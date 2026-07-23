# TRD — 카페 메뉴판 (Excel 구동)

관련 문서: [CLAUDE.md](../CLAUDE.md) · [PRD.md](./PRD.md) · [원본 요구사항](./menu-project-requirement.md)

이 문서는 아직 코드가 없는 상태에서 확정된 기술 방향을 기술한다. 구현은 [CLAUDE.md](../CLAUDE.md)의 TDD 프로세스(Red-Green-Refactor)를 따른다.

## 아키텍처 개요

```text
점주가 Excel 수정 → 저장
        │
        ▼
menu.xlsx ──(chokidar 파일 감시, 300ms 디바운스)──▶ server.mjs
        │                                              │
        │                              SSE: event: menu-updated
        ▼                                              ▼
   재파싱(JSON)  ◀── GET /api/menu ──  브라우저(메뉴판) ── 선택 테마로 재렌더
```

- **server.mjs**: `_` 접두사가 아닌 시트를 페이지로 변환, `_설정`에서 매장명·테마·자동전환초를 읽는다.
- **SSE(Server-Sent Events)**: 메뉴판은 읽기 전용 단방향 표시이므로 WebSocket 대신 SSE로 충분하다.
- **디바운스 300ms**: Excel 저장 시 발생하는 중복 파일 이벤트를 한 번으로 합친다.

## 폴더 구조 (목표 구조 — 현재 코드 미작성)

```text
menupan/
├── package.json          # 의존성: express, chokidar, xlsx(SheetJS)
├── server.mjs             # 파일 감시 + Excel 파싱 + SSE 푸시
├── data/
│   └── menu.xlsx          # 샘플 데이터 (커피/디저트/음료 + _설정)
├── docs/
│   ├── menu-project-requirement.md
│   ├── PRD.md
│   └── TRD.md
└── public/
    ├── index.html          # 메뉴판 화면
    ├── client.js           # SSE 수신 + 렌더링
    └── templates/
        ├── board-grid.css     # 공통 레이아웃(CSS 변수 테마 기반)
        ├── cafe-dark.css       # 테마: 어두운 카페(앰버)
        └── bistro-light.css    # 테마: 밝은 비스트로(브릭레드)
```

## 스택

- **express**: HTTP 서버, `GET /api/menu`, SSE 엔드포인트 제공.
- **chokidar**: `data/menu.xlsx` 파일 변경 감시.
- **xlsx (SheetJS)**: Excel 파싱. `package.json`에서 **공식 CDN**으로 지정한다.

```json
"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"
```

> npm 레지스트리의 `xlsx`는 0.18.5로 4년 묵은 구버전이다. SheetJS는 배포를 자체 CDN으로 이전했으므로 `npm install xlsx`(레지스트리)가 아닌 위 CDN URL을 사용한다. 보안 스캐너(Snyk 등)가 SheetJS에 오탐을 내는 알려진 이슈가 있으나 공식적으로 무시 권장이다.

- **SSE 채택 이유**: 서버 → 클라이언트 단방향 푸시만 필요(메뉴판은 표시 전용). WebSocket 대비 구현·인프라 복잡도가 낮다.

## Excel 파싱 규칙

- 첫 행 헤더, 시트 이름 = 페이지 이름.
- 열: 메뉴명 / 가격 / 설명 / 품절 / 카테고리.
- 가격: 숫자만 파싱. 통화 기호·콤마 포함 값은 파싱 단계에서 걸러내거나 숫자만 추출.
- 품절: `Y` → true, 빈칸 → false. 대소문자/공백 처리는 파서 테스트에서 경계값으로 검증.
- 시트 이름이 `_`로 시작하면 페이지 목록에서 제외(설정 시트 등).
- `_설정` 시트: `매장명`, `테마`, `자동전환초` 키-값 행을 읽어 전역 설정 객체로 변환.

## 테마 아키텍처 (하이브리드)

두 가지 테마 표현 방식을 함께 지원한다. 어떤 방식을 쓸지는 `_설정` 시트의 `테마` 값으로 결정한다.

### 방식 A — CSS 변수 테마 (기본, 경량)

- `templates/board-grid.css`가 공통 레이아웃(그리드, 타이포 스케일 등)을 정의하고, 테마별 CSS(`cafe-dark.css`, `bistro-light.css`)가 색상 변수만 오버라이드한다.
- 서버 재시작 없이 `_설정.테마` 값만 바꾸면 클라이언트가 해당 CSS를 로드한다.
- 신규 테마 추가 = CSS 파일 1개 추가(강의 확장 시나리오).

### 방식 B — PNG 배경+테두리 에셋 테마 (확장 옵션)

`design/project/` 핸드오프 번들(`메뉴판 템플릿 시스템.dc.html`, `design/project/assets/`)에서 이미 준비된 디자인 자산을 기반으로 한다.

- **테마 8종**: `bistro-light`, `cafe-dark`, `forest-dark`, `forest-light`, `light-olive`, `deep-green`, `beige`, `cream`.
- **디바이스 4종**과 목표 해상도:
  - `signage` (세로 사이니지): 1080 × 1920
  - `tablet-land` (태블릿 가로): 1920 × 1440
  - `tablet-port` (태블릿 세로): 1440 × 1920
  - `mobile`: 1080 × 2160
- **에셋 경로 규칙**: `assets/<테마>/bg-<디바이스>.png`(배경), `assets/<테마>/frame-<디바이스>.png`(테두리, 중앙이 투명한 오버레이). 테마 8종 × 디바이스 4종 × 2(bg/frame) = 총 64장.
- **렌더링 방식**: `bg` 레이어를 배경으로 깔고, 콘텐츠 위에 `frame` 레이어를 `pointer-events: none`으로 겹친다.
- **반응형 스케일링**: 폰트 크기·여백은 디바이스 최단축 `u = min(width, height)` 기준 비율로 계산한다(예: 매장명 `u * 0.058`, 본문 설명 `u * 0.0185`). 디바이스별 절대 px 하드코딩 대신 이 비율 로직을 재사용한다.
- **폰트**: 제목 Nanum Myeongjo, 본문 Pretendard.
- 참고 소스: `design/project/메뉴판 템플릿 시스템.dc.html`(컴포넌트 로직), `design/project/assets/<테마>/`(실제 PNG 에셋).

### 분기 규칙 (향후 구현 과제)

- `_설정.테마` 값이 CSS 테마 목록(`cafe-dark`, `bistro-light`)에 있으면 방식 A로 렌더링.
- PNG 테마 목록(8종) 중 하나이거나 `_설정`에 디바이스 지정이 있으면 방식 B로 렌더링.
- 디바이스 판별(향후): `_설정` 시트에 `디바이스` 항목을 추가하거나, 클라이언트 뷰포트 크기로 자동 판별하는 두 옵션 중 구현 시점에 결정. 이번 문서 단계에서는 코드로 확정하지 않는다.

## API / 이벤트 계약

### `GET /api/menu`

응답(JSON) 개형:

```json
{
  "storeName": "빌런 커피",
  "theme": "cafe-dark",
  "autoRotateSeconds": 0,
  "pages": [
    {
      "sheetName": "커피",
      "items": [
        { "name": "아메리카노", "price": 4500, "desc": "깔끔한 산미", "soldOut": false, "category": "에스프레소" }
      ]
    }
  ]
}
```

- `_`로 시작하는 시트는 `pages`에 포함하지 않는다.
- `price`는 숫자 타입. `soldOut`은 boolean.

### SSE

- 엔드포인트: 예) `GET /events`
- 이벤트: `event: menu-updated`, data는 없거나 최신 `GET /api/menu` 응답과 동일한 페이로드(구현 시 택1).
- 클라이언트는 이벤트 수신 시 `/api/menu`를 재조회하거나 푸시된 payload로 즉시 재렌더한다.

## 테스트 전략

[CLAUDE.md](../CLAUDE.md)의 TDD 프로세스(Red-Green-Refactor)에 따라 다음 단위부터 테스트를 작성한다.

1. **파서 단위 테스트**: 품절 `Y`/빈칸/이상값, 숫자가 아닌 가격 입력, `_` 접두 시트 제외, 빈 시트, 헤더만 있는 시트 등 경계값.
2. **`_설정` 파싱 테스트**: 값 누락 시 기본값(테마 기본값, 자동전환초 0) 적용 여부.
3. **`GET /api/menu` 통합 테스트**: 실제 xlsx 픽스처를 읽어 위 응답 스키마와 일치하는지 검증.
4. **디바운스 테스트**: 짧은 시간 내 다중 저장 이벤트가 SSE 푸시 1회로 합쳐지는지.
5. **SSE 브로드캐스트 테스트**: 파일 변경 시 연결된 클라이언트에 `menu-updated` 이벤트가 전달되는지.
6. **테마 분기 테스트**: `_설정.테마` 값에 따라 방식 A/B 중 올바른 경로로 분기하는지(방식 B 구현 이후).

## 참고 자료

- `design/project/메뉴판 템플릿 시스템.dc.html` — PNG 테마 시스템 컴포넌트 로직(스케일링 비율, THEMES/DEVICES 정의).
- `design/project/assets/` — 테마별 bg/frame PNG 에셋.
- `.claude/rules/anti-ai-slop.md` — 화면/이미지 생성 시 디자인 규칙(그라데이션·글로우·장식 모션 금지).

# TDD-IMPLEMENTS.md

카페 메뉴판 TDD 실행 문서. **마일스톤 단위**로 `/tdd-red [마일스톤]` → `/tdd-green [마일스톤]` → `/tdd-refactor [마일스톤]`를 실행한다(켄트 벡 Red-Green-Refactor, [CLAUDE.md](CLAUDE.md) 참조). 각 마일스톤 안의 `should...` 항목은 하위 Task로 유지된다.

**Task 상태 범례**: ⬜ Todo · 🔴 Red(실패 테스트 작성됨) · 🟢 Green(최소 구현, 테스트 통과) · ✅ Done(리팩터 완료)

## 마일스톤 목록

| 번호 | 이름 | 매치 키워드 | Task 진행 |
|---|---|---|---|
| M1 | Excel 파서 | `parser`, `파서`, `excel` | 5/5 Done |
| M2 | `_설정` 시트 파싱 | `settings`, `설정` | 5/5 Done |
| M3 | `GET /api/menu` | `api`, `api-menu` | 1/1 Done |
| M4 | 파일 감시 + 디바운스 | `watcher`, `debounce`, `디바운스` | 1/1 Done |
| M5 | SSE | `sse` | 1/1 Done |
| M6 | 테마 분기 (하이브리드) | `theme`, `테마` | 2/2 Done |
| M7 | 정적 서빙 + 실행 부트스트랩 | `static`, `bootstrap`, `실행` | 1/1 Done |
| M8 | 클라이언트 페이지 분리 렌더링 | `page`, `board`, `페이지` | 1/1 Done |
| M9 | 테마 렌더링 적용 (방식 B: PNG 배경+테두리) | `render`, `png`, `렌더링` | 2/2 Done |
| M10 | 페이지 네비게이션 (수동 전환) | `nav`, `indicator`, `네비게이션` | 1/1 Done |

---

## M1. Excel 파서 — `lib/parser.mjs`

| 상태 | 테스트명 | 설명 | 테스트 파일 | 구현 파일 |
|---|---|---|---|---|
| ✅ Done | shouldMarkItemSoldOutWhenFlagIsY | 품절 `Y`/빈칸 → `soldOut` boolean | `test/parser.test.mjs` | `lib/parser.mjs` |
| ✅ Done | shouldParsePriceAsNumberOnly | 가격 숫자만 허용, 통화기호·콤마 섞인 값 처리 | `test/parser.test.mjs` | `lib/parser.mjs` (`parsePrice`) |
| ✅ Done | shouldExcludeSheetsStartingWithUnderscore | `_`로 시작하는 시트는 페이지 목록에서 제외 | `test/parser.test.mjs` | `lib/parser.mjs` (`parseWorkbook`) |
| ✅ Done | shouldReturnEmptyItemsForHeaderOnlySheet | 헤더만 있고 데이터 행 없는 시트 → 빈 배열 | `test/parser.test.mjs` | `lib/parser.mjs` (`parseWorkbook`) |
| ✅ Done | shouldPreserveCategoryColumn | 카테고리 값 그대로 전달 — 기존 `parseMenuSheet` 구현이 이미 만족(추가 코드 불필요) | `test/parser.test.mjs` | `lib/parser.mjs` |

## M2. `_설정` 시트 파싱

| 상태 | 테스트명 | 설명 | 테스트 파일 | 구현 파일 |
|---|---|---|---|---|
| ✅ Done | shouldParseStoreNameThemeAndAutoRotateSeconds | 매장명/테마/자동전환초 파싱 | `test/settings.test.mjs` | `lib/settings.mjs` (`parseSettings`) |
| ✅ Done | shouldApplyDefaultThemeWhenSettingMissing | 테마 값 누락 시 기본 테마(`cafe-dark`) 적용 | `test/settings.test.mjs` | `lib/settings.mjs` (`parseSettings`) |
| ✅ Done | shouldDefaultAutoRotateSecondsToZeroWhenMissing | 자동전환초 누락 시 0 기본값 | `test/settings.test.mjs` | `lib/settings.mjs` (`parseSettings`) |
| ✅ Done | shouldParseDeviceSetting | `_설정.디바이스` 파싱 — 실데이터(`data/menu.xlsx`)가 `디바이스` 값을 실제 사용 중인데 그동안 파싱 안 됐던 갭 | `test/settings.test.mjs` | `lib/settings.mjs` (`parseSettings`) |
| ✅ Done | shouldParseEnglishTagSetting | `_설정.영문태그`(eyebrow 라벨) 파싱 — 디자인 재검토 중 발견된 추가 갭 | `test/settings.test.mjs` | `lib/settings.mjs` (`parseSettings`) |

## M3. `GET /api/menu`

| 상태 | 테스트명 | 설명 | 테스트 파일 | 구현 파일 |
|---|---|---|---|---|
| ✅ Done | shouldReturnMenuJsonMatchingApiContract | 실제 xlsx 픽스처 → [TRD.md](docs/TRD.md) API 계약과 일치 검증 | `test/api-menu.test.mjs` | `server.mjs` (`createServer`, `loadMenuData`), `test/fixtures/menu.xlsx` |

## M4. 파일 감시 + 디바운스

| 상태 | 테스트명 | 설명 | 테스트 파일 | 구현 파일 |
|---|---|---|---|---|
| ✅ Done | shouldCoalesceRapidSaveEventsIntoSingleReload | 300ms 디바운스로 중복 저장 이벤트를 1회로 병합 — chokidar 배선(`data/menu.xlsx` 실제 감시)은 아직 미연결, 디바운스 로직만 구현 | `test/watcher.test.mjs` | `lib/watcher.mjs` (`createDebouncedWatcher`) |

## M5. SSE

| 상태 | 테스트명 | 설명 | 테스트 파일 | 구현 파일 |
|---|---|---|---|---|
| ✅ Done | shouldBroadcastMenuUpdatedEventOnFileChange | 파일 변경 시 연결된 클라이언트에 `menu-updated` 이벤트 전달 — `server`(http.Server)에 `'menu-updated'` emit 시 등록된 SSE 클라이언트에 브로드캐스트. `res.flushHeaders()` 누락 버그 발견·수정(Node는 첫 body write 전까지 writeHead를 소켓에 flush 안 함) | `test/sse.test.mjs` | `server.mjs` (`/events` route, `MENU_UPDATED_EVENT` 상수) |

## M6. 테마 분기 (하이브리드 — 방식 A 먼저, 방식 B는 이후)

| 상태 | 테스트명 | 설명 | 테스트 파일 | 구현 파일 |
|---|---|---|---|---|
| ✅ Done | shouldSelectCssThemeWhenSettingMatchesCssThemeList | `_설정.테마`가 CSS 테마 목록과 일치하면 방식 A 선택 | `test/theme.test.mjs` | `lib/theme.mjs` (`selectThemeMode`) |
| ✅ Done | shouldSelectPngThemeWhenSettingMatchesPngThemeList | `_설정.테마`가 PNG 테마 목록과 일치하면 방식 B 선택 — `cafe-dark`/`bistro-light`는 CSS 목록 우선 체크로 항상 방식 A | `test/theme.test.mjs` | `lib/theme.mjs` (`selectThemeMode`) |

## M7. 정적 서빙 + 실행 부트스트랩

| 상태 | 테스트명 | 설명 | 테스트 파일 | 구현 파일 |
|---|---|---|---|---|
| ✅ Done | shouldServeIndexHtmlAtRoot | `GET /`가 `public/index.html` 정적 콘텐츠를 반환 | `test/static.test.mjs` | `server.mjs` (`express.static`), `public/index.html` |

**글루 코드(should-테스트 대상 아님, 근거 명시)**: chokidar가 `data/menu.xlsx` 실제 감시 → `createDebouncedWatcher` → `server.emit('menu-updated')` 배선, `npm start` 진입점(`isMainModule` 가드, 포트 리슨), `public/client.js`(fetch `/api/menu` 렌더 + `EventSource('/events')` 구독). 이미 단위 테스트된 조각들(`createDebouncedWatcher` M4, SSE 브로드캐스트 M5, `createServer` M3)을 그대로 연결하는 합성 루트(composition root)라 별도 단위 테스트를 강제하지 않는다.

**매뉴얼 스모크 테스트 완료** (2026-07-24): `PORT=4200 npm start` → `curl /`(index.html 응답 확인) → `curl /api/menu`(실제 `data/menu.xlsx` 파싱 결과 확인) → `curl -N /events` 연결 후 `touch data/menu.xlsx` → SSE로 `event: menu-updated` 수신 확인. 전체 파이프라인(Excel 저장 → chokidar → 디바운스 → SSE → 클라이언트) end-to-end 동작 검증됨.

**뒤늦게 발견된 갭** (2026-07-24, 사용자 리포트): M7의 `shouldServeIndexHtmlAtRoot`가 `<!doctype html>` 존재만 확인하는 약한 테스트라 실제 렌더링 내용(페이지 분리, 테마 적용)이 검증 안 된 채 Green 통과함. `lib/theme.mjs`(`selectThemeMode`, M6)도 순수 판별 함수로만 테스트되고 실제 렌더링에 연결된 적 없음(dead code). 이를 M8·M9로 보강한다.

**2차 갭** (2026-07-24, 사용자 재리포트): M8·M9 구현 이후에도 (1) 실데이터 `자동전환초=0`이라 `autoRotateSeconds > 0`에서만 페이지가 넘어가는 `scheduleAutoRotate`가 절대 발동 안 해 첫 페이지에 고정 — 수동 전환 UI 자체가 없었음. (2) `applyTheme`이 PNG 배경을 `body`에 `background-image: cover`로 깔기만 해서 디자인 번들의 실제 레이아웃(고정 디바이스 비율, eyebrow/세리프 매장명/rule 라인/점선 리더/품절 배지, 테마별 텍스트 색)과 전혀 다름. 사용자 확인 결과: 수동 전환 UI는 점(dot) 네비게이션으로, 미정의 테마 4종(bistro-light/cafe-dark/forest-dark/forest-light) 텍스트 색은 흰색 계열 기본값으로 결정. M9 재오픈 + M10 신설로 보강한다.

## M8. 클라이언트 페이지 분리 렌더링

| 상태 | 테스트명 | 설명 | 테스트 파일 | 구현 파일 |
|---|---|---|---|---|
| ✅ Done | shouldSelectSinglePageByIndexWithWraparound | 여러 페이지 중 인덱스 하나만 선택(순환), 클라이언트가 전체를 한 번에 이어붙이지 않고 한 번에 한 페이지만 보여주는 근거 로직 | `test/board.test.mjs` | `lib/board.mjs` (`selectPage`) |

**글루 코드(should-테스트 대상 아님)**: `public/client.js`가 `selectPage`를 이용해 현재 페이지 인덱스 상태를 들고 렌더링하고, `autoRotateSeconds > 0`이면 `setInterval`로 다음 페이지로 전환(브라우저 타이머·DOM 의존이라 단위 테스트 대상에서 제외, 매뉴얼 스모크 테스트로 검증).

## M9. 테마 렌더링 적용 (방식 B: PNG 배경+테두리)

| 상태 | 테스트명 | 설명 | 테스트 파일 | 구현 파일 |
|---|---|---|---|---|
| ✅ Done | shouldBuildPngBackgroundAndFrameUrlsFromThemeAndDevice | `_설정.테마`+`_설정.디바이스` → `selectThemeMode`가 `'png'`일 때 `/assets/<테마>/bg-<디바이스>.png`·`frame-<디바이스>.png` URL 조합 (`design/project/assets/`를 `public/assets/`로 복사해 실제 서빙) | `test/board.test.mjs` | `lib/board.mjs` (`buildBoardViewModel`) |
| ✅ Done | shouldResolveThemeTextColorsWithWhiteFallback | 디자인 번들에 색상 정의된 4종(light-olive/deep-green/cream/beige)은 그 값을, 나머지 4종(bistro-light/cafe-dark/forest-dark/forest-light)은 흰색 계열 기본값을 `colors: {text, sub, accent}`로 반환 | `test/board.test.mjs` | `lib/board.mjs` (`resolveThemeColors`) |

**글루 코드(should-테스트 대상 아님)**: `design/project/assets/*` → `public/assets/*` 복사(정적 자산 이관, 71M), `public/client.js`가 `buildBoardViewModel` 결과로 배경/프레임 이미지 스타일 적용 + Pretendard/Nanum Myeongjo 폰트 로드. CSS 방식(A, `cafe-dark`/`bistro-light`)은 실데이터가 현재 PNG 방식만 사용 중이라 이번 라운드에서는 최소 폴백(단색 배경)만 적용하고 완전한 CSS 변수 템플릿은 별도 마일스톤으로 남긴다 — 범위 확정을 위해 명시. `server.mjs`에 `/lib` 정적 라우트 추가(브라우저가 `lib/board.mjs`·`lib/theme.mjs`를 번들러 없이 직접 import해 서버 테스트와 동일 로직 재사용, 중복 제거).

**매뉴얼 스모크 테스트 완료** (2026-07-24): `PORT=4210 npm start` → `curl /lib/board.mjs`(200) → `curl /assets/deep-green/bg-tablet-port.png`(200, 실데이터 테마·디바이스 조합 실제 서빙 확인) → `curl /api/menu`에서 `device: 'tablet-port'`, `pages` 3개(`커피`/`디저트`/`음료`) 확인 → `node --check public/client.js`, `node --check lib/board.mjs` 문법 확인. **단, 실제 브라우저 렌더링(폰트·배경 이미지 시각적 확인, 페이지 자동전환 동작)은 확인 못함** — 사용자가 이번 세션에서 Claude in Chrome 확장 설치를 보류해 시각적 검증 도구 사용 불가. 브라우저에서 직접 `npm start` 후 `http://localhost:3000` 열어 확인 필요.

**2차 패치 후 스모크 테스트 완료** (2026-07-24): `client.js` 전면 재작성(디바이스 고정 박스 + `transform:scale` 뷰포트 맞춤, eyebrow/세리프 매장명/rule 라인/점선 리더/품절 배지/점 네비게이션, 테마 색상 적용). `PORT=4220 npm start` → `curl /`(200), `curl /client.js`(200), `curl /api/menu`에서 `englishTag: 'SPECIALTY COFFEE'` 포함 전체 필드 확인. **역시 실제 브라우저 시각 확인은 못함** — 사용자가 직접 `npm start` 후 열어서 레이아웃·색상·점 네비게이션 클릭 동작 확인 필요.

## M10. 페이지 네비게이션 (수동 전환)

| 상태 | 테스트명 | 설명 | 테스트 파일 | 구현 파일 |
|---|---|---|---|---|
| ✅ Done | shouldBuildPageIndicatorsWithActiveFlag | 페이지 배열 + 현재 인덱스 → `[{label, active}]` 점(dot) 네비게이션 데이터 — `자동전환초=0`이어도 클릭으로 페이지 전환 가능하게 하는 근거 로직 | `test/board.test.mjs` | `lib/board.mjs` (`getPageIndicators`) |

**글루 코드(should-테스트 대상 아님)**: `public/client.js`가 `getPageIndicators`의 `{label, active}`를 시트명 텍스트 버튼(`renderNavButton`, 사용자 요청으로 점 표시 대신 버튼으로 변경, 시트명 줄 위에 배치)으로 렌더하고 클릭 시 `goToPage(i)` 호출(DOM 이벤트 의존이라 단위 테스트 제외). 디자인 레이아웃(고정 디바이스 비율 박스, eyebrow/세리프 매장명/rule 라인/점선 리더/품절 배지)은 `public/index.html`+`public/client.js`에 CSS로 재구현 — 순수 로직이 아니라 시각적 스타일이라 별도 should-테스트 대상 아님, 매뉴얼 스모크 테스트로 검증.

---

## 진행 규칙 (마일스톤 단위)

1. `/tdd-red [마일스톤 번호|이름]` — 인자 없으면 ⬜ Todo Task가 남아 있는 최상단 마일스톤. 해당 마일스톤의 ⬜ Todo Task **전부**에 대해 순서대로(한 번에 하나씩 작성 → `npm test`로 실패 확인 → 다음 Task) 실패 테스트를 작성, 각 Task 상태를 🔴로 갱신.
2. `/tdd-green [마일스톤 번호|이름]` — 인자 없으면 🔴 Red Task가 있는 최상단 마일스톤. 해당 마일스톤의 🔴 Red Task **전부**를 순서대로 최소 구현으로 통과시키고, 매 Task 구현 후 `npm test` 전체 재확인, 상태를 🟢로 갱신.
3. `/tdd-refactor [마일스톤 번호|이름]` — 인자 없으면 🟢 Green Task가 있는 최상단 마일스톤. 해당 마일스톤의 🟢 Green Task를 대상으로 하드코딩·중복·원칙 위반을 구조적 변경으로 정리, 매 변경 후 테스트 재실행, 상태를 ✅로 갱신.
4. 마일스톤 안에서도 Task는 **한 번에 하나씩** 처리한다(동시에 여러 테스트를 미확인 상태로 몰아 쓰지 않는다) — 다만 그 마일스톤에 속한 모든 Task를 끝까지 순회하는 것이 목표다.
5. 다른 마일스톤의 Task를 앞당겨 진행하지 않는다.
6. 커밋은 각 명령이 초안 메시지만 제시하며, 실제 커밋은 사용자가 명시적으로 요청할 때만 수행한다.
7. 마일스톤·Task 구성을 바꾸려면 이 파일을 먼저 수정한다(그 자체가 구조적 변경).

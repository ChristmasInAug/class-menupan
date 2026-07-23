# TDD-IMPLEMENTS.md

카페 메뉴판 TDD 실행 문서. **마일스톤 단위**로 `/tdd-red [마일스톤]` → `/tdd-green [마일스톤]` → `/tdd-refactor [마일스톤]`를 실행한다(켄트 벡 Red-Green-Refactor, [CLAUDE.md](CLAUDE.md) 참조). 각 마일스톤 안의 `should...` 항목은 하위 Task로 유지된다.

**Task 상태 범례**: ⬜ Todo · 🔴 Red(실패 테스트 작성됨) · 🟢 Green(최소 구현, 테스트 통과) · ✅ Done(리팩터 완료)

## 마일스톤 목록

| 번호 | 이름 | 매치 키워드 | Task 진행 |
|---|---|---|---|
| M1 | Excel 파서 | `parser`, `파서`, `excel` | 5/5 Done |
| M2 | `_설정` 시트 파싱 | `settings`, `설정` | 3/3 Done |
| M3 | `GET /api/menu` | `api`, `api-menu` | 1/1 Done |
| M4 | 파일 감시 + 디바운스 | `watcher`, `debounce`, `디바운스` | 1/1 Done |
| M5 | SSE | `sse` | 1/1 Done |
| M6 | 테마 분기 (하이브리드) | `theme`, `테마` | 2/2 Done |

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

---

## 진행 규칙 (마일스톤 단위)

1. `/tdd-red [마일스톤 번호|이름]` — 인자 없으면 ⬜ Todo Task가 남아 있는 최상단 마일스톤. 해당 마일스톤의 ⬜ Todo Task **전부**에 대해 순서대로(한 번에 하나씩 작성 → `npm test`로 실패 확인 → 다음 Task) 실패 테스트를 작성, 각 Task 상태를 🔴로 갱신.
2. `/tdd-green [마일스톤 번호|이름]` — 인자 없으면 🔴 Red Task가 있는 최상단 마일스톤. 해당 마일스톤의 🔴 Red Task **전부**를 순서대로 최소 구현으로 통과시키고, 매 Task 구현 후 `npm test` 전체 재확인, 상태를 🟢로 갱신.
3. `/tdd-refactor [마일스톤 번호|이름]` — 인자 없으면 🟢 Green Task가 있는 최상단 마일스톤. 해당 마일스톤의 🟢 Green Task를 대상으로 하드코딩·중복·원칙 위반을 구조적 변경으로 정리, 매 변경 후 테스트 재실행, 상태를 ✅로 갱신.
4. 마일스톤 안에서도 Task는 **한 번에 하나씩** 처리한다(동시에 여러 테스트를 미확인 상태로 몰아 쓰지 않는다) — 다만 그 마일스톤에 속한 모든 Task를 끝까지 순회하는 것이 목표다.
5. 다른 마일스톤의 Task를 앞당겨 진행하지 않는다.
6. 커밋은 각 명령이 초안 메시지만 제시하며, 실제 커밋은 사용자가 명시적으로 요청할 때만 수행한다.
7. 마일스톤·Task 구성을 바꾸려면 이 파일을 먼저 수정한다(그 자체가 구조적 변경).

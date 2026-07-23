# TDD 체크리스트 — 카페 메뉴판

[CLAUDE.md](CLAUDE.md) TDD 프로세스가 참조하는 실행 체크리스트다. "go" 지시 시 다음 미완료(`[ ]`) 항목 하나를 Red → Green → Refactor 사이클로 구현하고 커밋한다(구조적/행위적 커밋 분리). 완료된 항목만 `[x]`로 표시한다. 순서·항목 변경은 이 파일을 먼저 수정한다(그 자체가 구조적 변경).

## 1. Excel 파서 (`lib/parser.mjs`)

- [ ] shouldMarkItemSoldOutWhenFlagIsY — 품절 `Y`/빈칸 → `soldOut` boolean *(Red 작성 완료, Green 대기)*
- [ ] shouldParsePriceAsNumberOnly — 가격 숫자만 허용, 통화기호/콤마 섞인 값 처리
- [ ] shouldExcludeSheetsStartingWithUnderscore — `_`로 시작하는 시트는 페이지 목록 제외
- [ ] shouldReturnEmptyItemsForHeaderOnlySheet — 헤더만 있고 데이터 행 없는 시트
- [ ] shouldPreserveCategoryColumn — 카테고리 값 그대로 전달

## 2. `_설정` 시트 파싱

- [ ] shouldParseStoreNameThemeAndAutoRotateSeconds
- [ ] shouldApplyDefaultThemeWhenSettingMissing
- [ ] shouldDefaultAutoRotateSecondsToZeroWhenMissing

## 3. `GET /api/menu`

- [ ] shouldReturnMenuJsonMatchingApiContract — 실제 xlsx 픽스처 기반 통합 테스트, [TRD.md](docs/TRD.md) API 계약과 일치 검증

## 4. 파일 감시 + 디바운스

- [ ] shouldCoalesceRapidSaveEventsIntoSingleReload — 300ms 디바운스로 중복 저장 이벤트 병합

## 5. SSE

- [ ] shouldBroadcastMenuUpdatedEventOnFileChange

## 6. 테마 분기 (하이브리드 — 방식 B는 방식 A 이후 착수)

- [ ] shouldSelectCssThemeWhenSettingMatchesCssThemeList
- [ ] shouldSelectPngThemeWhenSettingMatchesPngThemeList

---

항목 완료 조건: 테스트 통과 + 린터 경고 없음 + 논리적 단위 커밋 완료(`npm test`로 확인).

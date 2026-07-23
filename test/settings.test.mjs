import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSettings } from '../lib/settings.mjs';

test('shouldParseStoreNameThemeAndAutoRotateSeconds', () => {
  const rows = [
    { 항목: '매장명', 값: '빌런 커피' },
    { 항목: '테마', 값: 'cafe-dark' },
    { 항목: '자동전환초', 값: 10 },
  ];

  const settings = parseSettings(rows);

  assert.equal(settings.storeName, '빌런 커피');
  assert.equal(settings.theme, 'cafe-dark');
  assert.equal(settings.autoRotateSeconds, 10);
});

test('shouldApplyDefaultThemeWhenSettingMissing', () => {
  const rows = [{ 항목: '매장명', 값: '빌런 커피' }];

  const settings = parseSettings(rows);

  assert.equal(settings.theme, 'cafe-dark');
});

test('shouldDefaultAutoRotateSecondsToZeroWhenMissing', () => {
  const rows = [{ 항목: '매장명', 값: '빌런 커피' }];

  const settings = parseSettings(rows);

  assert.equal(settings.autoRotateSeconds, 0);
});

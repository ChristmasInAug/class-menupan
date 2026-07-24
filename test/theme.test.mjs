import test from 'node:test';
import assert from 'node:assert/strict';
import { selectThemeMode, CSS_THEMES, PNG_THEMES } from '../lib/theme.mjs';

test('shouldSelectCssThemeWhenSettingMatchesCssThemeList', () => {
  assert.equal(selectThemeMode('cafe-dark'), 'css');
});

test('shouldSelectPngThemeWhenSettingMatchesPngThemeList', () => {
  assert.equal(selectThemeMode('light-olive'), 'png');
});

test('shouldExposeAvailableThemeLists', () => {
  assert.deepEqual(CSS_THEMES, ['cafe-dark', 'bistro-light']);
  assert.deepEqual(PNG_THEMES, ['bistro-light', 'cafe-dark', 'forest-dark', 'forest-light', 'light-olive', 'deep-green', 'beige', 'cream']);
});

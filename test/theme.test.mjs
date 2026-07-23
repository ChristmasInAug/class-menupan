import test from 'node:test';
import assert from 'node:assert/strict';
import { selectThemeMode } from '../lib/theme.mjs';

test('shouldSelectCssThemeWhenSettingMatchesCssThemeList', () => {
  assert.equal(selectThemeMode('cafe-dark'), 'css');
});

test('shouldSelectPngThemeWhenSettingMatchesPngThemeList', () => {
  assert.equal(selectThemeMode('light-olive'), 'png');
});

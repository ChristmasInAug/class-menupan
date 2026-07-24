import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPage, buildBoardViewModel, getPageIndicators, computeFitScale } from '../lib/board.mjs';

test('shouldSelectSinglePageByIndexWithWraparound', () => {
  const pages = [{ sheetName: '커피' }, { sheetName: '디저트' }, { sheetName: '음료' }];

  assert.equal(selectPage(pages, 0).sheetName, '커피');
  assert.equal(selectPage(pages, 1).sheetName, '디저트');
  assert.equal(selectPage(pages, 3).sheetName, '커피');
});

test('shouldBuildPngBackgroundAndFrameUrlsFromThemeAndDevice', () => {
  const vm = buildBoardViewModel({ theme: 'deep-green', device: 'tablet-port' });

  assert.equal(vm.themeMode, 'png');
  assert.equal(vm.bgUrl, '/assets/deep-green/bg-tablet-port.png');
  assert.equal(vm.frameUrl, '/assets/deep-green/frame-tablet-port.png');
});

test('shouldResolveThemeTextColorsWithWhiteFallback', () => {
  const documented = buildBoardViewModel({ theme: 'deep-green', device: 'signage' });
  assert.deepEqual(documented.colors, { text: '#f0ecd8', sub: '#a9bcab', accent: '#c8a24a' });

  const undocumented = buildBoardViewModel({ theme: 'bistro-light', device: 'signage' });
  assert.deepEqual(undocumented.colors, { text: '#ffffff', sub: '#d9d9d9', accent: '#ffffff' });
});

test('shouldBuildPageIndicatorsWithActiveFlag', () => {
  const pages = [{ sheetName: '커피' }, { sheetName: '디저트' }, { sheetName: '음료' }];

  const indicators = getPageIndicators(pages, 1);

  assert.deepEqual(indicators, [
    { label: '커피', active: false },
    { label: '디저트', active: true },
    { label: '음료', active: false },
  ]);
});

test('shouldComputeFitScalePreservingAspectRatio', () => {
  assert.equal(computeFitScale(1080, 1920, 1080, 1920), 1);
  assert.equal(computeFitScale(500, 500, 1000, 2000), 0.25);
  assert.equal(computeFitScale(2000, 1000, 1920, 1440), 1000 / 1440);
});


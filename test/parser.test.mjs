import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMenuSheet } from '../lib/parser.mjs';

test('shouldMarkItemSoldOutWhenFlagIsY', () => {
  const rows = [
    { 메뉴명: '아메리카노', 가격: 4500, 설명: '깔끔한 산미', 품절: '', 카테고리: '에스프레소' },
    { 메뉴명: '디카페인 아메리카노', 가격: 5000, 설명: '스위스 워터 디카페인', 품절: 'Y', 카테고리: '에스프레소' },
  ];

  const items = parseMenuSheet(rows);

  assert.equal(items[0].soldOut, false);
  assert.equal(items[1].soldOut, true);
});

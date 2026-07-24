import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMenuSheet, parseWorkbook } from '../lib/parser.mjs';

test('shouldMarkItemSoldOutWhenFlagIsY', () => {
  const rows = [
    { 메뉴명: '아메리카노', 가격: 4500, 설명: '깔끔한 산미', 품절: '', 카테고리: '에스프레소' },
    { 메뉴명: '디카페인 아메리카노', 가격: 5000, 설명: '스위스 워터 디카페인', 품절: 'Y', 카테고리: '에스프레소' },
  ];

  const items = parseMenuSheet(rows);

  assert.equal(items[0].soldOut, false);
  assert.equal(items[1].soldOut, true);
});

test('shouldParsePriceAsNumberOnly', () => {
  const rows = [
    { 메뉴명: '카페라떼', 가격: '5,000원', 설명: '', 품절: '', 카테고리: '' },
  ];

  const items = parseMenuSheet(rows);

  assert.equal(items[0].price, 5000);
});

test('shouldExcludeSheetsStartingWithUnderscore', () => {
  const sheets = {
    커피: [{ 메뉴명: '아메리카노', 가격: 4500, 설명: '', 품절: '', 카테고리: '' }],
    _설정: [{ 항목: '매장명', 값: '빌런 커피' }],
  };

  const pages = parseWorkbook(sheets);

  assert.deepEqual(pages.map((p) => p.sheetName), ['커피']);
});

test('shouldReturnEmptyItemsForHeaderOnlySheet', () => {
  const sheets = { 디저트: [] };

  const pages = parseWorkbook(sheets);

  assert.deepEqual(pages[0].items, []);
});

test('shouldPreserveCategoryColumn', () => {
  const rows = [
    { 메뉴명: '콜드브루', 가격: 5500, 설명: '', 품절: '', 카테고리: '브루' },
  ];

  const items = parseMenuSheet(rows);

  assert.equal(items[0].category, '브루');
});

function parsePrice(value) {
  if (typeof value === 'number') return value;
  return Number(String(value).replace(/[^0-9.]/g, ''));
}

export function parseMenuSheet(rows) {
  return rows.map((row) => ({
    name: row.메뉴명,
    price: parsePrice(row.가격),
    desc: row.설명,
    soldOut: row.품절 === 'Y',
    category: row.카테고리,
  }));
}

export function parseWorkbook(sheets) {
  return Object.entries(sheets)
    .filter(([sheetName]) => !sheetName.startsWith('_'))
    .map(([sheetName, rows]) => ({
      sheetName,
      items: parseMenuSheet(rows),
    }));
}

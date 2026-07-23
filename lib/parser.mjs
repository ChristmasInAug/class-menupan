export function parseMenuSheet(rows) {
  return rows.map((row) => ({
    name: row.메뉴명,
    price: row.가격,
    desc: row.설명,
    soldOut: row.품절 === 'Y',
    category: row.카테고리,
  }));
}

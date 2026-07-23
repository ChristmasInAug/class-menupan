const DEFAULT_THEME = 'cafe-dark';
const DEFAULT_AUTO_ROTATE_SECONDS = 0;

export function parseSettings(rows) {
  const values = Object.fromEntries(rows.map((row) => [row.항목, row.값]));

  return {
    storeName: values['매장명'],
    theme: values['테마'] ?? DEFAULT_THEME,
    autoRotateSeconds: values['자동전환초'] ?? DEFAULT_AUTO_ROTATE_SECONDS,
  };
}

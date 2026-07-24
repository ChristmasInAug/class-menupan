const DEFAULT_THEME = 'cafe-dark';
const DEFAULT_AUTO_ROTATE_SECONDS = 0;

export function parseSettings(rows) {
  const values = Object.fromEntries(rows.map((row) => [row.항목, row.값]));

  return {
    storeName: values['매장명'],
    theme: values['테마'] ?? DEFAULT_THEME,
    autoRotateSeconds: values['자동전환초'] ?? DEFAULT_AUTO_ROTATE_SECONDS,
    device: values['디바이스'],
    englishTag: values['영문태그'],
  };
}

export function settingsToRows(settings) {
  return [
    { 항목: '매장명', 값: settings.storeName },
    { 항목: '테마', 값: settings.theme },
    { 항목: '디바이스', 값: settings.device },
    { 항목: '영문태그', 값: settings.englishTag },
    { 항목: '자동전환초', 값: settings.autoRotateSeconds },
  ];
}

const CSS_THEMES = ['cafe-dark', 'bistro-light'];
const PNG_THEMES = ['bistro-light', 'cafe-dark', 'forest-dark', 'forest-light', 'light-olive', 'deep-green', 'beige', 'cream'];

export function selectThemeMode(themeName) {
  if (CSS_THEMES.includes(themeName)) return 'css';
  if (PNG_THEMES.includes(themeName)) return 'png';
}

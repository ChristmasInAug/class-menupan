import { selectThemeMode } from './theme.mjs';

const DEFAULT_DEVICE = 'signage';

const THEME_COLORS = {
  'light-olive': { text: '#33381f', sub: '#6e7350', accent: '#6f7637' },
  'deep-green': { text: '#f0ecd8', sub: '#a9bcab', accent: '#c8a24a' },
  cream: { text: '#3c3120', sub: '#897354', accent: '#b5602f' },
  beige: { text: '#352a1a', sub: '#827049', accent: '#7a8246' },
};

const FALLBACK_THEME_COLORS = { text: '#ffffff', sub: '#d9d9d9', accent: '#ffffff' };

function resolveThemeColors(theme) {
  return THEME_COLORS[theme] ?? FALLBACK_THEME_COLORS;
}

export function selectPage(pages, index) {
  const wrapped = ((index % pages.length) + pages.length) % pages.length;
  return pages[wrapped];
}

export function buildBoardViewModel({ theme, device }) {
  const themeMode = selectThemeMode(theme);
  const colors = resolveThemeColors(theme);

  if (themeMode === 'png') {
    const resolvedDevice = device ?? DEFAULT_DEVICE;
    return {
      themeMode,
      colors,
      bgUrl: `/assets/${theme}/bg-${resolvedDevice}.png`,
      frameUrl: `/assets/${theme}/frame-${resolvedDevice}.png`,
    };
  }

  return { themeMode, colors };
}

export function getPageIndicators(pages, currentIndex) {
  return pages.map((page, index) => ({
    label: page.sheetName,
    active: index === currentIndex,
  }));
}

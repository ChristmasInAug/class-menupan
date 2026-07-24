import { selectThemeMode } from './theme.mjs';

const DEFAULT_DEVICE = 'signage';

// CLAUDE.md ## 해상도 — 정확한 스펙 해상도(단일 소스)
export const DEVICE_DIMENSIONS = {
  signage: { width: 1080, height: 1920 },
  'tablet-land': { width: 1920, height: 1440 },
  'tablet-port': { width: 1440, height: 1920 },
  mobile: { width: 1080, height: 2160 },
};

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

export function computeFitScale(viewportWidth, viewportHeight, deviceWidth, deviceHeight) {
  return Math.min(viewportWidth / deviceWidth, viewportHeight / deviceHeight);
}

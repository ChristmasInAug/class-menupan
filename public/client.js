import { selectPage, buildBoardViewModel, getPageIndicators, computeFitScale, DEVICE_DIMENSIONS } from '/lib/board.mjs';

const RESIZE_DEBOUNCE_MS = 150;
const DEFAULT_DEVICE = 'signage';

let menuData = null;
let pageIndex = 0;
let rotateTimer = null;
let resizeTimer = null;

async function loadMenu() {
  const res = await fetch('/api/menu');
  menuData = await res.json();
  pageIndex = 0;
  render();
  scheduleAutoRotate(menuData.autoRotateSeconds);
}

function goToPage(index) {
  pageIndex = index;
  render();
}

function render() {
  const viewModel = buildBoardViewModel({ theme: menuData.theme, device: menuData.device });
  const dimensions = DEVICE_DIMENSIONS[menuData.device] ?? DEVICE_DIMENSIONS[DEFAULT_DEVICE];
  const u = Math.min(dimensions.width, dimensions.height);
  const page = selectPage(menuData.pages, pageIndex);
  const indicators = getPageIndicators(menuData.pages, pageIndex);

  const board = document.getElementById('board');
  board.style.width = `${dimensions.width}px`;
  board.style.height = `${dimensions.height}px`;
  board.innerHTML = renderBoard({
    viewModel,
    u,
    page,
    indicators,
    storeName: menuData.storeName,
    englishTag: menuData.englishTag,
  });

  document.querySelectorAll('[data-page-index]').forEach((el) => {
    el.addEventListener('click', () => goToPage(Number(el.dataset.pageIndex)));
  });

  applyFitScale(dimensions);
}

function applyFitScale(dimensions) {
  const board = document.getElementById('board');
  const scale = computeFitScale(window.innerWidth, window.innerHeight, dimensions.width, dimensions.height);
  board.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (menuData) {
      const dimensions = DEVICE_DIMENSIONS[menuData.device] ?? DEVICE_DIMENSIONS[DEFAULT_DEVICE];
      applyFitScale(dimensions);
    }
  }, RESIZE_DEBOUNCE_MS);
});
window.addEventListener('orientationchange', () => {
  if (menuData) {
    const dimensions = DEVICE_DIMENSIONS[menuData.device] ?? DEVICE_DIMENSIONS[DEFAULT_DEVICE];
    applyFitScale(dimensions);
  }
});

function renderBoard({ viewModel, u, page, indicators, storeName, englishTag }) {
  const { colors } = viewModel;
  const px = (ratio) => `${Math.round(u * ratio)}px`;

  const backgroundLayer = viewModel.themeMode === 'png'
    ? `<div style="position:absolute;inset:0;background-image:url('${viewModel.bgUrl}');background-size:cover;background-position:center;"></div>
       <div style="position:absolute;inset:0;pointer-events:none;background-image:url('${viewModel.frameUrl}');background-size:cover;background-position:center;"></div>`
    : '';

  return `
    ${backgroundLayer}
    <div style="position:relative;padding:${px(0.085)};display:flex;flex-direction:column;height:100%;box-sizing:border-box;font-family:'Pretendard',sans-serif;">
        <div style="font-size:${px(0.0175)};letter-spacing:${px(0.0175 * 0.42)};color:${colors.accent};font-weight:700;">${englishTag ?? ''}</div>
        <div style="font-family:'Nanum Myeongjo',serif;font-size:${px(0.058)};color:${colors.text};font-weight:800;margin-top:${px(0.014)};">${storeName ?? ''}</div>
        <div style="height:2px;width:${px(0.11)};background:${colors.accent};opacity:.85;margin:${px(0.03)} 0 ${px(0.022)};"></div>
        <div style="display:flex;gap:${px(0.02)};flex-wrap:wrap;">
          ${indicators.map((indicator, index) => renderNavButton(indicator, index, colors, u)).join('')}
        </div>
        <div style="font-family:'Nanum Myeongjo',serif;font-size:${px(0.03)};color:${colors.text};font-weight:700;margin-top:${px(0.022)};">${page.sheetName}</div>
        <div style="margin-top:${px(0.04)};display:flex;flex-direction:column;gap:${px(0.032)};overflow-y:auto;">
          ${page.items.map((item) => renderItem(item, u, colors)).join('')}
        </div>
      </div>
  `;
}

function renderItem(item, u, colors) {
  const px = (ratio) => `${Math.round(u * ratio)}px`;
  const nameColor = item.soldOut ? colors.sub : colors.text;
  const priceColor = item.soldOut ? colors.sub : colors.accent;
  const textDecoration = item.soldOut ? 'line-through' : 'none';
  const badge = item.soldOut
    ? `<span style="font-size:${px(0.015)};font-weight:700;color:#fff;background:${colors.accent};border-radius:999px;padding:${px(0.003)} ${px(0.012)};margin-left:${px(0.012)};">품절</span>`
    : '';

  return `
    <div>
      <div style="display:flex;align-items:baseline;gap:${px(0.012)};">
        <span style="font-size:${px(0.03)};font-weight:600;color:${nameColor};text-decoration:${textDecoration};white-space:nowrap;">${item.name}</span>
        ${badge}
        <span style="flex:1;border-bottom:1px dotted ${colors.sub};opacity:.55;margin:0 ${px(0.006)};"></span>
        <span style="font-size:${px(0.03)};font-weight:700;color:${priceColor};white-space:nowrap;">${item.price.toLocaleString('ko-KR')}원</span>
      </div>
      <div style="font-size:${px(0.0185)};color:${colors.sub};margin-top:${px(0.007)};">${item.desc ?? ''}</div>
    </div>
  `;
}

function renderNavButton(indicator, index, colors, u) {
  const px = (ratio) => `${Math.round(u * ratio)}px`;
  const background = indicator.active ? colors.accent : 'transparent';
  const textColor = indicator.active ? '#fff' : colors.sub;
  const border = indicator.active ? 'none' : `1px solid ${colors.sub}`;
  return `<button data-page-index="${index}" style="font-family:'Pretendard',sans-serif;font-size:${px(0.02)};font-weight:600;color:${textColor};background:${background};border:${border};border-radius:${px(0.008)};padding:${px(0.01)} ${px(0.02)};cursor:pointer;">${indicator.label}</button>`;
}

function scheduleAutoRotate(autoRotateSeconds) {
  clearInterval(rotateTimer);
  if (autoRotateSeconds > 0 && menuData.pages.length > 1) {
    rotateTimer = setInterval(() => {
      pageIndex += 1;
      render();
    }, autoRotateSeconds * 1000);
  }
}

const events = new EventSource('/events');
events.addEventListener('menu-updated', loadMenu);

loadMenu();

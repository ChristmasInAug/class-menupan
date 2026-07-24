import { selectPage, buildBoardViewModel, getPageIndicators } from '/lib/board.mjs';

const DEVICE_DIMENSIONS = {
  signage: { width: 1080, height: 1920 },
  'tablet-land': { width: 1920, height: 1440 },
  'tablet-port': { width: 1440, height: 1920 },
  mobile: { width: 1080, height: 2160 },
};
const DEFAULT_DEVICE = 'signage';

let menuData = null;
let pageIndex = 0;
let rotateTimer = null;

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
  board.innerHTML = renderBoard({
    viewModel,
    dimensions,
    u,
    page,
    indicators,
    storeName: menuData.storeName,
    englishTag: menuData.englishTag,
  });

  document.querySelectorAll('[data-page-index]').forEach((el) => {
    el.addEventListener('click', () => goToPage(Number(el.dataset.pageIndex)));
  });

  applyScale(dimensions);
}

function applyScale(dimensions) {
  const board = document.getElementById('board');
  const scale = Math.min(window.innerWidth / dimensions.width, window.innerHeight / dimensions.height);
  board.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', () => {
  if (menuData) {
    const dimensions = DEVICE_DIMENSIONS[menuData.device] ?? DEVICE_DIMENSIONS[DEFAULT_DEVICE];
    applyScale(dimensions);
  }
});

function renderBoard({ viewModel, dimensions, u, page, indicators, storeName, englishTag }) {
  const { colors } = viewModel;
  const px = (ratio) => `${Math.round(u * ratio)}px`;

  const backgroundLayer = viewModel.themeMode === 'png'
    ? `<div style="position:absolute;inset:0;background-image:url('${viewModel.bgUrl}');background-size:cover;background-position:center;"></div>
       <div style="position:absolute;inset:0;pointer-events:none;background-image:url('${viewModel.frameUrl}');background-size:cover;background-position:center;"></div>`
    : '';

  return `
    <div style="position:relative;width:${dimensions.width}px;height:${dimensions.height}px;overflow:hidden;">
      ${backgroundLayer}
      <div style="position:relative;padding:${px(0.085)};display:flex;flex-direction:column;height:100%;box-sizing:border-box;font-family:'Pretendard',sans-serif;">
        <div style="font-size:${px(0.0175)};letter-spacing:${px(0.0175 * 0.42)};color:${colors.accent};font-weight:700;">${englishTag ?? ''}</div>
        <div style="font-family:'Nanum Myeongjo',serif;font-size:${px(0.058)};color:${colors.text};font-weight:800;margin-top:${px(0.014)};">${storeName ?? ''}</div>
        <div style="height:2px;width:${px(0.11)};background:${colors.accent};opacity:.85;margin:${px(0.03)} 0 ${px(0.022)};"></div>
        <div style="display:flex;gap:${px(0.02)};">
          ${indicators.map((indicator, index) => renderNavButton(indicator, index, colors, u)).join('')}
        </div>
        <div style="font-family:'Nanum Myeongjo',serif;font-size:${px(0.03)};color:${colors.text};font-weight:700;margin-top:${px(0.022)};">${page.sheetName}</div>
        <div style="margin-top:${px(0.04)};display:flex;flex-direction:column;gap:${px(0.032)};">
          ${page.items.map((item) => renderItem(item, u, colors)).join('')}
        </div>
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

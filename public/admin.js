import { CSS_THEMES, PNG_THEMES } from '/lib/theme.mjs';
import { DEVICE_DIMENSIONS } from '/lib/board.mjs';

const ALL_THEMES = [...new Set([...PNG_THEMES, ...CSS_THEMES])];
const DEVICES = Object.keys(DEVICE_DIMENSIONS);

let selectedTheme = null;
let selectedDevice = null;

async function login(username, password) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.ok;
}

async function fetchSettings() {
  const res = await fetch('/api/admin/settings');
  if (!res.ok) return null;
  return res.json();
}

async function persistSettings(settings) {
  const res = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return res.ok;
}

function renderOptionButtons(container, options, selected, onSelect) {
  container.innerHTML = '';
  for (const option of options) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn' + (option === selected ? ' active' : '');
    btn.textContent = option;
    btn.addEventListener('click', () => onSelect(option));
    container.appendChild(btn);
  }
}

function renderThemeOptions() {
  renderOptionButtons(document.getElementById('theme-options'), ALL_THEMES, selectedTheme, (theme) => {
    selectedTheme = theme;
    renderThemeOptions();
  });
}

function renderDeviceOptions() {
  renderOptionButtons(document.getElementById('device-options'), DEVICES, selectedDevice, (device) => {
    selectedDevice = device;
    renderDeviceOptions();
  });
}

function fillForm(settings) {
  document.getElementById('store-name').value = settings.storeName ?? '';
  document.getElementById('english-tag').value = settings.englishTag ?? '';
  document.getElementById('auto-rotate').value = settings.autoRotateSeconds ?? 0;
  selectedTheme = settings.theme ?? ALL_THEMES[0];
  selectedDevice = settings.device ?? DEVICES[0];
  renderThemeOptions();
  renderDeviceOptions();
}

function showSettingsView(settings) {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('settings-view').style.display = 'block';
  fillForm(settings);
}

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const ok = await login(username, password);
  if (ok) {
    showSettingsView(await fetchSettings());
  } else {
    document.getElementById('login-error').textContent = '아이디 또는 비밀번호가 틀렸습니다.';
  }
});

document.getElementById('save-btn').addEventListener('click', async () => {
  const settings = {
    storeName: document.getElementById('store-name').value,
    englishTag: document.getElementById('english-tag').value,
    autoRotateSeconds: Number(document.getElementById('auto-rotate').value),
    theme: selectedTheme,
    device: selectedDevice,
  };
  const status = document.getElementById('save-status');
  const ok = await persistSettings(settings);
  status.textContent = ok ? '저장됐습니다.' : '저장 실패';
});

// 이미 로그인된 세션이면 로그인 폼 건너뛰기
fetchSettings().then((settings) => {
  if (settings) showSettingsView(settings);
});

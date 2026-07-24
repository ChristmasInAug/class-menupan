import http from 'node:http';
import crypto from 'node:crypto';
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import chokidar from 'chokidar';
import * as XLSX from 'xlsx';
import { parseWorkbook } from './lib/parser.mjs';
import { parseSettings, settingsToRows } from './lib/settings.mjs';
import { createDebouncedWatcher } from './lib/watcher.mjs';
import { verifyAdminCredentials } from './lib/adminAuth.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

XLSX.set_fs(fs);

const MENU_UPDATED_EVENT = 'menu-updated';

function loadMenuData(dataFile) {
  const workbook = XLSX.readFile(dataFile);
  const sheets = Object.fromEntries(
    workbook.SheetNames.map((sheetName) => [
      sheetName,
      XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]),
    ]),
  );

  const settings = parseSettings(sheets['_설정'] ?? []);
  const pages = parseWorkbook(sheets);

  return { ...settings, pages };
}

function saveSettings(dataFile, settings) {
  const workbook = XLSX.readFile(dataFile);
  workbook.Sheets['_설정'] = XLSX.utils.json_to_sheet(settingsToRows(settings));
  if (!workbook.SheetNames.includes('_설정')) {
    workbook.SheetNames.push('_설정');
  }
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(dataFile, buffer);
}

function parseCookies(header) {
  return Object.fromEntries(
    (header ?? '').split(';').filter(Boolean).map((pair) => {
      const [key, ...rest] = pair.trim().split('=');
      return [key, rest.join('=')];
    }),
  );
}

export function createServer({ dataFile }) {
  const app = express();
  const sseClients = [];
  const sessions = new Set();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/lib', express.static(path.join(__dirname, 'lib')));

  function requireAdminSession(req, res, next) {
    const { session } = parseCookies(req.headers.cookie);
    if (!session || !sessions.has(session)) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    next();
  }

  app.get('/admin', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  });

  app.get('/api/menu', (_req, res) => {
    res.json(loadMenuData(dataFile));
  });

  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body ?? {};
    if (!verifyAdminCredentials(username, password)) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const token = crypto.randomUUID();
    sessions.add(token);
    res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Path=/`);
    res.json({ ok: true });
  });

  app.get('/api/admin/settings', requireAdminSession, (_req, res) => {
    res.json(loadMenuData(dataFile));
  });

  app.post('/api/admin/settings', requireAdminSession, (req, res) => {
    saveSettings(dataFile, req.body ?? {});
    server.emit(MENU_UPDATED_EVENT);
    res.json({ ok: true });
  });

  app.get('/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();
    sseClients.push(res);
    req.on('close', () => {
      sseClients.splice(sseClients.indexOf(res), 1);
    });
  });

  const server = http.createServer(app);

  server.on(MENU_UPDATED_EVENT, () => {
    for (const client of sseClients) {
      client.write(`event: ${MENU_UPDATED_EVENT}\ndata: {}\n\n`);
    }
  });

  return server;
}

function isMainModule() {
  return process.argv[1] === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  const dataFile = path.join(__dirname, 'data', 'menu.xlsx');
  const port = process.env.PORT || 3000;

  const server = createServer({ dataFile });
  const watcher = createDebouncedWatcher(() => server.emit(MENU_UPDATED_EVENT), { delayMs: 300 });

  chokidar.watch(dataFile).on('change', () => watcher.notify());

  server.listen(port, () => {
    console.log(`http://localhost:${port}`);
  });
}

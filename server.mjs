import http from 'node:http';
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import chokidar from 'chokidar';
import * as XLSX from 'xlsx';
import { parseWorkbook } from './lib/parser.mjs';
import { parseSettings } from './lib/settings.mjs';
import { createDebouncedWatcher } from './lib/watcher.mjs';

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

export function createServer({ dataFile }) {
  const app = express();
  const sseClients = [];

  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/lib', express.static(path.join(__dirname, 'lib')));

  app.get('/api/menu', (_req, res) => {
    res.json(loadMenuData(dataFile));
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

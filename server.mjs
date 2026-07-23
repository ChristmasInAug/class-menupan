import http from 'node:http';
import * as fs from 'node:fs';
import express from 'express';
import * as XLSX from 'xlsx';
import { parseWorkbook } from './lib/parser.mjs';
import { parseSettings } from './lib/settings.mjs';

XLSX.set_fs(fs);

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

  app.get('/api/menu', (_req, res) => {
    res.json(loadMenuData(dataFile));
  });

  return http.createServer(app);
}

import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import { createServer } from '../server.mjs';

test('shouldRejectAdminSettingsRequestsWithoutValidSession', async () => {
  const server = createServer({ dataFile: 'test/fixtures/menu.xlsx' });
  const { port } = await new Promise((resolve) => {
    server.listen(0, () => resolve({ port: server.address().port }));
  });

  try {
    const getRes = await fetch(`http://localhost:${port}/api/admin/settings`);
    assert.equal(getRes.status, 401);

    const postRes = await fetch(`http://localhost:${port}/api/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeName: 'x' }),
    });
    assert.equal(postRes.status, 401);
  } finally {
    server.close();
  }
});

test('shouldLoginWithValidCredentialsAndSetSessionCookie', async () => {
  const server = createServer({ dataFile: 'test/fixtures/menu.xlsx' });
  const { port } = await new Promise((resolve) => {
    server.listen(0, () => resolve({ port: server.address().port }));
  });

  try {
    const badRes = await fetch(`http://localhost:${port}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrong' }),
    });
    assert.equal(badRes.status, 401);

    const okRes = await fetch(`http://localhost:${port}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: '1234' }),
    });
    assert.equal(okRes.status, 200);
    assert.match(okRes.headers.get('set-cookie'), /session=/);
  } finally {
    server.close();
  }
});

test('shouldPersistSettingsToExcelAndBroadcastMenuUpdated', async () => {
  const tempFile = path.join(os.tmpdir(), `menu-admin-test-${Date.now()}.xlsx`);
  fs.copyFileSync('test/fixtures/menu.xlsx', tempFile);

  const server = createServer({ dataFile: tempFile });
  const { port } = await new Promise((resolve) => {
    server.listen(0, () => resolve({ port: server.address().port }));
  });

  try {
    const loginRes = await fetch(`http://localhost:${port}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: '1234' }),
    });
    const cookie = loginRes.headers.get('set-cookie').split(';')[0];

    const sseRes = await fetch(`http://localhost:${port}/events`, {
      headers: { accept: 'text/event-stream' },
    });
    const reader = sseRes.body.getReader();

    const saveRes = await fetch(`http://localhost:${port}/api/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        storeName: '새매장',
        theme: 'forest-dark',
        device: 'mobile',
        englishTag: 'NEW TAG',
        autoRotateSeconds: 5,
      }),
    });
    assert.equal(saveRes.status, 200);

    const { value } = await reader.read();
    const chunk = new TextDecoder().decode(value);
    assert.match(chunk, /event: menu-updated/);
    await reader.cancel();

    const menuRes = await fetch(`http://localhost:${port}/api/menu`);
    const menu = await menuRes.json();
    assert.equal(menu.storeName, '새매장');
    assert.equal(menu.theme, 'forest-dark');
    assert.equal(menu.device, 'mobile');
  } finally {
    server.close();
    fs.unlinkSync(tempFile);
  }
});

test('shouldServeAdminPageAtAdminRoute', async () => {
  const server = createServer({ dataFile: 'test/fixtures/menu.xlsx' });
  const { port } = await new Promise((resolve) => {
    server.listen(0, () => resolve({ port: server.address().port }));
  });

  try {
    const res = await fetch(`http://localhost:${port}/admin`);
    const html = await res.text();

    assert.equal(res.status, 200);
    assert.match(html, /<!doctype html>/i);
  } finally {
    server.close();
  }
});

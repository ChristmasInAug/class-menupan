import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.mjs';

test('shouldServeIndexHtmlAtRoot', async () => {
  const server = createServer({ dataFile: 'test/fixtures/menu.xlsx' });

  const { port } = await new Promise((resolve) => {
    server.listen(0, () => resolve({ port: server.address().port }));
  });

  try {
    const res = await fetch(`http://localhost:${port}/`);
    const html = await res.text();

    assert.equal(res.status, 200);
    assert.match(html, /<!doctype html>/i);
  } finally {
    server.close();
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.mjs';

test('shouldReturnMenuJsonMatchingApiContract', async () => {
  const server = createServer({ dataFile: 'test/fixtures/menu.xlsx' });

  const { port } = await new Promise((resolve) => {
    server.listen(0, () => resolve({ port: server.address().port }));
  });

  try {
    const res = await fetch(`http://localhost:${port}/api/menu`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(typeof body.storeName, 'string');
    assert.ok(Array.isArray(body.pages));
    assert.equal(typeof body.pages[0].items[0].price, 'number');
  } finally {
    server.close();
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.mjs';

test('shouldBroadcastMenuUpdatedEventOnFileChange', async () => {
  const server = createServer({ dataFile: 'test/fixtures/menu.xlsx' });

  const { port } = await new Promise((resolve) => {
    server.listen(0, () => resolve({ port: server.address().port }));
  });

  try {
    const res = await fetch(`http://localhost:${port}/events`, {
      headers: { accept: 'text/event-stream' },
    });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    server.emit('menu-updated');

    const { value } = await reader.read();
    const chunk = decoder.decode(value);

    assert.match(chunk, /event: menu-updated/);

    await reader.cancel();
  } finally {
    server.close();
  }
});

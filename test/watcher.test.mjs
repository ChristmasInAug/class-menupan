import test from 'node:test';
import assert from 'node:assert/strict';
import { createDebouncedWatcher } from '../lib/watcher.mjs';

test('shouldCoalesceRapidSaveEventsIntoSingleReload', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });

  let callCount = 0;
  const watcher = createDebouncedWatcher(() => {
    callCount += 1;
  }, { delayMs: 300 });

  watcher.notify();
  t.mock.timers.tick(100);
  watcher.notify();
  t.mock.timers.tick(100);
  watcher.notify();
  t.mock.timers.tick(300);

  assert.equal(callCount, 1);
});

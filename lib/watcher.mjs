export function createDebouncedWatcher(onChange, { delayMs = 300 } = {}) {
  let timer = null;

  function notify() {
    clearTimeout(timer);
    timer = setTimeout(onChange, delayMs);
  }

  return { notify };
}

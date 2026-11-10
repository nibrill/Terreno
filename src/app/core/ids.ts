/** Short unique id. Uses crypto.randomUUID when available (secure contexts only). */
export function newId(prefix = ''): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  const core =
    c && typeof c.randomUUID === 'function'
      ? c.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}_${core}` : core;
}

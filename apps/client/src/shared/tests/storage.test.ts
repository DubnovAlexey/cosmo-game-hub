// FILE: shared/tests/storage.test.ts — saved games for every game: versioned, isolated per game, safe without storage.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { addGameResult, clearGameSave, loadGame, loadGameResults, saveGame } from '../utils/storageEngine.ts';

class MemoryStorage {
  readonly items = new Map<string, string>();
  getItem(key: string): string | null { return this.items.get(key) ?? null; }
  setItem(key: string, value: string): void { this.items.set(key, value); }
  removeItem(key: string): void { this.items.delete(key); }
}
const install = (value: unknown) => Object.defineProperty(globalThis, 'localStorage', { value, configurable: true, writable: true });

beforeEach(() => install(new MemoryStorage()));

test('a game is saved and loaded back under its own prefixed key', () => {
  assert.equal(saveGame('preferans', 1, { deal: 7 }), true);
  const saved = loadGame<{ deal: number }>('preferans', 1);
  assert.equal(saved?.data.deal, 7);
  assert.ok([...(globalThis.localStorage as unknown as MemoryStorage).items.keys()].includes('cosmo-game-hub:preferans:save'));
  assert.equal(loadGame('chess', 1), null, 'another game has its own save');
});

test('a save of another version is ignored; clearing removes it', () => {
  saveGame('preferans', 1, { old: true });
  assert.equal(loadGame('preferans', 2), null);
  clearGameSave('preferans');
  assert.equal(loadGame('preferans', 1), null);
});

test('results keep the newest twenty, newest first', () => {
  for (let i = 0; i < 25; i += 1) addGameResult('preferans', { pool: i });
  const results = loadGameResults<{ pool: number }>('preferans');
  assert.equal(results.length, 20);
  assert.equal(results[0].summary.pool, 24);
});

test('without storage (private mode) every call is safe', () => {
  install(undefined);
  assert.equal(saveGame('preferans', 1, {}), false);
  assert.equal(loadGame('preferans', 1), null);
  assert.deepEqual(loadGameResults('preferans'), []);
  clearGameSave('preferans');
  install({ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('blocked'); } });
  assert.equal(saveGame('preferans', 1, {}), false);
  assert.equal(loadGame('preferans', 1), null);
});

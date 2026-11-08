// Настоящий EngineManager в изолированном Worker-макете; внешний Stockfish не запускается.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
async function fixture() {
    let worker;
    class Worker { constructor() { worker = this; this.messages = []; } postMessage(value) { this.messages.push(value); } terminate() { this.terminated = true; } }
    let source = await readFile(new URL('../engine/EngineManager.ts', import.meta.url), 'utf8');
    source = source.replaceAll('import.meta.env.BASE_URL', '"/cosmo-game-hub/"').replace('export class EngineManager', 'globalThis.EngineManager = class EngineManager')
        .replace(/export const (\w+) =/g, 'const $1 =');
    const { code } = await transform(source, { loader: 'ts', target: 'es2022' });
    const context = vm.createContext({ window: {}, Worker }); vm.runInContext(code, context);
    const manager = new context.EngineManager(); return { manager, worker };
}
test('search waits for readyok and normalizes a trailing base slash', async () => {
    const { manager, worker } = await fixture();
    const promise = manager.getBestMove('first-position', 2);
    assert.equal(worker.messages.some(v => v.startsWith('go ')), false);
    worker.onmessage({ data: 'readyok' });
    assert.ok(worker.messages.includes('position fen first-position'));
    worker.onmessage({ data: 'bestmove e2e4' }); assert.equal(await promise, 'e2e4'); manager.destroy();
});
test('overlapping requests cannot resolve with another position bestmove and pending queue stays bounded', async () => {
    const { manager, worker } = await fixture(); worker.onmessage({ data: 'readyok' });
    const first = manager.getBestMove('one', 1), superseded = manager.getBestMove('two', 2), last = manager.getBestMove('three', 3);
    assert.equal(await superseded, '');
    worker.onmessage({ data: 'bestmove e2e4' }); assert.equal(await first, 'e2e4');
    assert.equal(worker.messages.filter(v => v.startsWith('position fen')).join('|'), 'position fen one|position fen three');
    worker.onmessage({ data: 'bestmove g8f6' }); assert.equal(await last, 'g8f6'); manager.destroy();
});
test('every search has a depth and a time cap, so a slow device never waits for long', async () => {
    const { manager, worker } = await fixture(); worker.onmessage({ data: 'readyok' });
    const levelTen = manager.getBestMove('deep', 10);
    assert.ok(worker.messages.includes('go depth 15 movetime 2000'));
    worker.onmessage({ data: 'bestmove d2d4' }); assert.equal(await levelTen, 'd2d4');
    const levelOne = manager.getBestMove('quick', 1);
    assert.ok(worker.messages.includes('go depth 2 movetime 560'));
    worker.onmessage({ data: 'bestmove g1f3' }); assert.equal(await levelOne, 'g1f3'); manager.destroy();
});
test('destroy resolves active/pending promises and releases worker', async () => {
    const { manager, worker } = await fixture(); worker.onmessage({ data: 'readyok' });
    const active = manager.getBestMove('one', 1), pending = manager.getBestMove('two', 1);
    manager.destroy(); assert.deepEqual(await Promise.all([active, pending]), ['', '']);
    assert.equal(worker.terminated, true); assert.equal(manager.ready, false);
});

// ФАЙЛ: tests/navigation-and-timer.test.mjs
// НАЗНАЧЕНИЕ: Регрессии времени партии и base-aware навигации на настоящих исходниках.
// РАЗДЕЛЫ: 1. Изолированное выполнение hook; 2. Настройка/ход/пауза/timeout; 3. URL-гранницы.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

// НАЧАЛО ФУНКЦИИ timerFixture
/** Управляемые React hook slots исполняют реальный useChessTimer без DOM и настоящих таймеров. */
async function timerFixture() {
    const slots = [], intervals = new Map();
    let cursor = 0, changed = false, scheduled = [], nextTimer = 1, props, result;
    const hooks = {
        useState(initial) {
            const index = cursor++;
            if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
            return [slots[index].value, value => {
                const next = typeof value === 'function' ? value(slots[index].value) : value;
                if (!Object.is(next, slots[index].value)) { slots[index].value = next; changed = true; }
            }];
        },
        useRef(initial) {
            const index = cursor++;
            if (!slots[index]) slots[index] = { current: initial };
            return slots[index];
        },
        useEffect(effect, deps) {
            const index = cursor++, before = slots[index];
            if (!before || deps.some((value, i) => !Object.is(value, before.deps[i]))) {
                const slot = { deps, cleanup: before?.cleanup };
                slots[index] = slot;
                scheduled.push(() => { slot.cleanup?.(); slot.cleanup = effect(); });
            }
        },
    };
    const source = await readFile(new URL('../apps/client/src/hooks/useChessTimer.ts', import.meta.url), 'utf8');
    const { code } = await transform(source, { loader: 'ts', format: 'cjs', target: 'es2022' });
    const module = { exports: {} };
    const context = vm.createContext({ module, exports: module.exports,
        require(name) { assert.equal(name, 'react'); return hooks; },
        setInterval(callback, delay) { assert.equal(delay, 1000); const id = nextTimer++; intervals.set(id, callback); return id; },
        clearInterval(id) { intervals.delete(id); },
    });
    vm.runInContext(code, context);
    const hook = module.exports.useChessTimer;
    function render(nextProps = props) {
        props = nextProps;
        for (let turn = 0; turn < 20; turn++) {
            cursor = 0; changed = false; scheduled = [];
            result = hook(props);
            for (const effect of scheduled) effect();
            if (!changed) return result;
        }
        throw new Error('Hook effects did not settle');
    }
    return { render,
        tick() { for (const callback of [...intervals.values()]) callback(); return render(); },
        dispose() { for (const slot of slots) slot?.cleanup?.(); },
        intervalCount() { return intervals.size; },
    };
}
// КОНЕЦ ФУНКЦИИ timerFixture

test('Choosing a non-default control after setup mount sets both clocks before the first move', async () => {
    const timer = await timerFixture();
    const onTimeOut = () => assert.fail('No timeout before the first move');
    const initial = { activePlayer: null, initialSeconds: 600, onTimeOut };
    timer.render(initial);
    for (const seconds of [180, 300, 1800, 600]) {
        const state = timer.render({ ...initial, initialSeconds: seconds });
        assert.equal(state.whiteSeconds, seconds);
        assert.equal(state.blackSeconds, seconds);
        assert.equal(timer.intervalCount(), 0);
    }
    timer.dispose();
});

test('Turn changes tick only that player; pause and unmount release the interval', async () => {
    const timer = await timerFixture();
    const settings = { initialSeconds: 180, activePlayer: 'White', onTimeOut: () => assert.fail('Unexpected timeout') };
    timer.render(settings);
    assert.equal(timer.intervalCount(), 1);
    let state = timer.tick();
    assert.equal(state.whiteSeconds, 179); assert.equal(state.blackSeconds, 180);
    timer.render({ ...settings, activePlayer: null });
    assert.equal(timer.intervalCount(), 0);
    state = timer.tick();
    assert.equal(state.whiteSeconds, 179); assert.equal(state.blackSeconds, 180);
    timer.render({ ...settings, activePlayer: 'Black' });
    assert.equal(timer.intervalCount(), 1);
    state = timer.tick();
    assert.equal(state.whiteSeconds, 179); assert.equal(state.blackSeconds, 179);
    timer.dispose(); assert.equal(timer.intervalCount(), 0);
});

test('Timeout fires once and a changed control starts new clocks without a stale timeout', async () => {
    const timer = await timerFixture(), timeouts = [];
    const initial = { activePlayer: 'White', initialSeconds: 1, onTimeOut: player => timeouts.push(player) };
    timer.render(initial); timer.tick(); timer.tick();
    assert.deepEqual(timeouts, ['White']);
    timer.render({ ...initial, onTimeOut: player => timeouts.push(player) });
    assert.deepEqual(timeouts, ['White']);
    const state = timer.render({ ...initial, activePlayer: 'Black', initialSeconds: 3 });
    assert.equal(state.whiteSeconds, 3); assert.equal(state.blackSeconds, 3);
    assert.deepEqual(timeouts, ['White']);
    timer.tick(); timer.tick(); timer.tick();
    assert.deepEqual(timeouts, ['White', 'Black']);
    timer.dispose();
});

// НАЧАЛО ФУНКЦИИ navigationFixture
async function navigationFixture() {
    let source = await readFile(new URL('../apps/client/src/utils/withBase.ts', import.meta.url), 'utf8');
    source = source.replaceAll('import.meta.env.BASE_URL', '"/cosmo-game-hub/"');
    const { code } = await transform(source, { loader: 'ts', format: 'cjs', target: 'es2022' });
    const module = { exports: {} };
    vm.runInNewContext(code, { module, exports: module.exports });
    return module.exports;
}
// КОНЕЦ ФУНКЦИИ navigationFixture

test('Navigation recognizes root/base and document routes with either trailing-slash spelling', async () => {
    const { withBase, isNavigationPathActive } = await navigationFixture();
    assert.equal(withBase('/games'), '/cosmo-game-hub/games');
    assert.equal(isNavigationPathActive('/', '/'), true);
    assert.equal(isNavigationPathActive('/cosmo-game-hub/', withBase('/')), true);
    for (const route of ['leaderboard', 'about']) {
        assert.equal(isNavigationPathActive(`/cosmo-game-hub/${route}`, withBase(route)), true);
        assert.equal(isNavigationPathActive(`/cosmo-game-hub/${route}/`, withBase(route)), true);
        assert.equal(isNavigationPathActive(`/cosmo-game-hub/${route}/extra/`, withBase(route)), false);
    }
});

test('Games remains active for its own child routes but never for another prefix', async () => {
    const { withBase, isNavigationPathActive } = await navigationFixture();
    assert.equal(isNavigationPathActive('/cosmo-game-hub/games/', withBase('/games'), true), true);
    assert.equal(isNavigationPathActive('/cosmo-game-hub/games/chess/', withBase('/games'), true), true);
    assert.equal(isNavigationPathActive('/cosmo-game-hub/games2/', withBase('/games'), true), false);
    assert.equal(isNavigationPathActive('/cosmo-game-hub/games-extra/', withBase('/games'), true), false);
    assert.equal(isNavigationPathActive('/other/games/', withBase('/games'), true), false);
});

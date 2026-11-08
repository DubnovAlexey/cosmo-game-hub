// ФАЙЛ: shell/tests/navigation.test.mjs
// НАЗНАЧЕНИЕ: Регрессии base-aware навигации сайта на настоящем исходнике withBase.ts.
// РАЗДЕЛЫ: 1. Изолированное выполнение модуля; 2. Границы URL.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

// НАЧАЛО ФУНКЦИИ navigationFixture
async function navigationFixture() {
    let source = await readFile(new URL('../utils/withBase.ts', import.meta.url), 'utf8');
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

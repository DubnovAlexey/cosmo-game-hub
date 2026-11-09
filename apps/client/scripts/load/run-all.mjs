// [EN] FILE: apps/client/scripts/load/run-all.mjs — runs every load test one after another and prints a summary:
//      the preferans engine (Node), chess and Stockfish, the preferans table on a computer and on a slow phone, and
//      the hub itself. The browser tests need the production build served: `npm run build --workspace client`, then
//      `astro preview --port 4324` (or HUB_URL pointing elsewhere).
//      Run: npm run load        (or: node apps/client/scripts/load/run-all.mjs [--quick])
// [RU] ФАЙЛ: запускает все нагрузочные проверки по очереди и печатает итог: движок преферанса (Node), шахматы и
//      Stockfish, стол преферанса на компьютере и на медленном телефоне, сам хаб. Браузерным проверкам нужна
//      отданная сервером продакшен-сборка: `npm run build --workspace client`, затем `astro preview --port 4324`
//      (или HUB_URL на другой адрес).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { BASE } from './cdp.mjs';

const quick = process.argv.includes('--quick');
const here = fileURLToPath(new URL('.', import.meta.url));
/** [EN] Why the site cannot be tested, or null when it answers. [RU] Почему сайт нельзя проверить, или null, если он отвечает. */
async function siteProblem() {
    try {
        const response = await fetch(`${BASE}/`);
        return response.ok ? null : `HTTP ${response.status}`;
    } catch (error) {
        return error.message;
    }
}
const problem = await siteProblem();
if (problem) {
    console.error(`The site is not served at ${BASE} (${problem}). Build it and start: astro preview --port 4324`);
    process.exit(2);
}

const RUNS = [
    ['preferans engine / движок преферанса', 'preferans-engine.mjs', quick ? ['--pools', '2', '--deals', '4', '--threads', '1,4', '--solver', '60'] : []],
    ['chess and Stockfish / шахматы и Stockfish', 'chess.mjs', quick ? ['--games', '1'] : []],
    ['preferans table, computer / стол, компьютер', 'preferans-ui.mjs', ['--deals', quick ? '6' : '30']],
    ['preferans table, slow phone / стол, медленный телефон', 'preferans-ui.mjs', ['--deals', quick ? '4' : '15', '--phone', '--cpu', '4']],
    ['the hub / хаб', 'hub.mjs', quick ? ['--requests', '1500', '--rounds', '5'] : []],
];
const results = [];
for (const [title, script, args] of RUNS) {
    console.log(`\n=== ${title}`);
    const started = Date.now();
    const run = spawnSync(process.execPath, [`${here}${script}`, ...args], { stdio: 'inherit' });
    results.push({ title, ok: run.status === 0, seconds: Math.round((Date.now() - started) / 1000) });
}
console.log('\n=== summary / итог');
for (const result of results) console.log(`${result.ok ? 'OK    ' : 'FAILED'} ${result.title} (${result.seconds} s)`);
process.exitCode = results.every(result => result.ok) ? 0 : 1;

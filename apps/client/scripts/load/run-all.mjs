// [EN] FILE: apps/client/scripts/load/run-all.mjs — runs every load test one after another and prints a summary:
//      the preferans engine (Node), chess and Stockfish, the preferans table on a computer and on a slow phone, the
//      poker bots and the poker table by finger and by mouse, a whole sea battle by finger and by mouse, the layout
//      of the card tables and of the sea battle on phones, tablets and computers (layout-audit.mjs: no text past the
//      screen or under something else, no seat on the board), and the hub itself. The browser tests need the production build served: `npm run build --workspace client`, then
//      `astro preview --port 4324` (or HUB_URL pointing elsewhere).
//      Run: npm run load        (or: node apps/client/scripts/load/run-all.mjs [--quick])
// [RU] ФАЙЛ: запускает все нагрузочные проверки по очереди и печатает итог: движок преферанса (Node), шахматы и
//      Stockfish, стол преферанса на компьютере и на медленном телефоне, боты покера и стол покера пальцем и мышью,
//      целый морской бой пальцем и мышью, раскладка карточных столов и морского боя на телефонах, планшетах и
//      компьютерах (layout-audit.mjs: ни один текст не выходит за экран и не лежит под чем-то другим, ни одно место
//      не лежит на доске) и сам хаб. Браузерным
//      проверкам нужна отданная сервером продакшен-сборка: `npm run build --workspace client`, затем
//      `astro preview --port 4324` (или HUB_URL на другой адрес).
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
    ['poker bots / боты покера', 'poker-bots.mjs', ['--tournaments', quick ? '8' : '40']],
    ['poker table, phone by finger / стол покера, телефон пальцем', 'poker-touch.mjs', ['390', '844', '5', quick ? '3' : '8', 'load-poker-phone']],
    ['poker table, computer by mouse / стол покера, компьютер мышью', 'poker-touch.mjs', ['1366', '768', '3', quick ? '3' : '8', 'load-poker-desktop'], { INPUT: 'mouse' }],
    ['sea battle, phone by finger / морской бой, телефон пальцем', 'battleship-touch.mjs', ['393', '852', 'classic']],
    ['sea battle, computer by mouse / морской бой, компьютер мышью', 'battleship-touch.mjs', ['1366', '768', 'western'], { INPUT: 'mouse' }],
    ['layout of the sea battle in five languages / раскладка морского боя на пяти языках', 'layout-audit.mjs', ['--game', 'battleship', '--screens', quick ? '320x568,1366x768' : '320x568,393x852,844x390,768x1024,1366x768,1920x1080', '--languages', 'ru,he,en,es,fr']],
    ['draughts, phone by finger / шашки, телефон пальцем', 'checkers-touch.mjs', ['393', '852', 'russian', 'white']],
    ['draughts, computer by mouse / шашки, компьютер мышью', 'checkers-touch.mjs', ['1366', '768', 'english', 'black'], { INPUT: 'mouse' }],
    ['layout of draughts in five languages / раскладка шашек на пяти языках', 'layout-audit.mjs', ['--game', 'checkers', '--to-the-end', '--screens', quick ? '320x568,1366x768' : '320x568,393x852,844x390,768x1024,1366x768,1920x1080', '--languages', 'ru,he,en,es,fr']],
    ['layout of the card tables, phones / раскладка карточных столов, телефоны', 'layout-audit.mjs', ['--game', 'cards', '--screens', quick ? '320x568,393x852' : '320x568,360x780,393x852,430x932,844x390', '--players', quick ? '4,6' : '2,3,4,5,6']],
    ['layout of the card tables, tablets and computers / раскладка, планшеты и компьютеры', 'layout-audit.mjs', ['--game', 'cards', '--screens', quick ? '768x1024,1366x768' : '768x1024,1024x768,1280x720,1366x768,1920x1080', '--players', quick ? '4,6' : '2,3,4,5,6']],
    ['the hub / хаб', 'hub.mjs', quick ? ['--requests', '1500', '--rounds', '5'] : []],
];
const results = [];
for (const [title, script, args, env = {}] of RUNS) {
    console.log(`\n=== ${title}`);
    const started = Date.now();
    const run = spawnSync(process.execPath, [`${here}${script}`, ...args], { stdio: 'inherit', env: { ...process.env, ...env } });
    results.push({ title, ok: run.status === 0, seconds: Math.round((Date.now() - started) / 1000) });
}
console.log('\n=== summary / итог');
for (const result of results) console.log(`${result.ok ? 'OK    ' : 'FAILED'} ${result.title} (${result.seconds} s)`);
process.exitCode = results.every(result => result.ok) ? 0 : 1;

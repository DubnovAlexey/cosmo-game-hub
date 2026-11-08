// [EN] FILE: apps/client/scripts/load/chess.mjs — load test of the chess engine (Stockfish in its Web Worker) and of
//      the chess page around it, in headless Chrome against the production build:
//      A. Stockfish alone: self-play at levels 1–10 with the game's exact commands (Skill Level = level × 2,
//         depth = level × 1.5): time per move, and a watchdog per move (no answer in 30 s = HANG);
//      B. four Stockfish workers thinking at once (four open tabs or a future server);
//      C. "stop" storms: a deep search interrupted and replaced 60 times in a row, as on undo or a new game —
//         every search must still answer;
//      D. real games through the page: random legal moves for White by clicks, Stockfish answers; time from the
//         click to the reply on the board, long tasks of the page, memory after each game, errors.
//      Run (preview server on :4324): node apps/client/scripts/load/chess.mjs [--games 3] [--level 5]
// [RU] ФАЙЛ: нагрузочная проверка шахматного движка (Stockfish в своём Web Worker) и шахматной страницы вокруг него в
//      Chrome без окна на продакшен-сборке:
//      A. Stockfish отдельно: игра сам с собой на уровнях 1–10 теми же командами, что в игре (Skill Level =
//         уровень × 2, глубина = уровень × 1,5): время на ход и сторож на каждый ход (нет ответа 30 с = ЗАВИСАНИЕ);
//      B. четыре воркера Stockfish думают одновременно (четыре открытые вкладки или будущий сервер);
//      C. «шторм стопов»: глубокий поиск 60 раз подряд прерывают и заменяют новым, как при отмене хода или новой
//         партии, — ответить должен каждый поиск;
//      D. настоящие партии через страницу: белые ходят случайными разрешёнными ходами щелчками, Stockfish отвечает;
//         время от щелчка до ответа на доске, долгие задачи страницы, память после каждой партии, ошибки.
import { writeFileSync } from 'node:fs';
import { BASE, emulate, heapMb, launch, longTasks, open, sleep, stats } from './cdp.mjs';

const arg = (name, fallback) => {
    const index = process.argv.indexOf(`--${name}`);
    return index > 0 ? process.argv[index + 1] : fallback;
};
const games = Number(arg('games', 3));
const uiLevel = Number(arg('level', 5));
const phone = process.argv.includes('--phone');
const cpu = Number(arg('cpu', phone ? 4 : 1));
const out = arg('out', null);
const uiOnly = process.argv.includes('--ui-only');
const engineOnly = process.argv.includes('--engine-only');
const report = { date: new Date().toISOString(), base: BASE, phone, cpu, engine: [], parallel: null, stopStorm: null, ui: [] };

// [EN] In-page helpers: one Stockfish worker with a promise per answer. [RU] Помощники в странице: воркер Stockfish и обещание на каждый ответ.
const HELPERS = `
window.__sf = (url) => {
    const worker = new Worker(url);
    let waiter = null;
    worker.onmessage = event => {
        const line = String(event.data);
        if (waiter && waiter.re.test(line)) { const current = waiter; waiter = null; current.resolve(line); }
    };
    const wait = (re, ms) => new Promise((resolve, reject) => {
        waiter = { re, resolve };
        setTimeout(() => { if (waiter && waiter.re === re) { waiter = null; reject(new Error('timeout ' + re)); } }, ms);
    });
    return { worker, wait, send: command => worker.postMessage(command) };
};
window.__selfPlay = async ({ url, level, plies, timeoutMs, capMs }) => {
    const engine = window.__sf(url);
    const started = performance.now();
    engine.send('uci'); await engine.wait(/^uciok/, 30000);
    engine.send('isready'); await engine.wait(/^readyok/, 30000);
    const initMs = performance.now() - started;
    const moves = [];
    const times = [];
    let hang = null;
    engine.send('setoption name Skill Level value ' + Math.round(level * 2));
    for (let ply = 0; ply < plies; ply += 1) {
        engine.send(moves.length ? 'position startpos moves ' + moves.join(' ') : 'position startpos');
        const start = performance.now();
        engine.send('go depth ' + Math.max(1, Math.round(level * 1.5)) + (capMs ? ' movetime ' + capMs : ''));
        let line;
        try { line = await engine.wait(/^bestmove/, timeoutMs); }
        catch { hang = { ply, moves: moves.join(' ') }; break; }
        times.push(performance.now() - start);
        const move = line.split(' ')[1];
        if (!move || move === '(none)') break;
        moves.push(move);
    }
    engine.worker.terminate();
    return { level, initMs: Math.round(initMs), times, plies: moves.length, hang };
};
window.__stopStorm = async ({ url, cycles, timeoutMs }) => {
    const engine = window.__sf(url);
    engine.send('uci'); await engine.wait(/^uciok/, 30000);
    engine.send('isready'); await engine.wait(/^readyok/, 30000);
    const stopMs = [];
    let lost = 0;
    for (let cycle = 0; cycle < cycles; cycle += 1) {
        engine.send('position startpos moves e2e4 e7e5 g1f3 b8c6 f1b5 a7a6');
        engine.send('go depth 30');
        await new Promise(resolve => setTimeout(resolve, 5 + (cycle % 7) * 9));
        const start = performance.now();
        engine.send('stop');
        try { await engine.wait(/^bestmove/, timeoutMs); stopMs.push(performance.now() - start); }
        catch { lost += 1; }
    }
    engine.send('position startpos');
    engine.send('go depth 6');
    let alive = true;
    try { await engine.wait(/^bestmove/, timeoutMs); } catch { alive = false; }
    engine.worker.terminate();
    return { cycles, stopMs, lost, aliveAfter: alive };
};
true;`;

const page = await launch();
try {
    await emulate(page, { phone, cpu });
    const workerUrl = `${BASE}/games/chess/stockfish.js`;

    // A + B + C on a page without the chess island, so nothing else uses the CPU. / A, B, C — на странице без шахмат.
    await open(page, `${BASE}/about/`, 500);
    await page.evaluate(HELPERS);
    // [EN] The game's own limits (EngineManager.ts: depth = level × 1.5, time cap = 400 + level × 160 ms); --raw measures depth alone.
    // [RU] Пределы самой игры (EngineManager.ts: глубина = уровень × 1,5, лимит = 400 + уровень × 160 мс); --raw меряет одну глубину.
    const raw = process.argv.includes('--raw');
    for (const [level, plies] of uiOnly ? [] : [[1, 60], [3, 60], [5, 60], [7, 50], [10, 40]]) {
        const capMs = raw ? 0 : 400 + level * 160;
        const result = await page.evaluate(`window.__selfPlay(${JSON.stringify({ url: workerUrl, level, plies, timeoutMs: 30000, capMs })})`, { timeout: 30 * 60000 });
        const entry = { level, depth: Math.max(1, Math.round(level * 1.5)), capMs, initMs: result.initMs, plies: result.plies, moveMs: stats(result.times), hang: result.hang };
        report.engine.push(entry);
        console.log(`A level ${level} (depth ${entry.depth}): ${entry.plies} plies, move ms ${JSON.stringify(entry.moveMs)}, init ${entry.initMs} ms, hang ${entry.hang ? JSON.stringify(entry.hang) : 'none'}`);
    }
    if (!uiOnly) {
        const parallelStart = Date.now();
        const parallel = await page.evaluate(`Promise.all([0, 1, 2, 3].map(() => window.__selfPlay(${JSON.stringify({ url: workerUrl, level: 7, plies: 20, timeoutMs: 30000, capMs: process.argv.includes('--raw') ? 0 : 400 + 7 * 160 })})))`, { timeout: 30 * 60000 });
        report.parallel = {
            workers: 4, level: 7, wallMs: Date.now() - parallelStart,
            moveMs: stats(parallel.flatMap(result => result.times)), hangs: parallel.filter(result => result.hang).length,
        };
        console.log(`B 4 workers at level 7: move ms ${JSON.stringify(report.parallel.moveMs)}, hangs ${report.parallel.hangs}`);
        const storm = await page.evaluate(`window.__stopStorm(${JSON.stringify({ url: workerUrl, cycles: 60, timeoutMs: 10000 })})`, { timeout: 10 * 60000 });
        report.stopStorm = { cycles: storm.cycles, stopMs: stats(storm.stopMs), lost: storm.lost, aliveAfter: storm.aliveAfter };
        console.log(`C stop storm: ${storm.cycles} cycles, stop→bestmove ms ${JSON.stringify(report.stopStorm.stopMs)}, lost ${storm.lost}, engine alive after: ${storm.aliveAfter}`);
    }

    // D. Real games through the page / Настоящие партии через страницу
    for (let gameIndex = 0; gameIndex < (engineOnly ? 0 : games); gameIndex += 1) {
        page.errors.length = 0;
        page.failed.length = 0;
        await open(page, `${BASE}/games/chess/`, 1500);
        await page.evaluate(`(() => { const start = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Start Game')); start.click(); return true; })()`);
        await sleep(400);
        await page.evaluate(`(() => {
            const slider = document.querySelector('input[type=range]');
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(slider, '${uiLevel}');
            slider.dispatchEvent(new Event('input', { bubbles: true }));
            return slider.value;
        })()`);
        const game = await playOneGame(page);
        const heap = await heapMb(page);
        const tasks = await longTasks(page);
        const entry = { game: gameIndex + 1, level: uiLevel, ...game, heapMb: heap, longTasks: stats(tasks), errors: [...page.errors], failed: [...page.failed] };
        report.ui.push(entry);
        console.log(`D game ${gameIndex + 1}: ${game.plies} plies, ${game.result}, reply ms ${JSON.stringify(game.replyMs)}, long tasks ${tasks.length} (max ${entry.longTasks.max} ms), heap ${heap} MB, errors ${page.errors.length}, hang ${game.hang ?? 'none'}`);
    }
} finally {
    await page.close();
}

if (out) writeFileSync(out, JSON.stringify(report, null, 2));
const problems = report.engine.filter(entry => entry.hang).length + (report.parallel?.hangs ?? 0) + (report.stopStorm?.lost ?? 0)
    + (report.stopStorm?.aliveAfter === false ? 1 : 0) + report.ui.reduce((sum, game) => sum + (game.hang ? 1 : 0) + game.errors.length, 0);
console.log(problems ? `FAILED: ${problems} problems` : 'OK: no hangs, no errors');
process.exitCode = problems ? 1 : 0;

/** [EN] White plays random legal moves by clicks until the game ends. [RU] Белые ходят случайно щелчками до конца партии. */
async function playOneGame(page) {
    const replyMs = [];
    const STATE = `(() => {
        const tiles = [...document.querySelectorAll('[class*="board-tile"]')];
        const sans = [...document.querySelectorAll('[class*="history-san"]')].filter(span => span.textContent.trim()).length;
        const over = /The game has ended|Time is up/.test(document.body.innerText);
        const thinking = document.body.innerText.includes('Engine is thinking');
        return { plies: sans, over, thinking, tiles: tiles.length };
    })()`;
    // [EN] React redraws after the click event, so wait a moment before reading the highlighted squares.
    // [RU] React перерисовывает доску после события щелчка, поэтому перед чтением подсветки нужна пауза.
    const MOVE = `(async () => {
        const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
        const tiles = () => [...document.querySelectorAll('[class*="board-tile"]')];
        const mine = tiles().filter(tile => tile.querySelector('img[alt^="w "]'));
        for (let attempt = 0; attempt < 40; attempt += 1) {
            const from = mine[Math.floor(Math.random() * mine.length)];
            from.click();
            await pause(40);
            const targets = tiles().filter(tile => /highlight-move/.test(tile.className));
            if (targets.length) { targets[Math.floor(Math.random() * targets.length)].click(); return true; }
            from.click();
            await pause(20);
        }
        return false;
    })()`;
    for (let ply = 0; ply < 160; ply += 1) {
        const state = await page.evaluate(STATE);
        if (state.over) return { plies: state.plies, result: 'game over', replyMs: stats(replyMs) };
        if (state.plies % 2 === 1 || state.thinking) { await sleep(50); ply -= 1; continue; }
        if (state.plies >= 140) return { plies: state.plies, result: 'stopped at 70 moves', replyMs: stats(replyMs) };
        const before = state.plies;
        const moved = await page.evaluate(MOVE);
        if (!moved) return { plies: before, result: 'no legal move found by clicks', replyMs: stats(replyMs) };
        await sleep(30);
        await page.evaluate(`(() => { const promo = document.querySelector('[class*="promo-btn"]'); if (promo) promo.click(); return true; })()`);
        const clicked = Date.now();
        for (;;) {
            const now = await page.evaluate(STATE);
            if (now.over) return { plies: now.plies, result: 'game over', replyMs: stats(replyMs) };
            if (now.plies >= before + 2 && !now.thinking) { replyMs.push(Date.now() - clicked); break; }
            if (Date.now() - clicked > 60000) return { plies: now.plies, result: 'hang', hang: `no reply 60 s after ply ${before + 1}`, replyMs: stats(replyMs) };
            await sleep(40);
        }
    }
    return { plies: 160, result: 'limit', replyMs: stats(replyMs) };
}

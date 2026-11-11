// [EN] FILE: apps/client/scripts/load/checkers-touch.mjs — a whole game of draughts played on a screen with real touch
//      taps (touch emulation and CDP touch events, no mouse at all) or, with INPUT=mouse, with a mouse: the menu (the
//      rules, the level, the colour, another opponent), then moves — a glowing man, then a burning square, square by
//      square through a capture — until the game ends. On the way a move is taken back, and a game that drags on is
//      resigned in two presses. At every step each visible control is hit-tested where a finger would press it: a
//      covered or too small control, a tap that lands on something else and a page wider than the screen are reported.
//      Run: node apps/client/scripts/load/checkers-touch.mjs <width> <height> <rules: russian|english> <colour: white|black> <shot-prefix>
//      RESIGN=early gives the game up after ten moves (to see the end screen quickly).
// [RU] ФАЙЛ: целая партия в шашки на экране настоящими касаниями (эмуляция касаний и события касания CDP, без мыши)
//      или, с INPUT=mouse, мышью: меню (правила, уровень, цвет, другой соперник), затем ходы — светящаяся шашка, потом
//      тлеющее поле, поле за полем через взятие, — пока партия не кончится. По дороге один ход берётся назад, а
//      затянувшаяся партия сдаётся двумя нажатиями. На каждом шаге каждая видимая кнопка проверяется там, куда нажмёт
//      палец: закрытая или слишком мелкая кнопка, касание мимо цели и страница шире экрана попадают в отчёт.
//      RESIGN=early сдаёт партию после десяти ходов (чтобы быстро увидеть экран конца).
import fs from 'node:fs';
import { BASE, launch, open, sleep } from './cdp.mjs';

const W = Number(process.argv[2] ?? 390), H = Number(process.argv[3] ?? 844);
const RULES = process.argv[4] ?? 'russian';
const COLOUR = process.argv[5] ?? 'white';
const PREFIX = process.argv[6] ?? null;
const MOUSE = process.env.INPUT === 'mouse';
const RESIGN_AFTER = process.env.RESIGN === 'early' ? 10 : 140;
const page = await launch();
const errors = [];
const problems = new Map();
const misses = [];
page.on('Runtime.exceptionThrown', event => errors.push(event.exceptionDetails?.exception?.description ?? 'exception'));
page.on('Runtime.consoleAPICalled', event => { if (event.type === 'error') errors.push(event.args.map(a => a.value ?? a.description).join(' ')); });

async function tapAt(x, y) {
    if (MOUSE) {
        await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
        await sleep(40);
        await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
        await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
        return;
    }
    await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, radiusX: 6, radiusY: 6 }] });
    await sleep(60);
    await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
/** Scrolls the control into view, waits until it stops moving, checks what is under the finger, taps. */
async function tap(finder) {
    const found = await page.evaluate(`(() => { const el = (${finder})(); if (!el) return false; el.scrollIntoView({ block: 'center', inline: 'nearest' }); return true; })()`);
    if (!found) return false;
    const measure = `(() => { const el = (${finder})(); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, label: (el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 24) }; })()`;
    let box = await page.evaluate(measure);
    for (let i = 0; i < 6 && box; i += 1) {
        await sleep(90);
        const again = await page.evaluate(measure);
        if (!again) return false;
        const steady = Math.abs(again.x - box.x) < 0.5 && Math.abs(again.y - box.y) < 0.5;
        box = again;
        if (steady) break;
    }
    if (!box) return false;
    const under = await page.evaluate(`(() => { const el = document.elementFromPoint(${box.x}, ${box.y}); const b = el?.closest('button, input, select, label'); return b ? (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 24) : (el ? el.tagName.toLowerCase() : 'nothing'); })()`);
    if (under !== box.label) misses.push(`aimed at «${box.label}», the finger lands on «${under}»`);
    await tapAt(box.x, box.y);
    return true;
}

const AUDIT = `(() => {
    const found = [];
    const shown = el => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el); return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none'; };
    const name = el => (el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 26);
    const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
    const scope = modal ?? document.querySelector('#checkers-room');
    for (const el of scope.querySelectorAll('button:not(:disabled), select, input')) {
        if (!shown(el)) continue;
        const r = el.getBoundingClientRect();
        const x = r.x + r.width / 2, y = r.y + r.height / 2;
        if (x < 1 || y < 1 || x > innerWidth - 1 || y > innerHeight - 1) continue;
        const hit = document.elementFromPoint(x, y);
        if (!hit || !(el === hit || el.contains(hit) || hit.closest('label')?.contains(el))) found.push('control ' + name(el) + ' is covered by ' + (hit ? hit.tagName.toLowerCase() + '.' + String(hit.className).split(' ')[0].slice(0, 40) : 'nothing'));
        const square = /_dark_/.test(String(el.className));
        const minimum = ${MOUSE} ? 24 : 36;
        if (Math.min(r.width, r.height) < minimum) found.push('control ' + (square ? 'a square' : name(el)) + ' is small: ' + Math.round(r.width) + '×' + Math.round(r.height));
    }
    const screenWidth = Math.round(window.visualViewport?.width ?? innerWidth);
    if (document.documentElement.scrollWidth > screenWidth + 1 || innerWidth > screenWidth + 1) found.push('the page is wider than the screen: ' + document.documentElement.scrollWidth + ' > ' + screenWidth);
    return found;
})()`;
async function audit(where) {
    for (const problem of await page.evaluate(AUDIT)) {
        const key = problem.replace(/\d+×\d+/, '…');
        if (!problems.has(key)) problems.set(key, `${problem}  [${where}]`);
    }
}
const shot = async name => { if (!PREFIX) return; const s = await page.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${PREFIX}-${name}.png`, Buffer.from(s.data, 'base64')); };
const button = pattern => `() => [...document.querySelectorAll('#checkers-room button')].find(b => ${pattern}.test(b.textContent.trim()) && !b.disabled)`;
const squares = kind => `[...document.querySelectorAll('#checkers-room [class*="_${kind}_"]')]`;
const pick = (kind, index) => `() => { const all = ${squares(kind)}; return all.length ? all[${index} % all.length] : null; }`;
const plies = () => page.evaluate(`JSON.parse(localStorage.getItem('cosmo-game-hub:checkers:save') || 'null')?.data?.game?.log?.length ?? -1`);

let moves = 0;
let presses = 0;
let tookBack = false;
try {
    await page.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: MOUSE ? 1 : 2, mobile: !MOUSE });
    if (!MOUSE) await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: "try { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('cosmo-game-hub:language', 'ru'); sessionStorage.setItem('seeded', '1'); } } catch {}" });
    await open(page, `${BASE}/games/checkers/`, 2200);
    await audit('menu');
    await shot('menu');
    if (RULES === 'english') await tap(button('/^Английские шашки$/'));
    await tap(button('/^как новичок$/'));
    await tap(button(COLOUR === 'black' ? '/^чёрные$/' : '/^белые$/'));
    await tap(button('/^Другой соперник$/'));
    await audit('menu, changed');
    await tap(button('/^Начать партию$/'));
    await sleep(700);
    await audit('the board');
    let waited = 0;
    for (;;) {
        const state = await page.evaluate(`({ over: !!document.querySelector('#checkers-room section[role=status]'), yours: !!document.querySelector('#checkers-room [class*="_boardActive_"]'), targets: ${squares('darkTarget')}.length, movable: ${squares('darkMovable')}.length })`);
        if (state.over) break;
        if (!state.yours || (state.targets === 0 && state.movable === 0)) {
            await sleep(200);
            waited += 200;
            if (waited > 30000) { await shot('stall'); throw new Error('STALL: the opponent does not move'); }
            continue;
        }
        waited = 0;
        if (moves === RESIGN_AFTER) {
            await tap(button('/^Сдаться$/'));
            await sleep(200);
            await audit('resign asked');
            await tap(button('/^Точно сдаться\\?$/'));
            await sleep(500);
            continue;
        }
        if (moves === 5 && !tookBack) {
            // [EN] Take the last move back: the game is shorter by your move and the answer. [RU] Ход назад: партия короче на ваш ход и ответ.
            tookBack = true;
            const before = await plies();
            await tap(button('/^Взять ход назад$/'));
            await sleep(400);
            const after = await plies();
            if (!(after < before && after >= before - 2)) problems.set('take back', `taking a move back: ${before} → ${after} half-moves`);
            continue;
        }
        if (state.targets > 0) {
            if (moves === 2) { await audit('a man chosen'); await shot('chosen'); }
            await tap(pick('darkTarget', moves * 3 + presses));
            presses += 1;
            await sleep(160);
            const still = await page.evaluate(`${squares('darkTarget')}.length`);
            if (still === 0) moves += 1;
        } else {
            await tap(pick('darkMovable', moves * 5 + 1));
            presses += 1;
            await sleep(160);
        }
        if (moves === 8) { await audit('move 8'); await shot('play'); }
        if (presses > 900) throw new Error('STALL: the game does not end');
    }
    await sleep(400);
    await audit('result');
    await shot('result');
    const result = await page.evaluate(`[...document.querySelectorAll('#checkers-room section[role=status] p')].map(p => p.textContent).join(' / ')`);
    console.log(`your moves: ${moves}; presses: ${presses}; ${result}; console errors: ${errors.length}`);
    if (!tookBack) console.log('NOTE: no move was taken back');
    if (problems.size === 0) console.log('no covered or tiny controls');
    else for (const problem of problems.values()) console.log(`PROBLEM: ${problem}`);
    console.log(misses.length ? `MISSES:\n  ${misses.slice(0, 8).join('\n  ')}` : 'every tap landed on its target');
    if (errors.length) console.log(`ERRORS: ${errors.slice(0, 4).join(' | ')}`);
    process.exitCode = problems.size || misses.length || errors.length ? 1 : 0;
} finally {
    await page.close();
}

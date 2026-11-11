// [EN] FILE: apps/client/scripts/load/battleship-touch.mjs — a whole sea battle played on a screen with real touch taps
//      (touch emulation and CDP touch events, no mouse at all) or, with INPUT=mouse, with a mouse: the menu, the
//      fleet (a ship is taken off the sea and put back, the fleet is set out at random), then shots at the
//      opponent's sea until one fleet is sunk. At every step each visible control is hit-tested where a finger
//      would press it: a covered or too small control, a tap that lands on something else and a page wider than
//      the screen are reported.
//      Run: node apps/client/scripts/load/battleship-touch.mjs <width> <height> <rules: classic|western> <shot-prefix>
// [RU] ФАЙЛ: целый морской бой на экране настоящими касаниями (эмуляция касаний и события касания CDP, без мыши) или,
//      с INPUT=mouse, мышью: меню, флот (корабль снимается с моря и ставится обратно, флот расставляется случайно),
//      затем выстрелы по морю соперника, пока один из флотов не потоплен. На каждом шаге каждая видимая кнопка
//      проверяется там, куда нажмёт палец: закрытая или слишком мелкая кнопка, касание мимо цели и страница шире
//      экрана попадают в отчёт.
import fs from 'node:fs';
import { BASE, launch, open, sleep } from './cdp.mjs';

const W = Number(process.argv[2] ?? 390), H = Number(process.argv[3] ?? 844);
const RULES = process.argv[4] ?? 'classic';
const PREFIX = process.argv[5] ?? null;
const MOUSE = process.env.INPUT === 'mouse';
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
    const scope = modal ?? document.querySelector('#battleship-room');
    for (const el of scope.querySelectorAll('button:not(:disabled), select, input')) {
        if (!shown(el)) continue;
        const r = el.getBoundingClientRect();
        const x = r.x + r.width / 2, y = r.y + r.height / 2;
        if (x < 1 || y < 1 || x > innerWidth - 1 || y > innerHeight - 1) continue;
        const hit = document.elementFromPoint(x, y);
        if (!hit || !(el === hit || el.contains(hit) || hit.closest('label')?.contains(el))) found.push('control ' + name(el) + ' is covered by ' + (hit ? hit.tagName.toLowerCase() + '.' + String(hit.className).split(' ')[0].slice(0, 40) : 'nothing'));
        // A cell of a sea is a tenth of a phone's width: smaller than a button, like a card in a fan.
        const cell = /_cell_/.test(String(el.className));
        const box = el.type === 'checkbox';
        const minimum = ${MOUSE} ? (cell || box ? 18 : 24) : (cell || box ? 22 : 36);
        if (Math.min(r.width, r.height) < minimum) found.push('control ' + name(el).replace(/^[^,]+,/, 'a cell,') + ' is small: ' + Math.round(r.width) + '×' + Math.round(r.height));
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
const button = pattern => `() => [...document.querySelectorAll('#battleship-room button')].find(b => ${pattern}.test(b.textContent.trim()) && !b.disabled)`;
const count = selector => page.evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`);

let shots = 0;
try {
    await page.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: MOUSE ? 1 : 2, mobile: !MOUSE });
    if (!MOUSE) await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: "try { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('cosmo-game-hub:language', 'ru'); sessionStorage.setItem('seeded', '1'); } } catch {}" });
    await open(page, `${BASE}/games/battleship/`, 2200);
    // The menu: the rules, a harder gunner, another opponent.
    await audit('menu');
    await shot('menu');
    if (RULES === 'western') await tap(button('/^Международные$/'));
    await tap(button('/^как адмирал$/'));
    await tap(button('/^Другой соперник$/'));
    await audit('menu, changed');
    await tap(button('/^К расстановке$/'));
    await sleep(600);
    // The fleet: take a ship off the sea, turn it, put it back somewhere, then set everything out at random.
    await audit('placing');
    const before = await count('#battleship-room [class*="_hull_"]');
    // The first cell of the first ship, found by the ship's place in the grid (the ship may be below the screen's edge).
    const bow = await page.evaluate(`(() => { const hull = document.querySelector('#battleship-room [class*="_hull_"]'); if (!hull) return null; const column = parseInt(hull.style.gridColumnStart, 10) - 2, row = parseInt(hull.style.gridRowStart, 10) - 2; const cells = hull.parentElement.querySelectorAll('button'); return cells[row * Math.sqrt(cells.length) + column]?.getAttribute('aria-label')?.split(',')[0] ?? null; })()`);
    const bowCell = `() => [...document.querySelectorAll('#battleship-room [class*="_grid_"] button')].find(b => (b.getAttribute('aria-label') || '').split(',')[0] === ${JSON.stringify(bow)})`;
    if (!bow || !await tap(bowCell)) problems.set('lift', 'no ship on the sea to press');
    await sleep(250);
    const lifted = await count('#battleship-room [class*="_hull_"]');
    if (lifted !== before - 1) problems.set('lift', `a press on a ship did not take it off the sea: ${before} → ${lifted}`);
    // The ship in hand goes back to the cell it was taken from, then into the hand again.
    await tap(bowCell);
    await sleep(250);
    const back = await count('#battleship-room [class*="_hull_"]');
    if (back !== before) problems.set('place', `a press on the sea did not put the ship back: ${lifted} → ${back}`);
    await tap(bowCell);
    await sleep(250);
    await tap(button('/^Повернуть/'));
    await audit('placing, a ship in hand');
    await shot('placing');
    await tap(button('/^Расставить случайно$/'));
    await sleep(250);
    if (await count('#battleship-room [class*="_hull_"]') !== before) problems.set('random', 'the random fleet is not whole');
    await tap(button('/^В бой!$/'));
    await sleep(700);
    await audit('battle');
    // The battle: shoot at the first cells that may be shot at, in a scattered order, until somebody wins.
    const enemyCell = `() => { const cells = [...document.querySelectorAll('#battleship-room [class*="_seaEnemy_"] button:not(:disabled)')]; return cells.length ? cells[(cells.length * 7 + ${'${shots}'} * 37) % cells.length] : null; }`;
    let waited = 0;
    for (;;) {
        const state = await page.evaluate(`({ over: !!document.querySelector('#battleship-room section[role=status]'), open: document.querySelectorAll('#battleship-room [class*="_seaEnemy_"] button:not(:disabled)').length })`);
        if (state.over) break;
        if (state.open === 0) {
            await sleep(250);
            waited += 250;
            if (waited > 40000) { await shot('stall'); throw new Error('STALL: the opponent does not shoot'); }
            continue;
        }
        waited = 0;
        if (shots === 6) { await audit('battle, shot 6'); await shot('battle'); }
        if (shots === 30) await audit('battle, shot 30');
        await tap(enemyCell.replace('${shots}', String(shots)));
        shots += 1;
        await sleep(120);
        if (shots > 400) throw new Error('STALL: the battle does not end');
    }
    await sleep(300);
    await audit('result');
    await shot('result');
    const result = await page.evaluate(`document.querySelector('#battleship-room section[role=status] p')?.textContent ?? ''`);
    console.log(`shots: ${shots}; ${result}; console errors: ${errors.length}`);
    if (problems.size === 0) console.log('no covered or tiny controls');
    else for (const problem of problems.values()) console.log(`PROBLEM: ${problem}`);
    console.log(misses.length ? `MISSES:\n  ${misses.slice(0, 8).join('\n  ')}` : 'every tap landed on its target');
    if (errors.length) console.log(`ERRORS: ${errors.slice(0, 4).join(' | ')}`);
    process.exitCode = problems.size || misses.length || errors.length ? 1 : 0;
} finally {
    await page.close();
}

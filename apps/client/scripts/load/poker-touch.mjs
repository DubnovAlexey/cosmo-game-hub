// [EN] FILE: apps/client/scripts/load/poker-touch.mjs — poker played on a screen with real touch taps (touch emulation
//      and CDP touch events, no mouse at all) or, with INPUT=mouse, with a mouse: the menu, then hands with a
//      different decision each time (check or call, a bet or a raise from the slider presets, fold, all-in), then the
//      next hand, until the tournament ends or the hands run out. At every decision every visible control is
//      hit-tested where a finger would press it: a covered or too small control, a tap that lands on something else
//      and a page that scrolls sideways are reported.
//      Run: node apps/client/scripts/load/poker-touch.mjs <width> <height> <opponents> <hands> <shot-prefix>
// [RU] ФАЙЛ: покер на экране настоящими касаниями (эмуляция касаний и события касания CDP, без мыши) или с INPUT=mouse
//      мышью: меню, потом раздачи с разным решением каждый раз (чек или колл, бет или рейз кнопками размера, фолд,
//      олл-ин), потом следующая раздача, пока турнир не кончится или не кончатся раздачи. В каждом решении каждая
//      видимая кнопка проверяется там, куда нажмёт палец: закрытая или слишком мелкая кнопка, касание мимо цели и
//      страница с прокруткой вбок попадают в отчёт.
import { launch, open, sleep, BASE } from './cdp.mjs';
import fs from 'node:fs';

const W = Number(process.argv[2] ?? 390), H = Number(process.argv[3] ?? 844);
const OPPONENTS = process.argv[4] ?? '3';
const HANDS = Number(process.argv[5] ?? 6);
const PREFIX = process.argv[6] ?? 'poker-touch';
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
    await sleep(60);
    await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    return;
  }
  await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, radiusX: 6, radiusY: 6 }] });
  await sleep(70);
  await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
/** Scrolls the control into view, waits until it stops moving, checks what is under the finger, taps. */
async function tap(finder) {
  const found = await page.evaluate(`(() => { const el = (${finder})(); if (!el) return false; el.scrollIntoView({ block: 'center', inline: 'center' }); return true; })()`);
  if (!found) return false;
  const measure = `(() => { const el = (${finder})(); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, label: (el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 24) }; })()`;
  let box = await page.evaluate(measure);
  for (let i = 0; i < 6 && box; i += 1) {
    await sleep(110);
    const again = await page.evaluate(measure);
    if (!again) return false;
    const steady = Math.abs(again.x - box.x) < 0.5 && Math.abs(again.y - box.y) < 0.5;
    box = again;
    if (steady) break;
  }
  if (!box) return false;
  const under = await page.evaluate(`(() => { const el = document.elementFromPoint(${box.x}, ${box.y}); const b = el?.closest('button, input, select'); return b ? (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 24) : (el ? el.tagName.toLowerCase() : 'nothing'); })()`);
  if (under !== box.label) misses.push(`aimed at «${box.label}», the finger lands on «${under}»`);
  await tapAt(box.x, box.y);
  return true;
}

const AUDIT = `(() => {
  const found = [];
  const shown = el => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el); return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none'; };
  const name = el => (el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 26);
  const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
  const scope = modal ?? document.querySelector('#poker-room');
  for (const el of scope.querySelectorAll('button:not(:disabled), select, input')) {
    if (!shown(el)) continue;
    const r = el.getBoundingClientRect();
    const x = r.x + r.width / 2, y = r.y + r.height / 2;
    if (x < 1 || y < 1 || x > innerWidth - 1 || y > innerHeight - 1) continue;
    const hit = document.elementFromPoint(x, y);
    if (!hit || !(el === hit || el.contains(hit))) found.push('control ' + name(el) + ' is covered by ' + (hit ? hit.tagName.toLowerCase() + '.' + String(hit.className).split(' ')[0].slice(0, 40) : 'nothing'));
    const minimum = ${MOUSE} ? 24 : 36;
    const slider = el.type === 'range';
    if (Math.min(slider ? r.height : r.width, r.height) < minimum) found.push('control ' + name(el) + ' is small: ' + Math.round(r.width) + '×' + Math.round(r.height));
  }
  // A mobile browser widens innerWidth itself when something sticks out, so the page is compared with the screen.
  const screenWidth = Math.round(window.visualViewport?.width ?? innerWidth);
  if (document.documentElement.scrollWidth > screenWidth + 1 || innerWidth > screenWidth + 1) found.push('the page is wider than the screen: ' + document.documentElement.scrollWidth + ' > ' + screenWidth);
  return found;
})()`;
async function audit(where) {
  for (const problem of await page.evaluate(AUDIT)) {
    const key = problem.replace(/\\d+×\\d+/, '…');
    if (!problems.has(key)) problems.set(key, `${problem}  [${where}]`);
  }
}
const shot = async name => { const s = await page.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${PREFIX}-${name}.png`, Buffer.from(s.data, 'base64')); };
const button = pattern => `() => [...document.querySelectorAll('#poker-room button, [role=dialog] button')].find(b => ${pattern}.test(b.textContent.trim()) && !b.disabled)`;
const trayButton = pattern => `() => { const tray = [...document.querySelectorAll('#poker-room section')].find(s => /Ваш ход/.test(s.textContent)); return tray ? [...tray.querySelectorAll('button')].find(b => ${pattern}.test(b.textContent.trim()) && !b.disabled) : null; }`;

let hands = 0, decisions = 0, lastKey = '', lastChange = Date.now();
try {
  await page.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: MOUSE ? 1 : 2, mobile: !MOUSE });
  if (!MOUSE) await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await page.send('Runtime.enable');
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: "try { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('cosmo-game-hub:language', 'ru'); sessionStorage.setItem('seeded', '1'); } } catch {}" });
  await open(page, `${BASE}/games/poker/`, 2500);
  await tap(`() => [...document.querySelectorAll('[role=dialog] button')].find(b => b.textContent.trim() === ${JSON.stringify(OPPONENTS)})`);
  await audit('menu');
  await shot('menu');
  await tap(button('/^Сесть за стол$/'));
  await sleep(900);
  // The decisions cycle so that every kind of button is pressed.
  const plan = ['/^(Чек|Колл)/', '/½ банка/', '/^(Бет|Рейз)/', '/^(Чек|Колл)/', '/^Фолд$/', '/^(Чек|Колл)/', '/Банк/', '/^(Бет|Рейз)/'];
  while (hands < HANDS) {
    const state = await page.evaluate(`({
      yours: [...document.querySelectorAll('#poker-room section')].some(s => /Ваш ход/.test(s.textContent)),
      next: [...document.querySelectorAll('#poker-room button')].some(b => b.textContent.trim() === 'Следующая раздача'),
      over: [...document.querySelectorAll('#poker-room button')].some(b => b.textContent.trim() === 'Новый турнир'),
      log: document.querySelectorAll('#poker-room ol li').length,
    })`);
    const key = JSON.stringify(state);
    if (key !== lastKey) { lastKey = key; lastChange = Date.now(); }
    if (Date.now() - lastChange > 30000) {
      await shot('stall');
      console.log(misses.length ? `MISSES before the stall:\n  ${misses.slice(-8).join('\n  ')}` : 'no misses before the stall');
      throw new Error(`STALL: ${key}`);
    }
    if (state.over) { await audit('tournament over'); console.log('the tournament ended'); break; }
    if (state.next) {
      await audit('result');
      if (hands === 0) await shot('result');
      hands += 1;
      await tap(button('/^Следующая раздача$/'));
      await sleep(700);
      continue;
    }
    if (!state.yours) { await sleep(300); continue; }
    await audit(`decision ${decisions}`);
    if (decisions === 1) await shot('decision');
    const want = plan[decisions % plan.length];
    let done = false;
    if (want === '/½ банка/' || want === '/Банк/') {
      // A size from the presets, then the raise itself.
      done = await tap(trayButton(want === '/Банк/' ? '/^Банк$/' : want)) && (await sleep(150), await tap(trayButton('/^(Бет|Рейз|Олл-ин)/')));
    } else {
      done = await tap(trayButton(want));
    }
    if (!done) done = await tap(trayButton('/^(Чек|Колл)/')) || await tap(trayButton('/^(Фолд|Олл-ин)/'));
    decisions += 1;
    await sleep(500);
  }
  console.log(`hands: ${hands}, decisions: ${decisions}, console errors: ${errors.length}`);
  if (problems.size === 0) console.log('no covered or tiny controls');
  else for (const problem of problems.values()) console.log(`PROBLEM: ${problem}`);
  console.log(misses.length ? `MISSES:\n  ${misses.slice(0, 8).join('\n  ')}` : 'every tap landed on its target');
  if (errors.length) console.log(`ERRORS: ${errors.slice(0, 4).join(' | ')}`);
  process.exitCode = problems.size || misses.length || errors.length ? 1 : 0;
} finally {
  await page.close();
}

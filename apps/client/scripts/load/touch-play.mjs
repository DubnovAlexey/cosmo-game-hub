// [EN] FILE: apps/client/scripts/load/touch-play.mjs — plays preferans the way people do: by finger on a phone or a
//      tablet (touch emulation and CDP touch events, no mouse at all) or, with INPUT=mouse, with a mouse on a computer —
//      both are equal scenarios and are checked the same way (Alexey, 09.11.2026). At every decision each enabled button
//      and each card of a hand is hit-tested where a finger or a pointer would land; a covered or too small control,
//      and a tap that lands on something else, are reported. Options are ticked on the menu by their Russian labels.
//      Needs the production build served (see run-all.mjs). Usage:
//        node apps/client/scripts/load/touch-play.mjs <width> <height> <players> "<variant,option,…>" <deals> <shot-prefix>
//        INPUT=mouse node apps/client/scripts/load/touch-play.mjs 1600 1000 3 "Классика,Тёмные заявки" 5 desktop
// [RU] ФАЙЛ: играет в преферанс так, как играют люди: пальцем на телефоне или планшете (эмуляция касаний и события
//      касания CDP, без мыши) или, с INPUT=mouse, мышью на компьютере — это равноценные сценарии, и проверяются они
//      одинаково (Алексей, 09.11.2026). На каждом решении каждая доступная кнопка и каждая карта руки проверяются там,
//      куда попадёт палец или указатель; закрытый или слишком мелкий элемент и нажатие, попавшее не туда, попадают в
//      отчёт. Опции включаются в меню по русским подписям. Нужна отданная сервером продакшен-сборка (см. run-all.mjs).
import { BASE, launch, open, sleep } from './cdp.mjs';
import fs from 'node:fs';

const W = Number(process.argv[2] ?? 390), H = Number(process.argv[3] ?? 844);
const PLAYERS = process.argv[4] ?? '3';
const CHOICES = (process.argv[5] ?? '').split(',').map(text => text.trim()).filter(Boolean);
const DEALS = Number(process.argv[6] ?? 3);
const PREFIX = process.argv[7] ?? 'touch';
const page = await launch();
const errors = [];
const problems = new Map();
page.on('Runtime.exceptionThrown', event => errors.push(event.exceptionDetails?.exception?.description ?? 'exception'));
page.on('Runtime.consoleAPICalled', event => { if (event.type === 'error') errors.push(event.args.map(a => a.value ?? a.description).join(' ')); });

// INPUT=mouse plays the same game with a mouse instead of a finger: both ways are checked the same.
const MOUSE = process.env.INPUT === 'mouse';
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
/** Scrolls the control into view and taps it at `fraction` of its width (a fanned card shows only its left part). */
const misses = [];
async function tap(finder, fraction = 0.5) {
  const measure = `(() => { const el = (${finder})(); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width * ${fraction}, y: r.y + r.height / 2, label: el.getAttribute('aria-label') || el.textContent.trim().slice(0, 20) }; })()`;
  const found = await page.evaluate(`(() => { const el = (${finder})(); if (!el) return false; el.scrollIntoView({ block: 'center', inline: 'center' }); return true; })()`);
  if (!found) return false;
  // Wait until the control stops moving (scrolling, a card rising) and tap where it really is.
  let box = await page.evaluate(measure);
  for (let i = 0; i < 6 && box; i += 1) {
    await sleep(120);
    const again = await page.evaluate(measure);
    if (!again) return false;
    const steady = Math.abs(again.x - box.x) < 0.5 && Math.abs(again.y - box.y) < 0.5;
    box = again;
    if (steady) break;
  }
  if (!box) return false;
  const under = await page.evaluate(`(() => { const hit = document.elementFromPoint(${box.x}, ${box.y}); const owner = hit && hit.closest('button, label, select'); return owner ? (owner.getAttribute('aria-label') || owner.textContent.trim().slice(0, 20)) : (hit ? hit.tagName : 'nothing'); })()`);
  if (under !== box.label) misses.push(`aimed at «${box.label}», the finger lands on «${under}»`);
  await tapAt(box.x, box.y);
  return true;
}
const shot = async name => { const s = await page.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${PREFIX}-${name}.png`, Buffer.from(s.data, 'base64')); };
const byText = (selector, pattern) => `() => [...document.querySelectorAll(${JSON.stringify(selector)})].find(b => ${pattern}.test(b.textContent.trim()) && !b.disabled)`;

const AUDIT = `(() => {
  const found = [];
  const shown = el => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el); return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none'; };
  const name = el => (el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 26);
  // While the table menu is open it is the only thing to tap: the table under it is meant to be covered.
  const modal = document.querySelector('[class*="setupBackdrop"]') ?? document.querySelector('[role="dialog"][aria-modal="true"]');
  const scope = modal ?? document.querySelector('#preferans-room');
  for (const el of scope.querySelectorAll('button:not(:disabled), select')) {
    if (!shown(el)) continue;
    const r = el.getBoundingClientRect();
    const card = /card/.test(el.className);
    const x = r.x + r.width * (card ? 0.2 : 0.5), y = r.y + r.height * (card ? 0.35 : 0.5);
    if (x < 1 || y < 1 || x > innerWidth - 1 || y > innerHeight - 1) continue; // scrolled away: checked when it comes into view
    // Hidden by the scroll of its own box (the gallery of portraits): reached by scrolling that box, not covered.
    let clipped = false;
    for (let box = el.parentElement; box && box !== document.body; box = box.parentElement) {
      const st = getComputedStyle(box);
      if (!/(auto|scroll|hidden)/.test(st.overflowX + st.overflowY)) continue;
      const b = box.getBoundingClientRect();
      if (x < b.left || x > b.right || y < b.top || y > b.bottom) { clipped = true; break; }
    }
    if (clipped) continue;
    const hit = document.elementFromPoint(x, y);
    if (!hit || !(el === hit || el.contains(hit))) found.push((card ? 'card ' : 'control ') + name(el) + ' is covered by ' + (hit ? hit.tagName.toLowerCase() + '.' + String(hit.className).split(' ')[0].slice(0, 40) : 'nothing'));
    // A finger needs a bigger target than a mouse pointer.
    const minimum = ${MOUSE} ? (card ? 18 : 24) : (card ? 24 : 36);
    if (Math.min(r.width * (card ? 0.6 : 1), r.height) < minimum) found.push((card ? 'card ' : 'control ') + name(el) + ' is small: ' + Math.round(r.width) + '×' + Math.round(r.height));
  }
  // A mobile browser widens innerWidth itself when something sticks out, so the page is compared with the screen.
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

const STATE = `(() => {
  const panel = document.querySelector('[class*="_panel_"]');
  return {
    text: (panel?.innerText ?? '').replace(/\\s+/g, ' ').slice(0, 120),
    next: [...document.querySelectorAll('button')].some(b => /Следующая раздача/.test(b.textContent)),
    over: /закрыта/i.test(document.querySelector('[class*="overlay"], [role="dialog"]')?.textContent ?? '') && !!document.querySelector('[class*="overlay"]'),
    total: document.querySelectorAll('[class*="seat"] [class*="card"]').length,
  };
})()`;

let deals = 0, actions = 0, lastKey = '', lastChange = Date.now(), shots = 0;
try {
  await page.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: MOUSE ? 1 : 2, mobile: !MOUSE, screenOrientation: W > H ? { type: 'landscapePrimary', angle: 90 } : { type: 'portraitPrimary', angle: 0 } });
  if (!MOUSE) await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await page.send('Runtime.enable');
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: "try { localStorage.clear(); localStorage.setItem('cosmo-game-hub:language', 'ru'); } catch {}" });
  await open(page, `${BASE}/games/preferans/`, 2500);
  await tap(`() => [...document.querySelectorAll('button')].find(b => /^${PLAYERS} ·/.test(b.textContent.trim()))`);
  await sleep(300);
  for (const choice of CHOICES) {
    const done = await tap(`() => [...document.querySelectorAll('button, label')].find(el => el.textContent.trim().startsWith(${JSON.stringify(choice)}) && !el.disabled && !el.querySelector('input:disabled'))`);
    if (!done) console.log(`  menu: "${choice}" not found or closed`);
    await sleep(250);
  }
  await audit('menu');
  await shot('menu');
  await tap(byText('button', /^Играть$/));
  await sleep(1500);
  while (deals < DEALS) {
    const s = await page.evaluate(STATE);
    if (s.over) { console.log('pool closed'); break; }
    const key = `${s.text}|${s.total}|${s.next}`;
    if (key !== lastKey) { lastKey = key; lastChange = Date.now(); }
    if (Date.now() - lastChange > 30000) { await shot('stall'); throw new Error(`STALL: ${JSON.stringify(s)}`); }
    if (/думает/.test(s.text) && !/Посмотреть карты/.test(s.text)) { await sleep(400); continue; }
    await audit(s.next ? 'result' : s.text.slice(0, 40));
    if (shots < 4 && !s.next && !/думает/.test(s.text)) { shots += 1; await shot(`decision${shots}`); }
    if (s.next) {
      deals += 1;
      console.log(`deal ${deals}: ${await page.evaluate(`document.querySelector('[class*="resultText"]')?.innerText ?? ''`)}`);
      if (deals === 1) await shot('result');
      if (deals >= DEALS) break;
      await tap(byText('button', /Следующая раздача/));
      actions += 1; await sleep(900); continue;
    }
    const panelButton = pattern => byText('[class*="_panel_"] button', pattern);
    if (/Карты ещё закрыты/.test(s.text)) {
      // Now and then speak in the dark, mostly look first.
      const dark = actions % 4 === 1 && await tap(panelButton(/втёмную/));
      if (!dark) await tap(panelButton(/Посмотреть карты/));
      actions += 1; await sleep(600); continue;
    }
    if (/Посмотреть карты/.test(s.text) && /думает/.test(s.text)) { await tap(panelButton(/Посмотреть карты/)); actions += 1; await sleep(500); continue; }
    if (/заявили втёмную/.test(s.text)) { await tap(panelButton(/^Пас$/)); actions += 1; await sleep(600); continue; }
    if (/Позвать сдающего|Оба защитника спасовали|Вистовать рукой/.test(s.text)) { await tap(`() => document.querySelector('[class*="_panel_"] button:not(:disabled)')`); actions += 1; await sleep(600); continue; }
    if (/снос|Снести|прикуп: выберите/.test(s.text)) {
      for (let i = 0; i < 2; i += 1) { await tap(`() => [...document.querySelectorAll('[class*="seatBottom"] button[class*="card"]')].filter(b => !b.disabled && b.getAttribute('aria-pressed') !== 'true')[0]`, 0.2); await sleep(300); }
      await tap(panelButton(/Снести/));
      actions += 1; await sleep(700); continue;
    }
    if (/Закажите игру/.test(s.text)) { await tap(`() => [...document.querySelectorAll('[class*="bidGrid"] button')].find(b => !b.disabled)`); actions += 1; await sleep(700); continue; }
    if (/Вист|полвиста|В светлую|Втёмную/.test(s.text) && !/приподнятых/.test(s.text)) { await tap(`() => document.querySelector('[class*="_panel_"] button:not(:disabled)')`); actions += 1; await sleep(700); continue; }
    if (/Ваше слово|здесь|: \d|Мизер/.test(s.text)) {
      const bid = actions % 3 === 0 && await tap(`() => [...document.querySelectorAll('[class*="bidGrid"] button')].find(b => !b.disabled)`);
      if (!bid) await tap(panelButton(/^Пас$/));
      actions += 1; await sleep(600); continue;
    }
    if (/приподнятых/.test(s.text)) {
      const before = s.total;
      const finder = `() => [...document.querySelectorAll('[class*="seat"] button[class*="card"]')].find(b => !b.disabled)`;
      const probe = await page.evaluate(`(() => { const el = (${finder})(); if (!el) return 'no card'; el.scrollIntoView({ block: 'center', inline: 'center' });
        const r = el.getBoundingClientRect(); const x = r.x + r.width * 0.2, y = r.y + r.height / 2; const hit = document.elementFromPoint(x, y);
        return (el.getAttribute('aria-label') || '?') + ' at ' + Math.round(x) + ',' + Math.round(y) + ' rect ' + [r.x, r.y, r.width, r.height].map(Math.round).join(',') + ' → ' + (hit ? (hit === el ? 'itself' : hit.tagName + '.' + String(hit.className).slice(0, 50) + ' ' + (hit.getAttribute('aria-label') || '')) : 'nothing'); })()`);
      await tap(finder, 0.2);
      actions += 1; await sleep(800);
      const after = await page.evaluate(STATE);
      if (after.total === before) console.log(`  (a tap on a card did not play: ${probe})`);
      continue;
    }
    await sleep(400);
  }
  await shot('end');
  console.log(`deals: ${deals}, taps: ${actions}, console errors: ${errors.length}`);
  if (errors.length) console.log(errors.slice(0, 4).join('\n'));
  console.log(problems.size ? `PROBLEMS (${problems.size}):\n  ${[...problems.values()].join('\n  ')}` : 'no covered or tiny controls');
  console.log(misses.length ? `MISSED TAPS (${misses.length}): ${[...new Set(misses)].slice(0, 8).join(' | ')}` : 'every tap landed on its target');
} finally {
  await page.close();
}

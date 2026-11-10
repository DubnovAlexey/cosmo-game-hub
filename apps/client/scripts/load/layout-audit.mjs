// [EN] FILE: apps/client/scripts/load/layout-audit.mjs — looks at the card tables the way a person looks at a screen:
//      on phones (upright and on their side), tablets and computers, with every number of players, it opens every
//      portrait's caption and checks three things.
//        1. No text goes past the screen or is cut by a box around it (a caption cut by the screen edge on a phone,
//           Alexey, 10.11.2026).
//        2. No text is hidden under something painted over it (a card over «Префлоп · Банк 30», a card over a bet).
//        3. On the poker oval no seat lies on the board, the pot, a bet or another seat.
//      Text inside playing cards is skipped here (fanned cards overlap on purpose); the poker check covers the
//      board cards themselves. Needs the production build served (see run-all.mjs). Usage:
//        node apps/client/scripts/load/layout-audit.mjs [--game poker|preferans|all] [--screens 393x852,1366x768]
//            [--players 2,3,4,5,6] [--languages ru,he] [--shots <folder>] [--hands 2]
// [RU] ФАЙЛ: смотрит на карточные столы так, как человек смотрит на экран: на телефонах (стоя и лёжа), планшетах и
//      компьютерах, при любом числе игроков, раскрывает подпись каждого портрета и проверяет три вещи.
//        1. Никакой текст не выходит за экран и не обрезается рамкой вокруг (подпись, обрезанная краем экрана на
//           телефоне, Алексей, 10.11.2026).
//        2. Никакой текст не спрятан под чем-то нарисованным поверх (карта на «Префлоп · Банк 30», карта на ставке).
//        3. На покерном овале ни одно место не лежит на доске, банке, ставке или другом месте.
//      Текст внутри игральных карт здесь пропускается (карты веером перекрываются нарочно); сами карты доски
//      проверяет покерная проверка. Нужна отданная сервером продакшен-сборка (см. run-all.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { BASE, launch, open, sleep } from './cdp.mjs';

const option = (name, fallback) => {
    const index = process.argv.indexOf(`--${name}`);
    return index > 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};
// [EN] Phones upright and on their side, tablets both ways, computers. [RU] Телефоны стоя и лёжа, планшеты в обе стороны, компьютеры.
const ALL_SCREENS = '320x568,360x780,375x667,390x844,393x852,412x915,430x932,667x375,844x390,932x430,768x1024,820x1180,1024x768,1024x1366,1180x820,1280x720,1366x768,1440x900,1920x1080';
const GAME = option('game', 'all');
const SCREENS = option('screens', ALL_SCREENS).split(',').map(text => text.split('x').map(Number));
const PLAYERS = option('players', '2,3,4,5,6').split(',').map(Number);
const LANGUAGES = option('languages', 'ru').split(',');
const SHOTS = option('shots', null);
const HANDS = Number(option('hands', '1'));
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

/** [EN] A phone or a tablet is touched; a computer is clicked. [RU] Телефон и планшет трогают пальцем, на компьютере щёлкают. */
const touchScreen = (width, height) => width <= 1180 || (width <= 1366 && height > width);

// [EN] The checks run inside the page. Elements are found by the start of their CSS-module class («_seat_…»).
// [RU] Проверки выполняются внутри страницы. Элементы ищутся по началу класса CSS-модуля («_seat_…»).
const TEXT_AUDIT = `((rootSelector) => {
  const found = [];
  const root = document.querySelector(rootSelector);
  if (!root) return ['no ' + rootSelector + ' on the page'];
  const screenWidth = window.visualViewport ? window.visualViewport.width : innerWidth;
  const screenHeight = innerHeight;
  const POPOVER = '[role="dialog"], [role="note"], [role="tooltip"], [data-popover]';
  const label = el => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0].replace(/^_|_[a-z0-9]+_\\d+$/g, '') : '');
  const alpha = colour => { const m = colour.match(/rgba?\\(([^)]+)\\)/); if (!m) return colour === 'transparent' ? 0 : 1; const parts = m[1].split(/[\\s,/]+/).filter(Boolean); return parts.length > 3 ? parseFloat(parts[3]) : 1; };
  const ownText = (el, x, y) => [...el.childNodes].some(node => {
    if (node.nodeType !== 3 || !node.textContent.trim()) return false;
    const range = document.createRange(); range.selectNodeContents(node);
    return [...range.getClientRects()].some(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
  });
  const painted = (el, x, y) => {
    const tag = el.tagName.toLowerCase();
    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || parseFloat(st.opacity) < 0.05) return false;
    if (['img', 'canvas', 'video', 'input', 'select', 'textarea'].includes(tag)) return true;
    if (el instanceof SVGElement) return tag === 'svg' ? false : st.fill !== 'none' || st.stroke !== 'none';
    if (alpha(st.backgroundColor) > 0.05 || st.backgroundImage !== 'none') return true;
    return ownText(el, x, y);
  };
  // [EN] Pointer-transparent layers (the pot, the bets) are made hit-testable for the moment of the check.
  // [RU] Прозрачные для указателя слои (банк, ставки) на время проверки становятся видимыми для попаданий.
  const lift = document.createElement('style');
  lift.textContent = rootSelector + ' *:not([aria-hidden="true"]):not([aria-hidden="true"] *) { pointer-events: auto !important; }';
  document.head.append(lift);
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent.replace(/\\s+/g, ' ').trim();
      if (!text) continue;
      const owner = node.parentElement;
      if (!owner || owner.closest('[class*="card"], [class*="Card"], option, script, style')) continue;
      const st = getComputedStyle(owner);
      if (st.visibility === 'hidden' || parseFloat(st.opacity) < 0.05) continue;
      // [EN] Text kept only for screen readers (a box of one pixel) is not on the screen at all. [RU] Текст только для экранного диктора (рамка в один пиксель) на экране не виден вовсе.
      let spoken = false;
      for (let box = owner; box && box !== root; box = box.parentElement) {
        const b = box.getBoundingClientRect();
        if ((b.width <= 2 || b.height <= 2) && getComputedStyle(box).overflow !== 'visible') { spoken = true; break; }
      }
      if (spoken) continue;
      const popover = owner.closest(POPOVER);
      const range = document.createRange(); range.selectNodeContents(node);
      // [EN] A word must not be torn between two lines («Хрустальны» + «й Череп» on a narrow plaque).
      // [RU] Слово не должно рваться между двумя строками («Хрустальны» + «й Череп» на узкой табличке).
      if (range.getClientRects().length > 1) {
        const words = /[\\p{L}\\p{N}]{4,}/gu;
        for (let word = words.exec(node.textContent); word; word = words.exec(node.textContent)) {
          const piece = document.createRange(); piece.setStart(node, word.index); piece.setEnd(node, word.index + word[0].length);
          const tops = [...piece.getClientRects()].filter(r => r.width > 0.5).map(r => r.top);
          if (tops.length > 1 && Math.max(...tops) - Math.min(...tops) > 4) found.push('the word «' + word[0] + '» is torn between two lines in ' + label(owner));
        }
      }
      for (const line of range.getClientRects()) {
        if (line.width < 2 || line.height < 2) continue;
        // [EN] What is left of the line after every box that hides its overflow. [RU] Что остаётся от строки после всех рамок, скрывающих выступ.
        let left = line.left, right = line.right, cutBy = null, scrolled = false;
        for (let box = owner; box && box !== document.documentElement; box = box.parentElement) {
          const bs = getComputedStyle(box);
          if (bs.overflowX === 'visible' && bs.overflowY === 'visible') continue;
          const b = box.getBoundingClientRect();
          const scroller = /(auto|scroll)/.test(bs.overflowX + bs.overflowY);
          const nextLeft = Math.max(left, b.left), nextRight = Math.min(right, b.right);
          if ((nextLeft > left + 1 || nextRight < right - 1) && !scroller) {
            const intended = bs.textOverflow === 'ellipsis' || getComputedStyle(owner).textOverflow === 'ellipsis';
            if (!intended && !cutBy) cutBy = label(box);
          }
          if (scroller && (line.bottom < b.top || line.top > b.bottom)) scrolled = true;
          left = nextLeft; right = nextRight;
        }
        if (scrolled) continue;
        const sample = text.slice(0, 44);
        if (cutBy) found.push('text «' + sample + '» is cut by ' + cutBy);
        if (left < -0.5 || right > screenWidth + 0.5) found.push('text «' + sample + '» goes past the screen: ' + Math.round(left) + '…' + Math.round(right) + ' of ' + Math.round(screenWidth));
        const y = line.top + line.height / 2;
        if (y < 0 || y > screenHeight) continue; // [EN] below the fold: seen when scrolled to. [RU] ниже экрана: проверяется при прокрутке.
        for (const x of [line.left + Math.min(4, line.width / 3), (line.left + line.right) / 2, line.right - Math.min(4, line.width / 3)]) {
          if (x < 0 || x > screenWidth) continue;
          const stack = document.elementsFromPoint(x, y);
          const at = stack.findIndex(el => el === owner || owner.contains(el));
          if (at <= 0) continue;
          // [EN] An open caption lies over the table on purpose; only what covers the caption itself counts.
          // [RU] Раскрытая подпись лежит поверх стола нарочно; считается только то, что закрывает саму подпись.
          const cover = stack.slice(0, at).find(el => !el.contains(owner) && painted(el, x, y) && (popover ? true : !el.closest(POPOVER)));
          if (cover) { found.push('text «' + sample + '» is covered by ' + label(cover)); break; }
        }
        // [EN] A line must stay inside the plate it is written on (a name wider than its plaque).
        // [RU] Строка должна оставаться внутри таблички, на которой написана (имя шире своей таблички).
        for (let box = owner; box && box !== root; box = box.parentElement) {
          const bs = getComputedStyle(box);
          const plate = alpha(bs.backgroundColor) > 0.05 || bs.backgroundImage !== 'none' || parseFloat(bs.borderTopWidth) > 0;
          if (!plate || bs.display === 'inline') continue;
          const b = box.getBoundingClientRect();
          // [EN] What is seen of the line (a name cut by its own dots on purpose is seen only inside its box).
          // [RU] То, что видно от строки (имя, нарочно обрезанное многоточием, видно только внутри своей рамки).
          if (left < b.left - 1.5 || right > b.right + 1.5) found.push('text «' + sample + '» sticks out of its plate ' + label(box));
          break;
        }
      }
    }
  } finally {
    lift.remove();
  }
  if (document.documentElement.scrollWidth > Math.round(screenWidth) + 1) {
    // [EN] Name what sticks out: the widest thing that no box around it cuts off. [RU] Назвать, что торчит: самое широкое из того, что не обрезает ни одна рамка вокруг.
    let widest = null;
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= screenWidth + 1) continue;
      let cut = false;
      for (let box = el.parentElement; box && box !== document.body; box = box.parentElement) {
        if (getComputedStyle(box).overflowX !== 'visible' && box.getBoundingClientRect().right <= screenWidth + 1) { cut = true; break; }
      }
      if (!cut && (!widest || r.right > widest.right)) widest = { right: r.right, left: r.left, name: label(el) };
    }
    found.push('the page is wider than the screen: ' + document.documentElement.scrollWidth + ' > ' + Math.round(screenWidth) + (widest ? ' (' + widest.name + ' ' + Math.round(widest.left) + '…' + Math.round(widest.right) + ')' : ''));
  }
  return found;
})`;

const POKER_AUDIT = `(() => {
  const found = [];
  const felt = document.querySelector('#poker-room [class*="_felt_"]');
  if (!felt) return ['no poker table'];
  const box = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? r : null; };
  const overlap = (a, b, by = 2) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > by && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > by;
  const parts = [];
  const seats = [...felt.querySelectorAll('[class*="_seat_"]')];
  seats.forEach((seat, index) => {
    const name = (seat.querySelector('[class*="_seatName_"]')?.textContent ?? 'seat ' + index).trim();
    for (const [what, selector] of [['portrait', '[class*="_portrait_"]'], ['plaque', '[class*="_plaque_"]'], ['cards', '[class*="_card_"]'], ['button and blinds', '[class*="_badges_"] > *'], ['status', '[class*="_status_"]'], ['bet', '[class*="_bet_"]']]) {
      for (const el of seat.querySelectorAll(selector)) { const r = box(el); if (r) parts.push({ seat: index, name, what, r }); }
    }
  });
  const middle = [];
  for (const [what, selector] of [['the board', '[class*="_board_"]'], ['the pot', '[class*="_pot_"]']]) {
    const el = felt.querySelector(selector); const r = el && box(el); if (r) middle.push({ what, r });
  }
  const screenWidth = window.visualViewport ? window.visualViewport.width : innerWidth;
  for (const part of parts) {
    if (part.r.left < -0.5 || part.r.right > screenWidth + 0.5) found.push(part.name + ': ' + part.what + ' goes past the screen');
    for (const m of middle) if (overlap(part.r, m.r)) found.push(part.name + ': ' + part.what + ' lies on ' + m.what);
  }
  for (let i = 0; i < parts.length; i += 1) for (let j = i + 1; j < parts.length; j += 1) {
    const a = parts[i], b = parts[j];
    if (a.seat !== b.seat) { if (overlap(a.r, b.r)) found.push(a.name + ': ' + a.what + ' lies on ' + b.name + ': ' + b.what); continue; }
    // [EN] Inside one seat: the bet and the plaque keep clear of the cards and of each other (the status is written
    //      across the cards and the button sits on a corner on purpose).
    // [RU] Внутри одного места: ставка и табличка не задевают карты и друг друга (статус пишется поверх карт, а
    //      баттон сидит на углу нарочно).
    const pair = [a.what, b.what].sort().join('+');
    if (['bet+cards', 'bet+plaque', 'bet+portrait', 'cards+plaque', 'bet+button and blinds'].includes(pair) && overlap(a.r, b.r, 3)) found.push(a.name + ': ' + a.what + ' lies on its own ' + b.what);
  }
  // [EN] The oval itself must be on the screen whole. [RU] Сам овал должен быть на экране целиком.
  const table = felt.getBoundingClientRect();
  if (table.left < -0.5 || table.right > screenWidth + 0.5) found.push('the table goes past the screen');
  return found;
})()`;

const problems = new Map();
let checks = 0;
function note(where, list) {
    checks += 1;
    for (const problem of list) {
        const key = problem.replace(/-?\d+…-?\d+ of \d+/, '…').replace(/\d[\d\s ]*/g, '#');
        const entry = problems.get(key) ?? { problem, places: [] };
        // [EN] A new kind of problem is printed at once, so a long run that is stopped still tells what it saw.
        // [RU] Новый вид проблемы печатается сразу, поэтому долгий прогон, который остановили, всё равно расскажет, что видел.
        if (entry.places.length === 0) console.log(`  ! ${problem}  [${where}]`);
        if (entry.places.length < 400) entry.places.push(where);
        problems.set(key, entry);
    }
}

async function tapAt(page, touch, x, y) {
    if (!touch) {
        await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
        await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
        await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
        return;
    }
    await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, radiusX: 6, radiusY: 6 }] });
    await sleep(60);
    await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
/** [EN] Scrolls an element into view and taps its middle. [RU] Прокручивает элемент в вид и нажимает в середину. */
async function tap(page, touch, finder) {
    const box = await page.evaluate(`(() => { const el = (${finder})(); if (!el) return null; el.scrollIntoView({ block: 'center', inline: 'nearest' }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    if (!box) return false;
    await sleep(120);
    const again = await page.evaluate(`(() => { const el = (${finder})(); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    if (!again) return false;
    await tapAt(page, touch, again.x, again.y);
    return true;
}
const shot = async (page, name) => {
    if (!SHOTS) return;
    const s = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from(s.data, 'base64'));
};
const scrollTo = (page, selector) => page.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (el) el.scrollIntoView({ block: 'center', inline: 'nearest' }); return !!el; })()`);

// ===== Poker / Покер =====
async function poker(page, touch, where, players, language) {
    // [EN] The menu is driven in Russian; another language is switched on once the table is set (the dialog keeps
    //      its buttons by place, the tray by its classes). [RU] Меню ведётся по-русски; другой язык включается, когда
    //      стол накрыт (кнопки диалога ищутся по месту, лоток — по классам).
    const button = pattern => `() => [...document.querySelectorAll('#poker-room button, [role=dialog] button')].find(b => ${pattern}.test(b.textContent.trim()) && !b.disabled)`;
    if (language !== 'ru') await setLanguage(page, 'ru');
    if (!(await page.evaluate(`!!document.querySelector('[role=dialog]')`))) await tap(page, touch, button('/^Меню стола$/'));
    await sleep(300);
    await tap(page, touch, `() => [...document.querySelectorAll('[role=dialog] button')].find(b => b.textContent.trim() === '${players - 1}')`);
    await tap(page, touch, button('/^Сесть за стол$/'));
    await sleep(900);
    if (language !== 'ru') await setLanguage(page, language);
    for (let hand = 0; hand < HANDS; hand += 1) {
        // [EN] Wait for your decision (bets on the cloth, the button, the blinds), look, then call or check to the end.
        // [RU] Ждём вашего решения (ставки на сукне, баттон, блайнды), смотрим, потом колл или чек до конца.
        let street = 0;
        for (let step = 0; step < 80; step += 1) {
            const state = await page.evaluate(`({
                decision: !!document.querySelector('#poker-room [class*="_trayTitle_"]'),
                done: !!document.querySelector('#poker-room section[role=status]'),
                board: document.querySelectorAll('#poker-room [class*="_board_"] [class*="_card_"]').length,
            })`);
            if (state.done) {
                await scrollTo(page, '#poker-room [class*="_felt_"]');
                note(`${where} ${players}p result`, [...await page.evaluate(`${TEXT_AUDIT}('#poker-room')`), ...await page.evaluate(POKER_AUDIT)]);
                await shot(page, `poker-${where}-${players}p-${language}-result`);
                break;
            }
            if (state.decision) {
                await scrollTo(page, '#poker-room [class*="_felt_"]');
                await sleep(150);
                note(`${where} ${players}p ${['preflop', 'flop', 'turn', 'river', 'river'][state.board === 0 ? 0 : state.board - 2] ?? 'street'}`, [...await page.evaluate(`${TEXT_AUDIT}('#poker-room')`), ...await page.evaluate(POKER_AUDIT)]);
                if (street === 0 && hand === 0) {
                    await shot(page, `poker-${where}-${players}p-${language}-decision`);
                    await captions(page, touch, `${where} ${players}p`, '#poker-room', '#poker-room [class*="_portrait_"]', `poker-${where}-${players}p-${language}`);
                }
                street += 1;
                // [EN] Check or call: the plain button of the tray (not the fold, not the raise). [RU] Чек или колл: простая кнопка лотка (не фолд и не рейз).
                const acted = await tap(page, touch, `() => document.querySelector('#poker-room [class*="_actions_"] button:not([class*="buttonFold"]):not([class*="buttonPrimary"])')`);
                if (!acted) await tap(page, touch, `() => document.querySelector('#poker-room [class*="_actions_"] [class*="buttonPrimary"]')`);
                await sleep(500);
                continue;
            }
            await sleep(300);
        }
        const next = await tap(page, touch, `() => [...document.querySelectorAll('#poker-room section[role=status] button')][0]`);
        if (!next) break;
        await sleep(700);
    }
}

/** [EN] Opens every portrait's caption in turn and checks it. [RU] Раскрывает подпись каждого портрета по очереди и проверяет её. */
async function captions(page, touch, where, root, portraits, shotName) {
    const count = await page.evaluate(`document.querySelectorAll(${JSON.stringify(portraits)}).length`);
    for (let index = 0; index < count; index += 1) {
        const finder = `() => document.querySelectorAll(${JSON.stringify(portraits)})[${index}]`;
        if (!(await tap(page, touch, finder))) continue;
        await sleep(350);
        // [EN] The caption is scrolled into view the way a person would read it. [RU] Подпись прокручивается в вид так, как её стал бы читать человек.
        await page.evaluate(`(() => { const open = document.querySelector('${root} [aria-expanded="true"]'); const bubble = open && (document.getElementById(open.getAttribute('aria-controls') || '') || open.parentElement.querySelector('[class*="bubble"], [class*="_bio_"]')); if (bubble) bubble.scrollIntoView({ block: 'nearest', inline: 'nearest' }); })()`);
        await sleep(150);
        note(`${where} caption ${index + 1}`, await page.evaluate(`${TEXT_AUDIT}(${JSON.stringify(root)})`));
        if (index === 0) await shot(page, `${shotName}-caption`);
        // [EN] Closed again by the same portrait (or by its own close button). [RU] Закрывается тем же портретом (или своей кнопкой «Закрыть»).
        const closed = await page.evaluate(`(() => { const open = document.querySelector('${root} [aria-expanded="true"]'); return !open; })()`);
        if (!closed) {
            const closer = `() => { const open = document.querySelector('${root} [aria-expanded="true"]'); const panel = open && (document.getElementById(open.getAttribute('aria-controls') || '')); return panel?.querySelector('button') ?? open; }`;
            await tap(page, touch, closer);
            await sleep(250);
        }
    }
}

async function setLanguage(page, language) {
    await page.evaluate(`(() => { const select = document.querySelector('select'); if (!select) return false; select.value = ${JSON.stringify(language)}; select.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    await sleep(900);
}

// ===== Preferans / Преферанс =====
async function preferans(page, touch, where, players, language) {
    if (!(await page.evaluate(`!!document.querySelector('[class*="setupBackdrop"]')`))) {
        if (language !== 'ru') await setLanguage(page, 'ru');
        await tap(page, touch, `() => [...document.querySelectorAll('#preferans-room button')].find(b => /^Настройки стола$/.test(b.textContent.trim()))`);
        await sleep(400);
    }
    if (players > 4) return;
    const picked = await tap(page, touch, `() => [...document.querySelectorAll('button')].find(b => /^${players} ·/.test(b.textContent.trim()))`);
    if (!picked) return;
    await sleep(300);
    // [EN] The menu's own explanations: every «?» opened once. [RU] Пояснения самого меню: каждый «?» открывается один раз.
    if (players === 3) {
        const helps = await page.evaluate(`[...document.querySelectorAll('[class*="setupBackdrop"] button')].filter(b => b.textContent.trim() === '?').length`);
        for (let index = 0; index < helps; index += 1) {
            if (!(await tap(page, touch, `() => [...document.querySelectorAll('[class*="setupBackdrop"] button')].filter(b => b.textContent.trim() === '?')[${index}]`))) continue;
            await sleep(250);
            note(`${where} menu help ${index + 1}`, await page.evaluate(`${TEXT_AUDIT}('[class*="setupBackdrop"]')`));
            if (index === 0) await shot(page, `preferans-${where}-menu-help`);
            await tap(page, touch, `() => [...document.querySelectorAll('[class*="setupBackdrop"] button')].filter(b => b.textContent.trim() === '?')[${index}]`);
            await sleep(150);
        }
        note(`${where} menu`, await page.evaluate(`${TEXT_AUDIT}('[class*="setupBackdrop"]')`));
    }
    await tap(page, touch, `() => [...document.querySelectorAll('button')].find(b => /^Играть$/.test(b.textContent.trim()) && !b.disabled)`);
    await sleep(1800);
    if (language !== 'ru') await setLanguage(page, language);
    await page.evaluate(`window.scrollTo(0, 0)`);
    note(`${where} ${players}p table`, await page.evaluate(`${TEXT_AUDIT}('#preferans-room')`));
    await shot(page, `preferans-${where}-${players}p-${language}`);
    await captions(page, touch, `${where} ${players}p`, '#preferans-room', '#preferans-room button[aria-controls][aria-expanded]', `preferans-${where}-${players}p-${language}`);
}

const page = await launch();
const errors = [];
page.on('Runtime.exceptionThrown', event => errors.push(event.exceptionDetails?.exception?.description ?? 'exception'));
try {
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: "try { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('cosmo-game-hub:language', 'ru'); sessionStorage.setItem('seeded', '1'); } } catch {}" });
    for (const [width, height] of SCREENS) {
        const touch = touchScreen(width, height);
        await page.send('Emulation.setDeviceMetricsOverride', {
            width, height, deviceScaleFactor: touch ? 2 : 1, mobile: touch,
            screenOrientation: width > height ? { type: 'landscapePrimary', angle: 90 } : { type: 'portraitPrimary', angle: 0 },
        });
        await page.send('Emulation.setTouchEmulationEnabled', touch ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
        const where = `${width}x${height}`;
        for (const language of LANGUAGES) {
            if (GAME === 'all' || GAME === 'poker') {
                await page.evaluate(`(() => { try { sessionStorage.removeItem('seeded'); } catch {} return true; })()`).catch(() => {});
                await open(page, `${BASE}/games/poker/`, 1800);
                for (const players of PLAYERS) await poker(page, touch, where, players, language);
            }
            if (GAME === 'all' || GAME === 'preferans') {
                await page.evaluate(`(() => { try { sessionStorage.removeItem('seeded'); } catch {} return true; })()`).catch(() => {});
                await open(page, `${BASE}/games/preferans/`, 2200);
                for (const players of PLAYERS) await preferans(page, touch, where, players, language);
            }
        }
        process.stdout.write(`${where} `);
    }
    console.log(`\nchecks: ${checks}, console errors: ${errors.length}`);
    if (problems.size === 0) console.log('no text past the screen, no text under something else, no seat on the board, the pot or a bet');
    for (const { problem, places } of problems.values()) {
        const screens = [...new Set(places.map(place => place.split(' ')[0]))];
        console.log(`PROBLEM: ${problem}\n    on ${screens.length} screen(s): ${screens.slice(0, 8).join(', ')}${screens.length > 8 ? ' …' : ''}; e.g. ${places[0]}`);
    }
    if (errors.length) console.log(`ERRORS: ${errors.slice(0, 4).join(' | ')}`);
    process.exitCode = problems.size || errors.length ? 1 : 0;
} finally {
    await page.close();
}

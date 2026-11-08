// [EN] FILE: apps/client/scripts/load/preferans-ui.mjs — load test of the preferans table in headless Chrome on the
//      production build: deal after deal against strong bots, the human seat played by a random player through
//      clicks (bids, discard, whist, cards). Every bot request to the Web Worker is timed exactly (the page's Worker
//      is wrapped before the site loads). On the way: the language is switched through all five, the large score
//      sheet is opened and closed, and the page is watched for long tasks, memory growth and errors. A table that
//      shows no progress for 30 s is a HANG.
//      Run: node apps/client/scripts/load/preferans-ui.mjs [--deals 30] [--phone] [--cpu 4]
// [RU] ФАЙЛ: нагрузочная проверка стола преферанса в Chrome без окна на продакшен-сборке: раздача за раздачей
//      против сильных ботов, за человека щелчками играет случайный игрок (заявки, снос, вист, карты). Каждый
//      запрос ботов к Web Worker замеряется точно (Worker страницы обёрнут до загрузки сайта). По пути язык
//      переключается по всем пяти, крупный лист пули открывается и закрывается, а за страницей следят: долгие
//      задачи, рост памяти, ошибки. Стол без движения 30 с — ЗАВИСАНИЕ.
import { writeFileSync } from 'node:fs';
import { BASE, emulate, heapMb, launch, longTasks, open, sleep, stats } from './cdp.mjs';

const arg = (name, fallback) => {
    const index = process.argv.indexOf(`--${name}`);
    return index > 0 ? process.argv[index + 1] : fallback;
};
const targetDeals = Number(arg('deals', 30));
const phone = process.argv.includes('--phone');
const cpu = Number(arg('cpu', phone ? 4 : 1));
const out = arg('out', null);
const LANGUAGES = ['ru', 'en', 'he', 'es', 'fr'];

// [EN] Wraps Worker before any site script runs: request id → time of the answer. [RU] Обёртка Worker до скриптов сайта: id запроса → время ответа.
const WORKER_PROBE = `(() => {
    const Original = window.Worker;
    window.__botTimes = [];
    window.Worker = function (...args) {
        const worker = new Original(...args);
        const sent = new Map();
        const post = worker.postMessage.bind(worker);
        worker.postMessage = (message, ...rest) => { if (message && typeof message.id === 'number') sent.set(message.id, performance.now()); return post(message, ...rest); };
        worker.addEventListener('message', event => {
            const id = event.data && event.data.id;
            if (sent.has(id)) { window.__botTimes.push({ ms: performance.now() - sent.get(id), phase: event.data.action ? event.data.action.type : 'error' }); sent.delete(id); }
        });
        return worker;
    };
    window.Worker.prototype = Original.prototype;
})();`;

// [EN] One step of the random human. Returns what it did. [RU] Один шаг случайного человека. Возвращает, что сделал.
const STEP = `(async () => {
    const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const enabled = root => [...root.querySelectorAll('button')].filter(button => !button.disabled && button.offsetParent !== null);
    const setup = document.querySelector('[role=dialog][aria-labelledby="preferans-setup-title"]');
    if (setup) {
        const wide = [...setup.querySelectorAll('[class*="setupWide"]')];
        wide[wide.length - 1].click();
        return 'start';
    }
    const overlay = [...document.querySelectorAll('button')].find(button => button.closest('.fixed') && /again|снова|Try/i.test(button.textContent));
    if (overlay) { overlay.click(); return 'try-again'; }
    const room = document.getElementById('preferans-room');
    const result = room.querySelector('[class*="result"] [class*="buttonPrimary"]');
    if (result) { result.click(); return 'next-deal'; }
    const playable = [...room.querySelectorAll('[class*="card-playable"]')];
    const panel = [...room.querySelectorAll('[class*="panel"]')].find(element => !element.className.includes('result'));
    const panelButtons = panel ? enabled(panel) : [];
    const discard = panel && panelButtons.some(button => button.className.includes('buttonPrimary')) && room.querySelectorAll('[class*="seatBottom"] [class*="card-playable"]').length >= 10;
    if (discard) {
        const cards = [...room.querySelectorAll('[class*="seatBottom"] [class*="card-playable"]')];
        const first = pick(cards); first.click(); await pause(30);
        const second = pick([...room.querySelectorAll('[class*="seatBottom"] [class*="card-playable"]')].filter(card => card !== first)); second.click(); await pause(30);
        const confirm = enabled(panel).find(button => button.className.includes('buttonPrimary'));
        if (confirm) { confirm.click(); return 'discard'; }
        return 'discard-wait';
    }
    if (panelButtons.length) {
        const pass = panelButtons.find(button => !button.closest('[role=group]') && !button.className.includes('buttonPrimary'));
        const bids = panelButtons.filter(button => button.closest('[role=group]'));
        const choice = bids.length && pass && Math.random() < 0.75 ? pass : pick(panelButtons);
        choice.click();
        return 'panel';
    }
    if (playable.length) { pick(playable).click(); return 'card'; }
    return 'wait';
})()`;

const PROGRESS = `(() => {
    const room = document.getElementById('preferans-room');
    return room ? room.innerText.length + ':' + room.querySelectorAll('[class*="trickSlot"]').length + ':' + document.querySelectorAll('[class*="card"]').length + ':' + (window.__botTimes ? window.__botTimes.length : 0) : 'none';
})()`;

const page = await launch();
const report = { date: new Date().toISOString(), base: BASE, phone, cpu, deals: 0, steps: {}, botMs: null, botByType: {}, longTasks: null, heapMb: [], languageSwitches: 0, sheetOpens: 0, hang: null, errors: [], failed: [] };
try {
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: WORKER_PROBE });
    await emulate(page, { phone, cpu });
    await open(page, `${BASE}/games/preferans/`, 1500);
    report.heapMb.push(await heapMb(page));
    let lastProgress = '';
    let lastChange = Date.now();
    let deals = 0;
    while (deals < targetDeals) {
        const did = await page.evaluate(STEP);
        report.steps[did] = (report.steps[did] ?? 0) + 1;
        if (did === 'next-deal') {
            deals += 1;
            if (deals % 4 === 0) {
                const language = LANGUAGES[(deals / 4) % LANGUAGES.length];
                await page.evaluate(`(() => {
                    const select = document.querySelector('#preferans-room header select');
                    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, '${language}');
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    return true;
                })()`);
                report.languageSwitches += 1;
                await sleep(300);
            }
            if (deals % 3 === 0) {
                const opened = await page.evaluate(`(() => {
                    const button = document.querySelector('[class*="sideOnly"] [class*="iconButton"]') && getComputedStyle(document.querySelector('[class*="sideOnly"]')).display !== 'none'
                        ? document.querySelector('[class*="sideOnly"] [class*="iconButton"]')
                        : document.querySelector('[class*="stripOnly"] button');
                    if (!button) return false;
                    button.click();
                    return true;
                })()`);
                if (opened) {
                    report.sheetOpens += 1;
                    await sleep(400);
                    await page.evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); true`);
                    await sleep(200);
                }
            }
            if (deals % 10 === 0) report.heapMb.push(await heapMb(page));
            process.stdout.write(`deal ${deals}/${targetDeals}\r`);
        }
        const progress = await page.evaluate(PROGRESS);
        if (progress !== lastProgress) { lastProgress = progress; lastChange = Date.now(); }
        else if (Date.now() - lastChange > 30000) { report.hang = { afterDeals: deals, lastStep: did, progress }; break; }
        await sleep(did === 'wait' ? 60 : 120);
    }
    report.deals = deals;
    const times = await page.evaluate('window.__botTimes');
    report.botMs = stats(times.map(entry => entry.ms));
    for (const entry of times) (report.botByType[entry.phase] ??= []).push(entry.ms);
    report.botByType = Object.fromEntries(Object.entries(report.botByType).map(([type, values]) => [type, stats(values)]));
    report.longTasks = stats(await longTasks(page));
    report.heapMb.push(await heapMb(page));
    report.errors = [...page.errors];
    report.failed = [...page.failed];
} finally {
    await page.close();
}

console.log(`\n${phone ? 'phone' : 'desktop'} cpu ×${cpu}: ${report.deals} deals, bot ms ${JSON.stringify(report.botMs)}`);
console.log(`  by type ${JSON.stringify(report.botByType)}`);
console.log(`  long tasks ${JSON.stringify(report.longTasks)}, heap MB ${report.heapMb.join(' → ')}, languages switched ${report.languageSwitches}, sheet opened ${report.sheetOpens}`);
console.log(`  steps ${JSON.stringify(report.steps)}, errors ${report.errors.length}, failed requests ${report.failed.length}, hang ${report.hang ? JSON.stringify(report.hang) : 'none'}`);
if (report.errors.length) console.log(report.errors.slice(0, 5).join('\n'));
if (out) writeFileSync(out, JSON.stringify(report, null, 2));
const problems = (report.hang ? 1 : 0) + report.errors.length + report.failed.length;
console.log(problems ? `FAILED: ${problems} problems` : 'OK: no hangs, no errors');
process.exitCode = problems ? 1 : 0;

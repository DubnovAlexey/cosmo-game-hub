// [EN] FILE: apps/client/scripts/load/cdp.mjs — a tiny driver for headless Chrome over the DevTools protocol, used by
//      the load tests: no packages, just Node's fetch and WebSocket. It opens a page, emulates a phone and a slower
//      CPU, collects console errors, failed requests and long tasks, and reads the JS heap after garbage collection.
//      Chrome is taken from the CHROME environment variable or the usual install path.
// [RU] ФАЙЛ: маленький драйвер Chrome без окна через протокол DevTools для нагрузочных проверок: без пакетов, только
//      fetch и WebSocket из Node. Открывает страницу, изображает телефон и медленный процессор, собирает ошибки
//      консоли, упавшие запросы и долгие задачи, читает память JS после сборки мусора. Chrome берётся из переменной
//      CHROME или из обычного места установки.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_PATHS = [
    process.env.CHROME,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
].filter(Boolean);

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** [EN] Starts Chrome and returns a connected page. [RU] Запускает Chrome и возвращает подключённую страницу. */
export async function launch({ port = 9300 + Math.floor(Math.random() * 500) } = {}) {
    const chromePath = CHROME_PATHS.find(path => existsSync(path));
    if (!chromePath) throw new Error('Chrome not found: set the CHROME environment variable');
    const profile = mkdtempSync(join(tmpdir(), 'cgh-load-'));
    const chrome = spawn(chromePath, [
        '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
        '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
        '--autoplay-policy=no-user-gesture-required', '--js-flags=--expose-gc', 'about:blank',
    ], { stdio: 'ignore' });
    let socketUrl = null;
    for (let attempt = 0; attempt < 80 && !socketUrl; attempt++) {
        try {
            const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
            socketUrl = list.find(item => item.type === 'page')?.webSocketDebuggerUrl ?? null;
        } catch { /* not up yet / ещё не поднялся */ }
        if (!socketUrl) await sleep(250);
    }
    if (!socketUrl) { chrome.kill(); throw new Error('Chrome did not start'); }
    const page = await connect(socketUrl);
    page.close = async () => {
        try { page.ws.close(); } catch { /* already closed */ }
        chrome.kill();
        await sleep(300);
        try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome may still hold files */ }
    };
    return page;
}

async function connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
    let counter = 0;
    const pending = new Map();
    const listeners = new Map();
    const page = {
        ws,
        errors: [],
        failed: [],
        on(method, handler) { listeners.set(method, [...(listeners.get(method) ?? []), handler]); },
        send(method, params = {}) {
            return new Promise((resolve, reject) => {
                const id = ++counter;
                pending.set(id, message => (message.error ? reject(new Error(`${method}: ${message.error.message}`)) : resolve(message.result)));
                ws.send(JSON.stringify({ id, method, params }));
            });
        },
        /** [EN] Evaluates an expression in the page and returns its value. [RU] Вычисляет выражение в странице и возвращает значение. */
        async evaluate(expression, { timeout = 120000 } = {}) {
            // [EN] The timeout timer is cleared afterwards, or it would keep Node alive long after the test ended.
            // [RU] Таймер ожидания снимается после ответа, иначе он держал бы Node живым ещё долго после конца проверки.
            let timer;
            const expired = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`evaluate timed out after ${timeout} ms`)), timeout); });
            try {
                const result = await Promise.race([page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }), expired]);
                if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
                return result.result.value;
            } finally {
                clearTimeout(timer);
            }
        },
    };
    ws.addEventListener('message', event => {
        const message = JSON.parse(event.data);
        if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); return; }
        for (const handler of listeners.get(message.method) ?? []) handler(message.params);
    });
    page.on('Runtime.exceptionThrown', params => page.errors.push(params.exceptionDetails.exception?.description ?? params.exceptionDetails.text));
    page.on('Runtime.consoleAPICalled', params => {
        if (params.type === 'error') page.errors.push(params.args.map(arg => arg.value ?? arg.description).join(' '));
    });
    page.on('Network.responseReceived', params => {
        if (params.response.status >= 400) page.failed.push(`${params.response.status} ${params.response.url}`);
    });
    page.on('Network.loadingFailed', params => {
        if (!params.canceled) page.failed.push(`${params.errorText} ${params.requestId}`);
    });
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Network.enable');
    await page.send('Performance.enable');
    return page;
}

/** [EN] Desktop 1280 × 860 or a 390 × 844 phone; cpu = slowdown factor. [RU] Компьютер 1280 × 860 или телефон 390 × 844; cpu — во сколько раз медленнее. */
export async function emulate(page, { phone = false, cpu = 1 } = {}) {
    await page.send('Emulation.setDeviceMetricsOverride', phone
        ? { width: 390, height: 844, deviceScaleFactor: 3, mobile: true }
        : { width: 1280, height: 860, deviceScaleFactor: 1, mobile: false });
    await page.send('Emulation.setTouchEmulationEnabled', { enabled: phone });
    await page.send('Emulation.setCPUThrottlingRate', { rate: cpu });
}

/** [EN] Navigates and waits for the load event plus a quiet moment. [RU] Переходит и ждёт события load и короткой паузы. */
export async function open(page, url, settle = 1500) {
    const loaded = new Promise(resolve => page.on('Page.loadEventFired', resolve));
    await page.send('Page.navigate', { url });
    let timer;
    await Promise.race([loaded, new Promise(resolve => { timer = setTimeout(resolve, 30000); })]);
    clearTimeout(timer);
    await page.evaluate(`(() => {
        window.__longTasks = [];
        try {
            new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__longTasks.push(Math.round(entry.duration)); })
                .observe({ type: 'longtask', buffered: true });
        } catch { /* no long task API */ }
        return true;
    })()`);
    await sleep(settle);
}

/** [EN] Long tasks seen since the page opened (ms each). [RU] Долгие задачи с момента открытия страницы (мс каждая). */
export const longTasks = page => page.evaluate('window.__longTasks ? window.__longTasks.slice() : []');

/** [EN] JS heap in MB after a forced garbage collection. [RU] Память JS в МБ после принудительной сборки мусора. */
export async function heapMb(page) {
    await page.send('HeapProfiler.collectGarbage').catch(() => {});
    const { metrics } = await page.send('Performance.getMetrics');
    const used = metrics.find(metric => metric.name === 'JSHeapUsedSize')?.value ?? 0;
    return Math.round((used / 1048576) * 10) / 10;
}

/** [EN] p50 / p95 / max of a list of numbers. [RU] p50 / p95 / максимум списка чисел. */
export function stats(values) {
    if (!values.length) return { count: 0, p50: 0, p95: 0, max: 0, mean: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const at = q => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
    const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
    return { count: sorted.length, p50: Math.round(at(0.5)), p95: Math.round(at(0.95)), max: Math.round(sorted[sorted.length - 1]), mean: Math.round(mean) };
}

export const BASE = process.env.HUB_URL ?? 'http://localhost:4324/cosmo-game-hub';

// [EN] FILE: apps/client/scripts/load/hub.mjs — load test of the Game Hub site on the production build:
//      A. HTTP: thousands of requests with many clients at once to every page and every file of dist/ (latency
//         p50/p95/max, errors) — the static server must keep answering;
//      B. pages in headless Chrome, on a computer and on a slow phone (CPU ×4, a slow 4G network): time to the first
//         picture and to the largest one, layout shifts, long tasks, bytes, console errors, broken requests;
//      C. a walk through all pages 20 times in a row: memory after every round must stay flat.
//      Run (preview server on :4324): node apps/client/scripts/load/hub.mjs [--requests 6000] [--clients 64]
// [RU] ФАЙЛ: нагрузочная проверка сайта Game Hub на продакшен-сборке:
//      A. HTTP: тысячи запросов от многих клиентов сразу ко всем страницам и всем файлам dist/ (задержка
//         p50/p95/максимум, ошибки) — статический сервер должен продолжать отвечать;
//      B. страницы в Chrome без окна, на компьютере и на медленном телефоне (процессор ×4, медленная сеть 4G):
//         время до первой картинки и до самой большой, сдвиги вёрстки, долгие задачи, байты, ошибки, битые запросы;
//      C. обход всех страниц 20 раз подряд: память после каждого круга должна стоять на месте.
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { BASE, emulate, heapMb, launch, longTasks, open, stats } from './cdp.mjs';

const arg = (name, fallback) => {
    const index = process.argv.indexOf(`--${name}`);
    return index > 0 ? process.argv[index + 1] : fallback;
};
const totalRequests = Number(arg('requests', 6000));
const clients = Number(arg('clients', 64));
const rounds = Number(arg('rounds', 20));
const out = arg('out', null);
const PAGES = ['/', '/games/', '/games/chess/', '/games/preferans/', '/leaderboard/', '/about/'];
const dist = fileURLToPath(new URL('../../dist/', import.meta.url));
const report = { date: new Date().toISOString(), base: BASE, http: null, pages: [], walk: null };

// A. HTTP load / Нагрузка HTTP
const files = [];
(function walk(directory) {
    for (const name of readdirSync(directory)) {
        const path = join(directory, name);
        if (statSync(path).isDirectory()) walk(path);
        else files.push('/' + relative(dist, path).split('\\').join('/').replace(/index\.html$/, ''));
    }
})(dist);
const urls = [...new Set([...PAGES, ...files])];
const latencies = [];
const failures = [];
let bytes = 0;
let issued = 0;
const httpStart = performance.now();
await Promise.all(Array.from({ length: clients }, async () => {
    while (issued < totalRequests) {
        const url = `${BASE}${urls[issued++ % urls.length]}`;
        const start = performance.now();
        try {
            const response = await fetch(url);
            const body = await response.arrayBuffer();
            bytes += body.byteLength;
            if (!response.ok) failures.push(`${response.status} ${url}`);
        } catch (error) { failures.push(`${error.message} ${url}`); }
        latencies.push(performance.now() - start);
    }
}));
const httpMs = performance.now() - httpStart;
report.http = {
    files: urls.length, requests: latencies.length, clients, seconds: Math.round(httpMs / 100) / 10,
    perSecond: Math.round(latencies.length / (httpMs / 1000)), megabytes: Math.round(bytes / 104857.6) / 10,
    ms: stats(latencies), failures: failures.slice(0, 20), failureCount: failures.length,
};
console.log(`A HTTP: ${report.http.requests} requests to ${urls.length} files with ${clients} clients in ${report.http.seconds} s (${report.http.perSecond}/s, ${report.http.megabytes} MB), ms ${JSON.stringify(report.http.ms)}, failures ${failures.length}`);

// B. Every page on a computer and on a slow phone / Каждая страница на компьютере и на медленном телефоне
const VITALS = `(() => new Promise(resolve => {
    const result = { lcp: 0, cls: 0, fcp: 0 };
    try { new PerformanceObserver(list => { for (const entry of list.getEntries()) result.lcp = Math.round(entry.startTime); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch {}
    try { new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) result.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true }); } catch {}
    const paint = performance.getEntriesByName('first-contentful-paint')[0];
    result.fcp = paint ? Math.round(paint.startTime) : 0;
    const resources = performance.getEntriesByType('resource');
    result.requests = resources.length + 1;
    result.kilobytes = Math.round((resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) + (performance.getEntriesByType('navigation')[0]?.transferSize || 0)) / 1024);
    setTimeout(() => { result.cls = Math.round(result.cls * 1000) / 1000; resolve(result); }, 300);
}))()`;
for (const profile of [{ name: 'desktop', phone: false, cpu: 1, network: null }, { name: 'phone, CPU ×4, slow 4G', phone: true, cpu: 4, network: { latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 } }]) {
    for (const path of PAGES) {
        const page = await launch();
        try {
            await emulate(page, profile);
            if (profile.network) await page.send('Network.emulateNetworkConditions', { offline: false, ...profile.network });
            await page.send('Network.setCacheDisabled', { cacheDisabled: true });
            const started = performance.now();
            await open(page, `${BASE}${path}`, 2500);
            const loadMs = Math.round(performance.now() - started - 2500);
            const vitals = await page.evaluate(VITALS);
            const tasks = await longTasks(page);
            const entry = { profile: profile.name, path, loadMs, ...vitals, longTasks: tasks.length, longestTaskMs: Math.max(0, ...tasks), totalBlockingMs: tasks.reduce((sum, ms) => sum + Math.max(0, ms - 50), 0), heapMb: await heapMb(page), errors: [...page.errors], failed: [...page.failed] };
            report.pages.push(entry);
            console.log(`B ${profile.name.padEnd(22)} ${path.padEnd(18)} load ${String(loadMs).padStart(5)} ms, FCP ${entry.fcp}, LCP ${entry.lcp}, CLS ${entry.cls}, ${entry.requests} req / ${entry.kilobytes} KB, long tasks ${entry.longTasks} (max ${entry.longestTaskMs} ms), errors ${entry.errors.length}, broken ${entry.failed.length}`);
        } finally {
            await page.close();
        }
    }
}

// C. Walking through the pages / Обход страниц
{
    const page = await launch();
    try {
        await emulate(page, { phone: false, cpu: 1 });
        const heap = [];
        for (let round = 0; round < rounds; round += 1) {
            for (const path of PAGES) await open(page, `${BASE}${path}`, 300);
            heap.push(await heapMb(page));
        }
        report.walk = { rounds, pagesPerRound: PAGES.length, heapMb: heap, errors: [...page.errors], failed: [...page.failed] };
        console.log(`C walk: ${rounds} rounds × ${PAGES.length} pages, heap MB after each round ${heap.join(' ')}, errors ${page.errors.length}, broken ${page.failed.length}`);
    } finally {
        await page.close();
    }
}

if (out) writeFileSync(out, JSON.stringify(report, null, 2));
const problems = report.http.failureCount + report.pages.reduce((sum, entry) => sum + entry.errors.length + entry.failed.length, 0) + report.walk.errors.length + report.walk.failed.length;
console.log(problems ? `FAILED: ${problems} problems` : 'OK: no errors, no broken requests');
process.exitCode = problems ? 1 : 0;

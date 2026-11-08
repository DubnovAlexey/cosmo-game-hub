// [EN] FILE: apps/client/scripts/load/preferans-engine.mjs — load test of the preferans engine itself, without a
//      browser: (1) the exact solver on hundreds of random full deals; (2) whole pools played by three bots with the
//      same settings as the game (strong: 32 samples / 900 ms, casual: 8 / 250 ms), on one thread and on many threads
//      at once (as a server with many tables would). Every decision runs under a watchdog: a deal that stops
//      answering is reported as a HANG with its seed, so it can be replayed exactly.
//      Run: node apps/client/scripts/load/preferans-engine.mjs [--pools 6] [--deals 12] [--threads 1,8] [--solver 300]
// [RU] ФАЙЛ: нагрузочная проверка самого движка преферанса, без браузера: (1) точный решатель на сотнях случайных
//      полных раскладов; (2) целые пули, которые играют три бота с теми же настройками, что в игре (сильные: 32
//      расклада / 900 мс, обычные: 8 / 250 мс), в одном потоке и во многих сразу (как сервер с многими столами).
//      Каждое решение идёт под сторожем: раздача, которая перестала отвечать, записывается как ЗАВИСАНИЕ со своим
//      зерном, чтобы её можно было точно повторить.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';

const STRENGTH = { strong: { samples: 32, timeBudgetMs: 900 }, casual: { samples: 8, timeBudgetMs: 250 } };

if (isMainThread) {
    const { stats } = await import('./cdp.mjs');
    const arg = (name, fallback) => {
        const index = process.argv.indexOf(`--${name}`);
        return index > 0 ? process.argv[index + 1] : fallback;
    };
    const pools = Number(arg('pools', 6));
    const dealsPerPool = Number(arg('deals', 12));
    const threadCounts = arg('threads', '1,8').split(',').map(Number);
    const solverDeals = Number(arg('solver', 300));
    const timeoutMs = Number(arg('timeout', 20000));
    const out = arg('out', null);

    /** [EN] Runs tasks in `threads` workers under a watchdog. [RU] Выполняет задачи в `threads` воркерах под сторожем. */
    function runTasks(tasks, threads) {
        return new Promise(resolve => {
            const events = [];
            const hangs = [];
            const errors = [];
            let next = 0;
            let running = 0;
            const startWorker = () => {
                if (next >= tasks.length) { if (running === 0) resolve({ events, hangs, errors }); return; }
                const task = tasks[next++];
                running += 1;
                const worker = new Worker(fileURLToPath(import.meta.url), { workerData: task });
                let last = { at: performance.now(), info: null };
                const watchdog = setInterval(() => {
                    if (performance.now() - last.at > timeoutMs) {
                        hangs.push({ task: task.label, ...last.info, silentMs: Math.round(performance.now() - last.at) });
                        clearInterval(watchdog);
                        worker.terminate();
                    }
                }, 500);
                worker.on('message', message => {
                    last = { at: performance.now(), info: message.type === 'beat' ? message : last.info };
                    if (message.type !== 'beat') events.push({ ...message, task: task.label });
                });
                worker.on('error', error => errors.push(`${task.label}: ${error.message}`));
                worker.on('exit', () => { clearInterval(watchdog); running -= 1; startWorker(); });
            };
            for (let i = 0; i < Math.min(threads, tasks.length); i += 1) startWorker();
        });
    }

    const report = { date: new Date().toISOString(), node: process.version, cpus: (await import('node:os')).cpus().length, solver: null, bots: [] };

    // 1. Solver / Решатель
    const solverTasks = Array.from({ length: 4 }, (_, part) => ({ kind: 'solver', label: `solver-${part}`, seeds: Array.from({ length: Math.ceil(solverDeals / 4) }, (_, i) => 1000 + part * 10000 + i) }));
    const solverStart = performance.now();
    const solverRun = await runTasks(solverTasks, 4);
    const solves = solverRun.events.filter(event => event.type === 'solve');
    report.solver = {
        deals: solves.length,
        wallMs: Math.round(performance.now() - solverStart),
        ms: stats(solves.map(event => event.ms)),
        nodes: stats(solves.map(event => event.nodes)),
        hangs: solverRun.hangs, errors: solverRun.errors,
    };
    console.log(`solver: ${solves.length} full deals, ms ${JSON.stringify(report.solver.ms)}, nodes p50 ${report.solver.nodes.p50} max ${report.solver.nodes.max}, hangs ${solverRun.hangs.length}`);

    // 2. Bots playing whole pools / Боты играют целые пули
    for (const strength of Object.keys(STRENGTH)) {
        for (const threads of threadCounts) {
            const tasks = Array.from({ length: Math.max(pools, threads) }, (_, pool) => ({
                kind: 'pool', label: `${strength}-${threads}t-pool${pool}`, strength, deals: dealsPerPool, seed: 7_000_000 + pool * 1009 + threads * 13,
            }));
            const start = performance.now();
            const run = await runTasks(tasks, threads);
            const wallMs = performance.now() - start;
            const decisions = run.events.filter(event => event.type === 'decision');
            const deals = run.events.filter(event => event.type === 'deal');
            const byPhase = {};
            for (const decision of decisions) (byPhase[decision.phase] ??= []).push(decision.ms);
            const entry = {
                strength, threads, deals: deals.length, decisions: decisions.length,
                wallMs: Math.round(wallMs), dealsPerMinute: Math.round((deals.length / wallMs) * 60000),
                dealMs: stats(deals.map(deal => deal.ms)),
                phases: Object.fromEntries(Object.entries(byPhase).map(([phase, values]) => [phase, stats(values)])),
                modes: deals.reduce((count, deal) => ({ ...count, [deal.mode]: (count[deal.mode] ?? 0) + 1 }), {}),
                heapMb: Math.max(0, ...run.events.filter(event => event.type === 'memory').map(event => event.heapMb)),
                hangs: run.hangs, errors: run.errors,
            };
            report.bots.push(entry);
            console.log(`${strength} ×${threads} threads: ${entry.deals} deals in ${(wallMs / 1000).toFixed(1)} s (${entry.dealsPerMinute}/min), play ${JSON.stringify(entry.phases.play ?? {})}, hangs ${run.hangs.length}, errors ${run.errors.length}`);
        }
    }

    if (out) writeFileSync(out, JSON.stringify(report, null, 2));
    const failed = report.solver.hangs.length + report.solver.errors.length + report.bots.reduce((sum, entry) => sum + entry.hangs.length + entry.errors.length, 0);
    console.log(failed ? `FAILED: ${failed} hangs or errors` : 'OK: no hangs, no errors');
    process.exitCode = failed ? 1 : 0;
} else {
    // [EN] Worker side: plays the task and reports every decision. [RU] Сторона воркера: играет задачу и сообщает о каждом решении.
    const engine = await import('../../src/games/preferans/engine/index.ts');
    const { newDeal, nextDeal, applyAction, chooseAction, createRandom, shuffled, customizeRules, SOCHI, solveWithStats, cardsOf } = engine;
    const task = workerData;
    const beat = info => parentPort.postMessage({ type: 'beat', ...info });

    if (task.kind === 'solver') {
        const deck = Array.from({ length: 32 }, (_, card) => card);
        for (const seed of task.seeds) {
            const random = createRandom(seed);
            const cards = shuffled(deck, random);
            const hands = [0, 1, 2].map(part => cards.slice(part * 10, part * 10 + 10).reduce((set, card) => (set | (1 << card)) >>> 0, 0));
            const strain = Math.floor(random() * 5);
            const position = {
                hands, trump: strain === 4 ? null : strain, turn: Math.floor(random() * 3), trick: [],
                target: Math.floor(random() * 3), targetWants: random() < 0.25 ? 'min' : 'max',
            };
            beat({ seed, step: 'solve' });
            const start = performance.now();
            const result = solveWithStats(position);
            parentPort.postMessage({ type: 'solve', seed, ms: performance.now() - start, nodes: result.nodes, tricks: result.tricks, cards: cardsOf(hands[0]).length });
        }
    } else {
        const options = STRENGTH[task.strength];
        const random = createRandom(task.seed);
        // [EN] Half of the pools also switch on Stalingrad and conceding, so those paths are loaded too.
        // [RU] Половина пуль включает ещё «Сталинград» и уход, чтобы нагрузить и эти пути.
        const rules = task.seed % 2 === 0 ? SOCHI : customizeRules(SOCHI, { stalingrad: true, concedeTricks: 2 });
        let state = newDeal({ rules, random, dealer: task.seed % 3 });
        for (let deal = 0; deal < task.deals; deal += 1) {
            if (deal > 0) state = nextDeal(state, { random });
            const dealStart = performance.now();
            let decision = 0;
            while (state.phase !== 'done') {
                beat({ seed: task.seed, deal, decision, phase: state.phase });
                const start = performance.now();
                const action = chooseAction(state, { random, samples: options.samples, timeBudgetMs: options.timeBudgetMs });
                const ms = performance.now() - start;
                parentPort.postMessage({ type: 'decision', phase: state.phase, ms });
                state = applyAction(state, action);
                decision += 1;
                if (decision > 200) throw new Error(`deal ${task.seed}/${deal} did not finish in 200 decisions`);
            }
            parentPort.postMessage({ type: 'deal', seed: task.seed, deal, ms: performance.now() - dealStart, decisions: decision, mode: state.result?.mode ?? 'unknown' });
        }
        parentPort.postMessage({ type: 'memory', heapMb: Math.round(process.memoryUsage().heapUsed / 104857.6) / 10 });
    }
}

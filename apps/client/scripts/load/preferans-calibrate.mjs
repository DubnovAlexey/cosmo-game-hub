// [EN] FILE: apps/client/scripts/load/preferans-calibrate.mjs — calibration of the bots' bidding and whist against the
//      exact solver, without a browser. Two measurements on the same random deals:
//      (A) what a hand can really make: every seat in turn is made the declarer — it takes the talon, discards and
//          names the strain as the bot would — and the solver plays the deal out with perfect play on both sides;
//          the table shows, for each pre-talon estimate, how often six, seven, eight… are made, and how often a
//          misère of a given risk is caught;
//      (B) what the bots do: the auction, the discard and the whist exactly as in the game, then the solver plays
//          the contract: how many deals go to all-pass, how often the declarer makes the game, how often the
//          whisters fall short of their obligation, how often a game passes without a whist.
//      The solver stands in for the card play (the bots play close to it and it is thousands of times faster).
//      Run: node apps/client/scripts/load/preferans-calibrate.mjs [--deals 3000] [--threads 10] [--players 3]
//           [--styles roster] [--out report.json] [--foresight 24] [--skip-potential]
//      --foresight N: deals a bot imagines per decision before the play (bot.ts BotOptions.foresight); 0 = the quick
//      estimates only, as the bots decided before 10.11.2026 — run both and compare.
// [RU] ФАЙЛ: калибровка торговли и виста ботов по точному решателю, без браузера. Два замера на одних и тех же
//      случайных раздачах:
//      (A) что рука реально тянет: каждое место по очереди делается играющим — берёт прикуп, сносит и называет
//          масть, как бот, — а решатель доигрывает раздачу безошибочно за обе стороны; таблица показывает для каждой
//          оценки до прикупа, как часто сыграны шестерная, семерная, восьмерная…, и как часто ловят мизер с данным
//          риском;
//      (B) что делают боты: торговля, снос и вист ровно как в игре, затем решатель играет контракт: сколько раздач
//          уходит в распасы, как часто играющий делает игру, как часто вистующие недобирают обязательство, как
//          часто игра проходит без виста.
//      Решатель заменяет розыгрыш карт (боты играют близко к нему, а он в тысячи раз быстрее).
//      --foresight N: сколько раскладов бот воображает на одно решение до розыгрыша (bot.ts BotOptions.foresight);
//      0 — только быстрые оценки, как боты решали до 10.11.2026: запустите оба варианта и сравните.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import os from 'node:os';

const arg = (name, fallback) => {
    const index = process.argv.indexOf(`--${name}`);
    return index > 0 ? process.argv[index + 1] : fallback;
};

if (isMainThread) {
    const deals = Number(arg('deals', 3000));
    const threads = Number(arg('threads', Math.max(1, Math.min(12, os.cpus().length - 2))));
    const players = Number(arg('players', 3));
    const styles = arg('styles', 'neutral');
    const seedBase = Number(arg('seed', 20261110));
    const out = arg('out', null);
    const foresight = arg('foresight', null);
    const skipPotential = process.argv.includes('--skip-potential');
    const chunk = Math.ceil(deals / threads);
    const tasks = Array.from({ length: threads }, (_, part) => ({ from: seedBase + part * chunk, count: Math.min(chunk, deals - part * chunk), players, styles, foresight: foresight === null ? null : Number(foresight), skipPotential })).filter(task => task.count > 0);
    const started = Date.now();
    const parts = await Promise.all(tasks.map(task => new Promise((resolve, reject) => {
        const worker = new Worker(fileURLToPath(import.meta.url), { workerData: task });
        worker.on('message', resolve);
        worker.on('error', reject);
    })));
    const potential = parts.flatMap(part => part.potential);
    const misere = parts.flatMap(part => part.misere);
    const auctions = parts.flatMap(part => part.auctions);
    const pct = (part, whole) => (whole ? `${((100 * part) / whole).toFixed(1)}%` : '—');

    // (A) What a hand can make, by the pre-talon estimate of its best strain.
    if (!skipPotential) {
    console.log(`\n(A) a hand as declarer, solver play — ${potential.length} hands`);
    console.log('estimate |     n | mean tricks | ≥6     ≥7     ≥8     ≥9     =10');
    const buckets = new Map();
    for (const row of potential) {
        const bucket = Math.floor(row.estimate * 2) / 2;
        (buckets.get(bucket) ?? buckets.set(bucket, []).get(bucket)).push(row.tricks);
    }
    for (const bucket of [...buckets.keys()].sort((a, b) => a - b)) {
        const list = buckets.get(bucket);
        if (list.length < 20) continue;
        const share = level => pct(list.filter(tricks => tricks >= level).length, list.length).padStart(6);
        console.log(`${bucket.toFixed(1).padStart(8)} | ${String(list.length).padStart(5)} | ${(list.reduce((a, b) => a + b, 0) / list.length).toFixed(2).padStart(11)} | ${share(6)} ${share(7)} ${share(8)} ${share(9)} ${share(10)}`);
    }
    console.log(`\n(A) misère after the talon, solver defence — ${misere.length} hands`);
    console.log('risk before talon |     n | caught');
    const byRisk = new Map();
    for (const row of misere) (byRisk.get(row.risk) ?? byRisk.set(row.risk, []).get(row.risk)).push(row.caught);
    for (const risk of [...byRisk.keys()].sort((a, b) => a - b)) {
        const list = byRisk.get(risk);
        console.log(`${String(risk).padStart(17)} | ${String(list.length).padStart(5)} | ${pct(list.filter(Boolean).length, list.length)}`);
    }
    }

    // (B) What the bots do.
    const games = auctions.filter(row => row.mode === 'game');
    const played = games.filter(row => row.played);
    const contested = played.filter(row => row.whisters > 0);
    const miseres = auctions.filter(row => row.mode === 'misere');
    console.log(`\n(B) the bots' auctions — ${auctions.length} deals, ${players} at the table, styles: ${styles}, foresight: ${foresight ?? 'default'}`);
    console.log(`all-pass ${pct(auctions.filter(row => row.mode === 'raspasy').length, auctions.length)} · games ${pct(games.length, auctions.length)} · misère ${pct(miseres.length, auctions.length)} · redeal ${pct(auctions.filter(row => row.mode === 'redeal').length, auctions.length)}`);
    const levels = {};
    for (const row of games) levels[row.level] = (levels[row.level] ?? 0) + 1;
    console.log(`game levels: ${Object.entries(levels).map(([level, count]) => `${level}: ${pct(count, games.length)}`).join(' · ')}`);
    console.log(`games made (solver play): ${pct(played.filter(row => row.made).length, played.length)} of ${played.length} played; by level: ${[6, 7, 8, 9, 10].map(level => { const list = played.filter(row => row.level === level); return `${level}: ${pct(list.filter(row => row.made).length, list.length)} (${list.length})`; }).join(' · ')}`);
    console.log(`passed without a whist: ${pct(games.filter(row => !row.played).length, games.length)} of games; of them the defence could have met the obligation: ${pct(games.filter(row => !row.played && row.defenceMeets).length, games.filter(row => !row.played).length)}`);
    console.log(`whisted: obligation missed ${pct(contested.filter(row => !row.obligationMet).length, contested.length)} of ${contested.length}`);
    console.log(`misère caught (solver defence): ${pct(miseres.filter(row => row.caught).length, miseres.length)} of ${miseres.length}`);
    if (!skipPotential) {
        const missedChances = auctions.filter(row => row.mode === 'raspasy' && row.bestPossible >= 6);
        console.log(`all-pass although someone could make a six (solver): ${pct(missedChances.length, auctions.filter(row => row.mode === 'raspasy').length)} of all-pass deals`);
    }
    // [EN] How strong the declarers look to the quick estimate after the talon: the margin over their level that a
    //      defender may assume when it imagines the declarer's cards (foresight.ts DECLARER_SLACK).
    // [RU] Насколько сильными играющие выглядят для быстрой оценки после прикупа: запас над их уровнем, который
    //      защитник вправе предполагать, воображая карты играющего (foresight.ts DECLARER_SLACK).
    const margins = games.map(row => row.estimateAfter - row.level).sort((a, b) => a - b);
    if (margins.length > 0) {
        const at = q => margins[Math.min(margins.length - 1, Math.floor(q * margins.length))].toFixed(2);
        console.log(`declarers' estimate after the talon minus the level: 5% ${at(0.05)} · 10% ${at(0.1)} · 25% ${at(0.25)} · 50% ${at(0.5)} · 75% ${at(0.75)}`);
        const overtricks = games.map(row => row.declarerTricks - row.level);
        console.log(`declarer's tricks minus the level (solver): mean ${(overtricks.reduce((a, b) => a + b, 0) / overtricks.length).toFixed(2)}; short ${pct(overtricks.filter(v => v < 0).length, overtricks.length)} · exact ${pct(overtricks.filter(v => v === 0).length, overtricks.length)} · over ${pct(overtricks.filter(v => v > 0).length, overtricks.length)}`);
    }
    // [EN] What the decisions are worth in whists by the table's own scoring (foresight.ts worth): the declarer's
    //      game, and a whist against letting the game go. A decision is right when it pays on average, whatever
    //      the share of failures looks like.
    // [RU] Чего решения стоят в вистах по правилам самого стола (foresight.ts worth): игра играющего и вист против
    //      того, чтобы отпустить игру. Решение верно, когда оно окупается в среднем, как бы ни выглядела доля неудач.
    const mean = list => (list.length ? (list.reduce((a, b) => a + b, 0) / list.length).toFixed(1) : '—');
    console.log(`worth in whists per game: the declarer ${mean(games.map(row => row.declarerWorth))} (played ${mean(played.map(row => row.declarerWorth))}, not whisted ${mean(games.filter(row => !row.played).map(row => row.declarerWorth))})`);
    const lone = played.filter(row => row.whisters === 1);
    const pair = played.filter(row => row.whisters === 2);
    console.log(`a whist against letting the game go: a lone whister ${mean(lone.map(row => row.whistGain))} over ${lone.length} games · two whisters ${mean(pair.map(row => row.whistGain))} each over ${pair.length} games`);
    console.log(`the same by level, lone whister: ${[6, 7, 8, 9].map(level => { const list = lone.filter(row => row.level === level); return `${level}: ${mean(list.map(row => row.whistGain))} (${list.length})`; }).join(' · ')}`);
    const viewed = games.filter(row => row.imagined);
    if (viewed.length > 0) {
        const real = viewed.map(row => row.declarerTricks - row.level);
        const dreamt = viewed.flatMap(row => row.imagined.map(tricks => tricks - row.level));
        const share = (list, test) => pct(list.filter(test).length, list.length);
        console.log(`the declarer's tricks minus the level — real: mean ${mean(real)}, short ${share(real, v => v < 0)}, exact ${share(real, v => v === 0)}, over ${share(real, v => v > 0)}`);
        console.log(`                              a defender imagines: mean ${mean(dreamt)}, short ${share(dreamt, v => v < 0)}, exact ${share(dreamt, v => v === 0)}, over ${share(dreamt, v => v > 0)}`);
    }
    const seconds = parts.reduce((sum, part) => sum + part.botSeconds, 0);
    console.log(`bots' thinking before the play: ${(1000 * seconds / Math.max(1, auctions.length)).toFixed(0)} ms per deal`);
    console.log(`\n${auctions.length} deals in ${((Date.now() - started) / 1000).toFixed(1)} s on ${tasks.length} threads`);
    if (out) writeFileSync(out, JSON.stringify({ potential, misere, auctions }, null, 0));
} else {
    const engine = await import('../../src/games/preferans/engine/index.ts');
    const { ROSTER } = await import('../../src/games/preferans/characters/roster.ts');
    const {
        newDeal, applyAction, chooseAction, createRandom, solveWithStats, bestStrain, misereRisk, cardsOf, removeCard, rankOf,
        estimateDeclarerTricks, scoreGame, worth, tricksRound, imagineDefending, otherSeats, NEUTRAL_STYLE, SOCHI,
    } = engine;
    const { from, count, players, styles, foresight, skipPotential } = workerData;
    let botSeconds = 0;
    const potential = [];
    const misere = [];
    const auctions = [];
    const addTalon = (hand, talon) => talon.reduce((set, card) => (set | (1 << card)) >>> 0, hand);
    /** The bot's discard for a game: the pair that leaves the most expected tricks. */
    const gameDiscard = cards => {
        let best = null;
        for (let i = 0; i < cards.length; i += 1) for (let j = i + 1; j < cards.length; j += 1) {
            const rest = removeCard(removeCard(cards.reduce((set, card) => (set | (1 << card)) >>> 0, 0), cards[i]), cards[j]);
            const value = bestStrain(rest).tricks;
            if (!best || value > best.value) best = { value, rest };
        }
        return best.rest;
    };
    /** The bot's discard for a misère: the safest hand, then the highest cards out. */
    const misereDiscard = cards => {
        let best = null;
        for (let i = 0; i < cards.length; i += 1) for (let j = i + 1; j < cards.length; j += 1) {
            const rest = removeCard(removeCard(cards.reduce((set, card) => (set | (1 << card)) >>> 0, 0), cards[i]), cards[j]);
            const value = -misereRisk(rest) * 100 + rankOf(cards[i]) + rankOf(cards[j]);
            if (!best || value > best.value) best = { value, rest };
        }
        return best.rest;
    };
    for (let seed = from; seed < from + count; seed += 1) {
        const random = createRandom(seed);
        const deal = newDeal({ rules: SOCHI, random, dealer: seed % 3 });
        const lead = deal.firstHand;
        // (A) every seat as the declarer
        let bestPossible = 0;
        for (const seat of skipPotential ? [] : [0, 1, 2]) {
            const estimate = bestStrain(deal.hands[seat]);
            const full = cardsOf(addTalon(deal.hands[seat], deal.talon));
            const rest = gameDiscard(full);
            const strain = bestStrain(rest).strain;
            const hands = deal.hands.map((hand, index) => (index === seat ? rest : hand));
            const { tricks } = solveWithStats({ hands, trump: strain === 4 ? null : strain, turn: lead, trick: [], target: seat, targetWants: 'max' });
            potential.push({ estimate: estimate.tricks, strain, tricks });
            bestPossible = Math.max(bestPossible, tricks);
            const risk = misereRisk(deal.hands[seat]);
            if (risk <= 3) {
                const safe = misereDiscard(full);
                const misereHands = deal.hands.map((hand, index) => (index === seat ? safe : hand));
                const result = solveWithStats({ hands: misereHands, trump: null, turn: lead, trick: [], target: seat, targetWants: 'min' });
                misere.push({ risk, caught: result.tricks > 0 });
            }
        }
        // (B) the bots' own auction, discard and whist; the solver plays the contract
        const style = seat => (styles === 'roster' ? ROSTER[(seed * 7 + seat * 13) % ROSTER.length].style : NEUTRAL_STYLE);
        let state = deal;
        let guard = 0;
        const thinkingStarted = performance.now();
        while (state.phase !== 'play' && state.phase !== 'done') {
            const options = { random, style: style(state.turn ?? 0) };
            if (foresight !== null) options.foresight = foresight;
            state = applyAction(state, chooseAction(state, options));
            if ((guard += 1) > 100) throw new Error(`seed ${seed}: the auction did not end`);
        }
        botSeconds += (performance.now() - thinkingStarted) / 1000;
        const row = { seed, mode: state.mode ?? state.result?.mode ?? 'unknown', bestPossible };
        if (state.result?.redeal) row.mode = 'redeal';
        if (row.mode === 'game') {
            const contract = state.contract;
            row.level = contract.level;
            const declarer = state.declarer;
            const whist = state.whist;
            const calls = whist?.calls ?? [];
            row.whisters = calls.filter(call => call === 'whist' || call === 'half').length;
            const obligation = state.rules.whistObligation[contract.level];
            // [EN] A game passed without a whist is still played out by the solver: could the defence have held it?
            // [RU] Игру, прошедшую без виста, решатель всё равно доигрывает: удержала бы её защита?
            const { tricks } = solveWithStats({ hands: state.hands, trump: state.trump, turn: state.phase === 'play' ? state.turn : lead, trick: [], target: declarer, targetWants: 'max' });
            row.played = state.phase === 'play';
            row.declarerTricks = tricks;
            row.estimateAfter = estimateDeclarerTricks(state.hands[declarer], contract.strain);
            row.made = tricks >= contract.level;
            // [EN] The score of this game with the solver's tricks, and of the same game let go without a whist.
            // [RU] Запись этой игры со взятками решателя и той же игры, отпущенной без виста.
            const whisters = whist?.whisters ?? [];
            const scored = scoreGame({ declarer, level: contract.level, tricks: tricksRound(declarer, tricks), whisters, halfWhister: whist?.halfWhister ?? null, played: row.played }, state.rules);
            const letGo = scoreGame({ declarer, level: contract.level, tricks: [0, 0, 0], whisters: [], halfWhister: null, played: false }, state.rules);
            row.declarerWorth = worth(scored, declarer, state.rules);
            if (row.played && whisters.length > 0) row.whistGain = whisters.reduce((sum, seat) => sum + worth(scored, seat, state.rules) - worth(letGo, seat, state.rules), 0) / whisters.length;
            // [EN] What the first defender imagines about this declarer (the same call the bot makes before it whists).
            // [RU] Что первый защитник воображает об этом играющем (тот же вызов, что бот делает перед вистом).
            if (seed % 3 === 0) {
                const defender = otherSeats(declarer)[0];
                row.imagined = imagineDefending(deal.hands[defender], defender, declarer, contract.level, contract.strain, lead, { random: createRandom(seed ^ 0x5eed), samples: 12, timeBudgetMs: 60000 });
            }
            row.defenceMeets = 10 - tricks >= obligation;
            row.obligationMet = row.defenceMeets;
        } else if (row.mode === 'misere') {
            const declarer = state.declarer;
            const { tricks } = solveWithStats({ hands: state.hands, trump: null, turn: state.phase === 'play' ? state.turn : lead, trick: [], target: declarer, targetWants: 'min' });
            row.caught = tricks > 0;
        }
        auctions.push(row);
    }
    parentPort.postMessage({ potential, misere, auctions, botSeconds });
}

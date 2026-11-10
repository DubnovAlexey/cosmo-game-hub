// [EN] FILE: apps/client/scripts/load/preferans-learn.mjs — teaches the bots' quick look at a declarer's hand from the
//      exact solver, and writes the lesson into src/games/preferans/engine/ai/strengthTable.ts. Not part of the game:
//      run it again only when the solver, the quick estimate (evaluate.ts) or the shape of the table below changes.
//      What it does:
//        1. deals random cards; a random seat takes the talon and keeps ten cards in several ways (the best by the
//           quick estimate, the best for another strain, a few random ones), names a strain, and the solver plays the
//           deal with perfect play of all three — that is one example: (ten cards, strain, who leads) → tricks;
//        2. fits corrections to the quick estimate by least squares with a small pull to zero (ridge): one number for
//           every holding of a suit in each role — the trump suit, a side suit (separately for a short, a five-card
//           and a long trump suit: a short side suit is worth a ruff only with trumps to spare), a suit at no trump —
//           plus what the first lead is worth to the declarer. A holding never seen keeps correction 0, so the quick
//           estimate still answers for it;
//        3. checks the result on deals it has not seen and prints how far the old estimate and the new one are from
//           the solver;
//        4. writes the table as whole hundredths of a trick.
//      Run: node apps/client/scripts/load/preferans-learn.mjs [--deals 120000] [--threads 14] [--ridge 4] [--dry]
// [RU] ФАЙЛ: учит быстрый взгляд ботов на руку играющего по точному решателю и записывает выученное в
//      src/games/preferans/engine/ai/strengthTable.ts. В игру не входит: запускать заново нужно, только если изменился
//      решатель, быстрая оценка (evaluate.ts) или устройство таблицы ниже.
//      Что делает:
//        1. сдаёт случайные карты; случайное место берёт прикуп и оставляет десять карт несколькими способами (лучший
//           по быстрой оценке, лучший для другой масти, несколько случайных), называет масть, и решатель доигрывает
//           раздачу безошибочно за всех троих — это один пример: (десять карт, масть, кто ходит) → взятки;
//        2. подбирает поправки к быстрой оценке методом наименьших квадратов с небольшим притяжением к нулю (ridge):
//           одно число на каждое сочетание карт масти в каждой роли — козырь, боковая масть (отдельно при коротком,
//           пятикарточном и длинном козыре: короткая боковая масть стоит убитку только при лишних козырях), масть
//           без козыря, — и ещё цену первого хода для играющего. У сочетания, которого не встретилось, поправка 0,
//           так что за него по-прежнему отвечает быстрая оценка;
//        3. проверяет результат на раздачах, которых не видел, и печатает, насколько старая и новая оценки далеки
//           от решателя;
//        4. записывает таблицу целыми сотыми долями взятки.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import os from 'node:os';

const arg = (name, fallback) => {
    const index = process.argv.indexOf(`--${name}`);
    return index > 0 ? process.argv[index + 1] : fallback;
};

// [EN] The layout of the table (the same numbers are written into strengthTable.ts and read by strength.ts).
// [RU] Устройство таблицы (те же числа записываются в strengthTable.ts и читаются в strength.ts).
const HOLDINGS = 256;
const TRUMP = 0;                 // 256 numbers: the trump suit
const SIDE = HOLDINGS;           // 3 × 256: a side suit by the length of the trump suit (≤4, 5, ≥6)
const NO_TRUMP = HOLDINGS * 4;   // 256: a suit at no trump
const LEAD_SUIT = HOLDINGS * 5;  // the declarer leads to the first trick, a suit game
const LEAD_NO_TRUMP = HOLDINGS * 5 + 1;
const SIZE = HOLDINGS * 5 + 2;
const popcount = bits => { let count = 0; for (let b = bits; b; b &= b - 1) count += 1; return count; };
const trumpBucket = length => (length <= 4 ? 0 : length === 5 ? 1 : 2);

/** The places of the table one hand touches (each counts once; a holding may repeat only at no trump). */
function featuresOf(hand, strain, declarerLeads) {
    const places = [];
    if (strain === 4) {
        for (let suit = 0; suit < 4; suit += 1) places.push(NO_TRUMP + ((hand >>> (suit * 8)) & 0xff));
        if (declarerLeads) places.push(LEAD_NO_TRUMP);
        return places;
    }
    const trumps = (hand >>> (strain * 8)) & 0xff;
    places.push(TRUMP + trumps);
    const bucket = trumpBucket(popcount(trumps));
    for (let suit = 0; suit < 4; suit += 1) if (suit !== strain) places.push(SIDE + bucket * HOLDINGS + ((hand >>> (suit * 8)) & 0xff));
    if (declarerLeads) places.push(LEAD_SUIT);
    return places;
}

if (isMainThread) {
    const deals = Number(arg('deals', 120000));
    const threads = Number(arg('threads', Math.max(1, Math.min(14, os.cpus().length - 4))));
    const ridge = Number(arg('ridge', 4));
    const dry = process.argv.includes('--dry');
    const chunk = Math.ceil(deals / threads);
    const started = Date.now();
    const parts = await Promise.all(Array.from({ length: threads }, (_, part) => new Promise((resolve, reject) => {
        const worker = new Worker(fileURLToPath(import.meta.url), { workerData: { from: 7000000 + part * chunk, count: chunk } });
        worker.on('message', resolve);
        worker.on('error', reject);
    })));
    const rows = parts.flat();
    console.log(`${rows.length} examples from ${deals} deals in ${((Date.now() - started) / 1000).toFixed(0)} s on ${threads} threads`);

    // [EN] Every tenth deal is kept aside for the check. [RU] Каждая десятая раздача отложена для проверки.
    const train = rows.filter(row => row.deal % 10 !== 0);
    const test = rows.filter(row => row.deal % 10 === 0);

    // Normal equations of ridge regression on the residual (tricks − quick estimate).
    const A = new Float64Array(SIZE * SIZE);
    const b = new Float64Array(SIZE);
    for (const row of train) {
        const places = featuresOf(row.hand, row.strain, row.leads);
        const residual = row.tricks - row.estimate;
        for (const i of places) {
            b[i] += residual;
            for (const j of places) A[i * SIZE + j] += 1;
        }
    }
    for (let i = 0; i < SIZE; i += 1) A[i * SIZE + i] += ridge;
    // Cholesky: A = L·Lᵀ, then two triangular solves.
    for (let j = 0; j < SIZE; j += 1) {
        let diagonal = A[j * SIZE + j];
        for (let k = 0; k < j; k += 1) diagonal -= A[j * SIZE + k] * A[j * SIZE + k];
        const root = Math.sqrt(diagonal);
        A[j * SIZE + j] = root;
        for (let i = j + 1; i < SIZE; i += 1) {
            let value = A[i * SIZE + j];
            for (let k = 0; k < j; k += 1) value -= A[i * SIZE + k] * A[j * SIZE + k];
            A[i * SIZE + j] = value / root;
        }
    }
    const weights = new Float64Array(SIZE);
    for (let i = 0; i < SIZE; i += 1) {
        let value = b[i];
        for (let k = 0; k < i; k += 1) value -= A[i * SIZE + k] * weights[k];
        weights[i] = value / A[i * SIZE + i];
    }
    for (let i = SIZE - 1; i >= 0; i -= 1) {
        let value = weights[i];
        for (let k = i + 1; k < SIZE; k += 1) value -= A[k * SIZE + i] * weights[k];
        weights[i] = value / A[i * SIZE + i];
    }
    const table = Array.from(weights, value => Math.round(value * 100));

    const predict = row => row.estimate + featuresOf(row.hand, row.strain, row.leads).reduce((sum, place) => sum + table[place], 0) / 100;
    const report = (name, list) => {
        let oldSquares = 0, newSquares = 0, oldBias = 0, newBias = 0;
        for (const row of list) {
            const before = row.estimate - row.tricks;
            const after = predict(row) - row.tricks;
            oldSquares += before * before; newSquares += after * after; oldBias += before; newBias += after;
        }
        const n = list.length;
        console.log(`${name}: ${n} examples · the quick estimate is off by ${Math.sqrt(oldSquares / n).toFixed(2)} tricks (on average ${(oldBias / n).toFixed(2)}) · with the table by ${Math.sqrt(newSquares / n).toFixed(2)} (on average ${(newBias / n).toFixed(2)})`);
    };
    report('learned on', train);
    report('checked on', test);
    // How well the new number tells a made game from a failed one, on the deals kept aside.
    console.log('strength |     n | mean tricks |   ≥6     ≥7     ≥8     ≥9');
    const buckets = new Map();
    for (const row of test.filter(item => item.best)) {
        const bucket = Math.floor(predict(row) * 2) / 2;
        (buckets.get(bucket) ?? buckets.set(bucket, []).get(bucket)).push(row.tricks);
    }
    for (const bucket of [...buckets.keys()].sort((x, y) => x - y)) {
        const list = buckets.get(bucket);
        if (list.length < 30) continue;
        const share = level => `${((100 * list.filter(tricks => tricks >= level).length) / list.length).toFixed(0)}%`.padStart(6);
        console.log(`${bucket.toFixed(1).padStart(8)} | ${String(list.length).padStart(5)} | ${(list.reduce((x, y) => x + y, 0) / list.length).toFixed(2).padStart(11)} | ${share(6)} ${share(7)} ${share(8)} ${share(9)}`);
    }
    console.log(`the first lead is worth ${(table[LEAD_SUIT] / 100).toFixed(2)} of a trick in a suit game, ${(table[LEAD_NO_TRUMP] / 100).toFixed(2)} at no trump`);

    if (!dry) {
        const lines = [];
        for (let index = 0; index < SIZE; index += 20) lines.push(`  ${table.slice(index, index + 20).join(', ')},`);
        const target = fileURLToPath(new URL('../../src/games/preferans/engine/ai/strengthTable.ts', import.meta.url));
        writeFileSync(target, `// =====================================================================
// FILE: apps/client/src/games/preferans/engine/ai/strengthTable.ts
// PURPOSE: corrections to the quick estimate of a declarer's hand, in hundredths of a trick, learned from the exact
//   solver. WRITTEN BY apps/client/scripts/load/preferans-learn.mjs — do not edit by hand, run the script again.
//   Learned on ${train.length} examples (${deals} deals, ridge ${ridge}); on the deals kept aside the estimate with the table
//   is off by ${Math.sqrt(test.reduce((sum, row) => sum + (predict(row) - row.tricks) ** 2, 0) / test.length).toFixed(2)} tricks, without it by ${Math.sqrt(test.reduce((sum, row) => sum + (row.estimate - row.tricks) ** 2, 0) / test.length).toFixed(2)}.
//   Layout (strength.ts reads it): [0, 256) the trump suit by its holding (bit r = rank r held, 0 = seven … 7 = ace);
//   [256, 1024) a side suit by its holding, in three blocks by the length of the trump suit (≤4, 5, ≥6);
//   [1024, 1280) a suit at no trump; 1280 — the declarer leads to the first trick in a suit game; 1281 — at no trump.
// =====================================================================
export const STRENGTH_TABLE: readonly number[] = Object.freeze([
${lines.join('\n')}
]);
`);
        console.log(`written: ${target}`);
    }
} else {
    const engine = await import('../../src/games/preferans/engine/index.ts');
    const { newDeal, createRandom, solveWithStats, estimateDeclarerTricks, bestStrain, cardsOf, removeCard, SOCHI } = engine;
    const { from, count } = workerData;
    const rows = [];
    for (let deal = from; deal < from + count; deal += 1) {
        const random = createRandom(deal);
        const state = newDeal({ rules: SOCHI, random, dealer: deal % 3 });
        const seat = Math.floor(random() * 3);
        const lead = state.firstHand;
        const twelve = state.talon.reduce((set, card) => (set | (1 << card)) >>> 0, state.hands[seat]);
        const cards = cardsOf(twelve);
        const keeps = [];
        for (let i = 0; i < cards.length; i += 1) for (let j = i + 1; j < cards.length; j += 1) keeps.push(removeCard(removeCard(twelve, cards[i]), cards[j]));
        // The best ten cards by the quick estimate with their strain; the best for another strain; three random keeps.
        const ranked = keeps.map(rest => ({ rest, ...bestStrain(rest) })).sort((x, y) => y.tricks - x.tricks);
        const examples = [{ rest: ranked[0].rest, strain: ranked[0].strain, best: true }];
        const other = (ranked[0].strain + 1 + Math.floor(random() * 4)) % 5;
        let otherBest = null;
        for (const rest of keeps) {
            const value = estimateDeclarerTricks(rest, other);
            if (!otherBest || value > otherBest.value) otherBest = { rest, value };
        }
        examples.push({ rest: otherBest.rest, strain: other, best: false });
        for (let extra = 0; extra < 3; extra += 1) {
            const rest = keeps[Math.floor(random() * keeps.length)];
            examples.push({ rest, strain: random() < 0.6 ? bestStrain(rest).strain : Math.floor(random() * 5), best: false });
        }
        for (const example of examples) {
            const hands = state.hands.map((hand, index) => (index === seat ? example.rest : hand));
            const { tricks } = solveWithStats({ hands, trump: example.strain === 4 ? null : example.strain, turn: lead, trick: [], target: seat, targetWants: 'max' });
            rows.push({ deal, hand: example.rest, strain: example.strain, leads: lead === seat, tricks, estimate: estimateDeclarerTricks(example.rest, example.strain), best: example.best });
        }
    }
    parentPort.postMessage(rows);
}

// [EN] FILE: games/preferans/hooks/usePreferans.ts — React state of a preferans pool: the current deal, bot seats
//      thinking in a Web Worker, the score sheet, the end of the pool, and saving after every move so a pool
//      continues exactly where it stopped (on the bus, on the way).
// [RU] ФАЙЛ: games/preferans/hooks/usePreferans.ts — состояние пули для React: текущая раздача, места ботов,
//      которые думают в Web Worker, запись, окончание пули и сохранение после каждого хода — пуля продолжается
//      ровно с того места, где её оставили (в автобусе, в дороге).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ZERO_SCORE, addScores, americanHelp, applyAction, bombsAfter, controllerOf, createRandom, dealSeatOf, dealerDecides, newDeal,
    normalizeTable, plainTable, rulesForTable, seatingFor, settle, settleDuel, sheetWidth, tableScore,
    type Action, type DealResult, type DealScore, type DealSeating, type DealState, type RuleSet, type Seat, type TableConfig, type TableSize,
} from '../engine/index.ts';
import type { BotRequest, BotResponse } from '../engine/worker.ts';
import { DEFAULT_CAST, castForNewPool, characterInfo, isCharacterId, normalizeCast, type Cast, type CharacterId } from '../characters/roster.ts';
import { addGameResult, loadGameResults, saveGame, type GameResult } from '@shared/utils/storageEngine';

// [EN] You are table player 0 and always sit at the bottom; the opponents follow clockwise (two, or three when the
//      dealer sits on the talon — engine/table.ts). Who they are changes from pool to pool (characters/roster.ts).
// [RU] Вы — игрок стола 0 и всегда сидите внизу; соперники идут по часовой стрелке (двое, или трое, когда
//      сдающий сидит на прикупе — engine/table.ts). Кто они, меняется от пули к пуле (characters/roster.ts).
export const HUMAN_PLAYER = 0;

// [EN] Who decides for a seat. 'remote' is the extension point for online play.
//      TODO(online): a remote seat receives its view of the deal and sends actions through a server that runs the
//      same engine (server-authoritative, hidden cards never leave the server). See COSMO_GAME_HUB_BIBLE.md (English section), "Online play".
// [RU] Кто решает за место. 'remote' — точка расширения для игры по сети.
//      TODO(online): удалённое место получает свой вид раздачи и шлёт действия через сервер с тем же движком
//      (сервер — источник истины, скрытые карты не покидают сервер). См. COSMO_GAME_HUB_BIBLE.md, «Игра по сети».
export type SeatKind = 'human' | 'bot' | 'remote';

export type BotStrength = 'casual' | 'strong';
// [EN] Strong bots sample more deals per card; both always solve each sampled deal exactly.
// [RU] Сильные боты перебирают больше раскладов на ход; каждый расклад оба решают точно.
const STRENGTH: Readonly<Record<BotStrength, { samples: number; timeBudgetMs: number }>> = {
    casual: { samples: 8, timeBudgetMs: 250 },
    strong: { samples: 32, timeBudgetMs: 900 },
};

export interface PreferansSettings {
    /** [EN] What was chosen on the table menu (engine/tableOptions.ts). [RU] Что выбрано в меню стола. */
    readonly table: TableConfig;
    readonly strength: BotStrength;
    /**
     * [EN] Opponents picked on the menu, seat by seat; null or absent = the lair decides (the last winner stays).
     * [RU] Соперники, выбранные в меню, по местам; null или нет — решает логово (победитель прошлой пули остаётся).
     */
    readonly opponents?: readonly (CharacterId | null)[];
}
export const DEFAULT_SETTINGS: PreferansSettings = { table: plainTable(), strength: 'strong', opponents: [null, null] };

/**
 * [EN] Who won the last closed pool, if it was an opponent: the champion keeps the seat in the next pool.
 * [RU] Кто выиграл последнюю закрытую пулю, если это был соперник: чемпион остаётся за столом в следующей пуле.
 */
export function championOf(results: readonly GameResult<PreferansResultSummary>[]): CharacterId | null {
    const last = results[0]?.summary;
    if (!last || !Array.isArray(last.balance) || !Array.isArray(last.names)) return null;
    let best = 0;
    last.balance.forEach((value, seat) => { if (value > last.balance[best]) best = seat; });
    const id = last.names[best];
    return best > 0 && last.balance[best] > 0.05 && isCharacterId(id) ? id : null;
}
export const rulesFor = (settings: PreferansSettings): RuleSet => rulesForTable(settings.table);

export interface DealLogEntry {
    readonly number: number;
    readonly dealer: Seat;
    readonly result: DealResult;
    /** [EN] What the deal wrote on the table sheet (table players; four at the table it differs from result.score).
     *  [RU] Что раздача записала на лист стола (игроки стола; вчетвером отличается от result.score). */
    readonly score?: DealScore;
    /** [EN] Who sat in which deal seat. [RU] Кто в какой позиции раздачи сидел. */
    readonly seating?: DealSeating;
}

/** [EN] An empty sheet for this many players. [RU] Пустой лист на столько игроков. */
const emptySheet = (size: number): DealScore => ({
    pool: Array.from({ length: size }, () => 0),
    mountain: Array.from({ length: size }, () => 0),
    whists: Array.from({ length: size }, () => Array.from({ length: size }, () => 0)),
});
const sizeOf = (settings: PreferansSettings): TableSize => (settings.table.players === 4 ? 4 : settings.table.players === 2 ? 2 : 3);
/** [EN] The first dealer: you speak first (three: seat 2 deals; four: player 3 deals and sits out). [RU] Первый сдающий — так, чтобы вы говорили первым. */
const firstDealer = (size: TableSize): number => (size === 4 ? 3 : size === 2 ? 1 : 2);

// [EN] What is saved on the device. Bump SAVE_VERSION when this shape changes: older saves are then ignored.
// [RU] Что сохраняется на устройстве. Меняется форма — увеличьте SAVE_VERSION: старые сохранения пропустятся.
export const SAVE_ID = 'preferans';
// [EN] 2: settings hold the table menu (TableConfig) instead of loose options. [RU] 2: настройки хранят меню стола.
export const SAVE_VERSION = 2;
export interface PreferansSave {
    readonly settings: PreferansSettings;
    readonly deal: DealState;
    readonly sheet: DealScore;
    readonly log: readonly DealLogEntry[];
    /** [EN] The opponents of this pool; absent in saves made before 09.11 (Vlad and Carmilla then). [RU] Соперники этой пули. */
    readonly cast?: Cast;
    /** [EN] The table player who deals now (four at the table he sits out). [RU] Игрок стола, который сейчас сдаёт. */
    readonly tableDealer?: number;
    /** [EN] Bombs of every table player (Classic); absent in older saves. [RU] Бомбы каждого игрока стола (Классика). */
    readonly bombs?: readonly number[];
}
export interface PreferansResultSummary {
    readonly balance: readonly number[];
    readonly deals: number;
    readonly poolTarget: number;
    readonly names: readonly string[];
}

// [EN] Pauses so that a human can follow the bots: a finished trick stays on the table a little longer.
// [RU] Паузы, чтобы человек успевал следить за ботами: сыгранная взятка задерживается на столе подольше.
function botPause(state: DealState): number {
    if (state.phase !== 'play') return 700;
    if (state.trick.length === 0 && state.tricks.length > 0) return 1100;
    return 550;
}

const freshSeed = (): number => (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
const NO_BOMBS: readonly number[] = [0, 0, 0, 0];
/** [EN] Bombs from a save made safe: four whole numbers 0…3. [RU] Бомбы из сохранения, приведённые в порядок. */
const normalizeBombs = (value: unknown): number[] =>
    NO_BOMBS.map((_, player) => {
        const count = Array.isArray(value) ? Number(value[player]) : 0;
        return Number.isFinite(count) ? Math.max(0, Math.min(3, Math.floor(count))) : 0;
    });
const firstDeal = (settings: PreferansSettings): DealState =>
    newDeal({ dealer: seatingFor(sizeOf(settings), firstDealer(sizeOf(settings))).dealSeat, rules: rulesFor(settings), random: createRandom(freshSeed()) });

/** [EN] `active` = false while the setup panel is open: bots wait and nothing is saved. [RU] Пока открыта плашка настроек, боты ждут и ничего не сохраняется. */
export function usePreferans(active: boolean) {
    const [settings, setSettings] = useState<PreferansSettings>(DEFAULT_SETTINGS);
    const [deal, setDeal] = useState<DealState>(() => firstDeal(DEFAULT_SETTINGS));
    const [sheet, setSheet] = useState<DealScore>(ZERO_SCORE);
    const [log, setLog] = useState<DealLogEntry[]>([]);
    const [cast, setCast] = useState<Cast>(DEFAULT_CAST);
    const [tableDealer, setTableDealer] = useState<number>(firstDealer(3));
    const [bombs, setBombs] = useState<number[]>(() => [...NO_BOMBS]);
    const [thinking, setThinking] = useState(false);
    // [EN] Three or four at the table; who plays this deal and in which deal seat; who decides for each seat.
    // [RU] Трое или четверо за столом; кто играет эту раздачу и на каком месте; кто решает за каждое место.
    const size = sizeOf(settings);
    const seating = useMemo(() => seatingFor(size, tableDealer), [size, tableDealer]);
    /**
     * [EN] The table player who decides now: the controller of the seat on turn (in open whist the whister plays the
     *      passer's cards), or the dealer on the talon when he answers the offer to whist and plays the cards he took.
     * [RU] Игрок стола, который решает сейчас: тот, кто управляет местом на ходу (в висте в светлую вистующий играет и
     *      за пасовавшего), или сдающий на прикупе, когда он отвечает на предложение вистовать и играет взятой рукой.
     */
    const actorOf = useCallback((state: DealState): number | null => {
        if (state.turn === null) return null;
        if (dealerDecides(state) && seating.sittingOut !== null) return seating.sittingOut;
        return seating.players[controllerOf(state, state.turn)];
    }, [seating]);
    const kindOf = useCallback((player: number | null): SeatKind => (player === HUMAN_PLAYER ? 'human' : 'bot'), []);
    const humanSeat = dealSeatOf(seating, 0);
    const workerRef = useRef<Worker | null>(null);
    const requestId = useRef(0);
    const seed = useRef(freshSeed());
    const recorded = useRef<DealState | null>(null);
    const resultSaved = useRef(false);

    // [EN] One worker for the whole pool; it is terminated when the page leaves.
    // [RU] Один воркер на всю пулю; он закрывается, когда страница уходит.
    useEffect(() => {
        let worker: Worker | null = null;
        try {
            worker = new Worker(new URL('../engine/worker.ts', import.meta.url), { type: 'module' });
        } catch {
            worker = null; // [EN] fallback below / [RU] запасной путь ниже
        }
        workerRef.current = worker;
        return () => {
            worker?.terminate();
            workerRef.current = null;
        };
    }, []);

    const askBot = useCallback((state: DealState): Promise<Action> => {
        requestId.current += 1;
        const id = requestId.current;
        // [EN] The character who decides (in open whist the whister plays the passer's cards) brings its manner:
        //      how boldly it bids and whists, and how long it thinks (effort scales the bot strength).
        // [RU] Решающий персонаж (в висте в светлую вистующий играет и за пасовавшего) приносит свою манеру:
        //      как смело заявляет и вистует и как долго думает (усердие масштабирует силу бота).
        const actor = actorOf(state) ?? 1;
        const who = characterInfo(cast[actor - 1] ?? DEFAULT_CAST[0]);
        const base = STRENGTH[settings.strength];
        const request: BotRequest = {
            id, state, seed: (seed.current + id * 7919) >>> 0, style: who.style,
            samples: Math.max(4, Math.round(base.samples * who.effort)), timeBudgetMs: Math.round(base.timeBudgetMs * who.effort),
        };
        const worker = workerRef.current;
        if (!worker) {
            // [EN] No worker (very old browser): a lighter search on the main thread. Loaded only in that case,
            //      so the solver normally lives in the worker bundle alone.
            // [RU] Воркера нет (очень старый браузер): облегчённый поиск в основном потоке. Загружается только в
            //      этом случае, поэтому решатель обычно есть только в файле воркера.
            return import('../engine/worker.ts').then(({ answerBotRequest }) => {
                const response = answerBotRequest({ ...request, samples: 6, timeBudgetMs: 150 });
                if ('action' in response) return response.action;
                throw new Error(response.error);
            });
        }
        return new Promise((resolve, reject) => {
            const onMessage = (event: MessageEvent<BotResponse>) => {
                if (event.data.id !== id) return;
                worker.removeEventListener('message', onMessage);
                if ('action' in event.data) resolve(event.data.action);
                else reject(new Error(event.data.error));
            };
            worker.addEventListener('message', onMessage);
            worker.postMessage(request);
        });
    }, [settings.strength, cast, actorOf]);

    // [EN] Whenever a bot seat has to act, ask the worker and apply its answer after a short pause.
    // [RU] Когда ход за местом бота, спрашиваем воркер и применяем ответ после короткой паузы.
    useEffect(() => {
        const seat = deal.turn;
        if (!active || seat === null || kindOf(actorOf(deal)) !== 'bot') return;
        let cancelled = false;
        let timer = 0;
        setThinking(true);
        const started = performance.now();
        askBot(deal).then(action => {
            const wait = Math.max(0, botPause(deal) - (performance.now() - started));
            timer = window.setTimeout(() => {
                if (cancelled) return;
                setThinking(false);
                setDeal(current => (current === deal ? applyAction(current, action) : current));
            }, wait);
        }).catch(() => {
            if (!cancelled) setThinking(false);
        });
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            setThinking(false);
        };
    }, [active, deal, askBot, kindOf, actorOf]);

    // [EN] A finished deal is written on the table sheet exactly once (four at the table the dealer writes too).
    // [RU] Сыгранная раздача записывается на лист стола ровно один раз (вчетвером пишет и сдающий).
    useEffect(() => {
        const result = deal.result;
        if (deal.phase !== 'done' || !result || recorded.current === deal) return;
        recorded.current = deal;
        let score = tableScore(result, seating, size, deal.rules, deal.raspasyRound);
        // [EN] American help: a surplus above the target goes to whoever is still short of it (own pools only).
        // [RU] Американская помощь: излишек сверх цели уходит тому, кто до неё ещё не дописал (только свои пули).
        if (deal.rules.americanHelp && deal.rules.poolEnd === 'own') {
            const before = sheet.pool.length === sheetWidth(size) ? sheet : emptySheet(sheetWidth(size));
            score = addScores(score, americanHelp(addScores(before, score), size, settings.table.poolTarget, deal.rules));
        }
        const written = score;
        setSheet(current => addScores(current.pool.length === sheetWidth(size) ? current : emptySheet(sheetWidth(size)), written));
        setLog(current => [...current, { number: current.length + 1, dealer: deal.dealer, result, score: written, seating }]);
        if (deal.rules.bombs) setBombs(current => bombsAfter(current, result, seating));
    }, [deal, seating, size, sheet, settings.table.poolTarget]);

    // [EN] Saved after every change of the pool; the save is small (about 10 KB of plain data). On the road a phone may
    //      switch apps or close the tab at any moment: hiding or leaving the page saves once more, at once, and the
    //      «Save» button saves on demand and shows when it happened.
    // [RU] Сохраняется после каждого изменения пули; сохранение маленькое (около 10 КБ простых данных). В дороге телефон
    //      может в любой момент переключиться на другое приложение или закрыть вкладку: когда страница скрывается или
    //      закрывается, пуля сохраняется ещё раз, сразу; кнопка «Сохранить» сохраняет по требованию и показывает, когда.
    const snapshot = useRef<PreferansSave | null>(null);
    const [savedAt, setSavedAt] = useState<number | null>(null);
    useEffect(() => {
        if (!active) return;
        const save: PreferansSave = { settings, deal, sheet, log, cast, tableDealer, bombs };
        snapshot.current = save;
        saveGame<PreferansSave>(SAVE_ID, SAVE_VERSION, save);
        setSavedAt(Date.now());
    }, [active, settings, deal, sheet, log, cast, tableDealer, bombs]);
    useEffect(() => {
        const flush = () => { if (snapshot.current) saveGame<PreferansSave>(SAVE_ID, SAVE_VERSION, snapshot.current); };
        const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
        window.addEventListener('pagehide', flush);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            window.removeEventListener('pagehide', flush);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);
    const saveNow = useCallback(() => {
        if (!snapshot.current) return;
        saveGame<PreferansSave>(SAVE_ID, SAVE_VERSION, snapshot.current);
        setSavedAt(Date.now());
    }, []);

    const isHumanTurn = deal.turn !== null && kindOf(actorOf(deal)) === 'human';

    // [EN] Human decisions are validated by the engine; an illegal click simply does nothing.
    // [RU] Решения человека проверяет движок; недопустимый клик просто ничего не делает.
    const act = useCallback((action: Action) => {
        setDeal(current => {
            if (current.turn === null || kindOf(actorOf(current)) !== 'human') return current;
            try {
                return applyAction(current, action);
            } catch {
                return current;
            }
        });
    }, [kindOf, actorOf]);

    const poolTarget = settings.table.poolTarget;
    const poolTotal = sheet.pool.reduce((total, value) => total + value, 0);
    // [EN] The pool closes when all pools together reach the target times the players; unfinished pools count as mountain.
    // [RU] Пуля закрыта, когда все пули вместе набрали цель, умноженную на число игроков; недописанная пуля — гора.
    const gameOver = deal.phase === 'done' && poolTotal >= poolTarget * size;
    const balance = useMemo(() => (size === 2 ? settleDuel : settle)(sheet, deal.rules, poolTarget), [sheet, deal.rules, poolTarget, size]);

    // [EN] A closed pool goes to the results history once. [RU] Закрытая пуля попадает в историю результатов один раз.
    useEffect(() => {
        if (!gameOver || resultSaved.current) return;
        resultSaved.current = true;
        addGameResult<PreferansResultSummary>(SAVE_ID, { balance, deals: log.length, poolTarget, names: ['you', ...cast] });
    }, [gameOver, balance, log.length, poolTarget, cast]);

    // [EN] The deal passes clockwise; four at the table the new dealer sits out. The all-pass price runs on.
    // [RU] Сдача идёт по часовой стрелке; вчетвером новый сдающий садится на прикуп. Цена распасов продолжается.
    const startNextDeal = useCallback(() => {
        if (deal.phase !== 'done') return;
        const dealer = (tableDealer + 1) % size;
        const next = seatingFor(size, dealer);
        setTableDealer(dealer);
        setDeal(newDeal({
            rules: deal.rules, dealer: next.dealSeat,
            raspasyRound: deal.mode === 'raspasy' && !deal.result?.redeal ? deal.raspasyRound + 1 : 0, random: createRandom(freshSeed()),
            // [EN] Each deal seat brings its player's bombs. [RU] Каждое место раздачи приносит бомбы своего игрока.
            bombs: next.players.map(player => bombs[player] ?? 0),
        }));
    }, [deal, tableDealer, size, bombs]);

    /** [EN] A new pool with these settings. [RU] Новая пуля с этими настройками. */
    const restart = useCallback((next: PreferansSettings) => {
        seed.current = freshSeed();
        recorded.current = null;
        resultSaved.current = false;
        const nextSize = sizeOf(next);
        setSettings(next);
        setSheet(emptySheet(sheetWidth(nextSize)));
        setLog([]);
        setTableDealer(firstDealer(nextSize));
        setBombs([...NO_BOMBS]);
        // [EN] A new pool, a new company: the opponents picked on the menu, the champion of the last pool, the rest new.
        // [RU] Новая пуля — новая компания: выбранные в меню, чемпион прошлой пули, остальные — новые лица.
        const champion = championOf(loadGameResults<PreferansResultSummary>(SAVE_ID));
        setCast(current => castForNewPool(next.opponents ?? [], nextSize - 1, createRandom(seed.current ^ 0x5bd1e995), current, champion));
        setThinking(false);
        setDeal(firstDeal(next));
    }, []);

    /** [EN] Continue a saved pool exactly where it stopped. [RU] Продолжить сохранённую пулю с того же места. */
    const load = useCallback((save: PreferansSave) => {
        const table = normalizeTable(save.settings.table); // a save is data from outside: made safe first
        const savedSize: TableSize = table.players === 4 ? 4 : table.players === 2 ? 2 : 3;
        recorded.current = save.deal.phase === 'done' ? save.deal : null; // its result is already on the sheet
        resultSaved.current = save.deal.phase === 'done' && save.sheet.pool.reduce((a, b) => a + b, 0) >= table.poolTarget * savedSize;
        setSettings({ ...save.settings, table, opponents: save.settings.opponents ?? [null, null] });
        setSheet(save.sheet.pool.length === sheetWidth(savedSize) ? save.sheet : emptySheet(sheetWidth(savedSize)));
        setLog([...save.log]);
        setCast(normalizeCast(save.cast, savedSize - 1));
        // [EN] Old saves (three at the table) knew only the deal's dealer. [RU] Старые сохранения (трое) знали только сдающего раздачи.
        setTableDealer(typeof save.tableDealer === 'number' ? save.tableDealer % savedSize : save.deal.dealer);
        setBombs(normalizeBombs(save.bombs));
        setThinking(false);
        // [EN] The rules follow from the table menu: rebuilt, so a pool saved before a rule field existed plays on.
        // [RU] Правила следуют из меню стола: собираем заново, и пуля, сохранённая до нового поля правил, играется дальше.
        setDeal({ ...save.deal, rules: rulesForTable(table) });
    }, []);

    return {
        deal, settings, sheet, log, cast, thinking, isHumanTurn, act, startNextDeal, restart, load, gameOver, balance, poolTotal,
        size, seating, humanSeat, tableDealer, bombs, actorOf, saveNow, savedAt,
    };
}

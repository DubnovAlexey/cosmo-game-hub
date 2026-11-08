// [EN] FILE: games/preferans/hooks/usePreferans.ts — React state of a preferans pool: the current deal, bot seats
//      thinking in a Web Worker, the score sheet, the end of the pool, and saving after every move so a pool
//      continues exactly where it stopped (on the bus, on the way).
// [RU] ФАЙЛ: games/preferans/hooks/usePreferans.ts — состояние пули для React: текущая раздача, места ботов,
//      которые думают в Web Worker, запись, окончание пули и сохранение после каждого хода — пуля продолжается
//      ровно с того места, где её оставили (в автобусе, в дороге).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    SOCHI, ZERO_SCORE, addScores, applyAction, controllerOf, createRandom, customizeRules, newDeal, nextDeal, normalizeTable,
    plainTable, settle, toRuleOptions,
    type Action, type DealResult, type DealScore, type DealState, type RuleSet, type Seat, type TableConfig,
} from '../engine/index.ts';
import type { BotRequest, BotResponse } from '../engine/worker.ts';
import { addGameResult, saveGame } from '@shared/utils/storageEngine';

// [EN] The human always sits at the bottom (seat 0); seats 1 and 2 follow clockwise.
// [RU] Человек всегда внизу (место 0), места 1 и 2 идут по часовой стрелке.
export const HUMAN_SEAT: Seat = 0;
export const SEAT_NAMES: readonly string[] = ['You', 'Orion', 'Vega'];

// [EN] Who decides for a seat. 'remote' is the extension point for online play.
//      TODO(online): a remote seat receives its view of the deal and sends actions through a server that runs the
//      same engine (server-authoritative, hidden cards never leave the server). See COSMO_GAME_HUB_BIBLE.md (English section), "Online play".
// [RU] Кто решает за место. 'remote' — точка расширения для игры по сети.
//      TODO(online): удалённое место получает свой вид раздачи и шлёт действия через сервер с тем же движком
//      (сервер — источник истины, скрытые карты не покидают сервер). См. COSMO_GAME_HUB_BIBLE.md, «Игра по сети».
export type SeatKind = 'human' | 'bot' | 'remote';
export const SEAT_KINDS: readonly SeatKind[] = ['human', 'bot', 'bot'];

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
}
export const DEFAULT_SETTINGS: PreferansSettings = { table: plainTable(), strength: 'strong' };
export const rulesFor = (settings: PreferansSettings): RuleSet => customizeRules(SOCHI, toRuleOptions(settings.table));

export interface DealLogEntry {
    readonly number: number;
    readonly dealer: Seat;
    readonly result: DealResult;
}

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
const firstDeal = (settings: PreferansSettings): DealState => newDeal({ dealer: 2, rules: rulesFor(settings), random: createRandom(freshSeed()) });

/** [EN] `active` = false while the setup panel is open: bots wait and nothing is saved. [RU] Пока открыта плашка настроек, боты ждут и ничего не сохраняется. */
export function usePreferans(active: boolean) {
    const [settings, setSettings] = useState<PreferansSettings>(DEFAULT_SETTINGS);
    const [deal, setDeal] = useState<DealState>(() => firstDeal(DEFAULT_SETTINGS));
    const [sheet, setSheet] = useState<DealScore>(ZERO_SCORE);
    const [log, setLog] = useState<DealLogEntry[]>([]);
    const [thinking, setThinking] = useState(false);
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
        const request: BotRequest = { id, state, seed: (seed.current + id * 7919) >>> 0, ...STRENGTH[settings.strength] };
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
    }, [settings.strength]);

    // [EN] Whenever a bot seat has to act, ask the worker and apply its answer after a short pause.
    // [RU] Когда ход за местом бота, спрашиваем воркер и применяем ответ после короткой паузы.
    useEffect(() => {
        const seat = deal.turn;
        if (!active || seat === null || SEAT_KINDS[controllerOf(deal, seat)] !== 'bot') return;
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
    }, [active, deal, askBot]);

    // [EN] A finished deal is written on the sheet exactly once.
    // [RU] Сыгранная раздача записывается ровно один раз.
    useEffect(() => {
        const result = deal.result;
        if (deal.phase !== 'done' || !result || recorded.current === deal) return;
        recorded.current = deal;
        setSheet(current => addScores(current, result.score));
        setLog(current => [...current, { number: current.length + 1, dealer: deal.dealer, result }]);
    }, [deal]);

    // [EN] Saved after every change of the pool; the save is small (about 10 KB of plain data).
    // [RU] Сохраняется после каждого изменения пули; сохранение маленькое (около 10 КБ простых данных).
    useEffect(() => {
        if (!active) return;
        saveGame<PreferansSave>(SAVE_ID, SAVE_VERSION, { settings, deal, sheet, log });
    }, [active, settings, deal, sheet, log]);

    const isHumanTurn = deal.turn !== null && SEAT_KINDS[controllerOf(deal, deal.turn)] === 'human';

    // [EN] Human decisions are validated by the engine; an illegal click simply does nothing.
    // [RU] Решения человека проверяет движок; недопустимый клик просто ничего не делает.
    const act = useCallback((action: Action) => {
        setDeal(current => {
            if (current.turn === null || SEAT_KINDS[controllerOf(current, current.turn)] !== 'human') return current;
            try {
                return applyAction(current, action);
            } catch {
                return current;
            }
        });
    }, []);

    const poolTarget = settings.table.poolTarget;
    const poolTotal = sheet.pool[0] + sheet.pool[1] + sheet.pool[2];
    // [EN] The pool closes when the three pools together reach three targets; unfinished pools count as mountain.
    // [RU] Пуля закрыта, когда три пули вместе набрали три цели; недописанная пуля считается горой.
    const gameOver = deal.phase === 'done' && poolTotal >= poolTarget * 3;
    const balance = useMemo(() => settle(sheet, deal.rules, poolTarget), [sheet, deal.rules, poolTarget]);

    // [EN] A closed pool goes to the results history once. [RU] Закрытая пуля попадает в историю результатов один раз.
    useEffect(() => {
        if (!gameOver || resultSaved.current) return;
        resultSaved.current = true;
        addGameResult<PreferansResultSummary>(SAVE_ID, { balance, deals: log.length, poolTarget, names: SEAT_NAMES });
    }, [gameOver, balance, log.length, poolTarget]);

    const startNextDeal = useCallback(() => {
        setDeal(current => (current.phase === 'done' ? nextDeal(current, { random: createRandom(freshSeed()) }) : current));
    }, []);

    /** [EN] A new pool with these settings. [RU] Новая пуля с этими настройками. */
    const restart = useCallback((next: PreferansSettings) => {
        seed.current = freshSeed();
        recorded.current = null;
        resultSaved.current = false;
        setSettings(next);
        setSheet(ZERO_SCORE);
        setLog([]);
        setThinking(false);
        setDeal(firstDeal(next));
    }, []);

    /** [EN] Continue a saved pool exactly where it stopped. [RU] Продолжить сохранённую пулю с того же места. */
    const load = useCallback((save: PreferansSave) => {
        const table = normalizeTable(save.settings.table); // a save is data from outside: made safe first
        recorded.current = save.deal.phase === 'done' ? save.deal : null; // its result is already on the sheet
        resultSaved.current = save.deal.phase === 'done' && save.sheet.pool.reduce((a, b) => a + b, 0) >= table.poolTarget * 3;
        setSettings({ ...save.settings, table });
        setSheet(save.sheet);
        setLog([...save.log]);
        setThinking(false);
        setDeal(save.deal);
    }, []);

    return { deal, settings, sheet, log, thinking, isHumanTurn, act, startNextDeal, restart, load, gameOver, balance, poolTotal };
}

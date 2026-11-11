// [EN] FILE: games/checkers/hooks/useCheckers.ts — one game of draughts from the menu to the last move: the settings
//      (the rules, how well the opponent plays, your colour), the opponent (a hero of the lair, shared by all the
//      games), your moves, the computer's answers (thought out in a Web Worker and shown after a human pause), taking
//      a move back, resigning, the save after every move and the result in the history.
//      The engine is pure (engine/*.ts); this hook only keeps its state in React and in the browser's storage.
// [RU] ФАЙЛ: одна партия в шашки от меню до последнего хода: настройки (правила, как сильно играет соперник, ваш
//      цвет), соперник (герой логова, общий для всех игр), ваши ходы, ответы компьютера (он думает в фоновом потоке,
//      а ход показывается после человеческой паузы), возврат хода, сдача, сохранение после каждого хода и итог в
//      истории. Движок чистый (engine/*.ts); этот хук только держит его состояние в React и в хранилище браузера.
import { useCallback, useEffect, useRef, useState } from 'react';
import { BOARD_FOLK, CHARACTER_IDS, isCharacterId, type CharacterId } from '@shared/characters/roster';
import { addGameResult, clearGameSave, loadGame, saveGame } from '@shared/utils/storageEngine';
import {
    RULE_SETS, movesOf, newGame, play, resign as resignGame, takeBack as takeBackGame,
    type CheckersLevel, type CheckersState, type Move, type RulesId, type Side,
} from '../engine/index.ts';
import type { CheckersBotRequest, CheckersBotResponse } from '../engine/worker.ts';

export const CHECKERS_SAVE_ID = 'checkers';
export const CHECKERS_SAVE_VERSION = 1;
export type OpponentId = Exclude<CharacterId, 'dummy'>;
export type ColourChoice = Side | 'random';

export interface CheckersSettings {
    readonly rules: RulesId;
    readonly level: CheckersLevel;
    readonly colour: ColourChoice;
}
export const DEFAULT_SETTINGS: CheckersSettings = Object.freeze({ rules: 'russian', level: 'normal', colour: 'white' });

export interface CheckersSave {
    readonly settings: CheckersSettings;
    readonly opponent: OpponentId;
    /** The colour you play. */
    readonly you: Side;
    readonly game: CheckersState;
    readonly seed: number;
}
export interface CheckersResultSummary {
    readonly result: 'won' | 'lost' | 'draw';
    readonly moves: number;
    readonly opponent: OpponentId;
    readonly rules: RulesId;
    readonly level: CheckersLevel;
}

const freshSeed = (): number => (Math.floor(Math.random() * 0x7fffffff) ^ Date.now()) >>> 0;
/** [EN] How often the opponent comes from the necromancers of the catacombs. [RU] Как часто соперник приходит из некромантов катакомб. */
export const BOARD_FOLK_SHARE = 0.5;

/**
 * [EN] Somebody of the lair at random, not the one who sat here before. Every second game is played against the
 *      necromancers of the catacombs: they came up to the lair for this game and play it with bones.
 * [RU] Кто-то из логова наугад, но не тот, кто сидел здесь только что. Каждая вторая партия — против некромантов
 *      катакомб: они поднялись в логово ради этой игры и играют в неё костями.
 */
export function pickOpponent(previous: OpponentId | null = null, random: () => number = Math.random): OpponentId {
    const pool = random() < BOARD_FOLK_SHARE ? BOARD_FOLK : CHARACTER_IDS;
    const others = pool.filter(id => id !== previous);
    return others[Math.floor(random() * others.length)] ?? CHARACTER_IDS[0];
}

/** [EN] A save from an older build or another device is checked before it is trusted. [RU] Сохранение из старой сборки или с другого устройства проверяется, прежде чем ему верить. */
function validSave(data: CheckersSave | null | undefined): data is CheckersSave {
    if (!data || !data.settings || !RULE_SETS[data.settings.rules] || !isCharacterId(data.opponent)) return false;
    if (data.you !== 'white' && data.you !== 'black') return false;
    const game = data.game;
    const size = RULE_SETS[data.settings.rules].size;
    return Boolean(game && Array.isArray(game.board) && game.board.length === size * size && Array.isArray(game.log) && game.origin && Array.isArray(game.origin.board));
}

export function loadCheckersSave(): { readonly save: CheckersSave; readonly timestamp: number } | null {
    const stored = loadGame<CheckersSave>(CHECKERS_SAVE_ID, CHECKERS_SAVE_VERSION);
    return stored && validSave(stored.data) ? { save: stored.data, timestamp: stored.timestamp } : null;
}

/** [EN] The shortest pause before the computer's move shows, in milliseconds. [RU] Самая короткая пауза перед тем, как показать ход компьютера, в миллисекундах. */
const PAUSE_MS = 650;

export interface CheckersApi {
    readonly settings: CheckersSettings;
    readonly opponent: OpponentId;
    readonly you: Side;
    readonly game: CheckersState | null;
    /** The seed of this game: the computer's choices and the scene of its end come from it. */
    readonly seed: number;
    /** The opponent is thinking over its move. */
    readonly thinking: boolean;
    readonly savedAt: number | null;
    /** Your last move can be taken back. */
    readonly canTakeBack: boolean;
    readonly begin: (settings: CheckersSettings, opponent: OpponentId) => void;
    readonly resume: (save: CheckersSave) => void;
    readonly move: (move: Move) => void;
    readonly takeBack: () => void;
    readonly resign: () => void;
    readonly saveNow: () => void;
}

export function useCheckers(active: boolean): CheckersApi {
    const [settings, setSettings] = useState<CheckersSettings>(DEFAULT_SETTINGS);
    const [opponent, setOpponent] = useState<OpponentId>(() => pickOpponent());
    const [you, setYou] = useState<Side>('white');
    const [game, setGame] = useState<CheckersState | null>(null);
    const [seed, setSeed] = useState<number>(freshSeed);
    const [thinking, setThinking] = useState(false);
    const [savedAt, setSavedAt] = useState<number | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const requestId = useRef(0);
    const reported = useRef(false);

    useEffect(() => {
        let worker: Worker | null = null;
        try {
            worker = new Worker(new URL('../engine/worker.ts', import.meta.url), { type: 'module' });
        } catch {
            worker = null; // [EN] the main thread thinks instead / [RU] тогда думает главный поток
        }
        workerRef.current = worker;
        return () => { worker?.terminate(); workerRef.current = null; };
    }, []);

    const begin = useCallback((next: CheckersSettings, who: OpponentId) => {
        const nextSeed = freshSeed();
        setSettings(next);
        setOpponent(who);
        setSeed(nextSeed);
        setYou(next.colour === 'random' ? ((nextSeed & 1) === 0 ? 'white' : 'black') : next.colour);
        setGame(newGame(RULE_SETS[next.rules]));
        reported.current = false;
    }, []);

    const resume = useCallback((save: CheckersSave) => {
        setSettings(save.settings);
        setOpponent(save.opponent);
        setYou(save.you);
        setSeed(save.seed);
        setGame(save.game);
        reported.current = false;
    }, []);

    const move = useCallback((chosen: Move) => {
        setGame(current => {
            if (!current || current.winner !== null || current.turn !== you) return current;
            try {
                return play(current, chosen);
            } catch {
                return current; // [EN] not a legal move: nothing happens / [RU] неправильный ход: ничего не происходит
            }
        });
    }, [you]);

    // [EN] Back to the position before your last move (with the opponent's answer, if it came).
    // [RU] Назад, к позиции перед вашим последним ходом (вместе с ответом соперника, если он уже был).
    const lastOwnPly = game ? game.log.map(record => record.side).lastIndexOf(you) : -1;
    const canTakeBack = Boolean(game && game.winner === null && lastOwnPly >= 0);
    const takeBack = useCallback(() => {
        setGame(current => {
            if (!current || current.winner !== null) return current;
            const index = current.log.map(record => record.side).lastIndexOf(you);
            return index < 0 ? current : takeBackGame(current, current.log.length - index);
        });
    }, [you]);

    const resign = useCallback(() => {
        setGame(current => (current && current.winner === null ? resignGame(current, you) : current));
    }, [you]);

    const askComputer = useCallback((state: CheckersState): Promise<Move> => {
        requestId.current += 1;
        const id = requestId.current;
        const request: CheckersBotRequest = { id, board: state.board, side: state.turn, rules: state.rules, level: settings.level, seed: (seed + state.log.length * 7919) >>> 0 };
        const worker = workerRef.current;
        if (!worker) {
            return import('../engine/worker.ts').then(({ answerCheckersRequest }) => {
                const response = answerCheckersRequest({ ...request, timeMs: 250 });
                if ('move' in response) return response.move;
                throw new Error(response.error);
            });
        }
        return new Promise((resolve, reject) => {
            const onMessage = (event: MessageEvent<CheckersBotResponse>) => {
                if (event.data.id !== id) return;
                worker.removeEventListener('message', onMessage);
                if ('move' in event.data) resolve(event.data.move);
                else reject(new Error(event.data.error));
            };
            worker.addEventListener('message', onMessage);
            worker.postMessage(request);
        });
    }, [seed, settings.level]);

    // [EN] The opponent's move: thought out in the background, shown after a pause, so the eye sees what changed.
    // [RU] Ход соперника: продумывается в фоне и показывается после паузы, чтобы глаз видел, что изменилось.
    useEffect(() => {
        if (!active || !game || game.winner !== null || game.turn === you) { setThinking(false); return undefined; }
        let cancelled = false;
        setThinking(true);
        const started = Date.now();
        const state = game;
        const apply = (chosen: Move) => {
            window.setTimeout(() => {
                if (cancelled) return;
                setThinking(false);
                setGame(current => {
                    if (current !== state) return current;
                    try { return play(state, chosen); } catch { return current; }
                });
            }, Math.max(0, PAUSE_MS - (Date.now() - started)));
        };
        askComputer(state).then(apply).catch(() => {
            // [EN] A search error never stops the game: the first legal move is played. [RU] Ошибка поиска не останавливает игру: играется первый правильный ход.
            if (cancelled) return;
            const [first] = movesOf(state);
            if (first) apply(first);
        });
        return () => { cancelled = true; };
    }, [active, game, you, askComputer]);

    const snapshot = useCallback((): CheckersSave | null => (game ? { settings, opponent, you, game, seed } : null), [settings, opponent, you, game, seed]);

    const saveNow = useCallback(() => {
        const save = snapshot();
        if (!save) return;
        // [EN] A finished game has nothing to continue: its save is removed. [RU] У законченной партии нечего продолжать: её сохранение убирается.
        if (save.game.winner !== null) { clearGameSave(CHECKERS_SAVE_ID); return; }
        if (saveGame(CHECKERS_SAVE_ID, CHECKERS_SAVE_VERSION, save)) setSavedAt(Date.now());
    }, [snapshot]);

    // [EN] Saved after every move, and once more when the page is hidden or closed. [RU] Сохраняется после каждого хода и ещё раз, когда страницу прячут или закрывают.
    useEffect(() => { saveNow(); }, [saveNow]);
    useEffect(() => {
        const onHide = () => saveNow();
        window.addEventListener('pagehide', onHide);
        document.addEventListener('visibilitychange', onHide);
        return () => { window.removeEventListener('pagehide', onHide); document.removeEventListener('visibilitychange', onHide); };
    }, [saveNow]);

    // [EN] The result goes to the history once per game. [RU] Итог попадает в историю один раз за партию.
    useEffect(() => {
        if (!game || game.winner === null || reported.current) return;
        reported.current = true;
        const result = game.winner === 'draw' ? 'draw' : game.winner === you ? 'won' : 'lost';
        addGameResult<CheckersResultSummary>(CHECKERS_SAVE_ID, { result, moves: game.log.length, opponent, rules: settings.rules, level: settings.level });
    }, [game, you, opponent, settings.rules, settings.level]);

    return { settings, opponent, you, game, seed, thinking, savedAt, canTakeBack, begin, resume, move, takeBack, resign, saveNow };
}

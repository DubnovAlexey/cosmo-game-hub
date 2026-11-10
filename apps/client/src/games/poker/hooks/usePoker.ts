// =====================================================================
// FILE: apps/client/src/games/poker/hooks/usePoker.ts
// PURPOSE: the poker tournament as React state: the table (engine/holdem.ts), the company of regulars, the bots
//   thinking in a Web Worker with a human pause, your actions, the next hand, the end of the tournament with your
//   place. Saved after every change and when the page hides (on the road a phone can close at any moment);
//   «Continue» on the menu restores it exactly.
// =====================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { applyAction, createRandom, DEFAULT_RULES, nextHand, newTable, type HandState, type PokerAction, type TableRules } from '../engine/index.ts';
import type { PokerBotRequest, PokerBotResponse } from '../engine/worker.ts';
import { characterOf, isCharacterId, pickCompany, type PokerCharacterId } from '../characters';
import { addGameResult, loadGame, saveGame } from '@shared/utils/storageEngine';

export const POKER_SAVE_ID = 'poker';
export const POKER_SAVE_VERSION = 1;
export const HUMAN_SEAT = 0;

export type BotStrength = 'casual' | 'strong';
export type BlindSpeed = 'slow' | 'normal' | 'fast';
export interface PokerSettings {
  readonly opponents: number;
  readonly stack: number;
  readonly speed: BlindSpeed;
  readonly strength: BotStrength;
}
export const DEFAULT_SETTINGS: PokerSettings = Object.freeze({ opponents: 3, stack: 1500, speed: 'normal', strength: 'casual' });
export const HANDS_PER_LEVEL: Readonly<Record<BlindSpeed, number>> = Object.freeze({ slow: 15, normal: 10, fast: 6 });
const STRENGTH: Readonly<Record<BotStrength, { samples: number; noise: number }>> = Object.freeze({
  casual: { samples: 260, noise: 0.18 },
  strong: { samples: 900, noise: 0.05 },
});

export interface PokerSave {
  readonly settings: PokerSettings;
  readonly table: HandState;
  /** The regular in every seat after yours (seat 1 … n). */
  readonly cast: readonly PokerCharacterId[];
  readonly seed: number;
  /** Seats in the order they went out (for the places). */
  readonly busted: readonly number[];
}
export interface PokerResultSummary { readonly place: number; readonly players: number; readonly hands: number; readonly winner: PokerCharacterId | 'you' }

const freshSeed = (): number => (Math.floor(Math.random() * 0x7fffffff) ^ Date.now()) >>> 0;
const rulesFor = (settings: PokerSettings): TableRules => ({ ...DEFAULT_RULES, startingStack: settings.stack, handsPerLevel: HANDS_PER_LEVEL[settings.speed] });
const handRandom = (seed: number, hand: number) => createRandom((seed + hand * 104729) >>> 0);

/** A save from an older build or another device is checked before it is trusted. */
function validSave(data: PokerSave | undefined | null): data is PokerSave {
  if (!data || !data.table || !Array.isArray(data.table.seats) || !Array.isArray(data.cast)) return false;
  return data.cast.length === data.table.seats.length - 1 && data.cast.every(isCharacterId);
}

export function loadPokerSave(): { readonly save: PokerSave; readonly timestamp: number } | null {
  const stored = loadGame<PokerSave>(POKER_SAVE_ID, POKER_SAVE_VERSION);
  return stored && validSave(stored.data) ? { save: stored.data, timestamp: stored.timestamp } : null;
}

export interface PokerGameApi {
  readonly table: HandState | null;
  readonly cast: readonly PokerCharacterId[];
  readonly settings: PokerSettings;
  readonly thinking: boolean;
  /** The tournament is over: your place (1 = you won) and how many sat down. */
  readonly over: { readonly place: number; readonly players: number; readonly winner: number } | null;
  readonly savedAt: number | null;
  readonly start: (settings: PokerSettings) => void;
  readonly resume: (save: PokerSave) => void;
  readonly act: (action: PokerAction) => void;
  readonly next: () => void;
  readonly saveNow: () => void;
}

export function usePoker(active: boolean): PokerGameApi {
  const [table, setTable] = useState<HandState | null>(null);
  const [cast, setCast] = useState<readonly PokerCharacterId[]>([]);
  const [settings, setSettings] = useState<PokerSettings>(DEFAULT_SETTINGS);
  const [busted, setBusted] = useState<readonly number[]>([]);
  const [thinking, setThinking] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const seed = useRef(freshSeed());
  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const recorded = useRef(false);

  useEffect(() => {
    let worker: Worker | null = null;
    try {
      worker = new Worker(new URL('../engine/worker.ts', import.meta.url), { type: 'module' });
    } catch {
      worker = null;
    }
    workerRef.current = worker;
    return () => { worker?.terminate(); workerRef.current = null; };
  }, []);

  // [EN] Who went out in this hand joins the list of the busted (the order gives the places).
  // [RU] Кто вылетел в этой раздаче, добавляется в список выбывших (порядок даёт места).
  useEffect(() => {
    if (!table || table.phase !== 'done') return;
    const gone = table.seats.flatMap((seat, index) => (seat.stack <= 0 && !seat.out && !busted.includes(index) ? [index] : []));
    if (gone.length > 0) setBusted(current => [...current, ...gone]);
  }, [table, busted]);

  const over = useMemo(() => {
    if (!table || table.phase !== 'done') return null;
    const players = table.seats.length;
    const left = table.seats.filter(seat => seat.stack > 0).length;
    const youOut = table.seats[HUMAN_SEAT].stack <= 0;
    if (!youOut && left > 1) return null;
    const winner = table.seats.findIndex(seat => seat.stack > 0);
    return { place: youOut ? left + 1 : 1, players, winner };
  }, [table]);

  // [EN] The tournament result goes into the history once. [RU] Итог турнира попадает в историю один раз.
  useEffect(() => {
    if (!over || !table || recorded.current) return;
    recorded.current = true;
    addGameResult<PokerResultSummary>(POKER_SAVE_ID, { place: over.place, players: over.players, hands: table.handNumber, winner: over.winner === HUMAN_SEAT ? 'you' : cast[over.winner - 1] });
  }, [over, table, cast]);

  const snapshot = useCallback((): PokerSave | null => (table ? { settings, table, cast, seed: seed.current, busted } : null), [table, settings, cast, busted]);
  const saveNow = useCallback(() => {
    const data = snapshot();
    if (data && saveGame(POKER_SAVE_ID, POKER_SAVE_VERSION, data)) setSavedAt(Date.now());
  }, [snapshot]);
  // Saved after every change and when the page hides.
  useEffect(() => { saveNow(); }, [saveNow]);
  useEffect(() => {
    const flush = () => { if (document.visibilityState !== 'visible') saveNow(); };
    window.addEventListener('pagehide', saveNow);
    document.addEventListener('visibilitychange', flush);
    return () => { window.removeEventListener('pagehide', saveNow); document.removeEventListener('visibilitychange', flush); };
  }, [saveNow]);

  const askBot = useCallback((state: HandState): Promise<PokerAction> => {
    requestId.current += 1;
    const id = requestId.current;
    const seat = state.turn ?? 1;
    const who = characterOf(cast[seat - 1] ?? 'vlad');
    const strength = STRENGTH[settings.strength];
    const request: PokerBotRequest = { id, state, seed: (seed.current + id * 7919) >>> 0, samples: strength.samples, noise: strength.noise, style: who.style };
    const worker = workerRef.current;
    if (!worker) {
      return import('../engine/worker.ts').then(({ answerPokerRequest }) => {
        const response = answerPokerRequest({ ...request, samples: 120 });
        if ('action' in response) return response.action;
        throw new Error(response.error);
      });
    }
    return new Promise((resolve, reject) => {
      const onMessage = (event: MessageEvent<PokerBotResponse>) => {
        if (event.data.id !== id) return;
        worker.removeEventListener('message', onMessage);
        if ('action' in event.data) resolve(event.data.action);
        else reject(new Error(event.data.error));
      };
      worker.addEventListener('message', onMessage);
      worker.postMessage(request);
    });
  }, [cast, settings.strength]);

  // [EN] A bot on turn thinks for a human moment (shorter once you have folded), then acts.
  // [RU] Бот, чей ход, думает человеческое мгновение (короче, когда вы уже сбросили), потом ходит.
  useEffect(() => {
    if (!active || !table || table.phase !== 'betting' || table.turn === null || table.turn === HUMAN_SEAT) return undefined;
    let cancelled = false;
    setThinking(true);
    const youIn = !table.seats[HUMAN_SEAT].folded && !table.seats[HUMAN_SEAT].out;
    const pause = (youIn ? 650 : 280) + Math.floor(Math.random() * (youIn ? 650 : 220));
    const started = Date.now();
    const state = table;
    askBot(state).then(action => {
      const wait = Math.max(0, pause - (Date.now() - started));
      window.setTimeout(() => {
        if (cancelled) return;
        setThinking(false);
        setTable(current => (current === state ? applyAction(state, action) : current));
      }, wait);
    }).catch(() => {
      if (cancelled) return;
      // [EN] A bot error never stops the game: the bot checks or folds. [RU] Ошибка бота не останавливает игру: бот чекает или сбрасывает.
      setThinking(false);
      setTable(current => {
        if (current !== state || state.turn === null) return current;
        const seat = state.turn;
        try { return applyAction(state, { type: 'check', seat }); } catch { return applyAction(state, { type: 'fold', seat }); }
      });
    });
    return () => { cancelled = true; setThinking(false); };
  }, [active, table, askBot]);

  const start = useCallback((next: PokerSettings) => {
    seed.current = freshSeed();
    const random = createRandom(seed.current);
    const players = Math.max(1, Math.min(5, next.opponents)) + 1;
    setSettings(next);
    setCast(pickCompany(players - 1, random));
    setBusted([]);
    recorded.current = false;
    setTable(newTable(players, handRandom(seed.current, 0), { rules: rulesFor(next), button: Math.floor(random() * players) }));
  }, []);

  const resume = useCallback((save: PokerSave) => {
    seed.current = save.seed;
    setSettings(save.settings);
    setCast(save.cast);
    setBusted(save.busted ?? []);
    recorded.current = false;
    setTable(save.table);
  }, []);

  const act = useCallback((action: PokerAction) => {
    setTable(current => {
      if (!current || current.turn !== HUMAN_SEAT || action.seat !== HUMAN_SEAT) return current;
      try { return applyAction(current, action); } catch { return current; }
    });
  }, []);

  const next = useCallback(() => {
    setTable(current => {
      if (!current || current.phase !== 'done' || current.seats[HUMAN_SEAT].stack <= 0) return current;
      return nextHand(current, handRandom(seed.current, current.handNumber)) ?? current;
    });
  }, []);

  return { table, cast, settings, thinking, over, savedAt, start, resume, act, next, saveNow };
}

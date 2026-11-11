// [EN] FILE: games/battleship/hooks/useBattleship.ts — one sea battle from the menu to the last shot: the settings of
//      the table, the opponent (a hero of the lair, shared by all the games), setting out your fleet, the battle
//      itself with the computer gunner answering after a short pause, the save after every change and the result.
//      The engine is pure (engine/*.ts); this hook only keeps its state in React and in the browser's storage.
// [RU] ФАЙЛ: один морской бой от меню до последнего выстрела: настройки стола, соперник (герой логова, общий для
//      всех игр), расстановка вашего флота, сам бой с компьютерным наводчиком, который отвечает после короткой
//      паузы, сохранение после каждого изменения и итог. Движок чистый (engine/*.ts); этот хук только держит его
//      состояние в React и в хранилище браузера.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CHARACTER_IDS, SEA_FOLK, isCharacterId, type CharacterId } from '@shared/characters/roster';
import { addGameResult, clearGameSave, loadGame, saveGame } from '@shared/utils/storageEngine';
import {
    RULE_SETS, accuracy, afloat, cellsOfPlacement, chooseShot, createRandom, customizeRules, fire, isFleetLegal, newBattle, otherSeat, placementProblem,
    randomFleet, shipsToPlace,
    type BattleRules, type BattleState, type GunnerLevel, type Placement, type PlacementProblem, type RulesId, type Seat, type Ship,
} from '../engine/index.ts';

export const BATTLE_SAVE_ID = 'battleship';
export const BATTLE_SAVE_VERSION = 1;
export const YOU: Seat = 0;
export const OPPONENT: Seat = 1;
export type OpponentId = Exclude<CharacterId, 'dummy'>;
export type FirstMove = 'you' | 'opponent' | 'random';

export interface BattleSettings {
    readonly rules: RulesId;
    readonly touching: boolean;
    readonly shootAgain: boolean;
    readonly level: GunnerLevel;
    readonly first: FirstMove;
}
export const DEFAULT_SETTINGS: BattleSettings = Object.freeze({ rules: 'classic', touching: false, shootAgain: true, level: 'normal', first: 'you' });
export const rulesOf = (settings: BattleSettings): BattleRules => customizeRules(RULE_SETS[settings.rules], { touching: settings.touching, shootAgain: settings.shootAgain });

export type Stage = 'idle' | 'placing' | 'battle';

export interface BattleSave {
    readonly settings: BattleSettings;
    readonly opponent: OpponentId;
    readonly stage: 'placing' | 'battle';
    /** Your ships while you set them out. */
    readonly fleet: readonly Ship[];
    readonly battle: BattleState | null;
    readonly seed: number;
}
export interface BattleResultSummary { readonly won: boolean; readonly shots: number; readonly hits: number; readonly opponent: OpponentId; readonly rules: RulesId; readonly level: GunnerLevel }

const freshSeed = (): number => (Math.floor(Math.random() * 0x7fffffff) ^ Date.now()) >>> 0;
/** [EN] How often the opponent of a sea battle comes from the sea folk (the pirates and Captain Galleon). [RU] Как часто соперник морского боя приходит из морского народа (пираты и Капитан Галеон). */
export const SEA_FOLK_SHARE = 0.5;

/**
 * [EN] Somebody of the lair at random, not the one who sat here before. Every second battle is fought against the sea
 *      folk: the pirates came to the lair for this game, and among 95 heroes they would be met too seldom.
 * [RU] Кто-то из логова наугад, но не тот, кто сидел здесь только что. Каждый второй бой — против морского народа:
 *      пираты пришли в логово ради этой игры, а среди 95 героев встречались бы слишком редко.
 */
export function pickOpponent(previous: OpponentId | null = null, random: () => number = Math.random): OpponentId {
    const pool = random() < SEA_FOLK_SHARE ? SEA_FOLK : CHARACTER_IDS;
    const others = pool.filter(id => id !== previous);
    return others[Math.floor(random() * others.length)] ?? CHARACTER_IDS[0];
}

/** [EN] A save from an older build or another device is checked before it is trusted. [RU] Сохранение из старой сборки или с другого устройства проверяется, прежде чем ему верить. */
function validSave(data: BattleSave | null | undefined): data is BattleSave {
    if (!data || !data.settings || !RULE_SETS[data.settings.rules] || !isCharacterId(data.opponent) || !Array.isArray(data.fleet)) return false;
    if (data.stage === 'battle') return Boolean(data.battle && Array.isArray(data.battle.sides) && data.battle.sides.length === 2 && Array.isArray(data.battle.log));
    return data.stage === 'placing';
}

export function loadBattleSave(): { readonly save: BattleSave; readonly timestamp: number } | null {
    const stored = loadGame<BattleSave>(BATTLE_SAVE_ID, BATTLE_SAVE_VERSION);
    return stored && validSave(stored.data) ? { save: stored.data, timestamp: stored.timestamp } : null;
}

/** [EN] How long the opponent «aims» before a shot, in milliseconds. [RU] Сколько соперник «целится» перед выстрелом, в миллисекундах. */
const AIM_MS = 750;

export interface BattleshipApi {
    readonly settings: BattleSettings;
    readonly opponent: OpponentId;
    readonly stage: Stage;
    readonly rules: BattleRules;
    /** Your ships while you set them out. */
    readonly fleet: readonly Ship[];
    /** Ship lengths not on the sea yet. */
    readonly toPlace: readonly number[];
    readonly battle: BattleState | null;
    /** The opponent is aiming. */
    readonly thinking: boolean;
    readonly savedAt: number | null;
    readonly begin: (settings: BattleSettings, opponent: OpponentId) => void;
    readonly resume: (save: BattleSave) => void;
    readonly place: (placement: Placement) => PlacementProblem | null;
    /** Takes the ship that covers `cell` off the sea and returns it. */
    readonly lift: (cell: number) => Ship | null;
    readonly randomize: () => void;
    readonly clear: () => void;
    readonly startBattle: () => void;
    readonly shoot: (cell: number) => void;
    readonly saveNow: () => void;
}

export function useBattleship(active: boolean): BattleshipApi {
    const [settings, setSettings] = useState<BattleSettings>(DEFAULT_SETTINGS);
    const [opponent, setOpponent] = useState<OpponentId>(() => pickOpponent());
    const [stage, setStage] = useState<Stage>('idle');
    const [fleet, setFleet] = useState<readonly Ship[]>([]);
    const [battle, setBattle] = useState<BattleState | null>(null);
    const [seed, setSeed] = useState<number>(freshSeed);
    const [thinking, setThinking] = useState(false);
    const [savedAt, setSavedAt] = useState<number | null>(null);
    const rules = useMemo(() => rulesOf(settings), [settings]);
    const toPlace = useMemo(() => shipsToPlace(fleet, rules), [fleet, rules]);
    const reported = useRef(false);

    const begin = useCallback((next: BattleSettings, who: OpponentId) => {
        const nextSeed = freshSeed();
        setSettings(next);
        setOpponent(who);
        setSeed(nextSeed);
        // [EN] A fleet set out at random waits on the sea: «To battle!» works at once, and any ship can be moved.
        // [RU] Случайно расставленный флот уже ждёт на море: «В бой!» работает сразу, а любой корабль можно переставить.
        setFleet(randomFleet(rulesOf(next), createRandom(nextSeed ^ 0x5ea)));
        setBattle(null);
        setStage('placing');
        reported.current = false;
    }, []);

    const resume = useCallback((save: BattleSave) => {
        setSettings(save.settings);
        setOpponent(save.opponent);
        setSeed(save.seed);
        setFleet(save.fleet);
        setBattle(save.battle);
        setStage(save.stage);
        reported.current = false;
    }, []);

    const place = useCallback((placement: Placement): PlacementProblem | null => {
        const problem = placementProblem(fleet, placement, rules);
        if (problem !== null) return problem;
        if (!shipsToPlace(fleet, rules).includes(placement.length)) return 'overlap';
        setFleet([...fleet, { cells: cellsOfPlacement(placement, rules.size) as number[] }]);
        return null;
    }, [fleet, rules]);

    const lift = useCallback((cell: number): Ship | null => {
        const ship = fleet.find(candidate => candidate.cells.includes(cell)) ?? null;
        if (ship) setFleet(fleet.filter(candidate => candidate !== ship));
        return ship;
    }, [fleet]);

    const randomize = useCallback(() => setFleet(randomFleet(rules, createRandom(freshSeed()))), [rules]);
    const clear = useCallback(() => setFleet([]), []);

    const startBattle = useCallback(() => {
        if (!isFleetLegal(fleet, rules)) return;
        const random = createRandom(seed);
        const theirs = randomFleet(rules, random, settings.level === 'hard' ? 'tucked' : 'scattered');
        const first: Seat = settings.first === 'you' ? YOU : settings.first === 'opponent' ? OPPONENT : random() < 0.5 ? YOU : OPPONENT;
        setBattle(newBattle(rules, fleet, theirs, first));
        setStage('battle');
    }, [fleet, rules, seed, settings.first, settings.level]);

    const shoot = useCallback((cell: number) => {
        setBattle(current => {
            if (!current || current.winner !== null || current.turn !== YOU) return current;
            try {
                return fire(current, cell);
            } catch {
                return current; // [EN] a cell that may not be shot at: nothing happens / [RU] клетка, в которую нельзя стрелять: ничего не происходит
            }
        });
    }, []);

    // [EN] The opponent's shot: after a pause, so the eye follows every shot of a series.
    // [RU] Выстрел соперника: после паузы, чтобы глаз успевал за каждым выстрелом серии.
    useEffect(() => {
        if (!active || stage !== 'battle' || !battle || battle.winner !== null || battle.turn !== OPPONENT) { setThinking(false); return; }
        setThinking(true);
        const timer = window.setTimeout(() => {
            setBattle(current => {
                if (!current || current.winner !== null || current.turn !== OPPONENT) return current;
                const target = current.sides[otherSeat(OPPONENT)];
                const random = createRandom((seed + current.log.length * 7919) >>> 0);
                return fire(current, chooseShot(target.marks, current.rules, afloat(target), random, settings.level));
            });
        }, AIM_MS);
        return () => window.clearTimeout(timer);
    }, [active, stage, battle, seed, settings.level]);

    const snapshot = useCallback((): BattleSave | null => {
        if (stage === 'idle') return null;
        return { settings, opponent, stage, fleet, battle, seed };
    }, [settings, opponent, stage, fleet, battle, seed]);

    const saveNow = useCallback(() => {
        const save = snapshot();
        if (!save) return;
        // [EN] A finished battle has nothing to continue: its save is removed. [RU] У законченного боя нечего продолжать: его сохранение убирается.
        if (save.battle && save.battle.winner !== null) { clearGameSave(BATTLE_SAVE_ID); return; }
        if (saveGame(BATTLE_SAVE_ID, BATTLE_SAVE_VERSION, save)) setSavedAt(Date.now());
    }, [snapshot]);

    // [EN] Saved after every change, and once more when the page is hidden or closed. [RU] Сохраняется после каждого изменения и ещё раз, когда страницу прячут или закрывают.
    useEffect(() => { saveNow(); }, [saveNow]);
    useEffect(() => {
        const onHide = () => saveNow();
        window.addEventListener('pagehide', onHide);
        document.addEventListener('visibilitychange', onHide);
        return () => { window.removeEventListener('pagehide', onHide); document.removeEventListener('visibilitychange', onHide); };
    }, [saveNow]);

    // [EN] The result goes to the history once per battle. [RU] Итог попадает в историю один раз за бой.
    useEffect(() => {
        if (!battle || battle.winner === null || reported.current) return;
        reported.current = true;
        const { shots, hits } = accuracy(battle, YOU);
        addGameResult<BattleResultSummary>(BATTLE_SAVE_ID, { won: battle.winner === YOU, shots, hits, opponent, rules: settings.rules, level: settings.level });
    }, [battle, opponent, settings.level, settings.rules]);

    return { settings, opponent, stage, rules, fleet, toPlace, battle, thinking, savedAt, begin, resume, place, lift, randomize, clear, startBattle, shoot, saveNow };
}

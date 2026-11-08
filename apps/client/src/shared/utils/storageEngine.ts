// [EN] FILE: shared/utils/storageEngine.ts — saved games and results on this device, for every game of the hub.
//      People play on the bus and on the way: a game is saved after every move and continues from the same
//      place. One key per game ("cosmo-game-hub:<game>:save") — all sites on dubnovalexey.github.io share one
//      browser storage, so the prefix keeps games apart. A schema version per game: a save from an older
//      version is ignored instead of breaking the new code. Storage can be missing or full (private mode):
//      every call is safe and simply reports false / null.
// [RU] ФАЙЛ: сохранённые партии и результаты на этом устройстве — для всех игр хаба. Играют в автобусе и в
//      дороге: партия сохраняется после каждого хода и продолжается с того же места. Один ключ на игру
//      («cosmo-game-hub:<игра>:save») — все сайты на dubnovalexey.github.io делят одно хранилище браузера,
//      префикс разводит игры. Номер схемы на игру: сохранение старой версии пропускается, а не ломает новый код.
//      Хранилища может не быть или оно переполнено (приватный режим): каждый вызов безопасен и просто
//      возвращает false / null.

export interface GameSaveState<T = unknown> {
    readonly gameId: string;
    readonly version: number;
    readonly timestamp: number;
    readonly data: T;
}

export interface GameResult<T = unknown> {
    readonly timestamp: number;
    readonly summary: T;
}

const PREFIX = 'cosmo-game-hub';
const RESULTS_KEPT = 20;
const saveKey = (gameId: string): string => `${PREFIX}:${gameId}:save`;
const resultsKey = (gameId: string): string => `${PREFIX}:${gameId}:results`;

function storage(): Storage | null {
    try {
        return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
    } catch {
        return null; // [EN] access itself may throw / [RU] сам доступ может бросить ошибку
    }
}

function readJson(key: string): unknown {
    try {
        const text = storage()?.getItem(key);
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
}

function writeJson(key: string, value: unknown): boolean {
    try {
        const target = storage();
        if (!target) return false;
        target.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false; // [EN] quota exceeded or blocked / [RU] места нет или запись запрещена
    }
}

// BEGIN saves
/** [EN] Saves the current game. [RU] Сохраняет текущую партию. */
export function saveGame<T>(gameId: string, version: number, data: T): boolean {
    const state: GameSaveState<T> = { gameId, version, timestamp: Date.now(), data };
    return writeJson(saveKey(gameId), state);
}

/** [EN] The saved game of this version, or null. [RU] Сохранённая партия этой версии или null. */
export function loadGame<T>(gameId: string, version: number): GameSaveState<T> | null {
    const value = readJson(saveKey(gameId)) as GameSaveState<T> | null;
    if (!value || value.gameId !== gameId || value.version !== version || typeof value.timestamp !== 'number') return null;
    return value;
}

export function clearGameSave(gameId: string): void {
    try {
        storage()?.removeItem(saveKey(gameId));
    } catch {
        // [EN] nothing to clear / [RU] очищать нечего
    }
}
// END saves

// BEGIN results
/** [EN] Adds a finished game to the results (the newest first, the last 20 kept). [RU] Добавляет итог партии. */
export function addGameResult<T>(gameId: string, summary: T): boolean {
    const results = [{ timestamp: Date.now(), summary }, ...loadGameResults<T>(gameId)].slice(0, RESULTS_KEPT);
    return writeJson(resultsKey(gameId), results);
}

export function loadGameResults<T>(gameId: string): GameResult<T>[] {
    const value = readJson(resultsKey(gameId));
    return Array.isArray(value) ? (value as GameResult<T>[]).filter(entry => entry && typeof entry.timestamp === 'number') : [];
}
// END results

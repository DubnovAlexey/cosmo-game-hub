// =====================================================================
// FILE: apps/client/src/games/checkers/engine/worker.ts
// PURPOSE: the computer opponent of draughts thinks in a Web Worker, so the board never freezes while it looks
//   ahead (the hard level searches for up to a second). Protocol: the page posts { id, board, side, rules, level,
//   seed }, the worker answers { id, move } (or { id, error }). `answerCheckersRequest` is the pure part, also used
//   on the main thread when a browser cannot start a worker.
// [RU] Компьютерный соперник в шашках думает в фоновом потоке (Web Worker), чтобы доска не замирала, пока он
//   смотрит вперёд (сильный уровень ищет до секунды). Страница посылает { id, board, side, rules, level, seed },
//   поток отвечает { id, move } или { id, error }. `answerCheckersRequest` — чистая часть; ею же пользуется главный
//   поток, если браузер не может запустить фоновый.
// =====================================================================
import { chooseMove, type CheckersLevel } from './ai/search.ts';
import type { Move, Piece } from './board.ts';
import type { CheckersRules, Side } from './rules.ts';
// noinspection ES6PreferShortImport
import { createRandom } from '../../../shared/engine/random.ts';

export interface CheckersBotRequest {
  readonly id: number;
  readonly board: readonly Piece[];
  readonly side: Side;
  readonly rules: CheckersRules;
  readonly level: CheckersLevel;
  readonly seed: number;
  /** Overrides the time of the level (the main-thread fallback thinks shorter). */
  readonly timeMs?: number;
}
export type CheckersBotResponse = { readonly id: number; readonly move: Move } | { readonly id: number; readonly error: string };

export function answerCheckersRequest(request: CheckersBotRequest): CheckersBotResponse {
  try {
    const { move } = chooseMove(request.board, request.side, request.rules, createRandom(request.seed), request.level, request.timeMs);
    return { id: request.id, move };
  } catch (error) {
    return { id: request.id, error: error instanceof Error ? error.message : String(error) };
  }
}

// [EN] Only inside a real worker (not in Node tests, not on the main thread). [RU] Только внутри настоящего фонового потока.
interface WorkerScope { postMessage(message: CheckersBotResponse): void; onmessage: ((event: MessageEvent<CheckersBotRequest>) => void) | null }
const scope = globalThis as unknown as Partial<WorkerScope> & { document?: unknown };
if (typeof scope.postMessage === 'function' && scope.document === undefined && 'onmessage' in globalThis) {
  scope.onmessage = (event: MessageEvent<CheckersBotRequest>) => scope.postMessage?.(answerCheckersRequest(event.data));
}

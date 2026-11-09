// =====================================================================
// FILE: apps/client/src/games/preferans/engine/worker.ts
// PURPOSE: the bots think in a Web Worker, so the table never freezes while a bot samples and solves deals.
//   Protocol: the page posts { id, state, seed, samples, timeBudgetMs, style? }, the worker answers { id, action }
//   (or { id, error }). `answerBotRequest` is the pure part, also used as the main-thread fallback.
// =====================================================================
import { chooseAction, type BotStyle } from './ai/bot.ts';
import type { Action, DealState } from './deal.ts';
// [EN] A relative path on purpose: Node runs the engine directly in the tests and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает движок прямо в тестах и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import { createRandom } from '../../../shared/engine/random.ts';

export interface BotRequest {
  readonly id: number;
  readonly state: DealState;
  readonly seed: number;
  readonly samples: number;
  readonly timeBudgetMs: number;
  /** The character's manner at the table (bold bidder, eager whister…); absent = neutral. */
  readonly style?: BotStyle;
}
export type BotResponse = { readonly id: number; readonly action: Action } | { readonly id: number; readonly error: string };

// BEGIN answerBotRequest
export function answerBotRequest(request: BotRequest): BotResponse {
  try {
    const action = chooseAction(request.state, {
      random: createRandom(request.seed),
      samples: request.samples,
      timeBudgetMs: request.timeBudgetMs,
      style: request.style,
    });
    return { id: request.id, action };
  } catch (error) {
    return { id: request.id, error: error instanceof Error ? error.message : String(error) };
  }
}
// END answerBotRequest

// BEGIN worker glue: only inside a real worker (not in Node tests, not on the main thread)
interface WorkerScope { postMessage(message: BotResponse): void; onmessage: ((event: MessageEvent<BotRequest>) => void) | null }
const scope = globalThis as unknown as Partial<WorkerScope> & { document?: unknown };
if (typeof scope.postMessage === 'function' && scope.document === undefined && 'onmessage' in globalThis) {
  scope.onmessage = (event: MessageEvent<BotRequest>) => scope.postMessage?.(answerBotRequest(event.data));
}
// END worker glue

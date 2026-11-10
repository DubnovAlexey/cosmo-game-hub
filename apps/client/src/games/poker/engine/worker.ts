// =====================================================================
// FILE: apps/client/src/games/poker/engine/worker.ts
// PURPOSE: the poker bots think in a Web Worker, so the table never freezes while a bot deals out its Monte Carlo
//   samples. Protocol: the page posts { id, state, seed, samples, noise, style }, the worker answers { id, action }
//   (or { id, error }). `answerPokerRequest` is the pure part, also used as the main-thread fallback.
// =====================================================================
import { choosePokerAction, type PokerStyle } from './ai/bot.ts';
import type { HandState, PokerAction } from './holdem.ts';
// noinspection ES6PreferShortImport
import { createRandom } from '../../../shared/engine/random.ts';

export interface PokerBotRequest {
  readonly id: number;
  readonly state: HandState;
  readonly seed: number;
  readonly samples: number;
  readonly noise: number;
  readonly style?: PokerStyle;
}
export type PokerBotResponse = { readonly id: number; readonly action: PokerAction } | { readonly id: number; readonly error: string };

export function answerPokerRequest(request: PokerBotRequest): PokerBotResponse {
  try {
    const action = choosePokerAction(request.state, { random: createRandom(request.seed), samples: request.samples, noise: request.noise, style: request.style });
    return { id: request.id, action };
  } catch (error) {
    return { id: request.id, error: error instanceof Error ? error.message : String(error) };
  }
}

// Only inside a real worker (not in Node tests, not on the main thread).
interface WorkerScope { postMessage(message: PokerBotResponse): void; onmessage: ((event: MessageEvent<PokerBotRequest>) => void) | null }
const scope = globalThis as unknown as Partial<WorkerScope> & { document?: unknown };
if (typeof scope.postMessage === 'function' && scope.document === undefined && 'onmessage' in globalThis) {
  scope.onmessage = (event: MessageEvent<PokerBotRequest>) => scope.postMessage?.(answerPokerRequest(event.data));
}

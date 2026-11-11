// =====================================================================
// FILE: apps/client/src/games/checkers/engine/ai/search.ts
// PURPOSE: a computer opponent for draughts. It sees the same board as the person and nothing more. It looks ahead
//   with alpha-beta search (negamax), deepening the search step by step until its time is up, and goes on looking
//   through forced captures at the end of a line, so it does not stop in the middle of an exchange. A position is
//   judged by material (a king is worth several men, a flying king even more), how far the men have advanced, the
//   centre and the guard of the back row. Three levels:
//   - 'easy'   — two half-moves ahead and now and then a careless move;
//   - 'normal' — four half-moves ahead;
//   - 'hard'   — as deep as the time allows (up to twelve half-moves), with the best line of the last pass tried first.
// SECTIONS: 1 judging a position; 2 the search; 3 entry point.
// =====================================================================
import { applyMove, crownRow, isKing, legalMoves, rowOf, columnOf, sideOf, type Move, type Piece } from '../board.ts';
import { otherSide, type CheckersRules, type Side } from '../rules.ts';
// [EN] A relative path on purpose: Node runs the engine directly in the tests and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает движок прямо в тестах и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import type { Random } from '../../../../shared/engine/random.ts';

export type CheckersLevel = 'easy' | 'normal' | 'hard';
export const CHECKERS_LEVELS: readonly CheckersLevel[] = Object.freeze(['easy', 'normal', 'hard']);

const WIN = 100_000;
const MAN = 100;

// BEGIN 1. Judging a position
/** The worth of a position for `side`: positive is good for it. */
export function evaluate(board: readonly Piece[], side: Side, rules: CheckersRules): number {
  const size = rules.size;
  const king = rules.flyingKings ? 320 : 230;
  let score = 0;
  let pieces = 0;
  for (let square = 0; square < board.length; square += 1) {
    const piece = board[square];
    if (piece === 0) continue;
    pieces += 1;
    const owner = sideOf(piece) as Side;
    const sign = owner === side ? 1 : -1;
    const row = rowOf(square, size);
    const column = columnOf(square, size);
    let worth: number;
    if (isKing(piece)) {
      // [EN] A king likes the long diagonal and the centre. [RU] Дамка любит большую дорогу и центр.
      worth = king + (row === size - 1 - column ? 12 : 0) + (column > 1 && column < size - 2 ? 6 : 0);
    } else {
      const advanced = owner === 'white' ? size - 1 - row : row;
      worth = MAN + advanced * 4 + (column > 1 && column < size - 2 && row > 1 && row < size - 2 ? 5 : 0);
      // [EN] Men on the own back row keep the enemy from being crowned, while there are many pieces about.
      // [RU] Шашки на своём последнем ряду не пускают чужие в дамки, пока фигур много.
      if (row === crownRow(otherSide(owner), size) && pieces < 30) worth += 6;
    }
    score += sign * worth;
  }
  return score;
}
// END 1

// BEGIN 2. The search
interface SearchContext {
  readonly rules: CheckersRules;
  readonly deadline: number;
  nodes: number;
  stopped: boolean;
}

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Captures first, the longest first; then moves that crown. */
function ordered(moves: Move[], first: Move | null): Move[] {
  const score = (move: Move) => (first && move === first ? 1000 : 0) + move.captured.length * 10 + (move.crowns ? 5 : 0);
  return [...moves].sort((a, b) => score(b) - score(a));
}

function negamax(board: readonly Piece[], side: Side, depth: number, alpha: number, beta: number, ply: number, context: SearchContext): number {
  context.nodes += 1;
  if ((context.nodes & 1023) === 0 && now() > context.deadline) context.stopped = true;
  if (context.stopped) return 0;
  const moves = legalMoves(board, side, context.rules);
  if (moves.length === 0) return -WIN + ply; // [EN] no move — a loss, the sooner the worse / [RU] хода нет — проигрыш, чем раньше, тем хуже
  const forced = moves[0].captured.length > 0;
  // [EN] At the end of a line only forced captures are looked through further. [RU] В конце линии дальше смотрим только вынужденные взятия.
  if (depth <= 0 && (!forced || depth <= -6)) return evaluate(board, side, context.rules);
  let best = -Infinity;
  for (const move of ordered(moves, null)) {
    const score = -negamax(applyMove(board, move), otherSide(side), depth - 1, -beta, -alpha, ply + 1, context);
    if (context.stopped) return 0;
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

/** The best move at a fixed depth (or null if the time ran out during the pass). */
function bestAtDepth(board: readonly Piece[], side: Side, moves: Move[], depth: number, first: Move | null, context: SearchContext): { move: Move; score: number; scores: Map<Move, number> } | null {
  let alpha = -Infinity;
  let bestMove: Move | null = null;
  const scores = new Map<Move, number>();
  for (const move of ordered(moves, first)) {
    const score = -negamax(applyMove(board, move), otherSide(side), depth - 1, -Infinity, -alpha, 1, context);
    if (context.stopped) return null;
    scores.set(move, score);
    if (score > alpha || bestMove === null) { alpha = score; bestMove = move; }
  }
  return bestMove ? { move: bestMove, score: alpha, scores } : null;
}
// END 2

// BEGIN 3. Entry point
export interface SearchResult {
  readonly move: Move;
  readonly score: number;
  readonly depth: number;
  readonly nodes: number;
}

const LIMITS: Readonly<Record<CheckersLevel, { depth: number; ms: number }>> = Object.freeze({
  easy: { depth: 2, ms: 150 },
  normal: { depth: 4, ms: 400 },
  hard: { depth: 12, ms: 900 },
});

/**
 * The move of the computer for `side`. `timeMs` overrides the time of the level (a slow phone, the tests). The easy
 * gunner of the board now and then picks a random move among those that do not lose material at once.
 */
export function chooseMove(board: readonly Piece[], side: Side, rules: CheckersRules, random: Random, level: CheckersLevel, timeMs?: number): SearchResult {
  const moves = legalMoves(board, side, rules);
  if (moves.length === 0) throw new Error('no legal move');
  if (moves.length === 1) return { move: moves[0], score: 0, depth: 0, nodes: 0 };
  const limit = LIMITS[level];
  const context: SearchContext = { rules, deadline: now() + (timeMs ?? limit.ms), nodes: 0, stopped: false };
  let result: { move: Move; score: number; scores: Map<Move, number> } | null = null;
  let reached = 0;
  for (let depth = 1; depth <= limit.depth; depth += 1) {
    const pass = bestAtDepth(board, side, moves, depth, result?.move ?? null, context);
    if (!pass) break;
    result = pass;
    reached = depth;
    if (Math.abs(pass.score) > WIN / 2) break; // [EN] a forced win or loss is found / [RU] найден вынужденный выигрыш или проигрыш
  }
  if (!result) result = { move: moves[0], score: 0, scores: new Map() };
  if (level === 'easy' && random() < 0.35) {
    // [EN] A careless move: any move that is not much worse than the best. [RU] Небрежный ход: любой, что ненамного хуже лучшего.
    const fair = [...result.scores.entries()].filter(([, score]) => score > result.score - 60).map(([move]) => move);
    if (fair.length > 0) return { move: fair[Math.floor(random() * fair.length)], score: result.score, depth: reached, nodes: context.nodes };
  }
  return { move: result.move, score: result.score, depth: reached, nodes: context.nodes };
}
// END 3

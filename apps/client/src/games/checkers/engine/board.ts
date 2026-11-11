// =====================================================================
// FILE: apps/client/src/games/checkers/engine/board.ts
// PURPOSE: the board, the legal moves and a whole game of draughts. A square is a number row × size + column, row 0
//   at the top (black's side), so white moves up and black moves down. Only the dark squares — (row + column) odd —
//   are used. A piece is a number: 1 a white man, 2 a white king, −1 a black man, −2 a black king, 0 an empty square.
//   A move is the square it starts from, the squares it lands on one after another and the squares of the pieces it
//   captures; a quiet move lands once and captures nothing. The state of a game is plain JSON and is never changed:
//   `play` returns a new one, so saving, undoing and the search of the computer cost nothing.
// SECTIONS: 1 squares and pieces; 2 the start; 3 moves; 4 a game.
// =====================================================================
import { otherSide, type CheckersRules, type Side } from './rules.ts';

// BEGIN 1. Squares and pieces
export type Piece = -2 | -1 | 0 | 1 | 2;
export const EMPTY = 0;
export const WHITE_MAN = 1;
export const WHITE_KING = 2;
export const BLACK_MAN = -1;
export const BLACK_KING = -2;

export const rowOf = (square: number, size: number): number => Math.floor(square / size);
export const columnOf = (square: number, size: number): number => square % size;
export const squareAt = (row: number, column: number, size: number): number => row * size + column;
export const isDark = (square: number, size: number): boolean => (rowOf(square, size) + columnOf(square, size)) % 2 === 1;
export const sideOf = (piece: number): Side | null => (piece > 0 ? 'white' : piece < 0 ? 'black' : null);
export const isKing = (piece: number): boolean => Math.abs(piece) === 2;
const kingOf = (side: Side): Piece => (side === 'white' ? WHITE_KING : BLACK_KING);
/** The row a man of this side is crowned on. */
export const crownRow = (side: Side, size: number): number => (side === 'white' ? 0 : size - 1);
/** One step forward for a man of this side, in rows. */
const forward = (side: Side): number => (side === 'white' ? -1 : 1);
// END 1

// BEGIN 2. The start
/** Twelve men a side on the dark squares of the three nearest rows. */
export function startBoard(rules: CheckersRules): Piece[] {
  const { size, rows } = rules;
  return Array.from({ length: size * size }, (_, square): Piece => {
    if (!isDark(square, size)) return EMPTY;
    const row = rowOf(square, size);
    if (row < rows) return BLACK_MAN;
    if (row >= size - rows) return WHITE_MAN;
    return EMPTY;
  });
}
// END 2

// BEGIN 3. Moves
export interface Move {
  readonly from: number;
  /** The squares the piece lands on, one after another; the last one is where it stays. */
  readonly path: readonly number[];
  /** The squares of the captured pieces, in the order they were jumped. */
  readonly captured: readonly number[];
  /** The man becomes a king during this move. */
  readonly crowns: boolean;
}

const DIRECTIONS: readonly (readonly [number, number])[] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

/** The square a step away in a direction, or −1 off the board. */
function step(square: number, dr: number, dc: number, distance: number, size: number): number {
  const row = rowOf(square, size) + dr * distance;
  const column = columnOf(square, size) + dc * distance;
  return row < 0 || row >= size || column < 0 || column >= size ? -1 : squareAt(row, column, size);
}

/**
 * Every capturing line of the piece on `from`, each followed to its end: a capture series may not stop while another
 * capture is possible. Captured pieces stay on the board until the move ends — they block the way and are not jumped
 * twice.
 */
function captureLines(board: readonly Piece[], from: number, rules: CheckersRules): Move[] {
  const piece = board[from];
  const side = sideOf(piece) as Side;
  const size = rules.size;
  const lines: Move[] = [];
  const occupied = (square: number) => square !== from && board[square] !== EMPTY;
  const enemy = (square: number) => square !== from && sideOf(board[square]) === otherSide(side);

  function grow(at: number, king: boolean, path: number[], captured: number[], crowned: boolean): void {
    const jumps: { landing: number; victim: number }[] = [];
    for (const [dr, dc] of DIRECTIONS) {
      if (!king && !rules.menCaptureBackward && dr !== forward(side)) continue;
      if (king && rules.flyingKings) {
        // [EN] Fly over empty squares to the first piece; an enemy not yet captured can be jumped onto any free square behind.
        // [RU] Летим по пустым полям до первой фигуры; ещё не битую чужую можно перепрыгнуть на любое свободное поле за ней.
        let distance = 1;
        let square = step(at, dr, dc, distance, size);
        while (square >= 0 && !occupied(square)) square = step(at, dr, dc, ++distance, size);
        if (square < 0 || !enemy(square) || captured.includes(square)) continue;
        for (let beyond = distance + 1; ; beyond += 1) {
          const landing = step(at, dr, dc, beyond, size);
          if (landing < 0 || occupied(landing)) break;
          jumps.push({ landing, victim: square });
        }
      } else {
        const victim = step(at, dr, dc, 1, size);
        const landing = step(at, dr, dc, 2, size);
        if (victim < 0 || landing < 0 || !enemy(victim) || captured.includes(victim) || occupied(landing)) continue;
        jumps.push({ landing, victim });
      }
    }
    if (jumps.length === 0) {
      if (captured.length > 0) lines.push({ from, path: [...path], captured: [...captured], crowns: crowned });
      return;
    }
    // [EN] A flying king that can go on capturing from some of its landing squares must land on one of those.
    // [RU] Летающая дамка, которая с части полей приземления может бить дальше, обязана встать на одно из них.
    const goesOn = (jump: { landing: number; victim: number }, asKing: boolean) => {
      const before = lines.length;
      grow(jump.landing, asKing, [...path, jump.landing], [...captured, jump.victim], crowned || (asKing && !king));
      return lines.length > before;
    };
    const byVictim = new Map<number, { landing: number; victim: number }[]>();
    for (const jump of jumps) byVictim.set(jump.victim, [...(byVictim.get(jump.victim) ?? []), jump]);
    for (const group of byVictim.values()) {
      if (king && rules.flyingKings && group.length > 1) {
        const continuing = group.filter(jump => canCaptureFrom(jump.landing, [...captured, jump.victim]));
        for (const jump of continuing.length > 0 ? continuing : group) goesOn(jump, true);
        continue;
      }
      for (const jump of group) {
        const reachesCrown = !king && rowOf(jump.landing, size) === crownRow(side, size);
        if (reachesCrown && !rules.promotionContinues) {
          lines.push({ from, path: [...path, jump.landing], captured: [...captured, jump.victim], crowns: true });
          continue;
        }
        goesOn(jump, king || reachesCrown);
      }
    }

    /** Whether a flying king standing on `square` could capture again (with these pieces already captured). */
    function canCaptureFrom(square: number, taken: readonly number[]): boolean {
      for (const [dr, dc] of DIRECTIONS) {
        let distance = 1;
        let next = step(square, dr, dc, distance, size);
        while (next >= 0 && !occupied(next)) next = step(square, dr, dc, ++distance, size);
        if (next < 0 || !enemy(next) || taken.includes(next)) continue;
        const landing = step(square, dr, dc, distance + 1, size);
        if (landing >= 0 && !occupied(landing)) return true;
      }
      return false;
    }
  }

  grow(from, isKing(piece), [], [], false);
  return lines;
}

/** The quiet moves of the piece on `from` (no capture). */
function quietMoves(board: readonly Piece[], from: number, rules: CheckersRules): Move[] {
  const piece = board[from];
  const side = sideOf(piece) as Side;
  const size = rules.size;
  const moves: Move[] = [];
  for (const [dr, dc] of DIRECTIONS) {
    if (!isKing(piece) && dr !== forward(side)) continue;
    const reach = isKing(piece) && rules.flyingKings ? size : 1;
    for (let distance = 1; distance <= reach; distance += 1) {
      const to = step(from, dr, dc, distance, size);
      if (to < 0 || board[to] !== EMPTY) break;
      moves.push({ from, path: [to], captured: [], crowns: !isKing(piece) && rowOf(to, size) === crownRow(side, size) });
    }
  }
  return moves;
}

/** All the legal moves of a side: capturing is compulsory, so if any capture exists only captures are legal. */
export function legalMoves(board: readonly Piece[], side: Side, rules: CheckersRules): Move[] {
  const captures: Move[] = [];
  const quiet: Move[] = [];
  for (let square = 0; square < board.length; square += 1) {
    if (sideOf(board[square]) !== side) continue;
    captures.push(...captureLines(board, square, rules));
    if (captures.length === 0) quiet.push(...quietMoves(board, square, rules));
  }
  return captures.length > 0 ? captures : quiet;
}

/** The board after a move: the piece moves to its last landing square, the captured pieces leave the board. */
export function applyMove(board: readonly Piece[], move: Move): Piece[] {
  const next = [...board];
  const piece = next[move.from];
  const side = sideOf(piece) as Side;
  next[move.from] = EMPTY;
  for (const square of move.captured) next[square] = EMPTY;
  next[move.path[move.path.length - 1]] = move.crowns ? kingOf(side) : piece;
  return next;
}

export const sameMove = (a: Move, b: Move): boolean =>
  a.from === b.from && a.path.length === b.path.length && a.path.every((square, index) => square === b.path[index]) && a.captured.every((square, index) => square === b.captured[index]);

/** The name of a square in the usual notation: columns a…h from white's left, rows 1…8 from white's side. */
export const squareName = (square: number, size: number): string => `${'abcdefghijkl'[columnOf(square, size)]}${size - rowOf(square, size)}`;

/** A move in the usual notation: «c3-d4» for a quiet move, «c3:e5:g3» for a capture. */
export const moveText = (move: Move, size: number): string =>
  [move.from, ...move.path].map(square => squareName(square, size)).join(move.captured.length > 0 ? ':' : '-');
// END 3

// BEGIN 4. A game
export type Outcome = Side | 'draw' | null;
export type DrawReason = 'quiet' | 'repetition' | null;

export interface MoveRecord {
  readonly side: Side;
  readonly move: Move;
}

export interface CheckersState {
  readonly rules: CheckersRules;
  /** The position the game began from (the usual start, or a set-up one): taking moves back replays from it. */
  readonly origin: { readonly board: readonly Piece[]; readonly turn: Side };
  readonly board: readonly Piece[];
  readonly turn: Side;
  readonly winner: Outcome;
  readonly drawReason: DrawReason;
  /** The side that gave the game up, if it ended so. */
  readonly resigned: Side | null;
  /** Half-moves since the last capture or move of a man. */
  readonly quiet: number;
  /** How many times each position (board + side to move) has occurred. */
  readonly seen: Readonly<Record<string, number>>;
  readonly log: readonly MoveRecord[];
}

const positionKey = (board: readonly Piece[], turn: Side): string => `${turn[0]}${board.map(piece => piece + 2).join('')}`;

export function newGame(rules: CheckersRules, board: readonly Piece[] = startBoard(rules), turn: Side = rules.firstMover): CheckersState {
  const state: CheckersState = {
    rules, origin: { board, turn }, board, turn, winner: null, drawReason: null, resigned: null, quiet: 0, seen: { [positionKey(board, turn)]: 1 }, log: [],
  };
  return legalMoves(board, turn, rules).length === 0 ? { ...state, winner: otherSide(turn) } : state;
}

export const movesOf = (state: CheckersState): Move[] => (state.winner !== null ? [] : legalMoves(state.board, state.turn, state.rules));

/** The game after a legal move of the side to move. Throws on an illegal move. */
export function play(state: CheckersState, move: Move): CheckersState {
  if (state.winner !== null) throw new Error('the game is over');
  const legal = legalMoves(state.board, state.turn, state.rules).find(candidate => sameMove(candidate, move));
  if (!legal) throw new Error('an illegal move');
  const board = applyMove(state.board, legal);
  const turn = otherSide(state.turn);
  const manMoved = !isKing(state.board[legal.from]);
  const quiet = legal.captured.length > 0 || manMoved ? 0 : state.quiet + 1;
  const key = positionKey(board, turn);
  const seen = { ...state.seen, [key]: (state.seen[key] ?? 0) + 1 };
  const log = [...state.log, { side: state.turn, move: legal }];
  let winner: Outcome = null;
  let drawReason: DrawReason = null;
  if (legalMoves(board, turn, state.rules).length === 0) winner = state.turn;
  else if (quiet >= state.rules.quietPlies) { winner = 'draw'; drawReason = 'quiet'; }
  else if (seen[key] >= 3) { winner = 'draw'; drawReason = 'repetition'; }
  return { rules: state.rules, origin: state.origin, board, turn, winner, drawReason, resigned: null, quiet, seen, log };
}

/** The side gives the game up: the other side wins. */
export function resign(state: CheckersState, side: Side): CheckersState {
  if (state.winner !== null) throw new Error('the game is over');
  return { ...state, winner: otherSide(side), resigned: side };
}

/**
 * The game without its last `plies` half-moves: it is played again from its first position, so the draw counters
 * and the repetitions are exactly what they were then.
 */
export function takeBack(state: CheckersState, plies: number): CheckersState {
  const keep = Math.max(0, state.log.length - plies);
  let game = newGame(state.rules, state.origin.board, state.origin.turn);
  for (const record of state.log.slice(0, keep)) game = play(game, record.move);
  return game;
}

/** How many men and kings a side has. */
export function countPieces(board: readonly Piece[], side: Side): { men: number; kings: number } {
  let men = 0;
  let kings = 0;
  for (const piece of board) {
    if (sideOf(piece) !== side) continue;
    if (isKing(piece)) kings += 1;
    else men += 1;
  }
  return { men, kings };
}
// END 4

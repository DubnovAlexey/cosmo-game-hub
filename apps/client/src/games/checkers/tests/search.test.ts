// [EN] FILE: games/checkers/tests/search.test.ts — the computer opponent of draughts: it always makes a legal move,
//      takes a free piece, sees a capture coming back, keeps to its time, and the levels are in the right order
//      (a few short games, so the tests stay quick).
// [RU] ФАЙЛ: компьютерный соперник в шашках: всегда делает правильный ход, берёт «бесплатную» шашку, видит ответное
//      взятие, укладывается во время, и уровни идут в правильном порядке (несколько коротких партий, чтобы тесты
//      оставались быстрыми).
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BLACK_MAN, EMPTY, RUSSIAN, ENGLISH, WHITE_MAN, chooseMove, evaluate, movesOf, newGame, play, sameMove, squareAt,
  startBoard, type CheckersLevel, type CheckersRules, type CheckersState, type Piece, type Side,
} from '../engine/index.ts';
// noinspection ES6PreferShortImport
import { createRandom } from '../../../shared/engine/random.ts';

const at = (row: number, column: number) => squareAt(row, column, 8);
function boardOf(pieces: readonly [number, number, Piece][]): Piece[] {
  const board: Piece[] = Array.from({ length: 64 }, () => EMPTY);
  for (const [row, column, piece] of pieces) board[at(row, column)] = piece;
  return board;
}

test('the start is even, and a piece more is worth about a man', () => {
  const board = startBoard(RUSSIAN);
  assert.equal(evaluate(board, 'white', RUSSIAN), evaluate(board, 'black', RUSSIAN));
  const minus = [...board];
  minus[minus.findIndex(piece => piece === BLACK_MAN)] = EMPTY;
  assert.ok(evaluate(minus, 'white', RUSSIAN) > 80);
});

test('the computer does not walk into a capture when it can avoid it', () => {
  // [EN] White can move the man to a square where black takes it, or to a safe square. [RU] Белые могут пойти под бой или на безопасное поле.
  const board = boardOf([[5, 2, WHITE_MAN], [3, 2, BLACK_MAN], [0, 7, BLACK_MAN], [7, 6, WHITE_MAN]]);
  const { move } = chooseMove(board, 'white', RUSSIAN, createRandom(1), 'normal', 300);
  const target = move.path[move.path.length - 1];
  assert.notEqual(target, at(4, 3), 'a step to d4 would be taken by the man on c5');
  assert.notEqual(target, at(4, 1), 'a step to b4 would be taken too');
});

test('every level makes only legal moves and keeps to its time', () => {
  const random = createRandom(7);
  for (const rules of [RUSSIAN, ENGLISH]) {
    let game = newGame(rules);
    for (let ply = 0; ply < 12 && game.winner === null; ply += 1) {
      const level: CheckersLevel = (['easy', 'normal', 'hard'] as const)[ply % 3];
      const started = Date.now();
      const { move } = chooseMove(game.board, game.turn, rules, random, level, 120);
      assert.ok(Date.now() - started < 700, `${rules.id} ${level}: too slow`);
      assert.ok(movesOf(game).some(candidate => sameMove(candidate, move)), `${rules.id}: an illegal move`);
      game = play(game, move);
    }
  }
});

/** A game between two levels; the stronger side alternates colours. Returns who won. */
function match(rules: CheckersRules, white: CheckersLevel, black: CheckersLevel, seed: number): CheckersState['winner'] {
  const random = createRandom(seed);
  let game = newGame(rules);
  for (let ply = 0; ply < 160 && game.winner === null; ply += 1) {
    const level = game.turn === 'white' ? white : black;
    game = play(game, chooseMove(game.board, game.turn, rules, random, level, 25).move);
  }
  return game.winner;
}

test('the normal level beats the easy one more often than it loses', () => {
  let normal = 0;
  let easy = 0;
  for (let seed = 1; seed <= 4; seed += 1) {
    const strongSide: Side = seed % 2 === 0 ? 'white' : 'black';
    const winner = strongSide === 'white' ? match(RUSSIAN, 'normal', 'easy', seed) : match(RUSSIAN, 'easy', 'normal', seed);
    if (winner === strongSide) normal += 1;
    else if (winner !== 'draw' && winner !== null) easy += 1;
  }
  assert.ok(normal > easy, `normal ${normal} : easy ${easy}`);
});

// [EN] FILE: games/checkers/tests/rules.test.ts — the rules of draughts: the start, quiet moves, compulsory and
//      multiple captures, men capturing backward (Russian) or not (English), flying kings and their landing
//      squares, crowning during a capture, the end of a game and the draws.
// [RU] ФАЙЛ: правила шашек: начальная позиция, тихие ходы, обязательное и многократное взятие, бой шашкой назад
//      (русские) или нет (английские), летающие дамки и поля их приземления, превращение в дамку во время взятия,
//      конец партии и ничьи.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BLACK_KING, BLACK_MAN, EMPTY, ENGLISH, RUSSIAN, WHITE_KING, WHITE_MAN, applyMove, countPieces, legalMoves, movesOf,
  newGame, play, squareAt, startBoard, type CheckersRules, type Move, type Piece,
} from '../engine/index.ts';

/** A board from a list of pieces: [row, column, piece]. */
function boardOf(rules: CheckersRules, pieces: readonly [number, number, Piece][]): Piece[] {
  const board: Piece[] = Array.from({ length: rules.size * rules.size }, () => EMPTY);
  for (const [row, column, piece] of pieces) board[squareAt(row, column, rules.size)] = piece;
  return board;
}
const at = (row: number, column: number) => squareAt(row, column, 8);
const landing = (move: Move) => move.path[move.path.length - 1];

test('the start: twelve men a side on the dark squares, seven first moves', () => {
  for (const rules of [RUSSIAN, ENGLISH]) {
    const board = startBoard(rules);
    assert.deepEqual(countPieces(board, 'white'), { men: 12, kings: 0 });
    assert.deepEqual(countPieces(board, 'black'), { men: 12, kings: 0 });
    const game = newGame(rules);
    assert.equal(game.turn, rules.firstMover);
    assert.equal(movesOf(game).length, 7, rules.id);
  }
  assert.equal(RUSSIAN.firstMover, 'white');
  assert.equal(ENGLISH.firstMover, 'black');
});

test('capturing is compulsory: with a capture on the board no quiet move is legal', () => {
  const board = boardOf(RUSSIAN, [[5, 2, WHITE_MAN], [4, 3, BLACK_MAN], [5, 6, WHITE_MAN], [0, 1, BLACK_MAN]]);
  const moves = legalMoves(board, 'white', RUSSIAN);
  assert.equal(moves.length, 1);
  assert.deepEqual(moves[0].captured, [at(4, 3)]);
  assert.equal(landing(moves[0]), at(3, 4));
});

test('a series of captures goes on to its end; a captured piece leaves the board only after the move', () => {
  const board = boardOf(RUSSIAN, [[6, 1, WHITE_MAN], [5, 2, BLACK_MAN], [3, 4, BLACK_MAN], [0, 7, BLACK_MAN]]);
  const [move] = legalMoves(board, 'white', RUSSIAN);
  assert.deepEqual(move.captured, [at(5, 2), at(3, 4)]);
  assert.deepEqual(move.path, [at(4, 3), at(2, 5)]);
  const after = applyMove(board, move);
  assert.equal(after[at(5, 2)], EMPTY);
  assert.equal(after[at(3, 4)], EMPTY);
  assert.equal(after[at(2, 5)], WHITE_MAN);
});

test('a man captures backward in Russian draughts, but not in English ones', () => {
  const pieces: [number, number, Piece][] = [[3, 4, WHITE_MAN], [4, 3, BLACK_MAN], [0, 1, BLACK_MAN]];
  const russian = legalMoves(boardOf(RUSSIAN, pieces), 'white', RUSSIAN);
  assert.ok(russian.every(move => move.captured.length === 1), 'Russian: the backward capture is compulsory');
  const english = legalMoves(boardOf(ENGLISH, pieces), 'white', ENGLISH);
  assert.ok(english.every(move => move.captured.length === 0), 'English: only forward moves');
});

test('a flying king captures from afar and may land on any free square behind the piece', () => {
  const board = boardOf(RUSSIAN, [[7, 0, WHITE_KING], [4, 3, BLACK_MAN], [0, 1, BLACK_MAN]]);
  const moves = legalMoves(board, 'white', RUSSIAN);
  assert.deepEqual(moves.map(landing).sort((a, b) => a - b), [at(0, 7), at(1, 6), at(2, 5), at(3, 4)].sort((a, b) => a - b));
  assert.ok(moves.every(move => move.captured[0] === at(4, 3)));
  // [EN] An English king moves one square at a time and cannot capture from afar. [RU] Английская дамка ходит на одно поле и издалека не бьёт.
  const english = legalMoves(boardOf(ENGLISH, [[7, 0, WHITE_KING], [4, 3, BLACK_MAN], [0, 1, BLACK_MAN]]), 'white', ENGLISH);
  assert.deepEqual(english.map(landing), [at(6, 1)]);
});

test('a flying king must land where it can capture again', () => {
  // [EN] Behind the first black man there are five free squares, but only from one of them (row 4) the king can take
  //      the second man — so that is the only way.
  // [RU] За первой чёрной шашкой пять свободных полей, но только с одного из них (ряд 4) дамка может взять вторую
  //      шашку — значит, это единственный путь.
  const board = boardOf(RUSSIAN, [[7, 0, WHITE_KING], [5, 2, BLACK_MAN], [2, 1, BLACK_MAN]]);
  const moves = legalMoves(board, 'white', RUSSIAN);
  assert.equal(moves.length, 1);
  assert.deepEqual(moves[0].captured, [at(5, 2), at(2, 1)]);
  assert.deepEqual(moves[0].path, [at(4, 3), at(1, 0)]);
});

test('crowning during a capture: Russian men go on as kings, English men stop', () => {
  // [EN] A white man jumps onto the last row, and from there a king could capture along the diagonal.
  // [RU] Белая шашка прыгает на последний ряд, а оттуда дамка могла бы бить по диагонали.
  const pieces: [number, number, Piece][] = [[2, 3, WHITE_MAN], [1, 4, BLACK_MAN], [1, 6, BLACK_MAN], [7, 0, BLACK_MAN]];
  const russian = legalMoves(boardOf(RUSSIAN, pieces), 'white', RUSSIAN);
  assert.equal(russian.length, 1);
  assert.equal(russian[0].captured.length, 2, 'went on capturing as a king');
  assert.equal(russian[0].crowns, true);
  assert.equal(applyMove(boardOf(RUSSIAN, pieces), russian[0])[landing(russian[0])], WHITE_KING);
  const english = legalMoves(boardOf(ENGLISH, pieces), 'white', ENGLISH);
  assert.equal(english.length, 1);
  assert.equal(english[0].captured.length, 1, 'the move ends on crowning');
  assert.equal(english[0].crowns, true);
});

test('a man reaching the last row with a quiet move is crowned', () => {
  const board = boardOf(RUSSIAN, [[1, 2, WHITE_MAN], [7, 0, BLACK_MAN]]);
  const moves = legalMoves(board, 'white', RUSSIAN);
  assert.ok(moves.every(move => move.crowns));
  assert.equal(applyMove(board, moves[0])[landing(moves[0])], WHITE_KING);
});

test('a captured piece cannot be jumped twice', () => {
  // [EN] A king in a ring of black men: each one can be taken only once. [RU] Дамка в кольце чёрных шашек: каждую можно взять только раз.
  const board = boardOf(RUSSIAN, [[4, 3, WHITE_KING], [3, 2, BLACK_MAN], [3, 4, BLACK_MAN], [5, 2, BLACK_MAN], [5, 4, BLACK_MAN]]);
  for (const move of legalMoves(board, 'white', RUSSIAN)) {
    assert.equal(new Set(move.captured).size, move.captured.length, 'no piece is taken twice');
    assert.ok(move.captured.length <= 4);
  }
});

test('a side without moves loses; a quiet stretch and a third repetition are draws', () => {
  // [EN] A black man blocked in a corner has no move: after white's move black loses. [RU] Чёрная шашка заперта в углу: после хода белых чёрные проиграли.
  const blocked = boardOf(RUSSIAN, [[0, 1, BLACK_KING], [7, 0, WHITE_MAN]]);
  const finished = newGame(RUSSIAN, boardOf(RUSSIAN, [[7, 0, WHITE_MAN]]), 'black');
  assert.equal(finished.winner, 'white', 'black has no pieces and no moves');
  let game = newGame(RUSSIAN, blocked, 'black');
  assert.equal(game.winner, null);
  // [EN] Two kings walk back and forth: the third repetition draws. [RU] Две дамки ходят туда-обратно: третье повторение — ничья.
  game = newGame(RUSSIAN, boardOf(RUSSIAN, [[0, 1, BLACK_KING], [7, 6, WHITE_KING]]), 'black');
  const shuttle = (from: number, to: number) => movesOf(game).find(move => move.from === from && landing(move) === to) as Move;
  for (let round = 0; round < 2 && game.winner === null; round += 1) {
    game = play(game, shuttle(at(0, 1), at(1, 0)));
    game = play(game, shuttle(at(7, 6), at(6, 7)));
    game = play(game, shuttle(at(1, 0), at(0, 1)));
    if (game.winner === null) game = play(game, shuttle(at(6, 7), at(7, 6)));
  }
  assert.equal(game.winner, 'draw');
  assert.equal(game.drawReason, 'repetition');
});

test('the state is never changed by a move and an illegal move is refused', () => {
  const game = newGame(RUSSIAN);
  const copy = JSON.stringify(game);
  const [move] = movesOf(game);
  const next = play(game, move);
  assert.equal(JSON.stringify(game), copy);
  assert.equal(next.turn, 'black');
  assert.equal(next.log.length, 1);
  assert.throws(() => play(game, { from: at(5, 0), path: [at(2, 3)], captured: [], crowns: false }));
});

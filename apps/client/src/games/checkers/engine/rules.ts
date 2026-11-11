// =====================================================================
// FILE: apps/client/src/games/checkers/engine/rules.ts
// PURPOSE: the rules of draughts as data. Two well-known games on the same 8 × 8 board, twelve men a side on the dark
//   squares of the three nearest rows:
//   - RUSSIAN — «русские шашки»: white moves first; a man moves forward but captures backward too; a king flies along a
//     whole diagonal, captures from afar and lands on any free square behind the captured piece; a man that reaches
//     the last row during a capture goes on capturing as a king; capturing is compulsory, and any capturing line may
//     be chosen (not necessarily the longest);
//   - ENGLISH — English draughts, «checkers»: black moves first; a man moves and captures only forward; a king moves
//     and captures one square at a time in all four directions; a man that reaches the last row is crowned and its
//     move ends there; capturing is compulsory too.
//   In both games a piece captured in a series stays on the board until the move ends and cannot be jumped twice
//   («турецкий удар» is impossible). A side that cannot move loses. A long series of quiet moves — no capture and
//   no move of a man — is a draw, and so is the same position for the third time.
//   Pure data without React and without the DOM, so the Node tests use it too.
// =====================================================================

export type RulesId = 'russian' | 'english';
export type Side = 'white' | 'black';

export interface CheckersRules {
  readonly id: RulesId;
  /** The board is `size` × `size` squares. */
  readonly size: number;
  /** How many rows of men each side starts with. */
  readonly rows: number;
  /** Men may capture backward as well as forward. */
  readonly menCaptureBackward: boolean;
  /** A king moves and captures along a whole diagonal; false — one square at a time. */
  readonly flyingKings: boolean;
  /** A man that reaches the last row during a capture goes on capturing as a king; false — its move ends there. */
  readonly promotionContinues: boolean;
  /** Who makes the first move. */
  readonly firstMover: Side;
  /** Half-moves without a capture and without a move of a man that end the game in a draw. */
  readonly quietPlies: number;
}

export const RUSSIAN: CheckersRules = Object.freeze({
  id: 'russian', size: 8, rows: 3, menCaptureBackward: true, flyingKings: true, promotionContinues: true, firstMover: 'white', quietPlies: 30,
});
export const ENGLISH: CheckersRules = Object.freeze({
  id: 'english', size: 8, rows: 3, menCaptureBackward: false, flyingKings: false, promotionContinues: false, firstMover: 'black', quietPlies: 80,
});
export const RULE_SETS: Readonly<Record<RulesId, CheckersRules>> = Object.freeze({ russian: RUSSIAN, english: ENGLISH });

export const otherSide = (side: Side): Side => (side === 'white' ? 'black' : 'white');

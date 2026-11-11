// [EN] FILE: games/checkers/engine/index.ts — the engine of draughts in one import: the rules, the board, the moves,
//      a whole game and the computer opponent. Pure TypeScript without React.
// [RU] ФАЙЛ: движок шашек одним импортом: правила, доска, ходы, целая партия и компьютерный соперник. Чистый
//      TypeScript без React.
export * from './rules.ts';
export * from './board.ts';
export * from './ai/search.ts';

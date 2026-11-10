// [EN] FILE: games/battleship/engine/index.ts — the sea battle engine in one import: the rules, a side's sea, a whole
//      battle and the computer gunner. Pure TypeScript without React or the DOM, so Node runs it in the tests directly.
// [RU] ФАЙЛ: движок морского боя одним импортом: правила, море одной стороны, целый бой и компьютерный наводчик.
//      Чистый TypeScript без React и DOM, поэтому Node запускает его в тестах напрямую.
// noinspection ES6PreferShortImport
export * from '../../../shared/engine/random.ts';
export * from './rules.ts';
export * from './board.ts';
export * from './battle.ts';
export * from './ai/gunner.ts';

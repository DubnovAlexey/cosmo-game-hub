// =====================================================================
// FILE: apps/client/src/games/preferans/engine/index.ts
// PURPOSE: the public API of the preferans engine. Everything is plain data and pure functions: the same
//   code runs in the browser UI, in a Web Worker for the bots, in Node tests and could run on a server.
// =====================================================================
export * from './cards.ts';
// [EN] A relative path on purpose: Node runs the engine directly in the tests and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает движок прямо в тестах и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
export * from '../../../shared/engine/random.ts';
export * from './bids.ts';
export * from './rules.ts';
export * from './tableOptions.ts';
export * from './play.ts';
export * from './bidding.ts';
export * from './scoring.ts';
export * from './deal.ts';
export * from './table.ts';
export * from './ai/solver.ts';
export * from './ai/knowledge.ts';
export * from './ai/evaluate.ts';
export * from './ai/strength.ts';
export * from './ai/foresight.ts';
export * from './ai/bot.ts';

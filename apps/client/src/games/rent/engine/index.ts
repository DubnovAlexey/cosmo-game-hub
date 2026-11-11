// [EN] FILE: games/rent/engine/index.ts — the engine of «Blood Rent» in one import: the rules, a whole game and the
//      bots. Pure TypeScript without React.
// [RU] ФАЙЛ: движок «Кровной ренты» одним импортом: правила, целая партия и боты. Чистый TypeScript без React.
export * from './rules.ts';
export * from './game.ts';
export * from './ai/bot.ts';
// noinspection ES6PreferShortImport
export { createRandom, type Random } from '../../../shared/engine/random.ts';

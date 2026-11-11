// [EN] FILE: games/rent/i18n/types.ts — the shape of the texts of «Blood Rent», the same for all five languages
//      (Russian is the master): the names of the squares, the sectors and the cards, the words of the table and
//      the lines of the log. Sentences that need a name, a number or a square are functions, so every language
//      builds them in its own word order and agrees them with the gender of the player.
// [RU] ФАЙЛ: форма текстов «Кровной ренты», одна для всех пяти языков (основной — русский): названия клеток,
//      секторов и карт, слова стола и строки хода партии. Фразы, которым нужны имя, число или клетка, — функции:
//      каждый язык строит их в своём порядке слов и согласует с родом игрока.
import type { Language } from '@shared/i18n/languages';
import type { CornerId, DeckId, SectorId } from '../engine/rules';

/** [EN] A player in a sentence: a name and the grammatical gender. [RU] Игрок во фразе: имя и грамматический род. */
export interface Who {
  readonly name: string;
  readonly female: boolean;
}

export interface CardText {
  readonly title: string;
  readonly text: string;
}

export interface RentTexts {
  readonly language: Language;
  readonly gameTitle: string;
  readonly tagline: string;
  /** [EN] The estates and the gates by their id in engine/rules.ts. [RU] Владения и врата по их id из engine/rules.ts. */
  readonly squares: Readonly<Record<string, string>>;
  readonly sectors: Readonly<Record<SectorId, string>>;
  readonly corners: Readonly<Record<CornerId, string>>;
  readonly special: { readonly cruiser: string; readonly spaceport: string; readonly oxygenTax: string };
  readonly decks: Readonly<Record<DeckId, string>>;
  readonly cards: Readonly<Record<DeckId, Readonly<Record<string, CardText>>>>;
  readonly resources: {
    readonly credits: string;
    readonly plasma: string;
    readonly bio: string;
    readonly infection: string;
    readonly short: { readonly credits: string; readonly plasma: string; readonly bio: string };
  };
  readonly header: {
    readonly language: string;
    readonly save: string;
    readonly savedAt: (time: string) => string;
    readonly menu: string;
  };
  readonly setup: {
    readonly title: string;
    readonly intro: string;
    readonly players: string;
    readonly playersHint: (count: number) => string;
    readonly opponents: string;
    readonly another: string;
    readonly auction: string;
    readonly auctionHint: string;
    readonly takeover: string;
    readonly takeoverHint: string;
    readonly length: string;
    readonly lengths: { readonly collapse: string; readonly short: string; readonly long: string };
    readonly lengthHints: { readonly collapse: string; readonly short: string; readonly long: string };
    readonly start: string;
    readonly continue: string;
    readonly savedLine: (when: string) => string;
    readonly close: string;
  };
  readonly table: {
    readonly you: string;
    readonly yourTurn: string;
    readonly theirTurn: (who: Who) => string;
    readonly round: (round: number) => string;
    readonly owner: string;
    readonly bank: string;
    readonly price: string;
    readonly rent: string;
    readonly rentLevels: readonly string[];
    readonly modules: (count: number) => string;
    readonly citadel: string;
    readonly pawned: string;
    readonly infected: string;
    readonly corpse: (master: string) => string;
    readonly quarantined: string;
    readonly bankrupt: string;
    readonly liens: (names: string) => string;
    readonly close: string;
  };
  readonly actions: {
    readonly roll: string;
    readonly buy: (price: number) => string;
    readonly decline: string;
    readonly bid: (amount: number) => string;
    readonly pass: string;
    readonly takeover: (price: number) => string;
    readonly skip: string;
    readonly heal: string;
    readonly healOwn: (fee: number) => string;
    readonly healAlimony: (owner: string) => string;
    readonly leaveCredits: (amount: number) => string;
    readonly leaveCapsule: string;
    readonly leaveFlesh: (percent: number) => string;
    readonly leaveCard: string;
    readonly sellFlesh: (percent: number, credits: number) => string;
    readonly buyPlasma: (credits: number) => string;
    readonly sellPlasma: (credits: number) => string;
    readonly risk: string;
    readonly teleport: (price: number) => string;
    readonly teleportPick: string;
    readonly courtCredits: (amount: number) => string;
    readonly courtFlesh: (percent: number) => string;
    readonly build: string;
    readonly sell: string;
    readonly pawn: string;
    readonly redeem: string;
    readonly infect: string;
    readonly buyout: (owner: string, price: number) => string;
    readonly ransom: (price: number) => string;
    readonly pay: (amount: number) => string;
    readonly bankrupt: string;
    readonly end: string;
  };
  readonly prompts: {
    readonly buy: (square: string) => string;
    readonly auction: (square: string, bid: number, leader: string | null) => string;
    readonly takeover: (square: string) => string;
    readonly lab: string;
    readonly market: string;
    readonly cruiser: string;
    readonly spaceport: string;
    readonly court: string;
    readonly quarantine: (tries: number) => string;
    readonly debt: (amount: number) => string;
  };
  readonly log: {
    readonly title: string;
    readonly roll: (who: Who, a: number, b: number) => string;
    readonly buy: (who: Who, square: string, price: number) => string;
    readonly auction: (who: Who | null, square: string, price: number) => string;
    readonly takeover: (who: Who, owner: string, square: string, price: number) => string;
    readonly rent: (who: Who, owner: string, amount: number) => string;
    readonly fleshRent: (who: Who, owner: string, percent: number) => string;
    readonly due: (who: Who, amount: number) => string;
    readonly card: (who: Who, deck: string, title: string) => string;
    readonly quarantine: (who: Who) => string;
    readonly free: (who: Who) => string;
    readonly heal: (who: Who) => string;
    readonly infect: (who: Who, sector: string) => string;
    readonly corpse: (who: Who, master: string) => string;
    readonly ransom: (who: Who) => string;
    readonly bankrupt: (who: Who) => string;
    readonly cruiser: (who: Who, lucky: boolean) => string;
    readonly teleport: (who: Who, square: string) => string;
    readonly court: (who: Who) => string;
    readonly collapse: string;
  };
  readonly result: {
    readonly won: string;
    readonly lost: (who: Who) => string;
    readonly collapse: string;
    readonly worth: (amount: number) => string;
    readonly again: string;
  };
  readonly hero: {
    readonly about: (name: string) => string;
    readonly close: string;
    readonly dweller: string;
    readonly guest: string;
  };
}

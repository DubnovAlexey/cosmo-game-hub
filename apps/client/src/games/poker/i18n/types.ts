// [EN] FILE: games/poker/i18n/types.ts — every text of the poker table in one contract, filled in five languages
//      (ru, en, he, es, fr). Sentences about a player take the player's name and gender, so Russian, Hebrew,
//      Spanish and French verbs agree («Кармилла поставила», «Граф Влад поставил»). Card ranks are the
//      international A K Q J 10 in every language, as in poker rooms.
// [RU] ФАЙЛ: все тексты покерного стола в одном договоре, заполненном на пяти языках (ru, en, he, es, fr). Фразы об
//      игроке получают его имя и род, поэтому глаголы в русском, иврите, испанском и французском согласуются
//      («Кармилла поставила», «Граф Влад поставил»). Достоинства карт — международные A K Q J 10 на всех языках,
//      как в покер-румах.
import type { Language } from '@shared/i18n/languages';
import type { PokerCharacterId } from '../characters';

export interface Who {
  readonly name: string;
  readonly female: boolean;
  /** The human player: «вы» speaks in the second person. */
  readonly you: boolean;
}

export interface PokerTexts {
  readonly language: Language;
  readonly gameTitle: string;
  readonly tagline: string;
  readonly header: {
    readonly language: string;
    readonly save: string;
    readonly savedAt: (time: string) => string;
    readonly menu: string;
    readonly level: (small: number, big: number, ante: number, hand: number) => string;
  };
  readonly setup: {
    readonly title: string;
    readonly intro: string;
    readonly noMoney: string;
    readonly opponents: string;
    readonly opponentsCount: (count: number) => string;
    readonly stack: string;
    readonly speed: string;
    readonly speeds: { readonly slow: string; readonly normal: string; readonly fast: string };
    readonly speedHint: (hands: number) => string;
    readonly strength: string;
    readonly strengths: { readonly casual: string; readonly strong: string };
    readonly start: string;
    readonly continue: string;
    readonly savedLine: (hand: number, players: number, when: string) => string;
    readonly close: string;
  };
  readonly seat: {
    readonly you: string;
    readonly dealer: string;
    readonly smallBlind: string;
    readonly bigBlind: string;
    readonly folded: string;
    readonly allIn: string;
    readonly thinking: string;
    readonly out: string;
    readonly stack: (chips: string) => string;
    readonly about: (name: string) => string;
    /** [EN] The button that closes a hero's card. [RU] Кнопка, закрывающая карточку героя. */
    readonly closeAbout: string;
  };
  readonly actions: {
    readonly fold: string;
    readonly check: string;
    readonly call: (amount: string) => string;
    readonly bet: (to: string) => string;
    readonly raise: (to: string) => string;
    readonly allIn: (amount: string) => string;
    readonly amount: string;
    readonly presets: { readonly half: string; readonly threeQuarters: string; readonly pot: string; readonly max: string };
    readonly yourTurn: string;
    readonly waiting: (who: Who) => string;
  };
  readonly streets: { readonly preflop: string; readonly flop: string; readonly turn: string; readonly river: string; readonly showdown: string };
  readonly pot: (amount: string) => string;
  readonly sidePot: (index: number, amount: string) => string;
  /** Category names: high card … straight flush, then royal flush. */
  readonly hands: readonly string[];
  readonly log: {
    readonly title: string;
    readonly blinds: (small: string, big: string, ante: string | null) => string;
    readonly fold: (who: Who) => string;
    readonly check: (who: Who) => string;
    readonly call: (who: Who, to: string, allIn: boolean) => string;
    readonly bet: (who: Who, to: string, allIn: boolean) => string;
    readonly raise: (who: Who, to: string, allIn: boolean) => string;
    readonly street: (street: string, cards: string) => string;
  };
  readonly results: {
    readonly wins: (who: Who, amount: string, hand: string) => string;
    readonly uncontested: (who: Who, amount: string) => string;
    readonly returned: (who: Who, amount: string) => string;
    readonly split: (names: string, amount: string, hand: string) => string;
    readonly nextHand: string;
    readonly youWon: string;
    readonly youOut: (place: number, players: number) => string;
    readonly botWon: (who: Who) => string;
    readonly newTournament: string;
  };
  readonly cards: { readonly name: (rank: number, suit: number) => string; readonly back: string };
  /**
   * [EN] The regulars: the name and the biography come from the texts shared by all the games
   *      (shared/characters/texts), the poker line — from the poker dictionary.
   * [RU] Завсегдатаи: имя и биография приходят из текстов, общих для всех игр (shared/characters/texts), покерная
   *      реплика — из словаря покера.
   */
  readonly characters: Readonly<Record<PokerCharacterId, { readonly name: string; readonly bio: string; readonly tagline: string }>>;
}

/** [EN] What a language file of poker holds: everything but the names and biographies. [RU] Что хранит языковой файл покера: всё, кроме имён и биографий. */
export type PokerDictionary = Omit<PokerTexts, 'characters'> & {
  readonly characters: Readonly<Record<PokerCharacterId, { readonly tagline: string }>>;
};

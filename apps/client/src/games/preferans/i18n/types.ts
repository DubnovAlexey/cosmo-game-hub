// [EN] FILE: games/preferans/i18n/types.ts — the shape of one language of the preferans table. Every language file
//      implements it in full, so TypeScript reports any text a translation forgot.
//      Sentences about a player take the seat, not the name: each language agrees its verbs with "you" and with
//      the bots' names (Orion is masculine, Vega feminine), e.g. «Вы берёте прикуп», «Вега сказала».
// [RU] ФАЙЛ: форма одного языка стола преферанса. Каждый языковой файл реализует её целиком, поэтому TypeScript
//      сразу показывает текст, который забыли перевести.
//      Фразы об игроке получают место, а не имя: каждый язык согласует глаголы с «вы» и с именами ботов (Орион —
//      он, Вега — она), например «Вы берёте прикуп», «Вега сказала».
import type { BotStrength } from '../hooks/usePreferans';
import type { ClosedReason, OptionId, PlayerCount, ProgressionId, Seat, VariantId } from '../engine/index.ts';
import type { Language } from '../../../shared/i18n/languages.ts';

export interface Explained {
    readonly name: string;
    /** [EN] The Russian term players know it by. [RU] Русское название, под которым его знают игроки. */
    readonly term?: string;
    readonly what: string;
    readonly how: string;
    readonly effect: string;
}

export interface Dictionary {
    readonly language: Language;
    readonly gameTitle: string;
    /** [EN] You, the left bot, the right bot. [RU] Вы, левый бот, правый бот. */
    readonly seatNames: readonly [string, string, string];
    readonly header: {
        readonly rules: (variant: string) => string;
        readonly pool: (target: number) => string;
        readonly tagline: string;
        readonly tableSetup: string;
        readonly language: string;
    };
    readonly cards: {
        /** [EN] Corner labels, seven to ace. [RU] Значки в углах, от семёрки до туза. */
        readonly corners: readonly string[];
        readonly name: (rank: number, suit: number) => string;
    };
    readonly bids: {
        readonly noTrump: string;
        readonly misere: string;
        readonly misereButton: string;
        readonly hold: (bid: string) => string;
        readonly gridLabel: string;
    };
    readonly info: {
        readonly auction: string;
        readonly speaksFirst: (seat: Seat) => string;
        readonly allPass: string;
        readonly allPassHint: string;
        readonly allPassTalonHint: string;
        readonly misere: (seat: Seat) => string;
        readonly misereHint: (seat: Seat) => string;
        readonly takesTalon: (seat: Seat) => string;
        readonly discardHint: string;
        readonly needs: (seat: Seat, tricks: number) => string;
        readonly defendersDecide: string;
    };
    readonly roles: {
        readonly allPass: string; readonly misere: string; readonly declarer: string; readonly catcher: string;
        readonly checks: string; readonly whist: string; readonly halfWhist: string; readonly pass: string;
    };
    readonly seat: { readonly tricks: (count: number) => string; readonly thinking: string };
    readonly table: { readonly centre: string; readonly talonOpen: string; readonly talonClosed: string; readonly talonLeads: string };
    readonly actions: {
        readonly thinking: (seat: Seat) => string;
        readonly yourBid: string;
        readonly someoneBids: (seat: Seat, bid: string, canHold: boolean) => string;
        readonly pass: string;
        readonly discardMisere: string;
        readonly discardGame: string;
        readonly selected: (count: number) => string;
        readonly discard: string;
        readonly nameGame: (bid: string) => string;
        readonly concede: (tricks: number) => string;
        readonly concedeHint: string;
        readonly whistQuestion: (seat: Seat, contract: string) => string;
        readonly whist: string;
        readonly halfWhist: string;
        readonly returnQuestion: (seat: Seat) => string;
        readonly takeBack: string;
        readonly leaveHalf: string;
        readonly modeQuestion: string;
        readonly open: string;
        readonly closed: string;
        readonly yourTurn: string;
        readonly yourTurnFor: (seat: Seat) => string;
        readonly nextDeal: string;
    };
    readonly results: {
        readonly allPass: (scores: string) => string;
        readonly misereClean: (seat: Seat) => string;
        readonly misereCaught: (seat: Seat, tricks: number) => string;
        readonly conceded: (seat: Seat, contract: string, tricks: number) => string;
        readonly halfWhistCounted: (seat: Seat, contract: string) => string;
        readonly nobodyWhisted: (seat: Seat, contract: string) => string;
        readonly made: (seat: Seat, contract: string, tricks: number, defence: number) => string;
        readonly down: (seat: Seat, contract: string, under: number, tricks: number) => string;
        readonly poolClosed: string;
        readonly whists: string;
    };
    readonly sheet: {
        readonly title: string;
        readonly meta: (target: number, total: number) => string;
        readonly openLarge: string;
        readonly close: string;
        readonly legend: { readonly mountain: string; readonly pool: string; readonly whists: string };
        readonly ifClosedNow: string;
        readonly sumsToZero: string;
        readonly deals: (count: number) => string;
        readonly deal: (number: number) => string;
        readonly rulesTitle: string;
        readonly rules: readonly string[];
        readonly bandPool: (name: string) => string;
        readonly bandMountain: (name: string) => string;
        readonly bandWhists: (writer: string, target: string) => string;
        readonly empty: string;
        readonly closesAt: (points: number) => string;
        readonly resultTitle: (name: string) => string;
        readonly drawing: (target: number) => string;
        readonly strip: (players: string) => string;
        readonly stripPlayer: (name: string, pool: number, target: number, mountain: number, balance: string) => string;
    };
    readonly setup: {
        readonly title: string;
        readonly savedPool: string;
        readonly savedLine: (deal: number, pool: number, max: number, when: string) => string;
        readonly continueSaved: string;
        readonly playPlain: string;
        readonly playPlainHint: string;
        readonly players: string;
        readonly rules: string;
        readonly pool: string;
        readonly progression: string;
        readonly bots: string;
        readonly conventions: string;
        readonly conventionsNote: string;
        readonly extras: string;
        readonly extrasNote: string;
        readonly soon: string;
        readonly what: string;
        readonly how: string;
        readonly effect: string;
        readonly about: (name: string) => string;
        readonly yourTable: string;
        readonly play: string;
        readonly reset: string;
        readonly back: string;
        readonly lastPools: string;
        readonly resultLine: (when: string, deals: number, balance: string) => string;
        readonly dropped: (names: string) => string;
        readonly summary: {
            readonly players: (count: number) => string;
            readonly pool: (target: number) => string;
            readonly allPass: (prices: string) => string;
            readonly without: (name: string) => string;
            readonly bots: Readonly<Record<BotStrength, string>>;
        };
        readonly strength: Readonly<Record<BotStrength, string>>;
    };
    readonly explain: {
        readonly players: Readonly<Record<PlayerCount, Explained>>;
        readonly variants: Readonly<Record<VariantId, Explained>>;
        readonly pool: Explained;
        readonly progression: Explained;
        readonly progressionLabels: Readonly<Record<ProgressionId, string>>;
        readonly bots: Explained;
        readonly options: Readonly<Record<OptionId, Explained>>;
    };
    /** [EN] Why an option is closed, in words. [RU] Почему опция закрыта — словами. */
    readonly closed: (reason: ClosedReason) => string;
}

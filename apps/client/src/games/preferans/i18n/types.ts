// [EN] FILE: games/preferans/i18n/types.ts — the shape of one language of the preferans table. Every language file
//      implements it in full, so TypeScript reports any text a translation forgot.
//      Sentences about a player take the seat, not the name. The opponents change from pool to pool (the company of
//      the lair, characters/roster.ts), so a language file is a function of the cast: it agrees its verbs with "you"
//      and with each opponent's gender, e.g. «Вы берёте прикуп», «Кармилла сказала», «Кощей сказал».
// [RU] ФАЙЛ: форма одного языка стола преферанса. Каждый языковой файл реализует её целиком, поэтому TypeScript
//      сразу показывает текст, который забыли перевести.
//      Фразы об игроке получают место, а не имя. Соперники меняются от пули к пуле (обитатели логова,
//      characters/roster.ts), поэтому языковой файл — функция от состава: он согласует глаголы с «вы» и с родом
//      каждого соперника, например «Вы берёте прикуп», «Кармилла сказала», «Кощей сказал».
import type { BotStrength } from '../hooks/usePreferans';
import type { ClosedReason, OptionId, PlayerCount, VariantId } from '../engine/index.ts';
import type { Cast, CharacterId } from '../characters/roster.ts';
import type { Language } from '@shared/i18n/languages';

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
    /** [EN] You, then the opponents of this pool clockwise. [RU] Вы, затем соперники этой пули по часовой стрелке. */
    readonly seatNames: readonly string[];
    /** [EN] The whole company of the lair: names and humorous biographies. [RU] Все обитатели логова: имена и биографии с юмором. */
    readonly characters: Readonly<Record<CharacterId, { readonly name: string; readonly bio: string }>>;
    readonly portrait: {
        /** [EN] Tag of a guest from a neighbouring world. [RU] Пометка гостя из соседнего мира. */
        readonly guest: string;
        /** [EN] Tag of a dweller of the lair. [RU] Пометка обитателя логова. */
        readonly dweller: string;
        readonly about: (name: string) => string;
        readonly close: string;
        /** [EN] The manner at the table, in four short words. [RU] Манера за столом — четыре коротких слова. */
        readonly manner: {
            readonly bidding: string; readonly whist: string; readonly misere: string; readonly pace: string;
            readonly bold: string; readonly even: string; readonly careful: string;
            readonly eager: string; readonly calculated: string; readonly cautious: string;
            readonly loves: string; readonly sometimes: string; readonly cleanOnly: string;
            readonly fast: string; readonly moderate: string; readonly slow: string;
        };
    };
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
        readonly speaksFirst: (seat: number) => string;
        readonly allPass: string;
        readonly allPassHint: string;
        readonly allPassTalonHint: string;
        readonly misere: (seat: number) => string;
        readonly misereHint: (seat: number) => string;
        readonly takesTalon: (seat: number) => string;
        readonly discardHint: string;
        readonly needs: (seat: number, tricks: number) => string;
        readonly defendersDecide: string;
    };
    readonly roles: {
        readonly allPass: string; readonly misere: string; readonly declarer: string; readonly catcher: string;
        readonly checks: string; readonly whist: string; readonly halfWhist: string; readonly pass: string;
        /** [EN] The dealer who sits out at a table of four. [RU] Сдающий, который вчетвером сидит на прикупе. */
        readonly onTalon: string;
    };
    readonly seat: { readonly tricks: (count: number) => string; readonly thinking: string };
    readonly table: { readonly centre: string; readonly talonOpen: string; readonly talonClosed: string; readonly talonLeads: string };
    readonly actions: {
        readonly thinking: (seat: number) => string;
        readonly yourBid: string;
        readonly someoneBids: (seat: number, bid: string, canHold: boolean) => string;
        readonly pass: string;
        readonly discardMisere: string;
        readonly discardGame: string;
        readonly selected: (count: number) => string;
        readonly discard: string;
        readonly nameGame: (bid: string) => string;
        readonly concede: (tricks: number) => string;
        readonly concedeHint: string;
        readonly whistQuestion: (seat: number, contract: string) => string;
        readonly whist: string;
        readonly halfWhist: string;
        readonly returnQuestion: (seat: number) => string;
        readonly takeBack: string;
        readonly leaveHalf: string;
        readonly modeQuestion: string;
        readonly open: string;
        readonly closed: string;
        readonly yourTurn: string;
        readonly yourTurnFor: (seat: number) => string;
        readonly nextDeal: string;
    };
    readonly results: {
        readonly allPass: (scores: string) => string;
        readonly misereClean: (seat: number) => string;
        readonly misereCaught: (seat: number, tricks: number) => string;
        readonly conceded: (seat: number, contract: string, tricks: number) => string;
        readonly halfWhistCounted: (seat: number, contract: string) => string;
        readonly nobodyWhisted: (seat: number, contract: string) => string;
        readonly made: (seat: number, contract: string, tricks: number, defence: number) => string;
        readonly down: (seat: number, contract: string, under: number, tricks: number) => string;
        readonly poolClosed: string;
        /** [EN] Two at the table, everybody passed: a new deal. [RU] Вдвоём все спасовали — пересдача. */
        readonly redeal: string;
        readonly whists: string;
    };
    /** [EN] Texts of the table options played since 09.11.2026: dark calls, bombs, shared misère, the dealer's whist,
     *       teeth, notes of a deal's result. Seats are table players. [RU] Тексты опций стола, которые играются с
     *       09.11.2026: тёмные заявки, бомбы, мизер пополам, вист сдающего, зубы, пометки итога раздачи. */
    readonly extra: {
        /** [EN] Save the pool now, and when it was saved. [RU] Сохранить пулю сейчас и когда она сохранилась. */
        readonly save: string;
        readonly savedAt: (time: string) => string;
        readonly misereNoTalon: string;
        readonly misereNoTalonButton: string;
        readonly dark: (level: number) => string;
        readonly darkPass: string;
        readonly darkRow: string;
        readonly lookAtCards: string;
        readonly darkQuestion: string;
        readonly darkOnly: string;
        readonly cardsClosed: string;
        readonly shareQuestion: string;
        readonly share: string;
        readonly playAlone: string;
        readonly dealerQuestion: string;
        readonly dealerHand: (seat: number) => string;
        readonly dealerWhistQuestion: (seat: number) => string;
        readonly bombs: (count: number) => string;
        readonly teeth: string;
        readonly tooth: (from: string, to: string, count: number) => string;
        readonly results: {
            readonly dark: string;
            readonly times: (factor: number) => string;
            readonly bombs: string;
            readonly darkAllPass: string;
            readonly bombsEarned: (names: string) => string;
            readonly shared: string;
            readonly dealerWhisted: (seat: number) => string;
            readonly premium: (whists: number) => string;
            readonly noTalon: string;
        };
    };
    readonly sheet: {
        readonly title: string;
        readonly meta: (target: number, total: number, max: number) => string;
        readonly openLarge: string;
        readonly close: string;
        readonly legend: { readonly mountain: string; readonly pool: string; readonly whists: string };
        readonly ifClosedNow: string;
        readonly sumsToZero: string;
        readonly deals: (count: number) => string;
        readonly deal: (number: number) => string;
        readonly rulesTitle: (variant: string) => string;
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
            /** [EN] Rostov: all-pass paid in whists. [RU] Ростовка: распасы платятся вистами. */
            readonly allPassWhists: string;
            readonly without: (name: string) => string;
            readonly bots: Readonly<Record<BotStrength, string>>;
        };
        readonly strength: Readonly<Record<BotStrength, string>>;
        readonly opponents: string;
        /** [EN] How many portraits may be picked (1–3). [RU] Сколько портретов можно выбрать (1–3). */
        readonly opponentsNote: (max: number) => string;
        readonly randomOpponents: string;
        /** [EN] The winner of the last pool keeps a free seat. [RU] Победитель прошлой пули сохраняет свободное место. */
        readonly champion: (name: string, female: boolean) => string;
    };
    readonly explain: {
        readonly players: Readonly<Record<PlayerCount, Explained>>;
        readonly variants: Readonly<Record<VariantId, Explained>>;
        readonly pool: Explained;
        readonly progression: Explained;
        /** [EN] All-pass trick prices in a row as players say them: «1 · 2 · 3», «always 2». [RU] Цены взяток распасов подряд. */
        readonly progressionLabel: (prices: readonly number[]) => string;
        readonly bots: Explained;
        readonly options: Readonly<Record<OptionId, Explained>>;
    };
    /** [EN] Why an option is closed, in words. [RU] Почему опция закрыта — словами. */
    readonly closed: (reason: ClosedReason) => string;
}

/** [EN] A language file: the texts for one company of opponents. [RU] Языковой файл: тексты для одного состава соперников. */
export type DictionaryFactory = (cast: Cast) => Dictionary;

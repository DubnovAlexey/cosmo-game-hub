// [EN] FILE: games/preferans/components/format.ts — texts of the preferans table built from the game state in the
//      current language: hand order, bids, roles, calls, results.
// [RU] ФАЙЛ: подписи стола преферанса из состояния игры на текущем языке — порядок карт, заявки, роли, слова,
//      итоги раздач.
import {
    NO_TRUMP, SUIT_SYMBOLS, bidOf, cardsOf, contractOf, darkLevel, isDarkBid, otherSeats, rankOf, suitOf,
    type Bid, type Card, type CardSet, type DealResult, type DealSeating, type DealState, type Seat,
} from '../engine/index.ts';
import { directionOf } from '@shared/i18n/languages';
import type { Dictionary } from '../i18n/index.ts';

// [EN] Bids and signed numbers are notation and read left to right in every language. Inside Hebrew text they are
//      wrapped in a left-to-right isolate (invisible marks), so «6♠» does not turn into «♠6» and «-40» into «40-».
// [RU] Заявки и числа со знаком — это запись, она читается слева направо на любом языке. Внутри текста на иврите
//      они завёрнуты в изоляцию «слева направо» (невидимые знаки), чтобы «6♠» не стало «♠6», а «-40» — «40-».
export const ltr = (text: string): string => `⁦${text}⁩`;
/** [EN] A balance in whists: +46, -6, 0. [RU] Итог в вистах: +46, -6, 0. */
export const signed = (value: number): string => ltr(`${value > 0.05 ? '+' : ''}${Math.round(value * 10) / 10}`);

// [EN] Hand order alternates colours: ♠ ♥ ♣ ♦, high to low inside a suit.
// [RU] Порядок в руке чередует цвета: ♠ ♥ ♣ ♦, внутри масти от старшей к младшей.
const SUIT_POSITION = [0, 2, 3, 1];
export function sortForHand(set: CardSet): Card[] {
    return cardsOf(set).sort((a, b) => SUIT_POSITION[suitOf(a)] - SUIT_POSITION[suitOf(b)] || rankOf(b) - rankOf(a));
}

/** [EN] A bid as players write it: 6♠ … 10NT, misère, misère without the talon, «6 dark». [RU] Заявка так, как её пишут: 6♠ … 10БК, мизер, мизер без прикупа, «6 втёмную». */
export function bidName(bid: Bid, t: Dictionary): string {
    if (isDarkBid(bid)) return t.extra.dark(darkLevel(bid));
    const contract = contractOf(bid);
    if (contract.kind === 'misere') return contract.noTalon ? t.extra.misereNoTalon : t.bids.misere;
    const text = `${contract.level}${contract.strain === NO_TRUMP ? t.bids.noTrump : SUIT_SYMBOLS[contract.strain]}`;
    return directionOf(t.language) === 'rtl' ? ltr(text) : text;
}

/** [EN] What is being played; a game won with a dark bid says so. [RU] Что играется; игра, выигранная тёмной заявкой, это называет. */
export const contractLabel = (state: DealState, t: Dictionary): string | null => {
    if (!state.contract) return null;
    const label = bidName(bidOf(state.contract), t);
    return state.contract.kind === 'game' && isDarkBid(state.winningBid) ? `${label} · ${t.extra.results.dark}` : label;
};

/** [EN] Role badge of a seat. [RU] Значок роли игрока. */
export function roleOf(state: DealState, seat: Seat, t: Dictionary): string | null {
    if (state.mode === 'raspasy') return t.roles.allPass;
    if (state.declarer === null) return null;
    if (seat === state.declarer) return state.mode === 'misere' ? t.roles.misere : t.roles.declarer;
    const whist = state.whist;
    if (!whist) return state.mode === 'misere' ? t.roles.catcher : null;
    if (whist.whisters.includes(seat)) return whist.whisters.length === 2 && state.contract?.kind === 'game' && state.contract.level === 10 ? t.roles.checks : t.roles.whist;
    const index = whist.order.indexOf(seat);
    const call = index >= 0 ? whist.calls[index] : null;
    if (call === 'half') return t.roles.halfWhist;
    if (call === 'pass') return t.roles.pass;
    return null;
}

/** [EN] The last thing a seat said in the auction or in the whist round. [RU] Последнее слово игрока в торговле или висте. */
export function lastCall(state: DealState, seat: Seat, t: Dictionary): string | null {
    if (state.phase === 'whist' || state.phase === 'whistReturn' || state.phase === 'whistMode') {
        const whist = state.whist;
        const index = whist ? whist.order.indexOf(seat) : -1;
        const call = whist && index >= 0 ? whist.calls[index] : null;
        if (call) return call === 'whist' ? t.actions.whist : call === 'half' ? t.actions.halfWhist : t.actions.pass;
        return null;
    }
    if (state.phase !== 'bidding') return null;
    for (let i = state.bidding.history.length - 1; i >= 0; i -= 1) {
        const call = state.bidding.history[i];
        if (call.seat !== seat) continue;
        if (call.call === 'pass') return call.dark ? t.extra.darkPass : t.actions.pass;
        return bidName(call.bid, t);
    }
    return null;
}

/** [EN] One line describing a finished deal; the sentence agrees with who declared (you or a dweller of the lair).
 *       `names` and the sentences count table players; `seating` says who sat in which deal seat (four at the
 *       table the dealer sits out, and on all-pass his talon's tricks are told too).
 *  [RU] Одна строка об итоге раздачи; фраза согласуется с тем, кто играл (вы или обитатель логова). `names` и
 *       фразы считают игроков стола; `seating` говорит, кто сидел на каком месте раздачи (вчетвером сдающий сидит на
 *       прикупе, и на распасах называются и взятки его прикупа). */
export function resultText(result: DealResult, names: readonly string[], t: Dictionary, seating?: DealSeating, options: { readonly bombs?: boolean } = {}): string {
    const notes = resultNotes(result, names, t, seating, options);
    const text = resultCore(result, names, t, seating);
    return notes.length > 0 ? `${text} · ${notes.join(' · ')}` : text;
}

/**
 * [EN] What the table options added to a deal: dark, bombs and the factor, a shared misère, the dealer's whist, the
 *      paid talon, the bombs a dark all-pass gave. [RU] Что добавили опции стола: втёмную, бомбы и множитель, мизер
 *      пополам, вист сдающего, платный прикуп, бомбы после тёмных распасов.
 */
function resultNotes(result: DealResult, names: readonly string[], t: Dictionary, seating: DealSeating | undefined, options: { readonly bombs?: boolean }): string[] {
    const notes: string[] = [];
    const extra = t.extra.results;
    const player = (seat: Seat): number => (seating ? seating.players[seat] : seat);
    if (result.noTalon) notes.push(extra.noTalon);
    if (result.mode === 'raspasy' && result.darkPassers && result.darkPassers.length > 0) {
        notes.push(extra.darkAllPass);
        if (options.bombs) notes.push(extra.bombsEarned(result.darkPassers.map(seat => names[player(seat)]).join(', ')));
    }
    if (result.dark) notes.push(extra.dark);
    const factor = result.multiplier ?? 1;
    if (result.mode !== 'raspasy' && factor > (result.dark ? 2 : 1)) notes.push(extra.bombs);
    if (factor > 1) notes.push(extra.times(factor));
    if (result.misereShared) notes.push(extra.shared);
    if (result.dealerSeat !== undefined && seating && seating.sittingOut !== null) notes.push(extra.dealerWhisted(seating.sittingOut));
    if (result.talonPremium) notes.push(extra.premium(Math.round(result.talonPremium * 10) / 10));
    return notes;
}

function resultCore(result: DealResult, names: readonly string[], t: Dictionary, seating?: DealSeating): string {
    const player = (seat: Seat): number => (seating ? seating.players[seat] : seat);
    if (result.redeal) return t.results.redeal;
    if (result.mode === 'raspasy') {
        const parts = result.tricksWon.map((tricks, seat) => `${names[player(seat as Seat)]} ${tricks}`);
        if (seating && seating.sittingOut !== null) parts.push(`${names[seating.sittingOut]} ${result.talonTricks ?? 0}`);
        return t.results.allPass(parts.join(' · '));
    }
    const declarer = result.declarer as Seat;
    const who = player(declarer);
    const tricks = result.tricksWon[declarer];
    if (result.mode === 'misere') return tricks === 0 ? t.results.misereClean(who) : t.results.misereCaught(who, tricks);
    const contract = result.contract;
    if (!contract || contract.kind !== 'game') return names[who];
    const label = bidName(bidOf(contract), t);
    if (result.conceded) return t.results.conceded(who, label, result.conceded);
    if (!result.played) return result.halfWhister !== null ? t.results.halfWhistCounted(who, label) : t.results.nobodyWhisted(who, label);
    const under = contract.level - tricks;
    const defence = otherSeats(declarer).map(seat => result.tricksWon[seat]).reduce((a, b) => a + b, 0);
    return under <= 0 ? t.results.made(who, label, tricks, defence) : t.results.down(who, label, under, tricks);
}

export const levelOfBid = (bid: number): number => {
    const contract = contractOf(bid);
    return contract.kind === 'game' ? contract.level : 0;
};

// [EN] FILE: games/preferans/components/teeth.ts — teeth («зуб», Префклуб МГУ): when a declarer goes down against a
//      whist, he draws a tooth on the sheet towards each whister who set him — a promise to pay it back. It changes no
//      score, so it is read from the deal log, not kept in the engine. Pure, tested without React.
// [RU] ФАЙЛ: зубы («зуб», Префклуб МГУ): когда играющий садится под вист, он рисует на листе зуб в сторону каждого
//      вистующего, который его подсадил, — обещание отплатить. На счёт не влияет, поэтому берётся из журнала раздач, а
//      не хранится в движке. Чистая функция, проверяется без React.
import type { DealLogEntry } from '../hooks/usePreferans';

export interface Tooth {
    /** [EN] The table player who was set. [RU] Игрок стола, которого подсадили. */
    readonly from: number;
    /** [EN] Towards whom the tooth points. [RU] В чью сторону зуб. */
    readonly to: number;
    readonly count: number;
}

export function teethOf(log: readonly Pick<DealLogEntry, 'result' | 'seating'>[]): Tooth[] {
    const counts = new Map<string, Tooth>();
    for (const { result, seating } of log) {
        const contract = result.contract;
        if (result.mode !== 'game' || !result.played || result.declarer === null || contract?.kind !== 'game') continue;
        if (result.tricksWon[result.declarer] >= contract.level) continue;
        const player = (seat: number): number => (seating ? seating.players[seat] : seat);
        const from = player(result.declarer);
        // [EN] The dealer who whisted with a passer's cards set him too. [RU] Сдающий, вистовавший картами спасовавшего, тоже подсадил.
        const setters = result.whisters.map(seat => (result.dealerSeat === seat && seating?.sittingOut != null ? seating.sittingOut : player(seat)));
        for (const to of setters) {
            const key = `${from}>${to}`;
            const old = counts.get(key);
            counts.set(key, { from, to, count: (old?.count ?? 0) + 1 });
        }
    }
    return [...counts.values()].sort((a, b) => a.from - b.from || a.to - b.to);
}

// [EN] FILE: games/preferans/components/sheetHistory.ts — the score sheet as it is written on paper. Every band
//      (pool, mountain, whists on each opponent) keeps its running totals, one entry for each deal that changed
//      it — what players call writing «через точку»: 2 · 6 · 10. Pure, so it is tested without React.
// [RU] ФАЙЛ: запись пули так, как её ведут на бумаге. В каждой полосе (пуля, гора, висты на каждого соперника)
//      копятся нарастающие итоги, по записи на каждую раздачу, которая её изменила, — «через точку»: 2 · 6 · 10.
//      Чистая функция, поэтому проверяется без React.
import type { DealLogEntry } from '../hooks/usePreferans';

export interface SheetEntry {
    /** [EN] Number of the deal that wrote it. [RU] Номер раздачи, которая это записала. */
    readonly deal: number;
    /** [EN] Running total after that deal. [RU] Итог после этой раздачи. */
    readonly total: number;
}
export type Band = readonly SheetEntry[];

export interface SheetHistory {
    readonly pool: readonly Band[];
    readonly mountain: readonly Band[];
    /** [EN] whists[writer][target]. [RU] whists[кто пишет][на кого]. */
    readonly whists: readonly (readonly Band[])[];
    /** [EN] Number of the last written deal, 0 before the first. [RU] Номер последней записанной раздачи, 0 до первой. */
    readonly lastDeal: number;
}

const round = (value: number): number => Math.round(value * 10) / 10;

export function buildSheetHistory(log: readonly DealLogEntry[], players = 3): SheetHistory {
    const seats = Array.from({ length: players }, (_, seat) => seat);
    const pool = seats.map((): SheetEntry[] => []);
    const mountain = seats.map((): SheetEntry[] => []);
    const whists = seats.map(() => seats.map((): SheetEntry[] => []));
    const write = (band: SheetEntry[], deal: number, delta: number): void => {
        if (delta === 0) return;
        const before = band.length > 0 ? band[band.length - 1].total : 0;
        band.push({ deal, total: round(before + delta) });
    };
    for (const entry of log) {
        const score = entry.result.score;
        for (const seat of seats) {
            write(pool[seat], entry.number, score.pool[seat]);
            write(mountain[seat], entry.number, score.mountain[seat]);
            for (const target of seats) if (target !== seat) write(whists[seat][target], entry.number, score.whists[seat][target]);
        }
    }
    return { pool, mountain, whists, lastDeal: log.length > 0 ? log[log.length - 1].number : 0 };
}

/** [EN] The current value of a band (0 while empty). [RU] Текущее значение полосы (0, пока пусто). */
export const bandTotal = (band: Band): number => (band.length > 0 ? band[band.length - 1].total : 0);

/** [EN] Did the last deal write in this band? [RU] Писала ли последняя раздача в эту полосу? */
export const isFresh = (band: Band, lastDeal: number): boolean => lastDeal > 0 && band.length > 0 && band[band.length - 1].deal === lastDeal;

/** [EN] Did the last deal change anything of this player? [RU] Изменила ли последняя раздача что-то у этого игрока? */
export function playerChanged(history: SheetHistory, seat: number): boolean {
    const { lastDeal } = history;
    if (isFresh(history.pool[seat], lastDeal) || isFresh(history.mountain[seat], lastDeal)) return true;
    return history.whists.some((row, writer) => row.some((band, target) => (writer === seat || target === seat) && isFresh(band, lastDeal)));
}

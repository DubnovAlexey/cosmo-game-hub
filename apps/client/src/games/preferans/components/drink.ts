// [EN] FILE: games/preferans/components/drink.ts — how much absinthe is left in the lair (Lair.tsx, Absinthe.tsx).
//      The bottle empties as the pool fills, and a little with every deal, since every deal begins with a pour: a
//      new pool opens a new bottle, and when the pool closes only the last drop is left. Your glass by the bottle is
//      poured at the start of each deal and sipped trick by trick; the host's glass by the right candelabrum lasts
//      two deals. Pure, tested without React.
// [RU] ФАЙЛ: сколько абсента осталось в логове (Lair.tsx, Absinthe.tsx). Бутылка пустеет по мере того, как пишется
//      пуля, и понемногу с каждой раздачей — каждая раздача начинается с того, что наливают: новая пуля открывает
//      новую бутылку, а когда пуля закрыта, остаётся последняя капля. Ваша рюмка у бутылки наливается в начале каждой
//      раздачи и отпивается взятка за взяткой; рюмки хозяина у правого канделябра хватает на две раздачи. Чистая
//      функция, проверяется без React.
import type { DealState } from '../engine/index.ts';

/** [EN] Levels from 0 (empty) to 1 (full to the brim). [RU] Уровни от 0 (пусто) до 1 (до краёв). */
export interface Drink {
    readonly bottle: number;
    /** [EN] Your glass by the bottle, then the host's glass. [RU] Ваша рюмка у бутылки, затем рюмка хозяина. */
    readonly glasses: readonly [number, number];
}

/** [EN] A new pool: the bottle is already opened, the first glasses are poured. [RU] Новая пуля: бутылка уже початая, первые рюмки налиты. */
export const FRESH_BOTTLE = 0.86;
/** [EN] The last drop always stays in the bottle. [RU] Последняя капля всегда остаётся в бутылке. */
export const LAST_DROP = 0.12;
export const FULL_GLASS = 0.9;
export const EMPTY_GLASS = 0.16;
const TRICKS_PER_DEAL = 10;
/** [EN] How many pours empty most of a bottle when the pool itself hardly moves (long all-pass runs). [RU] Сколько розливов осушают бутылку, если сама пуля почти не движется (долгие распасы). */
const POURS = 25;

export interface DrinkInput {
    readonly phase: DealState['phase'];
    /** [EN] Tricks already played in this deal. [RU] Взяток, уже сыгранных в этой раздаче. */
    readonly tricks: number;
    /** [EN] Deals written on the sheet. [RU] Раздач, записанных на лист. */
    readonly deals: number;
    /** [EN] The pool written by everybody, and the total that closes it. [RU] Пуля, написанная всеми, и сумма, которая её закрывает. */
    readonly pool: number;
    readonly closesAt: number;
}

export function drinkOf({ phase, tricks, deals, pool, closesAt }: DrinkInput): Drink {
    const share = closesAt > 0 ? Math.min(1, Math.max(0, pool / closesAt)) : 0;
    // [EN] The pool leads; pours alone may take only 60 % of the bottle. [RU] Ведёт пуля; одни розливы забирают не больше 60 % бутылки.
    const drunk = Math.max(share, 0.6 * (1 - Math.exp(-deals / POURS)));
    const bottle = FRESH_BOTTLE - (FRESH_BOTTLE - LAST_DROP) * drunk;
    const sip = phase === 'done' ? 1 : phase === 'play' ? Math.min(1, tricks / TRICKS_PER_DEAL) : 0;
    // [EN] The finished deal is already on the sheet. [RU] Сыгранная раздача уже на листе.
    const current = phase === 'done' ? Math.max(0, deals - 1) : deals;
    const glass = (part: number): number => FULL_GLASS - (FULL_GLASS - EMPTY_GLASS) * part;
    return { bottle, glasses: [glass(sip), glass(((current % 2) + sip) / 2)] };
}

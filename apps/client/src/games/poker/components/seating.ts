// [EN] FILE: games/poker/components/seating.ts — where everybody sits. Seats go clockwise from you at the bottom, as
//      the action does. The table is a grid of three rows and three columns — the far side (nw, n, ne), the middle
//      row with the board (w, board, e) and the near side (sw, you, se) — and every player gets a named place of it.
//      A grid cannot put one thing on another, so nothing covers anything by construction, whatever the screen, the
//      number of players and the length of the names (the bug of 10.11.2026: cards on the pot, a bet under the cards,
//      a caption past the screen; then, on a computer, a long name over the log of the hand).
//        • A computer and a tablet (`wide`): the side seats stand beside the board, the oval is wide.
//        • A phone (`phone`): the board takes the whole width, so the side seats go to the corners of the far and
//          the near side.
// [RU] ФАЙЛ: кто где сидит. Места идут по часовой стрелке от вас внизу — так же, как ход. Стол — сетка в три ряда и три
//      колонки: дальняя сторона (nw, n, ne), средний ряд с доской (w, доска, e) и ближняя сторона (sw, вы, se), — и
//      каждый игрок получает в ней именованное место. Сетка не умеет класть одно на другое, поэтому ничто ничего не
//      закрывает по построению при любом экране, числе игроков и длине имён (ошибка 10.11.2026: карты на банке,
//      ставка под картами, подпись за экраном; затем на компьютере длинное имя поверх хода раздачи).
//        • Компьютер и планшет (`wide`): боковые места стоят рядом с доской, овал широкий.
//        • Телефон (`phone`): доска занимает всю ширину, поэтому боковые места уходят в углы дальней и ближней
//          стороны.

export type SeatArea = 's' | 'sw' | 'w' | 'nw' | 'n' | 'ne' | 'e' | 'se';

export interface SeatPlace {
    /** [EN] The place on a computer and a tablet. [RU] Место на компьютере и планшете. */
    readonly wide: SeatArea;
    /** [EN] The place on a phone. [RU] Место на телефоне. */
    readonly phone: SeatArea;
}

export const MIN_SEATS = 2;
export const MAX_SEATS = 6;
/** [EN] Round the table clockwise, from you. [RU] Вокруг стола по часовой стрелке, от вас. */
export const CLOCKWISE: readonly SeatArea[] = Object.freeze(['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se']);

// [EN] With two or four at the table somebody sits right opposite you; with three or five the far middle stays free.
// [RU] Когда за столом двое или четверо, кто-то сидит прямо напротив вас; втроём и впятером середина напротив свободна.
const WIDE: Readonly<Record<number, readonly SeatArea[]>> = Object.freeze({
    2: ['s', 'n'],
    3: ['s', 'nw', 'ne'],
    4: ['s', 'w', 'n', 'e'],
    5: ['s', 'w', 'nw', 'ne', 'e'],
    6: ['s', 'w', 'nw', 'n', 'ne', 'e'],
});
const PHONE: Readonly<Record<number, readonly SeatArea[]>> = Object.freeze({
    2: ['s', 'n'],
    3: ['s', 'nw', 'ne'],
    4: ['s', 'nw', 'n', 'ne'],
    5: ['s', 'sw', 'nw', 'ne', 'se'],
    6: ['s', 'sw', 'nw', 'n', 'ne', 'se'],
});

/** [EN] The places of a table of `count` players, seat 0 is you. [RU] Места стола на `count` игроков, место 0 — вы. */
export function seating(count: number): SeatPlace[] {
    const seats = Math.min(MAX_SEATS, Math.max(MIN_SEATS, Math.round(count)));
    return Array.from({ length: seats }, (_, index): SeatPlace => ({ wide: WIDE[seats][index], phone: PHONE[seats][index] }));
}

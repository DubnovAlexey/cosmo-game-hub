// [EN] FILE: games/poker/components/seating.ts — where everybody sits. Seats go clockwise from you at the bottom, as
//      the action does. Two answers come from here, and the styles pick one by the width of the screen.
//        • A computer and a tablet: points on an oval (x and y in per cent of the cloth) and the side of the table the
//          seat is on, which decides where its cards lie (toward the middle).
//        • A phone: one of six named places of a grid with three rows — the far side of the table (nw, n, ne), the
//          board, the near side (sw, you, se). A grid cannot put one thing on another, so on a small screen nothing
//          covers anything by construction (the bug of 11.11.2026: cards on the pot, a caption past the screen).
// [RU] ФАЙЛ: кто где сидит. Места идут по часовой стрелке от вас внизу — так же, как ход. Отсюда выходят два ответа,
//      и стили выбирают один по ширине экрана.
//        • Компьютер и планшет: точки на овале (x и y в процентах сукна) и сторона стола, на которой стоит место; она
//          решает, куда ложатся его карты (к середине).
//        • Телефон: одно из шести именованных мест сетки в три ряда — дальняя сторона стола (nw, n, ne), доска,
//          ближняя сторона (sw, вы, se). Сетка не умеет класть одно на другое, поэтому на маленьком экране ничто
//          ничего не закрывает по построению (ошибка 11.11.2026: карты на банке, подпись за экраном).

export type SeatSide = 'west' | 'east' | 'north' | 'south';
export type SeatArea = 's' | 'sw' | 'nw' | 'n' | 'ne' | 'se';

export interface SeatPlace {
    /** [EN] Per cent of the cloth, for the oval. [RU] Проценты сукна, для овала. */
    readonly x: number;
    readonly y: number;
    readonly side: SeatSide;
    /** [EN] The place of the phone's grid. [RU] Место в сетке телефона. */
    readonly area: SeatArea;
}

export const MIN_SEATS = 2;
export const MAX_SEATS = 6;

// [EN] The far side fills first: with two or four at the table somebody sits right opposite you.
// [RU] Сначала заполняется дальняя сторона: когда за столом двое или четверо, кто-то сидит прямо напротив вас.
const PHONE_AREAS: Readonly<Record<number, readonly SeatArea[]>> = Object.freeze({
    2: ['s', 'n'],
    3: ['s', 'nw', 'ne'],
    4: ['s', 'nw', 'n', 'ne'],
    5: ['s', 'sw', 'nw', 'ne', 'se'],
    6: ['s', 'sw', 'nw', 'n', 'ne', 'se'],
});

/**
 * [EN] `narrow` — a tablet upright: its margins are thin, so the side seats move in and nothing sticks out past the
 *      screen (an overflow widens the page and makes a tap land below its target).
 * [RU] `narrow` — планшет стоя: поля у него тонкие, поэтому боковые места сдвигаются внутрь и ничего не выходит за
 *      экран (выступ расширяет страницу, и касание попадает ниже цели).
 */
export function seating(count: number, narrow = false): SeatPlace[] {
    const seats = Math.min(MAX_SEATS, Math.max(MIN_SEATS, Math.round(count)));
    const rx = narrow ? 37 : 45;
    const ry = 41;
    return Array.from({ length: seats }, (_, index): SeatPlace => {
        const angle = ((90 + (index * 360) / seats) * Math.PI) / 180;
        const x = 50 + rx * Math.cos(angle);
        const y = 50 + ry * Math.sin(angle);
        const side: SeatSide = index === 0 ? 'south' : x < 35 ? 'west' : x > 65 ? 'east' : 'north';
        return { x, y, side, area: PHONE_AREAS[seats][index] };
    });
}

// [EN] FILE: shared/utils/placeBeside.ts — where a floating card stands next to the thing it tells about (a hero's
//      card beside a small portrait in a list): to the right of it when there is room, else to the left, else under
//      or over it — and always whole on the screen. Pure arithmetic without the DOM, so the tests check it directly;
//      shared/components/CharacterPeek.tsx measures the real card and applies the answer.
// [RU] ФАЙЛ: где встаёт всплывающая карточка рядом с тем, о чём она рассказывает (карточка героя рядом с маленьким
//      портретом в списке): справа, если есть место, иначе слева, иначе под или над ним — и всегда целиком на экране.
//      Чистая арифметика без DOM, поэтому тесты проверяют её напрямую; shared/components/CharacterPeek.tsx измеряет
//      настоящую карточку и применяет ответ.

export interface Box { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number }
export interface Size { readonly width: number; readonly height: number }

const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));

/**
 * [EN] The top-left corner of a card of `size` that grows out of `anchor`: its picture (`inset` from the card's corner)
 *      starts where the small portrait is, and the card stays whole on the screen.
 * [RU] Левый верхний угол карточки размера `size`, которая вырастает из `anchor`: её картинка (`inset` от угла
 *      карточки) начинается там, где маленький портрет, а карточка целиком остаётся на экране.
 */
export function placeOver(anchor: Box, size: Size, screen: Size, inset = 14, margin = 8): { left: number; top: number } {
    return {
        left: clamp(anchor.left - inset, margin, Math.max(margin, screen.width - margin - size.width)),
        top: clamp(anchor.top - inset, margin, Math.max(margin, screen.height - margin - size.height)),
    };
}

/** [EN] The top-left corner of a card of `size` beside `anchor` on a `screen`. [RU] Левый верхний угол карточки размера `size` рядом с `anchor` на экране `screen`. */
export function placeBeside(anchor: Box, size: Size, screen: Size, gap = 10, margin = 8): { left: number; top: number } {
    const middle = (anchor.top + anchor.bottom) / 2 - size.height / 2;
    const top = clamp(middle, margin, Math.max(margin, screen.height - margin - size.height));
    if (screen.width - anchor.right >= size.width + gap + margin) return { left: anchor.right + gap, top };
    if (anchor.left >= size.width + gap + margin) return { left: anchor.left - gap - size.width, top };
    // [EN] No room at either side (a phone): under the anchor, or over it when the bottom is near.
    // [RU] По бокам места нет (телефон): под якорем или над ним, если низ экрана близко.
    const left = clamp((anchor.left + anchor.right) / 2 - size.width / 2, margin, Math.max(margin, screen.width - margin - size.width));
    const below = screen.height - anchor.bottom >= size.height + gap + margin;
    return { left, top: below ? anchor.bottom + gap : Math.max(margin, anchor.top - gap - size.height) };
}

// [EN] FILE: shared/hooks/useKeepOnScreen.ts — keeps a caption that opens beside something (a character's biography
//      under a portrait at the preferans table, a regular's line at the poker table) inside the screen. The caption
//      is placed by CSS next to its owner; right after it opens, and whenever the window changes, the hook measures
//      it and writes how far to move it sideways into the CSS variable --shift (the caption's own rule adds it with
//      `translate: var(--shift, 0px) 0`). Without it a caption of a seat at the edge of a phone ran off the screen
//      (Alexey, 11.11.2026).
// [RU] ФАЙЛ: держит подпись, которая раскрывается рядом с чем-то (биография героя под портретом за столом преферанса,
//      реплика завсегдатая за покерным столом), внутри экрана. Подпись ставит рядом с хозяином CSS; сразу после
//      раскрытия и при любом изменении окна хук измеряет её и пишет в CSS-переменную --shift, на сколько сдвинуть её
//      вбок (собственное правило подписи прибавляет сдвиг через `translate: var(--shift, 0px) 0`). Без этого подпись
//      места у края телефона уезжала за экран (Алексей, 11.11.2026).
import { useLayoutEffect, type RefObject } from 'react';

/** [EN] How far a box must move sideways to lie inside a screen with margins. [RU] На сколько сдвинуть рамку вбок, чтобы она легла внутрь экрана с полями. */
export function shiftIntoView(left: number, right: number, screenWidth: number, margin: number): number {
    // [EN] A caption wider than the screen keeps its left edge in sight: reading starts there.
    // [RU] Подпись шире экрана оставляет на виду левый край: с него начинают читать.
    if (right - left > screenWidth - margin * 2) return margin - left;
    if (right > screenWidth - margin) return screenWidth - margin - right;
    if (left < margin) return margin - left;
    return 0;
}

/**
 * [EN] `open` says whether the caption is shown now; `key` changes when its content does (another character).
 * [RU] `open` — показана ли подпись сейчас; `key` меняется вместе с её содержимым (другой герой).
 */
export function useKeepOnScreen(caption: RefObject<HTMLElement | null>, open: boolean, key: unknown = null, margin = 8): void {
    useLayoutEffect(() => {
        const element = caption.current;
        if (!open || !element) return;
        const place = () => {
            // [EN] The opening animation scales the caption; it is measured at rest, then the animation starts again.
            // [RU] Анимация раскрытия масштабирует подпись; она измеряется в покое, затем анимация начинается заново.
            const animation = element.style.animation;
            element.style.animation = 'none';
            element.style.setProperty('--shift', '0px');
            const box = element.getBoundingClientRect();
            element.style.animation = animation;
            const shift = shiftIntoView(box.left, box.right, document.documentElement.clientWidth, margin);
            element.style.setProperty('--shift', `${Math.round(shift)}px`);
        };
        place();
        window.addEventListener('resize', place);
        return () => window.removeEventListener('resize', place);
    }, [caption, open, key, margin]);
}

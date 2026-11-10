// [EN] FILE: shared/hooks/useKeepOnScreen.ts — keeps a caption that opens beside something (a character's biography
//      under a portrait at the preferans table, a regular's line at the poker table) inside the screen. CSS places
//      the caption by its anchor (under its left edge, under its right edge or centred) and adds the CSS variable
//      --shift with `translate`; the hook writes into it how far to move the caption sideways.
//      The sum is done BEFORE the caption ever stands in its own place: for the moment of measuring it is pinned to
//      the corner of the screen, invisible. Even one layout with the caption past the edge makes a phone browser
//      zoom the whole page out to fit it — and the page stays zoomed out after the caption has moved back (seen on
//      10.11.2026: a table 320 px wide became 367). Without the hook a caption of a seat at the edge of a phone ran
//      off the screen (Alexey, 10.11.2026).
// [RU] ФАЙЛ: держит подпись, которая раскрывается рядом с чем-то (биография героя под портретом за столом преферанса,
//      реплика завсегдатая за покерным столом), внутри экрана. CSS ставит подпись по якорю (под его левым краем,
//      под правым или по центру) и прибавляет через `translate` CSS-переменную --shift; хук пишет в неё, на сколько
//      сдвинуть подпись вбок.
//      Расчёт делается ДО того, как подпись хоть раз встанет на своё место: на время измерения она приколота к углу
//      экрана невидимой. Даже одна раскладка с подписью за краем заставляет браузер телефона уменьшить всю
//      страницу, чтобы её вместить, — и страница остаётся уменьшенной после того, как подпись вернулась (замечено
//      10.11.2026: стол шириной 320 px стал 367). Без хука подпись места у края телефона уезжала за экран
//      (Алексей, 10.11.2026).
import { useLayoutEffect, type RefObject } from 'react';
import { shiftIntoView } from '../utils/shiftIntoView.ts';

/** [EN] Which edge of the anchor the caption's CSS puts it by. [RU] У какого края якоря подпись ставит её CSS. */
export type CaptionSide = 'start' | 'end' | 'center';

/**
 * [EN] `open` says whether the caption is shown now; `key` changes when its content does (another character).
 *      `anchor` is the box the caption's CSS is placed against (its positioned parent).
 * [RU] `open` — показана ли подпись сейчас; `key` меняется вместе с её содержимым (другой герой). `anchor` — рамка,
 *      относительно которой подпись ставит её CSS (её позиционированный родитель).
 */
export function useKeepOnScreen(
    caption: RefObject<HTMLElement | null>, anchor: RefObject<HTMLElement | null>, open: boolean, key: unknown = null, side: CaptionSide = 'center', margin = 8,
): void {
    useLayoutEffect(() => {
        const element = caption.current;
        const base = anchor.current;
        if (!open || !element || !base) return;
        const place = () => {
            // [EN] Pinned to the corner and unseen: the width can be read, and nothing sticks out meanwhile.
            // [RU] Приколота к углу и не видна: ширину можно прочитать, и ничего при этом не торчит.
            const style = element.style;
            const before = { position: style.position, left: style.left, right: style.right, top: style.top, visibility: style.visibility, translate: style.translate, animation: style.animation };
            style.position = 'fixed';
            style.left = '0';
            style.right = 'auto';
            style.top = '0';
            style.visibility = 'hidden';
            style.translate = 'none';
            style.animation = 'none';
            const width = element.offsetWidth;
            const box = base.getBoundingClientRect();
            const left = side === 'start' ? box.left : side === 'end' ? box.right - width : box.left + box.width / 2 - width / 2;
            style.setProperty('--shift', `${Math.round(shiftIntoView(left, left + width, document.documentElement.clientWidth, margin))}px`);
            Object.assign(style, before);
        };
        place();
        window.addEventListener('resize', place);
        return () => window.removeEventListener('resize', place);
    }, [caption, anchor, open, key, side, margin]);
}

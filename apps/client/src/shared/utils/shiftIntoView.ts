// [EN] FILE: shared/utils/shiftIntoView.ts — one small sum for every caption that opens beside something (a biography
//      under a portrait, a line of a regular): how far to move a box sideways so it lies inside the screen with a
//      margin. Pure arithmetic without the DOM, so the tests check it directly; shared/hooks/useKeepOnScreen.ts
//      measures the real caption and applies the answer.
// [RU] ФАЙЛ: одно маленькое вычисление для любой подписи, которая раскрывается рядом с чем-то (биография под
//      портретом, реплика завсегдатая): на сколько сдвинуть рамку вбок, чтобы она легла внутрь экрана с полем.
//      Чистая арифметика без DOM, поэтому тесты проверяют её напрямую; shared/hooks/useKeepOnScreen.ts измеряет
//      настоящую подпись и применяет ответ.

/**
 * [EN] `left` and `right` are the edges of the box in screen pixels. The answer is added to its place: negative
 *      moves it left, positive right, zero leaves it alone.
 * [RU] `left` и `right` — края рамки в пикселях экрана. Ответ прибавляется к её месту: отрицательный сдвигает влево,
 *      положительный вправо, ноль оставляет на месте.
 */
export function shiftIntoView(left: number, right: number, screenWidth: number, margin = 8): number {
    // [EN] A box wider than the screen keeps its left edge in sight: reading starts there.
    // [RU] Рамка шире экрана оставляет на виду левый край: с него начинают читать.
    if (right - left > screenWidth - margin * 2) return margin - left;
    if (right > screenWidth - margin) return screenWidth - margin - right;
    if (left < margin) return margin - left;
    return 0;
}

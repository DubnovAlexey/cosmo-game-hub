// [EN] FILE: shell/utils/coverCycle.ts — the living covers of the catalog (shell/components/GameCard.astro): a card
//      with our own variants beside its cover (Alexey, 12.11.2026: «мы дополним существующие своими вариантами»)
//      slowly dissolves from one picture to the next and back to the cover. The cards do not change all at once —
//      each starts a little later than the one before. A hidden tab and «reduce motion» keep the cover still.
// [RU] ФАЙЛ: живые обложки каталога (shell/components/GameCard.astro): карточка, у которой рядом с обложкой есть
//      наши варианты (Алексей, 12.11.2026: «мы дополним существующие своими вариантами»), медленно перетекает от
//      одной картинки к следующей и обратно к обложке. Карточки меняются не все сразу — каждая начинает чуть позже
//      предыдущей. Скрытая вкладка и «уменьшить движение» оставляют обложку на месте.

/** [EN] How long one picture stays, ms. [RU] Сколько держится одна картинка, мс. */
export const COVER_STAY = 7000;
/** [EN] The delay between the starts of two neighbouring cards, ms. [RU] Задержка между стартами соседних карточек, мс. */
export const COVER_STAGGER = 1100;

/** [EN] The picture that follows `shown` of `count`: round and round, the cover first. [RU] Картинка после `shown` из `count`: по кругу, обложка первая. */
export const nextCover = (shown: number, count: number): number => (count > 0 ? (shown + 1) % count : 0);

/** [EN] Starts every stack of covers on the page. [RU] Запускает все стопки обложек на странице. */
export function startCoverCycle(): void {
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    document.querySelectorAll<HTMLElement>('[data-cover-stack]').forEach((stack, index) => {
        const pictures = [...stack.querySelectorAll<HTMLImageElement>('img')];
        if (pictures.length < 2) return;
        let shown = 0;
        const step = () => {
            if (document.hidden) return;
            const next = nextCover(shown, pictures.length);
            // [EN] a picture not loaded yet waits for the next turn / [RU] ещё не загруженная картинка ждёт следующего раза
            if (!pictures[next].complete) return;
            pictures[shown].classList.remove('is-shown');
            pictures[next].classList.add('is-shown');
            shown = next;
        };
        window.setTimeout(() => window.setInterval(step, COVER_STAY), index * COVER_STAGGER);
    });
}

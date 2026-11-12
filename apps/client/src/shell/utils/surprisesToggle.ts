// [EN] FILE: shell/utils/surprisesToggle.ts — the 🦇 button in the header of the hub: switches the «surprises» of
//      every game on and off (shared/surprises). The choice is saved for the whole site and reaches an open game at
//      once through one window event; another tab learns it from the storage event. aria-pressed tells a screen
//      reader whether they are on; the crossed look tells the eye.
// [RU] ФАЙЛ: кнопка 🦇 в шапке хаба: включает и выключает «неожиданности» во всех играх (shared/surprises). Выбор
//      сохраняется на весь сайт и сразу доходит до открытой игры через одно событие окна; другая вкладка узнаёт его
//      из события хранилища. aria-pressed говорит экранному диктору, включены ли они; зачёркнутый вид — глазу.
import { SURPRISES_EVENT, SURPRISES_KEY, surprisesEnabled } from '@shared/surprises/logic';

function read(): boolean {
    try {
        return surprisesEnabled(globalThis.localStorage?.getItem(SURPRISES_KEY) ?? null);
    } catch {
        return true;
    }
}

function write(on: boolean): void {
    try {
        if (on) globalThis.localStorage?.removeItem(SURPRISES_KEY);
        else globalThis.localStorage?.setItem(SURPRISES_KEY, 'off');
    } catch {
        // [EN] no storage (private mode): the choice lives until the page closes / [RU] нет хранилища: выбор живёт до закрытия страницы
    }
}

function show(on: boolean): void {
    document.querySelectorAll<HTMLButtonElement>('button[data-surprises-toggle]').forEach(button => {
        button.setAttribute('aria-pressed', String(on));
        button.dataset.on = String(on);
    });
}

/** [EN] Shows the saved choice and follows clicks and other tabs. [RU] Показывает сохранённый выбор и следит за нажатиями и другими вкладками. */
export function startSurprisesToggle(): void {
    let on = read();
    show(on);
    document.querySelectorAll<HTMLButtonElement>('button[data-surprises-toggle]').forEach(button => {
        button.addEventListener('click', () => {
            on = !on;
            write(on);
            show(on);
            window.dispatchEvent(new CustomEvent(SURPRISES_EVENT, { detail: on }));
        });
    });
    window.addEventListener('storage', event => {
        if (event.key !== SURPRISES_KEY) return;
        on = read();
        show(on);
    });
}

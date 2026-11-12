// [EN] FILE: shell/utils/soundToggle.ts — the 🔊 button in the header of the hub: switches on and off the sounds and
//      the voices at the end of a game (shared/finale). The choice is saved for the whole site; an open game reads it
//      at the moment it plays; another tab learns it from the storage event. aria-pressed tells a screen reader
//      whether the sound is on; the crossed look tells the eye.
// [RU] ФАЙЛ: кнопка 🔊 в шапке хаба: включает и выключает звуки и голоса в конце партии (shared/finale). Выбор
//      сохраняется на весь сайт; открытая игра читает его в момент, когда играет; другая вкладка узнаёт его из события
//      хранилища. aria-pressed говорит экранному диктору, включён ли звук; зачёркнутый вид — глазу.
import { SOUND_EVENT, SOUND_KEY, soundEnabled } from '@shared/finale/logic';

function read(): boolean {
    try {
        return soundEnabled(globalThis.localStorage?.getItem(SOUND_KEY) ?? null);
    } catch {
        return true;
    }
}

function write(on: boolean): void {
    try {
        if (on) globalThis.localStorage?.removeItem(SOUND_KEY);
        else globalThis.localStorage?.setItem(SOUND_KEY, 'off');
    } catch {
        // [EN] no storage (private mode): the choice lives until the page closes / [RU] нет хранилища: выбор живёт до закрытия страницы
    }
}

function show(on: boolean): void {
    document.querySelectorAll<HTMLButtonElement>('button[data-sound-toggle]').forEach(button => {
        button.setAttribute('aria-pressed', String(on));
        button.dataset.on = String(on);
    });
}

/** [EN] Shows the saved choice and follows clicks and other tabs. [RU] Показывает сохранённый выбор и следит за нажатиями и другими вкладками. */
export function startSoundToggle(): void {
    let on = read();
    show(on);
    document.querySelectorAll<HTMLButtonElement>('button[data-sound-toggle]').forEach(button => {
        button.addEventListener('click', () => {
            on = !on;
            write(on);
            show(on);
            if (!on) globalThis.speechSynthesis?.cancel();
            window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: on }));
        });
    });
    window.addEventListener('storage', event => {
        if (event.key !== SOUND_KEY) return;
        on = read();
        show(on);
    });
}

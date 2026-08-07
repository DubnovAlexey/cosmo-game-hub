// [EN] Initialize AudioContext variable outside the function to reuse it
// [RU] Инициализируем переменную AudioContext вне функции для её переиспользования
let audioCtx: AudioContext | null = null;

export const playSnapSound = (): void => {
    // [EN] Check if we are in a browser environment (important for SSR frameworks like Astro)
    // [RU] Проверяем, находимся ли мы в среде браузера (важно для SSR-фреймворков вроде Astro)
    if (typeof window === 'undefined') return;

    // [EN] Trigger subtle haptic feedback for mobile devices (mostly Android)
    // [RU] Запускаем легкий тактильный отклик для мобильных устройств (в основном Android)
    if (navigator.vibrate) {
        navigator.vibrate(10); // 10ms vibration
    }

    try {
        // [EN] Create AudioContext only on first user interaction to comply with browser policies
        // [RU] Создаем AudioContext только при первом взаимодействии пользователя согласно политикам браузеров
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // [EN] Resume context if it was suspended by the browser
        // [RU] Возобновляем контекст, если он был приостановлен браузером
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // [EN] Create an oscillator and a gain node (volume control)
        // [RU] Создаем осциллятор и узел усиления (контроль громкости)
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        // [EN] Configure a short, percussive click sound
        // [RU] Настраиваем короткий, ударный звук щелчка
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);

        // [EN] Shape the volume envelope for a quick fade out
        // [RU] Формируем огибающую громкости для быстрого затухания
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

        // [EN] Connect nodes and play the sound
        // [RU] Соединяем узлы и воспроизводим звук
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
    } catch (error) {
        console.error('Audio playback failed:', error);
    }
};

// [EN] NEW: real chess move sound effects, loaded from the project's own audio assets rather than
// synthesized like playSnapSound above. `?url` forces Vite to hand back a plain string URL — same
// fix as the piece images in chessPieces.ts, applied defensively here too even though Astro's
// object-wrapping behavior is specifically an image thing, just to remove any doubt.
// [RU] НОВОЕ: настоящие звуковые эффекты ходов, загруженные из собственных аудио-ассетов проекта,
// а не синтезированные, как playSnapSound выше. `?url` заставляет Vite вернуть простую строку URL —
// тот же фикс, что и для картинок фигур в chessPieces.ts, применён и здесь для подстраховки, хотя
// оборачивание в объект у Astro — это именно про картинки.
import moveSfx from '@assets/sounds/chess/move.mp3?url';
import captureSfx from '@assets/sounds/chess/capture.mp3?url';
import checkSfx from '@assets/sounds/chess/check.mp3?url';
import endSfx from '@assets/sounds/chess/end.mp3?url';

export type ChessSoundKind = 'move' | 'capture' | 'check' | 'end';

const CHESS_SOUND_URLS: Record<ChessSoundKind, string> = {
    move: moveSfx,
    capture: captureSfx,
    check: checkSfx,
    end: endSfx,
};

// [EN] Plays one of the four real chess sound effects. A fresh Audio() instance per call is
// deliberate — it lets back-to-back cues (e.g. a capture that also gives check) overlap cleanly
// instead of one call cutting off a previous still-playing sound.
// [RU] Проигрывает один из четырёх настоящих звуковых эффектов шахмат. Создание нового Audio()
// при каждом вызове — осознанное решение: это позволяет идущим подряд сигналам (например, взятие,
// которое ещё и объявляет шах) чисто накладываться друг на друга, а не обрывать предыдущий звук.
export const playChessSound = (kind: ChessSoundKind): void => {
    if (typeof window === 'undefined') return;

    try {
        const audio = new Audio(CHESS_SOUND_URLS[kind]);
        // [EN] Autoplay can be blocked before any user interaction with the page — safe to ignore here,
        // since by the time a move happens the player has already interacted (clicked a square)
        // [RU] Автовоспроизведение может быть заблокировано до первого взаимодействия со страницей —
        // здесь это безопасно игнорировать, так как к моменту хода игрок уже кликнул по клетке
        audio.play().catch(() => {});
    } catch (error) {
        console.error('Chess sound playback failed:', error);
    }
};
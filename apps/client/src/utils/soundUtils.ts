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
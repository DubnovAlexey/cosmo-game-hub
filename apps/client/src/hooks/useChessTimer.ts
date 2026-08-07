// [EN] Import React hooks for state, side effects, and a mutable ref that survives re-renders
// [RU] Импортируем хуки React для состояния, побочных эффектов и мутируемого ref, переживающего ре-рендеры
import { useState, useEffect, useRef } from 'react';

// [EN] Matches the 'White' | 'Black' UI contract already used by TimerPanel / ChessTimer / GameOverOverlay
// callers, rather than introducing a third color representation alongside chess.js's own 'w' | 'b'
// [RU] Соответствует UI-контракту 'White' | 'Black', уже используемому TimerPanel / ChessTimer, — вместо
// того чтобы вводить третье представление цвета рядом с собственным 'w' | 'b' из chess.js
export type TimerPlayer = 'White' | 'Black';

interface UseChessTimerOptions {
    // [EN] Whose clock should currently be ticking down. null means neither — before the first move,
    // paused, or the match is over
    // [RU] Чьи часы должны сейчас идти. null означает "ничьи" — до первого хода, на паузе,
    // или партия окончена
    activePlayer: TimerPlayer | null;
    // [EN] Starting time for both sides, in seconds
    // [RU] Стартовое время для обеих сторон, в секундах
    initialSeconds: number;
    // [EN] Called exactly once, the instant the active side's clock reaches zero
    // [RU] Вызывается ровно один раз, в момент когда часы активной стороны доходят до нуля
    onTimeOut: (player: TimerPlayer) => void;
}

interface UseChessTimerResult {
    whiteSeconds: number;
    blackSeconds: number;
}

// [EN] Owns the actual countdown for both clocks. Deliberately separate from useChessLogic (which only
// knows chess rules, not wall-clock time) so that ticking every second re-renders only whatever component
// calls this hook — not the whole game tree. Call it from TimerPanel, not from ChessGame, to keep the
// per-second re-render scoped to the timer cards and away from the (much heavier) board.
// [RU] Владеет самим отсчётом для обоих таймеров. Намеренно отделён от useChessLogic (который знает только
// правила шахмат, а не настенное время), чтобы тиканье раз в секунду перерендеривало только тот компонент,
// который вызывает этот хук, — а не всё дерево игры. Вызывайте его из TimerPanel, а не из ChessGame, чтобы
// ре-рендер раз в секунду был ограничен карточками таймера и не задевал (гораздо более тяжёлую) доску.
export const useChessTimer = ({ activePlayer, initialSeconds, onTimeOut }: UseChessTimerOptions): UseChessTimerResult => {
    const [whiteSeconds, setWhiteSeconds] = useState(initialSeconds);
    const [blackSeconds, setBlackSeconds] = useState(initialSeconds);

    // [EN] Guards onTimeOut against firing more than once per clock reaching zero — protects against the
    // effect below re-running if the caller passes a fresh onTimeOut reference on an unrelated re-render
    // [RU] Защищает onTimeOut от повторного срабатывания на одно и то же обнуление часов — страхует от
    // повторного запуска эффекта ниже, если вызывающий код передаёт новую ссылку onTimeOut на несвязанном ре-рендере
    const hasFiredRef = useRef(false);

    // [EN] Ticking: (re)starts an interval whenever the active side changes (including going to null,
    // e.g. before the first move or once the match ends), decrementing only that side's clock. The
    // updater stays pure — no side effects here; timeout detection lives in the effect below. Cleanup
    // clears the interval both on dependency change and on unmount (no leaked timers).
    // [RU] Тиканье: (пере)запускает интервал при смене активной стороны (в том числе в null — до первого
    // хода или после конца партии), уменьшая счётчик только этой стороны. Обновитель остаётся чистым —
    // без побочных эффектов; обнаружение просрочки — в эффекте ниже. Очистка убирает интервал и при
    // смене зависимостей, и при размонтировании (без утечек таймеров).
    useEffect(() => {
        if (!activePlayer) return;

        hasFiredRef.current = false; // [EN] fresh turn, fresh clock [RU] новый ход — новые часы

        const setActiveSeconds = activePlayer === 'White' ? setWhiteSeconds : setBlackSeconds;
        const intervalId = setInterval(() => {
            setActiveSeconds((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(intervalId);
    }, [activePlayer]);

    // [EN] Timeout detection: fires onTimeOut exactly once when the active side's clock reaches 0
    // [RU] Обнаружение просрочки: вызывает onTimeOut ровно один раз, когда время активной стороны дошло до 0
    useEffect(() => {
        if (!activePlayer || hasFiredRef.current) return;

        const activeSeconds = activePlayer === 'White' ? whiteSeconds : blackSeconds;
        if (activeSeconds === 0) {
            hasFiredRef.current = true;
            onTimeOut(activePlayer);
        }
    }, [activePlayer, whiteSeconds, blackSeconds, onTimeOut]);

    return { whiteSeconds, blackSeconds };
};
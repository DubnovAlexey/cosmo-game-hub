// [EN] Import React and necessary hooks for state and side effects
// [RU] Импортируем React и необходимые хуки для состояния и побочных эффектов
import React, { useState, useEffect } from 'react';

// [EN] Define the props interface for the timer component
// [RU] Определяем интерфейс пропсов для компонента таймера
export interface ChessTimerProps {
    player: 'White' | 'Black';
    isActive: boolean;
    initialSeconds: number;
    onTimeOut: (player: 'White' | 'Black') => void;
}

export const ChessTimer: React.FC<ChessTimerProps> = ({ player, isActive, initialSeconds, onTimeOut }) => {
    // [EN] Local state to track remaining time in seconds
    // [RU] Локальное состояние для отслеживания оставшегося времени в секундах
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

    // [EN] Handle timer countdown logic using side effects
    // [RU] Обработка логики обратного отсчета таймера с использованием побочных эффектов
    useEffect(() => {
        // [EN] Do not start interval if timer is not active or time is already up
        // [RU] Не запускаем интервал, если таймер не активен или время уже вышло
        if (!isActive || secondsLeft <= 0) return;

        // [EN] Set up an interval to decrease time every second
        // [RU] Устанавливаем интервал для уменьшения времени каждую секунду
        const timerId = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    onTimeOut(player);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // [EN] Cleanup function to prevent memory leaks on unmount or dependency change
        // [RU] Функция очистки для предотвращения утечек памяти при размонтировании или изменении зависимостей
        return () => clearInterval(timerId);
    }, [isActive, secondsLeft, player, onTimeOut]);

    // [EN] Format total seconds into MM:SS format
    // [RU] Форматируем общее количество секунд в формат MM:SS
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    return (
        // [EN] Conditional styling based on whether this timer is currently active
        // [RU] Условная стилизация в зависимости от того, активен ли этот таймер в данный момент
        <div className={`p-4 rounded-lg border-2 flex justify-between items-center transition-colors duration-300
            ${isActive
            ? 'bg-amber-500 text-slate-900 border-amber-400 shadow-lg'
            : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}
        >
            <span className="font-bold uppercase tracking-wider">{player}</span>
            <span className="text-2xl font-mono font-bold">{formattedTime}</span>
        </div>
    );
};
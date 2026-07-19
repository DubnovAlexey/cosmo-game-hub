// [EN] Import React, useState hook, and components using Path Aliases
// [RU] Импортируем React, хук useState и компоненты, используя псевдонимы путей
import React, { useState } from 'react';
import { ChessBoard } from '@components/games/chess/ChessBoard';
import { DifficultySelector } from '@components/games/chess/DifficultySelector';
import { TimerPanel } from '@components/games/chess/TimerPanel';
import { useChessLogic } from '@hooks/useChessLogic';

export const ChessGame: React.FC = () => {
    // [EN] Extract board, move handler, and current turn from the engines hook
    // [RU] Извлекаем доску, обработчик ходов и текущий ход из хука движка
    const { board, makeMove: handleMove, turn } = useChessLogic();

    // [EN] Initialize local state for difficulty level
    // [RU] Инициализируем локальное состояние для уровня сложности
    const [difficulty, setDifficulty] = useState<number>(1);
    // [EN] Map the engines's turn format ('w'/'b') to our TimerPanel format ('White'/'Black')
    // [RU] Преобразуем формат хода движка ('w'/'b') в формат для TimerPanel ('White'/'Black')
    const currentPlayer = turn === 'b' ? 'Black' : 'White';

    // [EN] Handler for timer timeout event
    // [RU] Обработчик события истечения времени таймера
    const handleTimeOut = (player: 'White' | 'Black') => {
        console.log(`Time is out for ${player}!`);
        // We will add game over logic here later
    };

    return (
        // [EN] Main Grid Layout
        // [RU] Главная сеточная компоновка
        <div className="w-full h-full grid grid-cols-1 lg:grid-cols-[300px_auto_300px] gap-8 items-start justify-center p-4">

            {/* [EN] Left Sidebar: Engine Settings and Timers */}
            {/* [RU] Левая боковая панель: Настройки движка и Таймеры */}
            <aside className="bg-slate-900 border-2 border-slate-700 rounded-xl p-6 shadow-2xl flex flex-col gap-6 min-h-[500px]">
                <h2 className="text-amber-500 font-bold text-xl uppercase tracking-widest border-b-2 border-slate-700 pb-2">
                    Game Controls
                </h2>

                <DifficultySelector currentDifficulty={difficulty} onSelect={setDifficulty} />

                {/* [EN] Inject the TimerPanel with the current player state */}
                {/* [RU] Внедряем TimerPanel с состоянием текущего игрока */}
                <TimerPanel currentPlayer={currentPlayer} onTimeOut={handleTimeOut} />
            </aside>

            {/* [EN] Center: The Chess Board Wrapper */}
            {/* [RU] Центр: Обертка для шахматной доски */}
            <div className="w-full flex items-center justify-center">
                <div className="w-full max-w-[700px] aspect-square">
                    <ChessBoard board={board} onMove={handleMove} />
                </div>
            </div>

            {/* [EN] Right Sidebar: Match Stats */}
            {/* [RU] Правая боковая панель: Статистика матча */}
            <aside className="bg-slate-900 border-2 border-slate-700 rounded-xl p-6 shadow-2xl flex flex-col gap-4 min-h-[500px]">
                <h2 className="text-amber-500 font-bold text-xl uppercase tracking-widest border-b-2 border-slate-700 pb-2">
                    Match Stats
                </h2>
                <div className="flex flex-col gap-2">
                    <div className="text-slate-400 italic">Captured Pieces</div>
                    <div className="text-slate-400 italic">Move History</div>
                </div>
            </aside>
        </div>
    );
};
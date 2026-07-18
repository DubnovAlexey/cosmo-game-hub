// [EN] Import React and necessary components
// [RU] Импортируем React и необходимые компоненты
import React from 'react';
import { ChessBoard } from './ChessBoard';
import { useChessLogic } from '@/hooks/useChessLogic.ts';
import { GameOverOverlay } from '../shared/GameOverOverlay';

export const ChessGame: React.FC = () => {
    // [EN] Destructure game state and core methods from our custom hook
    // [RU] Деструктурируем состояние игры и основные методы из нашего пользовательского хука
    const { board, makeMove, gameStatus, resetGame } = useChessLogic();

    return (
        // [EN] Main wrapper for the game view
        // [RU] Главная обертка для игрового вида
        <div className="relative w-full max-w-3xl mx-auto p-4 flex flex-col items-center">

            {/* [EN] Header / Game Title */}
            {/* [RU] Заголовок игры */}
            <h1 className="text-3xl font-bold text-slate-100 mb-6 uppercase tracking-widest drop-shadow-md">
                Cosmo Chess
            </h1>

            {/* [EN] The core game board container */}
            {/* [RU] Основной контейнер игровой доски */}
            <div className="relative w-full aspect-square border-4 border-slate-800 rounded-lg overflow-hidden shadow-2xl">

                <ChessBoard
                    board={board}
                    onMove={makeMove}
                />

                {/* [EN] Conditional Rendering for Game Over state */}
                {/* [RU] Условный рендеринг для состояния окончания игры */}
                {gameStatus !== 'active' && (
                    <GameOverOverlay status={gameStatus}>
                        {/* [EN] Injecting slot content based on status */}
                        {/* [RU] Внедряем контент слота в зависимости от статуса */}
                        <div className="text-xl font-medium">
                            {gameStatus === 'win'
                                ? 'The enemy king is crushed. Excellent strategy.'
                                : gameStatus === 'lose'
                                    ? 'Your forces have been annihilated. Pathetic.'
                                    : 'A sterile draw. Nobody wins.'}
                        </div>
                    </GameOverOverlay>
                )}

            </div>
        </div>
    );
};
// [EN] Import React and useState hook
// [RU] Импортируем React и хук useState
import React, { useState } from 'react';

// [EN] Import UI components according to the project architecture
// [RU] Импортируем UI-компоненты согласно архитектуре проекта
import { ChessBoard } from './ChessBoard';
import { ChessTimer } from './ChessTimer';
import { DifficultySelector } from './DifficultySelector';
import { PromotionModal } from './PromotionModal';
import { TimerPanel } from './TimerPanel';
import { GameOverOverlay } from '../shared/GameOverOverlay';

// [EN] Import logic hook and parser utility using Aliases
// [RU] Импортируем хук логики и утилиту парсинга, используя Алиасы
import { useChessLogic } from '@hooks/useChessLogic';
import { parseFenToBoard } from '@utils/engine/fenParser';

// [EN] Import CSS module stylesheet
// [RU] Импортируем таблицу стилей CSS-модуля
import styles from './Chess.module.css';

export const ChessGame: React.FC = () => {
    // [EN] Local state for engine difficulty (default is 3)
    // [RU] Локальное состояние для сложности движка (по умолчанию 3)
    const [difficulty, setDifficulty] = useState<number>(3);

    // [EN] Extract live state and methods from our custom chess logic hook
    // [RU] Извлекаем живое состояние и методы из нашего кастомного хука шахматной логики
    const { fen, turn, isGameOver, isEngineThinking, handleUserMove } = useChessLogic(difficulty);

    // [EN] Compute the 2D array matrix on the fly from the current FEN string
    // [RU] Вычисляем матрицу двумерного массива на лету из текущей FEN-строки
    const boardMatrix = parseFenToBoard(fen);

    // [EN] Temporary empty handler for components not yet fully implemented
    // [RU] Временный пустой обработчик для компонентов, которые еще не полностью реализованы
    const emptyHandler = () => {};

    // [EN] ADAPTER: Transform internal logic state ('w' | 'b') to UI string contracts
    // [RU] АДАПТЕР: Трансформируем внутреннее состояние логики ('w' | 'b') в строковые контракты UI
    const mappedPlayer = turn === 'w' ? 'White' : 'Black';

    // [EN] Derive the specific game over status for the overlay
    // [RU] Вычисляем конкретный статус окончания игры для оверлея
    const gameStatus = isGameOver ? (turn === 'w' ? 'lose' : 'win') : null;

    return (
        <div className={styles['chess-container']}>
            <h1 className={styles['chess-title']}>Cosmo Game Hub</h1>

            {/* [EN] Pass real state and setter to the DifficultySelector */}
            {/* [RU] Передаем реальное состояние и функцию обновления в DifficultySelector */}
            <DifficultySelector
                currentDifficulty={difficulty}
                onSelect={(level: number) => setDifficulty(level)}
            />

            <div className={styles['game-zone']}>
                <div className={styles['board-area-wrapper']}>
                    <div className={styles['graveyard']}></div>

                    <div className={styles['board-wrapper']}>
                        {/* [EN] Render the board, passing the dynamic matrix and move handler */}
                        {/* [RU] Рендерим доску, передавая динамическую матрицу и обработчик ходов */}
                        <ChessBoard
                            board={boardMatrix}
                            onMove={handleUserMove}
                            isBlackOriented={false}
                        />

                        {/* [EN] Optional: visual indicator when engine is thinking */}
                        {/* [RU] Опционально: визуальный индикатор, когда движок думает */}
                        {isEngineThinking && (
                            <div className="absolute top-2 right-2 flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded text-amber-400 text-sm font-bold z-10">
                                <span className="animate-pulse">Engine is thinking...</span>
                            </div>
                        )}
                    </div>

                    <div className={styles['graveyard']}></div>
                </div>
            </div>

            <div className={styles['control-panel']}>
                {/* [EN] Sync timer panel with the mapped player ('White' | 'Black') */}
                {/* [RU] Синхронизируем панель таймера с отформатированным игроком */}
                <TimerPanel
                    currentPlayer={mappedPlayer}
                    onTimeOut={emptyHandler}
                />
            </div>

            <ChessTimer
                player={mappedPlayer}
                isActive={!isGameOver && !isEngineThinking}
                initialSeconds={600}
                onTimeOut={emptyHandler}
            />

            <PromotionModal
                pendingPromotion={null} // To be implemented next
                onSelect={emptyHandler}
            />

            {/* [EN] CONDITIONAL RENDERING: Render overlay if game is actually over */}
            {/* [RU] УСЛОВНЫЙ РЕНДЕРИНГ: Рендерим оверлей, если игра действительно окончена */}
            {isGameOver && gameStatus !== null && (
                <GameOverOverlay status={gameStatus as "win" | "lose" | "draw"}>
                    <div className="text-center">
                        <p className="text-xl mb-4 text-slate-200">The game has ended!</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded transition-colors"
                        >
                            Play Again
                        </button>
                    </div>
                </GameOverOverlay>
            )}
        </div>
    );
};

export default ChessGame;
// [EN] Import React hooks and the Chess class from chess.js library
// [RU] Импортируем хуки React и класс Chess из библиотеки chess.js
import { useState, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';

// [EN] Define strict types for the game status
// [RU] Определяем строгие типы для статуса игры
export type GameStatus = 'active' | 'win' | 'lose' | 'draw';

export const useChessLogic = () => {
    // [EN] Initialize the chess engine instance inside a mutable ref to persist across renders
    // [RU] Инициализируем экземпляр шахматного движка внутри мутабельного рефа для сохранения между рендерами
    const engineRef = useRef<Chess>(new Chess());

    // [EN] State for the visual board representation as a 2D array
    // [RU] Стейт для визуального представления доски в виде двумерного массива
    const [board, setBoard] = useState(engineRef.current.board());

    // [EN] State to track the current phase and outcome of the match
    // [RU] Стейт для отслеживания текущей фазы и результата матча
    const [gameStatus, setGameStatus] = useState<GameStatus>('active');

    // [EN] Evaluates the board using native chess.js methods to detect game over states
    // [RU] Оценивает доску с помощью встроенных методов chess.js для обнаружения окончания игры
    const evaluateGameEnd = useCallback((engine: Chess) => {
        if (engine.isCheckmate()) {
            // [EN] If checkmate occurs, the side whose turn it is loses the game
            // [RU] Если происходит мат, сторона, чей сейчас ход, проигрывает игру
            setGameStatus('lose');
        } else if (
            engine.isDraw() ||
            engine.isStalemate() ||
            engine.isThreefoldRepetition()
        ) {
            // [EN] Captures any draw, stalemate, or repetition condition safely
            // [RU] Безопасно фиксирует любые условия ничьей, пата или повторения ходов
            setGameStatus('draw');
        }
    }, []);

    // [EN] Handles the core move execution logic with validation
    // [RU] Обрабатывает основную логику выполнения хода с валидацией
    const makeMove = useCallback((from: string, to: string, promotion?: string) => {
        try {
            const move = engineRef.current.move({
                from,
                to,
                promotion: promotion || undefined
            });

            if (move) {
                // [EN] Update board representation and instantly check for game over triggers
                // [RU] Обновляем представление доски и мгновенно проверяем триггеры окончания игры
                setBoard(engineRef.current.board());
                evaluateGameEnd(engineRef.current);
                return true;
            }
        } catch (error) {
            // [EN] Silent catch for invalid user interactions
            // [RU] Тихое перехватывание невалидных действий пользователя
            return false;
        }
        return false;
    }, [evaluateGameEnd]);

    // [EN] Completely resets the engine and state to initial values
    // [RU] Полностью сбрасывает движок и стейт к исходным значениям
    const resetGame = useCallback(() => {
        engineRef.current = new Chess();
        setBoard(engineRef.current.board());
        setGameStatus('active');
    }, []);

    return {
        board,
        gameStatus,
        makeMove,
        resetGame,
        turn: engineRef.current.turn()
    };
};
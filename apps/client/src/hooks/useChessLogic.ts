// [EN] Import React hooks for state and lifecycle management
// [RU] Импортируем хуки React для управления состоянием и жизненным циклом
import { useState, useEffect, useCallback } from 'react';

// [EN] Import the chess.js library for game rules validation
// [RU] Импортируем библиотеку chess.js для валидации правил игры
import { Chess } from 'chess.js';

// [EN] Import our custom engine hook
// [RU] Импортируем наш кастомный хук движка
import { useEngine } from './useEngine';

export const useChessLogic = (difficultyLevel: number = 5) => {
    // [EN] Lazy initialization: the instance is created exactly once during the first render
    // [RU] Ленивая инициализация: экземпляр создается ровно один раз при первом рендере
    const [game] = useState(() => new Chess());

    // [EN] State for the board representation (FEN string)
    // [RU] Состояние для представления доски (строка FEN)
    const [fen, setFen] = useState(game.fen());

    // [EN] State to track whose turn it is ('w' for white, 'b' for black)
    // [RU] Состояние для отслеживания очереди хода ('w' для белых, 'b' для черных)
    const [turn, setTurn] = useState<'w' | 'b'>('w');

    // [EN] State to check if the game is over
    // [RU] Состояние для проверки окончания игры
    const [isGameOver, setIsGameOver] = useState(false);

    // [EN] State to track if the engine is currently calculating
    // [RU] Состояние для отслеживания, считает ли сейчас движок
    const [isEngineThinking, setIsEngineThinking] = useState(false);

    // [EN] Initialize the engine hook
    // [RU] Инициализируем хук движка
    const { getBestMove } = useEngine();

    // [EN] Function to safely update the game state
    // [RU] Функция для безопасного обновления состояния игры
    const safeGameMutate = useCallback((modify: (g: Chess) => void) => {
        modify(game);
        setFen(game.fen());
        setTurn(game.turn() as 'w' | 'b');
        setIsGameOver(game.isGameOver());
    }, [game]);

    // [EN] Function to apply the move received from the engine
    // [RU] Функция для применения хода, полученного от движка
    const applyEngineMove = useCallback((moveStr: string) => {
        safeGameMutate((g) => {
            try {
                // [EN] The engine sends moves in UCI format (e.g., 'e2e4')
                // [RU] Движок присылает ходы в формате UCI (например, 'e2e4')
                const from = moveStr.substring(0, 2);
                const to = moveStr.substring(2, 4);
                const promotion = moveStr.length > 4 ? moveStr.charAt(4) : undefined;

                g.move({ from, to, promotion });
            } catch (error) {
                console.error("Engine move error:", error);
            }
        });
    }, [safeGameMutate]);

    // [EN] Reactive effect to trigger the engine when it is black's turn
    // [RU] Реактивный эффект для запуска движка, когда ход черных
    useEffect(() => {
        if (turn === 'b' && !isGameOver) {
            setIsEngineThinking(true);

            // [EN] Delay to ensure the UI updates before blocking the thread
            // [RU] Задержка для уверенности, что интерфейс обновился до блокировки потока
            const timer = setTimeout(async () => {
                const bestMoveStr = await getBestMove(fen, difficultyLevel);

                if (bestMoveStr) {
                    applyEngineMove(bestMoveStr);
                }
                setIsEngineThinking(false);
            }, 500);

            // [EN] Cleanup timer
            // [RU] Очистка таймера
            return () => clearTimeout(timer);
        }
    }, [turn, isGameOver, fen, difficultyLevel, getBestMove, applyEngineMove]);

    // [EN] Function for handling the user's manual move
    // [RU] Функция для обработки ручного хода пользователя
    const handleUserMove = useCallback((from: string, to: string, promotion?: string) => {
        // [EN] Prevent user from moving if game is over or engine is thinking
        // [RU] Не даем пользователю ходить, если игра окончена или движок думает
        if (isGameOver || isEngineThinking || turn !== 'w') return false;

        let moveResult = null;

        safeGameMutate((g) => {
            try {
                moveResult = g.move({ from, to, promotion });
            } catch (e) {
                moveResult = null; // [EN] Invalid move [RU] Недопустимый ход
            }
        });

        return moveResult !== null;
    }, [isGameOver, isEngineThinking, turn, safeGameMutate]);

    return {
        fen,
        turn,
        isGameOver,
        isEngineThinking,
        handleUserMove
    };
};
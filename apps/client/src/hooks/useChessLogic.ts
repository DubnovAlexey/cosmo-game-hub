// [EN] Import React hooks for state and lifecycle management
// [RU] Импортируем хуки React для управления состоянием и жизненным циклом
import { useState, useEffect, useCallback } from 'react';

// [EN] Import the chess.js library and its types for game rules validation
// [RU] Импортируем библиотеку chess.js и её типы для валидации правил игры
import { Chess } from 'chess.js';
import type { Square, Color, PieceSymbol } from 'chess.js';

// [EN] Import our custom engine hook
// [RU] Импортируем наш кастомный хук движка
import { useEngine } from './useEngine';

// [EN] Only four pieces are legal promotion targets — pawn and king are excluded at the type level
// [RU] Только четыре фигуры — легальные цели превращения; пешка и король исключены на уровне типов
export type PromotionPieceSymbol = Exclude<PieceSymbol, 'p' | 'k'>;

// [EN] A legal move that is waiting on the player's promotion piece choice
// [RU] Легальный ход, ожидающий выбора фигуры превращения от игрока
export interface PendingPromotion {
    from: Square;
    to: Square;
    color: Color;
}

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

    // [EN] NEW: a legal move waiting on the player's promotion piece choice, or null
    // [RU] НОВОЕ: легальный ход, ожидающий выбора фигуры превращения от игрока, или null
    const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

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
                const from = moveStr.substring(0, 2) as Square;
                const to = moveStr.substring(2, 4) as Square;
                const promotion = moveStr.length > 4 ? (moveStr.charAt(4) as PieceSymbol) : undefined;

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

    // [EN] Function for handling the user's manual move.
    // [EN] NEW: now detects promotion-requiring moves via chess.js's own legal-move list instead of
    // just trying g.move() directly, so the mutation can be deferred until the player picks a piece
    // [RU] Функция для обработки ручного хода пользователя.
    // [RU] НОВОЕ: теперь определяет ходы, требующие превращения, через список легальных ходов chess.js,
    // а не сразу пробует g.move(), чтобы отложить мутацию до выбора фигуры игроком
    const handleUserMove = useCallback((from: Square, to: Square) => {
        // [EN] Block new move attempts if the game is over, engine is thinking, it's not white's turn,
        // or a promotion choice is already pending (defense in depth even if the modal doesn't visually block clicks)
        // [RU] Блокируем новые попытки хода, если игра окончена, движок думает, сейчас не ход белых,
        // или уже ожидается выбор превращения (доп. защита, даже если модалка не блокирует клики визуально)
        if (isGameOver || isEngineThinking || turn !== 'w' || pendingPromotion) return false;

        // [EN] Ask chess.js for legal moves from this square, and check whether the specific
        // from->to pair requested is one that requires a promotion piece
        // [RU] Спрашиваем у chess.js легальные ходы с этой клетки и проверяем, требует ли
        // конкретно запрошенная пара from->to выбора фигуры превращения
        const candidates = game.moves({ square: from, verbose: true });
        const promotionMove = candidates.find((m) => m.to === to && m.promotion);

        if (promotionMove) {
            // [EN] Don't mutate the game yet — defer until the player picks a piece in the modal
            // [RU] Пока не мутируем игру — откладываем до выбора фигуры игроком в модалке
            setPendingPromotion({ from, to, color: turn });
            return true;
        }

        let moveResult = null;

        safeGameMutate((g) => {
            try {
                moveResult = g.move({ from, to });
            } catch (e) {
                moveResult = null; // [EN] Invalid move [RU] Недопустимый ход
            }
        });

        return moveResult !== null;
    }, [isGameOver, isEngineThinking, turn, pendingPromotion, safeGameMutate, game]);

    // [EN] NEW: resolves a pending promotion once the player has picked a piece
    // [RU] НОВОЕ: завершает отложенный ход превращения после выбора фигуры игроком
    const confirmPromotion = useCallback((piece: PromotionPieceSymbol) => {
        if (!pendingPromotion) return;
        const { from, to } = pendingPromotion;

        safeGameMutate((g) => {
            try {
                g.move({ from, to, promotion: piece });
            } catch (error) {
                console.error('Promotion move error:', error);
            }
        });

        setPendingPromotion(null);
    }, [pendingPromotion, safeGameMutate]);

    // [EN] NEW: lets the player back out of a pending promotion without making a move
    // [RU] НОВОЕ: позволяет игроку отменить отложенное превращение без совершения хода
    const cancelPromotion = useCallback(() => {
        setPendingPromotion(null);
    }, []);

    return {
        fen,
        turn,
        isGameOver,
        isEngineThinking,
        pendingPromotion,
        handleUserMove,
        confirmPromotion,
        cancelPromotion
    };
};
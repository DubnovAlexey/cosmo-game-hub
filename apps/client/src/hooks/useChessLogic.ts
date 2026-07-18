// [EN] Import React hooks
// [RU] Импортируем хуки React
import { useState, useRef, useCallback, useEffect } from 'react';

// [EN] Import Chess engine and our strict types/constants
// [RU] Импортируем шахматный движок и наши строгие типы/константы
import { Chess } from 'chess.js';
import { SQUARE_MAP, type ChessSquare } from '../components/games/chess/chessConstants';

// [EN] Dictionary pattern to map engine piece types to our UI naming
// [RU] Паттерн "Словарь" для сопоставления типов фигур движка с нашими названиями UI
const PIECE_DICTIONARY: Record<string, string> = {
    'p': 'pawn',
    'n': 'knight',
    'b': 'bishop',
    'r': 'rook',
    'q': 'queen',
    'k': 'king'
};

export const useChessLogic = () => {
    const engineRef = useRef(new Chess());

    const [boardState, setBoardState] = useState<string[]>([]);
    const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
    const [highlightedSquares, setHighlightedSquares] = useState<number[]>([]);

    // [EN] State to pause the game and wait for user's promotion choice
    // [RU] Состояние для паузы игры и ожидания выбора фигуры для превращения
    const [pendingPromotion, setPendingPromotion] = useState<{ from: ChessSquare, to: ChessSquare } | null>(null);

    const syncBoard = useCallback(() => {
        const currentBoard2D = engineRef.current.board();
        const newBoard1D = currentBoard2D.flat().map((piece) => {
            if (piece === null) return '';
            return `${piece.color}_${PIECE_DICTIONARY[piece.type]}`;
        });
        setBoardState(newBoard1D);
    }, []);

    useEffect(() => {
        syncBoard();
    }, [syncBoard]);

    const playSound = useCallback((type: 'move' | 'error') => {
        const audio = new Audio(`/sounds/${type}.mp3`);
        audio.play().catch(() => {});
    }, []);

    const handleSquareClick = useCallback((index: number) => {
        if (pendingPromotion) return;

        // [EN] Get algebraic notation and apply Type Guard (Runtime Validation)
        // [RU] Получаем алгебраическую нотацию и применяем защиту типа (проверка во время выполнения)
        const targetAlgebraic = SQUARE_MAP[index];
        if (!targetAlgebraic) return;

        const pieceOnTarget = engineRef.current.get(targetAlgebraic);

        if (selectedSquare === null) {
            if (pieceOnTarget) {
                setSelectedSquare(index);
                setHighlightedSquares([index]);
            }
            return;
        }

        const sourceAlgebraic = SQUARE_MAP[selectedSquare];
        if (!sourceAlgebraic) return;

        const pieceOnSource = engineRef.current.get(sourceAlgebraic);

        if (pieceOnTarget && pieceOnSource && pieceOnTarget.color === pieceOnSource.color) {
            setSelectedSquare(index);
            setHighlightedSquares([index]);
            return;
        }

        const legalMoves = engineRef.current.moves({ square: sourceAlgebraic, verbose: true });
        const moveAttempt = legalMoves.find(m => m.to === targetAlgebraic);

        if (moveAttempt) {
            if (moveAttempt.promotion) {
                setPendingPromotion({ from: sourceAlgebraic, to: targetAlgebraic });
                return;
            }

            engineRef.current.move({ from: sourceAlgebraic, to: targetAlgebraic });
            playSound('move');
            syncBoard();
            setSelectedSquare(null);
            setHighlightedSquares([]);
        } else {
            playSound('error');
            setSelectedSquare(null);
            setHighlightedSquares([]);
        }
    }, [selectedSquare, pendingPromotion, syncBoard, playSound]);

    const completePromotion = useCallback((pieceType: string) => {
        if (!pendingPromotion) return;

        engineRef.current.move({
            from: pendingPromotion.from,
            to: pendingPromotion.to,
            promotion: pieceType
        });

        playSound('move');
        syncBoard();
        setPendingPromotion(null);
        setSelectedSquare(null);
        setHighlightedSquares([]);
    }, [pendingPromotion, syncBoard, playSound]);

    return {
        boardState,
        highlightedSquares,
        handleSquareClick,
        pendingPromotion,
        completePromotion,
        engine: engineRef.current
    };
};
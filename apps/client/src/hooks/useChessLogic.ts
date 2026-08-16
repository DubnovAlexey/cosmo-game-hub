// [EN] Import React hooks for state and lifecycle management
// [RU] Импортируем хуки React для управления состоянием и жизненным циклом
import { useState, useEffect, useCallback, useRef } from 'react';

// [EN] Import the chess.js library and its types for game rules validation
// [RU] Импортируем библиотеку chess.js и её типы для валидации правил игры
import { Chess } from 'chess.js';
import type { Square, Color, PieceSymbol, Move } from 'chess.js';

// [EN] Import our custom engine hook
// [RU] Импортируем наш кастомный хук движка
import { useEngine } from './useEngine';

// [EN] Confirmed working path (matches DifficultySelector.tsx's own playSnapSound import)
// [RU] Подтверждённый рабочий путь (совпадает с импортом playSnapSound в DifficultySelector.tsx)
import { playChessSound } from '@utils/soundUtils';

// [EN] NEW (Feature 4): BoardPiece is needed here to safely type chess.js's own board() output when
// scanning for the checked king's square — same cast pattern fenParser.ts already uses
// [RU] НОВОЕ (Фича 4): BoardPiece нужен здесь, чтобы безопасно типизировать вывод board() из chess.js
// при поиске клетки короля под шахом — тот же паттерн каста, что уже использует fenParser.ts
import type { BoardPiece } from '@utils/engine/fenParser';

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

// [EN] Captured pieces grouped by the color they belonged to (not by who captured them)
// [RU] Захваченные фигуры, сгруппированные по цвету, которому они принадлежали (а не по тому, кто их взял)
export interface CapturedPieces {
    w: PieceSymbol[];
    b: PieceSymbol[];
}

// [EN] Standard PGN result tags. '*' means "game still in progress / unknown result"
// [RU] Стандартные теги результата PGN. '*' означает "партия ещё идёт / результат неизвестен"
export type PgnResult = '1-0' | '0-1' | '1/2-1/2' | '*';

// [EN] Piece value order used to sort captured pieces for display (pawns first, queen last)
// [RU] Порядок ценности фигур для сортировки захваченных при отображении (пешки первыми, ферзь последним)
const PIECE_VALUE_ORDER: PieceSymbol[] = ['p', 'n', 'b', 'r', 'q'];

// [EN] isExternallyOver lets a parent declare the match over for a reason chess.js itself can't see
// (e.g. a clock running out) without this hook needing to know anything about timers.
// [RU] isExternallyOver позволяет родителю объявить партию оконченной по причине, которую сам chess.js
// не видит (например, закончилось время).
export const useChessLogic = (difficultyLevel: number = 5, isExternallyOver: boolean = false, playerColor: 'w' | 'b' = 'w') => {
    // [EN] Lazy initialization: the instance is created exactly once during the first render
    // [RU] Ленивая инициализация: экземпляр создается ровно один раз при первом рендере
    const [game] = useState(() => {
        const g = new Chess();
        g.setHeader('Event', 'Cosmo Game Hub - Chess');
        return g;
    });

    // [EN] State for the board representation (FEN string)
    // [RU] Состояние для представления доски (строка FEN)
    const [fen, setFen] = useState(game.fen());

    // [EN] State to track whose turn it is ('w' for white, 'b' for black)
    // [RU] Состояние для отслеживания очереди хода ('w' для белых, 'b' для черных)
    const [turn, setTurn] = useState<'w' | 'b'>('w');

    // [EN] Chess.js's own rules-based game-over detection (checkmate, stalemate, repetition, etc.)
    // [RU] Собственное определение окончания игры по правилам chess.js (мат, пат, повторение и т.д.)
    const [isRulesGameOver, setIsRulesGameOver] = useState(false);

    // [EN] Whether the last game-ending state was specifically a checkmate (vs. any kind of draw)
    // [RU] Была ли последняя завершающая позиция именно матом (в отличие от любого вида ничьей)
    const [isCheckmate, setIsCheckmate] = useState(false);

    // [EN] State to track if the engine is currently calculating
    // [RU] Состояние для отслеживания, считает ли сейчас движок
    const [isEngineThinking, setIsEngineThinking] = useState(false);

    // [EN] A legal move waiting on the player's promotion piece choice, or null
    // [RU] Легальный ход, ожидающий выбора фигуры превращения от игрока, или null
    const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

    // [EN] The single source of truth for "no more moves should happen"
    // [RU] Единый источник истины для "ходов больше быть не должно"
    const isGameOver = isRulesGameOver || isExternallyOver;

    // [EN] Whether at least one move has been played yet — derived fresh each render
    // [RU] Был ли сделан хотя бы один ход — вычисляется заново на каждом рендере
    const hasStarted = game.history().length > 0;

    // [EN] The full verbose move history, recomputed fresh each render straight from chess.js
    // [RU] Полная детальная история ходов, вычисляется заново на каждом рендере прямо из chess.js
    const moveHistory: Move[] = game.history({ verbose: true });

    // [EN] Derives captured material straight from the move list instead of diffing FEN against
    // a hardcoded starting inventory
    // [RU] Захваченный материал выводится прямо из списка ходов, а не сравнением FEN с
    // захардкоженным начальным набором
    const capturedPieces: CapturedPieces = moveHistory.reduce<CapturedPieces>(
        (acc, move) => {
            if (move.captured) {
                const capturedColor: Color = move.color === 'w' ? 'b' : 'w';
                acc[capturedColor].push(move.captured);
            }
            return acc;
        },
        { w: [], b: [] }
    );
    capturedPieces.w.sort((a, b) => PIECE_VALUE_ORDER.indexOf(a) - PIECE_VALUE_ORDER.indexOf(b));
    capturedPieces.b.sort((a, b) => PIECE_VALUE_ORDER.indexOf(a) - PIECE_VALUE_ORDER.indexOf(b));

    // [EN] NEW (Feature 4): the square of the king currently in check, or null. Scans game.board()
    // [RU] НОВОЕ (Фича 4): клетка короля, находящегося под шахом, либо null. Сканирует game.board()
    const checkedSquare: Square | null = game.isCheck()
        ? ((game.board() as (BoardPiece | null)[][])
            .flat()
            .find((p) => p?.type === 'k' && p?.color === turn)?.square ?? null)
        : null;

    // [EN] Tracks the latest isGameOver value without relying on the engine effect's closure
    // [RU] Отслеживает актуальное значение isGameOver, не полагаясь на замыкание эффекта движка
    const isGameOverRef = useRef(isGameOver);
    useEffect(() => {
        isGameOverRef.current = isGameOver;
    }, [isGameOver]);

    // [EN] Remembers how many half-moves existed after the last sound cue
    // [RU] Запоминает, сколько полуходов было после последнего звукового сигнала
    const lastSoundedMoveCountRef = useRef(0);

    // [EN] Initialize the engine hook
    // [RU] Инициализируем хук движка
    const { getBestMove } = useEngine();

    // [EN] Function to safely update the game state and play sounds
    // [RU] Функция для безопасного обновления состояния игры и проигрывания звуков
    const safeGameMutate = useCallback((modify: (g: Chess) => void) => {
        modify(game);
        setFen(game.fen());
        setTurn(game.turn() as 'w' | 'b');
        setIsRulesGameOver(game.isGameOver());
        setIsCheckmate(game.isCheckmate());

        const history = game.history({ verbose: true });
        if (history.length > lastSoundedMoveCountRef.current) {
            lastSoundedMoveCountRef.current = history.length;
            const lastMove = history[history.length - 1];

            if (game.isGameOver()) {
                playChessSound('end');
            } else if (lastMove.san.includes('+')) {
                playChessSound('check');
            } else if (lastMove.captured) {
                playChessSound('capture');
            } else {
                playChessSound('move');
            }
        }
    }, [game]);

    // [EN] Function to apply the move received from the engine
    // [RU] Функция для применения хода, полученного от движка
    const applyEngineMove = useCallback((moveStr: string) => {
        safeGameMutate((g) => {
            try {
                const from = moveStr.substring(0, 2) as Square;
                const to = moveStr.substring(2, 4) as Square;
                const promotion = moveStr.length > 4 ? (moveStr.charAt(4) as PieceSymbol) : undefined;
                g.move({ from, to, promotion });
            } catch (error) {
                console.error("Engine move error:", error);
            }
        });
    }, [safeGameMutate]);

    // [EN] Reactive effect to trigger the engine whenever it is not the human player's turn
    // [RU] Реактивный эффект для запуска движка, когда очередь хода не совпадает с цветом человека
    useEffect(() => {
        if (turn !== playerColor && !isGameOver) {
            setIsEngineThinking(true);
            const timer = setTimeout(async () => {
                const bestMoveStr = await getBestMove(fen, difficultyLevel);
                if (bestMoveStr && !isGameOverRef.current) {
                    applyEngineMove(bestMoveStr);
                }
                setIsEngineThinking(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [turn, playerColor, isGameOver, fen, difficultyLevel, getBestMove, applyEngineMove]);

    // [EN] Pure query — what squares can the piece on `from` legally move to right now.
    // [RU] Чистый запрос — на какие клетки фигура на `from` может легально пойти прямо сейчас.
    const getLegalDestinations = useCallback((from: Square): Square[] => {
        return game.moves({ square: from, verbose: true }).map((m) => m.to);
    }, [game]);

    // [EN] Update user move handler to rely on playerColor
    // [RU] Обработчик ручного хода теперь проверяет playerColor
    const handleUserMove = useCallback((from: Square, to: Square) => {
        if (isGameOver || isEngineThinking || turn !== playerColor || pendingPromotion) return false;

        const candidates = game.moves({ square: from, verbose: true });
        const promotionMove = candidates.find((m) => m.to === to && m.promotion);

        if (promotionMove) {
            setPendingPromotion({ from, to, color: turn });
            return true;
        }

        let moveResult = null;
        safeGameMutate((g) => {
            try {
                moveResult = g.move({ from, to });
            } catch (e) {
                moveResult = null;
            }
        });

        return moveResult !== null;
    }, [isGameOver, isEngineThinking, turn, playerColor, pendingPromotion, safeGameMutate, game]);

    // [EN] Resolves a pending promotion once the player has picked a piece
    // [RU] Завершает отложенный ход превращения после выбора фигуры игроком
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

    // [EN] Lets the player back out of a pending promotion without making a move
    // [RU] Позволяет игроку отменить отложенное превращение без совершения хода
    const cancelPromotion = useCallback(() => {
        setPendingPromotion(null);
    }, []);

    // [EN] Produces a full PGN string on demand with dynamic color assignment
    // [RU] Формирует полную строку PGN по запросу с динамическим распределением цветов
    const generatePgn = useCallback((resultTag: PgnResult = '*') => {
        game.setHeader('White', playerColor === 'w' ? 'Player' : 'Stockfish');
        game.setHeader('Black', playerColor === 'b' ? 'Player' : 'Stockfish');
        game.setHeader('Result', resultTag);
        return game.pgn();
    }, [game, playerColor]);

    return {
        fen,
        turn,
        isGameOver,
        isCheckmate,
        hasStarted,
        isEngineThinking,
        pendingPromotion,
        moveHistory,
        capturedPieces,
        checkedSquare,
        handleUserMove,
        getLegalDestinations,
        confirmPromotion,
        cancelPromotion,
        generatePgn
    };
};
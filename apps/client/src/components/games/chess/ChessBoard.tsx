// [EN] Import React, state hook, and the exact Square type from chess.js
// [RU] Импортируем React, хук состояния и точный тип Square из chess.js
import React, { useState } from 'react';
import type { Square } from 'chess.js';

// [EN] BoardPiece comes from fenParser.ts — single source of truth for this shape
// [RU] BoardPiece импортируется из fenParser.ts — единый источник истины для этой формы
import type { BoardPiece } from '@utils/engine/fenParser';

// [EN] Piece image map shared with PromotionModal and Graveyard
// [RU] Карта изображений фигур, общая с PromotionModal и Graveyard
import { PIECE_IMAGES } from '@assets/chessPieces';

// [EN] NEW (Feature 4): migrating square/border styling from ad-hoc Tailwind classes to the theme's
// own .board-tile/.tile-light/.tile-dark/.board-frame-cell/.highlight-* classes — these already
// existed in Chess.module.css but this component didn't use them until now
// [RU] НОВОЕ (Фича 4): переносим стили клеток/рамки с разрозненных классов Tailwind на собственные
// классы темы .board-tile/.tile-light/.tile-dark/.board-frame-cell/.highlight-* — они уже были в
// Chess.module.css, но этот компонент их до сих пор не использовал
import styles from './Chess.module.css';

// [EN] Props interface: getLegalDestinations and checkedSquare are new for Feature 4 (highlighting + check)
// [RU] Интерфейс пропсов: getLegalDestinations и checkedSquare — новые для Фичи 4 (подсветка + шах)
interface ChessBoardProps {
    board: (BoardPiece | null)[][];
    isBlackOriented?: boolean;
    onMove: (from: Square, to: Square) => void;
    getLegalDestinations: (square: Square) => Square[];
    checkedSquare: Square | null;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
                                                          board,
                                                          isBlackOriented = false,
                                                          onMove,
                                                          getLegalDestinations,
                                                          checkedSquare
                                                      }) => {
    // [EN] Local state to memorize the selected square for making a move
    // [RU] Локальное состояние для запоминания выбранной клетки при совершении хода
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

    const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
    const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

    // [EN] NEW (Feature 4): legal destinations for the currently selected square, recomputed
    // whenever the selection changes. Empty array when nothing is selected.
    // [RU] НОВОЕ (Фича 4): легальные ходы для выбранной сейчас клетки, пересчитываются при смене
    // выбора. Пустой массив, если ничего не выбрано.
    const legalDestinations = selectedSquare ? getLegalDestinations(selectedSquare) : [];

    // [EN] Handles click interactions for selecting and moving pieces.
    // [EN] NEW (Feature 4): clicking a legal destination completes the move; clicking the already
    // selected square deselects it; clicking a different square that itself has legal moves
    // re-selects it instead of attempting (and silently failing) a move there; anything else deselects.
    // [RU] Обрабатывает взаимодействия по клику для выбора и перемещения фигур.
    // [RU] НОВОЕ (Фича 4): клик по легальной клетке назначения завершает ход; клик по уже выбранной
    // клетке снимает выбор; клик по другой клетке, у которой у самой есть легальные ходы,
    // переселекчивает её вместо попытки (и молчаливого провала) хода туда; всё остальное снимает выбор.
    const handleSquareClick = (squareId: Square) => {
        if (selectedSquare) {
            if (selectedSquare === squareId) {
                setSelectedSquare(null);
            } else if (legalDestinations.includes(squareId)) {
                onMove(selectedSquare, squareId);
                setSelectedSquare(null);
            } else if (getLegalDestinations(squareId).length > 0) {
                setSelectedSquare(squareId);
            } else {
                setSelectedSquare(null);
            }
        } else {
            setSelectedSquare(squareId);
        }
    };

    // [EN] Renders the 10x10 matrix including border coordinate labels and pieces
    // [RU] Рендерит матрицу 10x10 включая метки координат на рамках и сами фигуры
    const renderMatrix = () => {
        return Array.from({ length: 100 }).map((_, index) => {
            const gridRow = Math.floor(index / 10);
            const gridCol = index % 10;
            const isBorder = gridRow === 0 || gridRow === 9 || gridCol === 0 || gridCol === 9;

            if (isBorder) {
                let label = '';
                if ((gridRow === 0 || gridRow === 9) && gridCol >= 1 && gridCol <= 8) {
                    const fileIndex = gridCol - 1;
                    label = isBlackOriented ? FILES[7 - fileIndex] : FILES[fileIndex];
                } else if ((gridCol === 0 || gridCol === 9) && gridRow >= 1 && gridRow <= 8) {
                    const rankIndex = gridRow - 1;
                    label = isBlackOriented ? RANKS[7 - rankIndex] : RANKS[rankIndex];
                }

                return (
                    <div key={`border-${index}`} className={styles['board-frame-cell']}>
                        {label}
                    </div>
                );
            }

            // [EN] Calculate true coordinates for the 8x8 inner chess board
            // [RU] Вычисляем истинные координаты для внутренней шахматной доски 8x8
            const boardRow = gridRow - 1;
            const boardCol = gridCol - 1;

            const actualRow = isBlackOriented ? 7 - boardRow : boardRow;
            const actualCol = isBlackOriented ? 7 - boardCol : boardCol;

            // [EN] Cast is safe: FILES/RANKS only ever produce valid algebraic squares
            // [RU] Каст безопасен: FILES/RANKS всегда дают валидные алгебраические клетки
            const squareId = `${FILES[actualCol]}${RANKS[actualRow]}` as Square;

            // [EN] Extract piece directly from the 2D array matrix
            // [RU] Извлекаем фигуру напрямую из матрицы двумерного массива
            const piece = board[actualRow][actualCol];

            const isDark = (actualRow + actualCol) % 2 === 1;
            const isSelected = selectedSquare === squareId;
            const isLegalMove = legalDestinations.includes(squareId);
            const isChecked = checkedSquare === squareId;

            // [EN] NEW (Feature 4): priority when multiple states could apply to the same square —
            // check is the most urgent thing to show, then selection, then legal-move hints. In
            // practice check and legal-move can't overlap (you can never "move to" a king's square),
            // but check and selected can (selecting your own checked king), so the order matters.
            // [RU] НОВОЕ (Фича 4): приоритет, если на одну клетку могло бы претендовать несколько
            // состояний — шах важнее всего показать, затем выбор, затем подсказки о ходах. На практике
            // шах и легальный ход пересечься не могут (на клетку короля "сходить" нельзя), а вот шах
            // и выбор — могут (если выбрать свой король под шахом), поэтому порядок важен.
            let highlightClass = '';
            if (isChecked) {
                highlightClass = styles['highlight-check'];
            } else if (isSelected) {
                highlightClass = styles['highlight-selected'];
            } else if (isLegalMove) {
                highlightClass = styles['highlight-move'];
            }

            const tileColorClass = isDark ? styles['tile-dark'] : styles['tile-light'];

            return (
                <div
                    key={squareId}
                    onClick={() => handleSquareClick(squareId)}
                    className={`${styles['board-tile']} ${tileColorClass} ${highlightClass} cursor-pointer`}
                >
                    {/* [EN] Render the piece image if a piece exists on this square */}
                    {/* [RU] Рендерим изображение фигуры, если на этой клетке есть фигура */}
                    {piece && (
                        <img
                            src={PIECE_IMAGES[`${piece.color}-${piece.type}`]}
                            alt={`${piece.color} ${piece.type}`}
                            className="w-4/5 h-4/5 object-contain drop-shadow-lg pointer-events-none"
                        />
                    )}
                </div>
            );
        });
    };

    return (
        <div className="w-full h-full grid grid-cols-10 grid-rows-10 border-4 border-slate-950 shadow-2xl">
            {renderMatrix()}
        </div>
    );
};
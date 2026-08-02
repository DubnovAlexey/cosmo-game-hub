// [EN] Import React, state hook, and the exact Square type from chess.js
// [RU] Импортируем React, хук состояния и точный тип Square из chess.js
import React, { useState } from 'react';
import type { Square } from 'chess.js';

// [EN] NEW: BoardPiece now comes from fenParser.ts instead of being redefined here —
// it was a duplicate of the exact same interface already exported there
// [RU] НОВОЕ: BoardPiece теперь импортируется из fenParser.ts, а не переопределяется здесь —
// это был дубликат точно такого же интерфейса, уже экспортированного оттуда
import type { BoardPiece } from '@utils/engine/fenParser';

// [EN] NEW: piece image map moved to a shared module so PromotionModal can reuse it too
// [RU] НОВОЕ: карта изображений фигур вынесена в общий модуль, чтобы PromotionModal тоже мог её использовать
import { PIECE_IMAGES } from '@assets/chessPieces';

// [EN] Props interface updated to accept a 2D array and move handler
// [RU] Интерфейс свойств обновлен для приема двумерного массива и обработчика ходов
interface ChessBoardProps {
    board: (BoardPiece | null)[][];
    isBlackOriented?: boolean;
    onMove: (from: Square, to: Square) => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
                                                          board,
                                                          isBlackOriented = false,
                                                          onMove
                                                      }) => {
    // [EN] Local state to memorize the selected square for making a move
    // [RU] Локальное состояние для запоминания выбранной клетки при совершении хода
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

    const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
    const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

    // [EN] Handles click interactions for selecting and moving pieces
    // [RU] Обрабатывает взаимодействия по клику для выбора и перемещения фигур
    const handleSquareClick = (squareId: Square) => {
        if (selectedSquare) {
            // [EN] If a square is already selected, attempt to execute a move
            // [RU] Если клетка уже выбрана, пытаемся выполнить ход
            onMove(selectedSquare, squareId);
            setSelectedSquare(null);
        } else {
            // [EN] Select the square as the origin point
            // [RU] Выбираем клетку в качестве начальной точки
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
                    <div key={`border-${index}`} className="flex items-center justify-center bg-slate-950 text-slate-500 font-bold text-xs uppercase tracking-widest">
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

            // [EN] Styling: Highlight selected square, otherwise render checkboard pattern
            // [RU] Стилизация: Подсветка выбранной клетки, иначе рендер шахматного узора
            const bgClass = isSelected
                ? 'bg-amber-500/80'
                : isDark
                    ? 'bg-slate-800'
                    : 'bg-slate-300';

            return (
                <div
                    key={squareId}
                    onClick={() => handleSquareClick(squareId)}
                    className={`flex items-center justify-center cursor-pointer ${bgClass} transition-colors hover:bg-red-900/40 relative`}
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
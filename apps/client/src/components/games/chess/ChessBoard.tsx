// [EN] Import React, state hook, and exact types from chess.js
// [RU] Импортируем React, хук состояния и точные типы из chess.js
import React, { useState } from 'react';
import type { Square, PieceSymbol, Color } from 'chess.js';

// [EN] Static imports of all piece images from the assets folder
// [RU] Статические импорты всех изображений фигур из папки ресурсов
import w_p from '../../../assets/images/chess/w_pawn.svg.webp';
import w_n from '../../../assets/images/chess/w_knight.svg.webp';
import w_b from '../../../assets/images/chess/w_bishop.svg.webp';
import w_r from '../../../assets/images/chess/w_rook.svg.webp';
import w_q from '../../../assets/images/chess/w_queen.svg.webp';
import w_k from '../../../assets/images/chess/w_king.svg.webp';

import b_p from '../../../assets/images/chess/b_pawn.svg.webp';
import b_n from '../../../assets/images/chess/b_knight.svg.webp';
import b_b from '../../../assets/images/chess/b_bishop.svg.webp';
import b_r from '../../../assets/images/chess/b_rook.svg.webp';
import b_q from '../../../assets/images/chess/b_queen.svg.webp';
import b_k from '../../../assets/images/chess/b_king.svg.webp';

// [EN] Mapping dictionary connecting engines shortcodes to the .src property of imported image objects
// [RU] Словарь маппинга, связывающий короткие коды движка со свойством .src импортированных объектов изображений
const PIECE_IMAGES: Record<string, string> = {
    'w-p': w_p.src, 'w-n': w_n.src, 'w-b': w_b.src, 'w-r': w_r.src, 'w-q': w_q.src, 'w-k': w_k.src,
    'b-p': b_p.src, 'b-n': b_n.src, 'b-b': b_b.src, 'b-r': b_r.src, 'b-q': b_q.src, 'b-k': b_k.src,
};

// [EN] Strict interface for a single piece object based on chess.js logic
// [RU] Строгий интерфейс для объекта отдельной фигуры на основе логики chess.js
interface BoardPiece {
    square: Square;
    type: PieceSymbol;
    color: Color;
}

// [EN] Props interface updated to accept a 2D array and move handler
// [RU] Интерфейс свойств обновлен для приема двумерного массива и обработчика ходов
interface ChessBoardProps {
    board: (BoardPiece | null)[][];
    isBlackOriented?: boolean;
    onMove: (from: string, to: string) => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
                                                          board,
                                                          isBlackOriented = false,
                                                          onMove
                                                      }) => {
    // [EN] Local state to memorize the selected square for making a move
    // [RU] Локальное состояние для запоминания выбранной клетки при совершении хода
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

    const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

    // [EN] Handles click interactions for selecting and moving pieces
    // [RU] Обрабатывает взаимодействия по клику для выбора и перемещения фигур
    const handleSquareClick = (squareId: string) => {
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

            const squareId = `${FILES[actualCol]}${RANKS[actualRow]}`;

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
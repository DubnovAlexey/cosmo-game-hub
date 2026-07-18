// [EN] Import React and FC (Functional Component) type
// [RU] Импортируем React и тип FC (Функциональный компонент)
import React from 'react';

// [EN] Import clsx for dynamic class names
// [RU] Импортируем clsx для динамических имен классов
import clsx from 'clsx';

import styles from './Chess.module.css';

// [EN] Interface for Component Props
// [RU] Интерфейс для свойств компонента (Props)
interface ChessBoardProps {
    boardState: string[];
    isBlackOriented: boolean;
    onSquareClick: (index: number) => void;

    // [EN] Array of square indices that should be highlighted
    // [RU] Массив индексов клеток, которые должны быть подсвечены
    highlightedSquares: number[];
}

const FILES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const ChessBoard: React.FC<ChessBoardProps> = ({
                                                          boardState,
                                                          isBlackOriented,
                                                          onSquareClick,
                                                          highlightedSquares
                                                      }) => {

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
                    <div key={`border-${index}`} className={clsx(styles['board-frame-cell'])}>
                        {label}
                    </div>
                );
            }

            const boardRow = gridRow - 1;
            const boardCol = gridCol - 1;
            const baseIndex = boardRow * 8 + boardCol;
            const actualIndex = isBlackOriented ? 63 - baseIndex : baseIndex;
            const isDark = (boardRow + boardCol) % 2 !== 0;
            const pieceClass = boardState[actualIndex];

            // [EN] Check if current actualIndex is in the highlighted array
            // [RU] Проверяем, находится ли текущий actualIndex в массиве выделенных
            const isHighlighted = highlightedSquares.includes(actualIndex);

            return (
                <div
                    key={`cell-${actualIndex}`}
                    className={clsx(
                        styles['board-tile'],
                        isDark ? styles['tile-dark'] : styles['tile-light'],
                        // [EN] Apply highlight CSS class if the square is selected
                        // [RU] Применяем CSS-класс подсветки, если клетка выбрана
                        isHighlighted && styles['highlight-selected']
                    )}
                    onClick={() => onSquareClick(actualIndex)}
                >
                    {pieceClass && (
                        <div className={clsx(styles['chess-piece'], styles[pieceClass])} />
                    )}
                </div>
            );
        });
    };

    return (
        <React.Fragment>
            {renderMatrix()}
        </React.Fragment>
    );
};

export default ChessBoard;
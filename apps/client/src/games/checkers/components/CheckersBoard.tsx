// [EN] FILE: games/checkers/components/CheckersBoard.tsx — the board of draughts: cracked marble in a silver frame,
//      the numbers of the rows on the left and the letters of the columns below. Your men are always at the bottom:
//      when you play black the board is turned round. Every square, label and piece names its own place in the grid
//      (column and row), so nothing can flow onto anything else. The dark squares are buttons — the same for a finger,
//      a mouse and a keyboard; a light square is only decor.
// [RU] ФАЙЛ: доска шашек: треснувший мрамор в серебряной раме, номера рядов слева и буквы колонок снизу. Ваши шашки
//      всегда внизу: когда вы играете чёрными, доска повёрнута. Каждое поле, подпись и шашка называют своё место в
//      сетке (колонку и ряд), поэтому ничто не может натечь на другое. Тёмные поля — кнопки, одинаковые для пальца,
//      мыши и клавиатуры; светлое поле — только украшение.
import React from 'react';
import { isDark, isKing, squareAt, sideOf, type Piece } from '../engine/index.ts';
import styles from './Checkers.module.css';

/** [EN] The last move, to be seen on the board: where it began, where it went, whom it took. [RU] Последний ход, видный на доске: откуда, куда, кого взял. */
export interface LastMoveMarks {
    readonly from: number;
    readonly path: readonly number[];
    /** [EN] The captured squares with the piece that stood there. [RU] Битые поля с шашкой, которая там стояла. */
    readonly captured: readonly (readonly [number, Piece])[];
}

interface CheckersBoardProps {
    readonly size: number;
    readonly board: readonly Piece[];
    /** [EN] Black at the bottom. [RU] Чёрные внизу. */
    readonly flipped: boolean;
    /** [EN] It is your move: the squares may be pressed. [RU] Ваш ход: на поля можно нажимать. */
    readonly active: boolean;
    readonly movable: ReadonlySet<number>;
    readonly selected: number | null;
    /** [EN] The square the chosen piece left in the middle of a capture series. [RU] Поле, которое выбранная шашка покинула посреди серии взятий. */
    readonly left: number | null;
    readonly targets: ReadonlySet<number>;
    /** [EN] The pieces already jumped in the capture being entered (they leave the board when it ends). [RU] Уже перепрыгнутые шашки во вводимом взятии. */
    readonly taking: ReadonlySet<number>;
    readonly last: LastMoveMarks | null;
    readonly columns: string;
    readonly label: (square: number) => string;
    readonly onPress: (square: number) => void;
}

const at = (column: number, row: number): React.CSSProperties => ({ gridColumn: column, gridRow: row });

/** [EN] A man or a king; a king wears a crown. [RU] Шашка или дамка; дамка носит корону. */
export const PieceMark: React.FC<{ readonly piece: Piece; readonly className?: string }> = ({ piece, className = '' }) => (
    <span className={`${styles.piece} ${sideOf(piece) === 'white' ? styles.pieceWhite : styles.pieceBlack} ${isKing(piece) ? styles.pieceKing : ''} ${className}`} aria-hidden="true">
        {isKing(piece) && (
            <svg className={styles.crown} viewBox="0 0 24 16" focusable="false">
                <path d="M2 14.5 3.6 4.2l5 4.6L12 1.5l3.4 7.3 5-4.6L22 14.5Z" />
            </svg>
        )}
    </span>
);

export const CheckersBoard: React.FC<CheckersBoardProps> = ({ size, board, flipped, active, movable, selected, left, targets, taking, last, columns, label, onPress }) => {
    const toSquare = (row: number, column: number) => (flipped ? squareAt(size - 1 - row, size - 1 - column, size) : squareAt(row, column, size));
    const ghosts = new Map(last?.captured ?? []);
    const trail = new Set(last ? [last.from, ...last.path] : []);
    const cells: React.ReactNode[] = [];
    for (let row = 0; row < size; row += 1) {
        cells.push(<span key={`n${row}`} className={styles.axis} style={at(1, row + 1)} aria-hidden="true">{flipped ? row + 1 : size - row}</span>);
        for (let column = 0; column < size; column += 1) {
            const square = toSquare(row, column);
            const place = at(column + 2, row + 1);
            if (!isDark(square, size)) {
                cells.push(<span key={square} className={styles.light} style={place} aria-hidden="true" />);
                continue;
            }
            const piece = board[square];
            const target = targets.has(square);
            const pressable = active && (target || movable.has(square) || square === selected);
            const classes = [
                styles.dark,
                pressable ? styles.darkOpen : '',
                square === selected ? styles.darkSelected : '',
                target ? styles.darkTarget : '',
                movable.has(square) && selected === null ? styles.darkMovable : '',
                trail.has(square) ? styles.darkLast : '',
                square === left ? styles.darkLeft : '',
            ].filter(Boolean).join(' ');
            const ghost = ghosts.get(square);
            cells.push(
                <button key={square} type="button" className={classes} style={place} disabled={!pressable}
                    aria-label={label(square)} aria-pressed={square === selected ? true : undefined} onClick={() => onPress(square)}>
                    {piece !== 0 && <PieceMark piece={piece} className={taking.has(square) ? styles.pieceTaken : ''} />}
                    {piece === 0 && ghost !== undefined && <PieceMark piece={ghost} className={styles.pieceGhost} />}
                </button>,
            );
        }
    }
    for (let column = 0; column < size; column += 1) {
        cells.push(<span key={`l${column}`} className={styles.axis} style={at(column + 2, size + 1)} aria-hidden="true">{columns[flipped ? size - 1 - column : column]}</span>);
    }
    return (
        <div className={`${styles.boardFrame} ${active ? styles.boardActive : ''}`}>
            <div className={styles.board} style={{ '--board-size': size } as React.CSSProperties}>{cells}</div>
        </div>
    );
};

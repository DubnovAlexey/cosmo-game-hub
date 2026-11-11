// [EN] FILE: games/battleship/components/SeaBoard.tsx — one sea: a grid of cells with letters above and numbers at the
//      side, the ships lying on it and the marks of the shots. The same component draws your sea (your ships are
//      seen, the opponent shoots at it), the opponent's sea (only what your shots have opened) and the sea you set
//      your fleet out on (a ship in hand shows where it would stand: green — it may, red — it may not).
//      Every cell is a button with a spoken name («Б4, мимо»), so a finger, a mouse and a keyboard work alike. The
//      geometry never follows the language: column А is on the left in Hebrew too.
// [RU] ФАЙЛ: одно море: сетка клеток с буквами сверху и числами сбоку, корабли на ней и отметки выстрелов. Тот же
//      компонент рисует ваше море (ваши корабли видны, по нему стреляет соперник), море соперника (только то, что
//      открыли ваши выстрелы) и море, на котором вы расставляете флот (корабль «в руке» показывает, где он встанет:
//      зелёный — можно, красный — нельзя). Каждая клетка — кнопка с названием для диктора («Б4, мимо»), поэтому
//      палец, мышь и клавиатура работают одинаково. Геометрия не идёт за языком: колонка А слева и на иврите.
import React from 'react';
import { EMPTY, HIT, MISS, SUNK, columnOf, isHorizontal, rowOf, type Mark, type Ship } from '../engine/index.ts';
import styles from './Battleship.module.css';

export interface SeaPreview {
    readonly cells: readonly number[];
    readonly ok: boolean;
}

interface SeaBoardProps {
    readonly size: number;
    readonly columns: readonly string[];
    readonly title: string;
    /** What the shots have opened; null while the fleet is being set out. */
    readonly marks: readonly Mark[] | null;
    /** The ships to draw: all of yours, only the sunk ones of the opponent. */
    readonly ships: readonly Ship[];
    /** Ships drawn as wrecks (sunk). */
    readonly wrecks?: readonly Ship[];
    readonly enemy?: boolean;
    readonly pressable?: (cell: number) => boolean;
    readonly onPress?: (cell: number) => void;
    readonly onHover?: (cell: number | null) => void;
    readonly preview?: SeaPreview | null;
    /** The cell of the last shot at this sea. */
    readonly last?: number | null;
    readonly cellLabel: (cell: number) => string;
    readonly active?: boolean;
}

export const SeaBoard: React.FC<SeaBoardProps> = ({
    size, columns, title, marks, ships, wrecks = [], enemy = false, pressable, onPress, onHover, preview = null, last = null, cellLabel, active = false,
}) => {
    const previewCells = new Set(preview?.cells ?? []);
    const grid = { '--sea-size': size } as React.CSSProperties;
    const hull = (ship: Ship, wreck: boolean, key: string) => {
        const first = ship.cells[0];
        const horizontal = isHorizontal(ship, size);
        const length = ship.cells.length;
        const area = {
            gridColumn: `${columnOf(first, size) + 2} / span ${horizontal ? length : 1}`,
            gridRow: `${rowOf(first, size) + 2} / span ${horizontal ? 1 : length}`,
            '--decks': length,
        } as React.CSSProperties;
        return <span key={key} className={`${styles.hull} ${horizontal ? '' : styles.hullDown} ${wreck ? styles.hullWreck : ''} ${length === 1 ? styles.hullBoat : ''}`} style={area} aria-hidden="true" />;
    };
    return (
        <section className={`${styles.sea} ${enemy ? styles.seaEnemy : ''} ${active ? styles.seaActive : ''}`} aria-label={title}>
            <h2 className={styles.seaTitle}>{title}</h2>
            <div className={styles.grid} style={grid} onMouseLeave={onHover ? () => onHover(null) : undefined}>
                <span className={styles.corner} aria-hidden="true" />
                {columns.slice(0, size).map(letter => <span key={letter} className={styles.axis} aria-hidden="true">{letter}</span>)}
                {Array.from({ length: size }, (_, row) => (
                    <React.Fragment key={row}>
                        <span className={styles.axis} aria-hidden="true">{row + 1}</span>
                        {Array.from({ length: size }, (__, column) => {
                            const cell = row * size + column;
                            const mark = marks ? marks[cell] : 0;
                            const can = pressable ? pressable(cell) : false;
                            const classes = [
                                styles.cell,
                                mark === MISS ? styles.cellMiss : mark === HIT ? styles.cellHit : mark === SUNK ? styles.cellSunk : mark === EMPTY ? styles.cellEmpty : '',
                                last === cell ? styles.cellLast : '',
                                previewCells.has(cell) ? (preview?.ok ? styles.cellFits : styles.cellClash) : '',
                                can ? styles.cellOpen : '',
                            ].filter(Boolean).join(' ');
                            return (
                                <button key={cell} type="button" className={classes} disabled={!can} aria-label={cellLabel(cell)}
                                    onClick={can && onPress ? () => onPress(cell) : undefined}
                                    onMouseEnter={onHover ? () => onHover(cell) : undefined} onFocus={onHover ? () => onHover(cell) : undefined} />
                            );
                        })}
                    </React.Fragment>
                ))}
                {ships.map((ship, index) => hull(ship, false, `ship-${index}-${ship.cells[0]}`))}
                {wrecks.map((ship, index) => hull(ship, true, `wreck-${index}-${ship.cells[0]}`))}
            </div>
        </section>
    );
};

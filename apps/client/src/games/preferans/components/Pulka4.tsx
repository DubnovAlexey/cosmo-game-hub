// [EN] FILE: games/preferans/components/Pulka4.tsx — the score sheet for four players, drawn the way a pulka for four is
//      drawn on paper: a square cut by its two diagonals into four triangles around the circle with the pool length.
//      Every player writes in the triangle in front of him: the mountain next to the centre, then the pool, the
//      whists at the edge split between the three others (left to right, clockwise). Each triangle is the bottom one
//      turned by a quarter, so the writing faces its owner, as on the real sheet; you sit at the bottom.
//      The ink, lines and their animation are those of the sheet for three (Pulka.tsx).
// [RU] ФАЙЛ: пуля на четверых, расчерченная так, как её чертят на бумаге: квадрат, разрезанный двумя диагоналями на
//      четыре треугольника вокруг круга с длиной пули. Каждый пишет в треугольнике перед собой: у центра гора, дальше
//      пуля, у края висты, разделённые между тремя другими (слева направо, по часовой стрелке). Каждый треугольник —
//      нижний, повёрнутый на четверть, поэтому записи смотрят на хозяина, как на настоящем листе; вы сидите внизу.
//      Чернила, линии и их анимация — те же, что у листа на троих (Pulka.tsx).
import React from 'react';
import { useTexts } from '../i18n/index.ts';
import { BandInk, Ink, Quill, fitName, roundStroke, shortName, show, signedInk, stroke, type PulkaProps, type Rect } from './Pulka';
import type { Band } from './sheetHistory';
import styles from './ScoreSheet.module.css';

// BEGIN 1. Geometry (viewBox 300 × 300, the bottom triangle; the others are it turned around the centre)
const C = 150;
const R = 20;
const D = R * Math.SQRT1_2;
const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });
/** [EN] The frame, the two diagonals (stopping at the circle) and the circle. [RU] Рамка, две диагонали (до круга) и круг. */
const FRAME: readonly string[] = [
    stroke(5.5, 6, 294.5, 5.5, 1), stroke(294.5, 5, 295, 294, 2), stroke(295, 294.5, 5, 294, 3), stroke(5.5, 295, 6, 5.5, 4),
    stroke(6, 6, C - D, C - D, 5), stroke(C + D, C + D, 294, 294, 6), stroke(294, 6, C + D, C - D, 7), stroke(C - D, C + D, 6, 294, 8),
    roundStroke(C, C, R, R),
];
/** [EN] The bands of one triangle: mountain, pool, whists split in three. [RU] Полосы одного треугольника: гора, пуля, висты на троих. */
const SECTOR_LINES: readonly string[] = [
    stroke(98, 202, 202, 202, 11), stroke(68, 232, 232, 232, 12), stroke(38, 262, 262, 262, 13),
    stroke(113, 262, 113, 294, 14), stroke(187, 262, 187, 294, 15),
];
const AREA = {
    mountain: rect(101, 205, 98, 24),
    pool: rect(71, 235, 158, 24),
    whists: [rect(41, 265, 70, 27), rect(115, 265, 70, 27), rect(189, 265, 70, 27)],
};
// END 1

// BEGIN 2. The sheet
export const Pulka4: React.FC<PulkaProps> = ({ history, names, poolTarget, balance, large = false }) => {
    const t = useTexts();
    const { lastDeal } = history;
    const players = [0, 1, 2, 3];
    const list = (values: Band) => (values.length > 0 ? values.map(entry => show(entry.total)).join(', ') : t.sheet.empty);
    const spoken = (seat: number): string => [
        `${t.sheet.bandPool(names[seat])}: ${list(history.pool[seat])}`,
        `${t.sheet.bandMountain(names[seat])}: ${list(history.mountain[seat])}`,
        ...players.filter(other => other !== seat).map(other => `${t.sheet.bandWhists(names[seat], names[other])}: ${list(history.whists[seat][other])}`),
    ].join('; ');
    return (
        <figure className={`${styles.paper} ${large ? styles.paperLarge : ''}`} dir="ltr">
            <svg viewBox="0 0 300 300" role="img" aria-label={t.sheet.drawing(poolTarget)}>
                <g className={styles.rules}>
                    {FRAME.map((d, index) => <path key={`frame-${index}`} d={d} pathLength={1} style={{ animationDelay: `${(index * 0.05).toFixed(2)}s` }} />)}
                    {players.map(player => (
                        <g key={player} transform={`rotate(${player * 90} ${C} ${C})`}>
                            {SECTOR_LINES.map((d, index) => <path key={index} d={d} pathLength={1} style={{ animationDelay: `${(0.45 + index * 0.05 + player * 0.1).toFixed(2)}s` }} />)}
                        </g>
                    ))}
                </g>
                <g><title>{t.sheet.closesAt(poolTarget * 4)}</title>
                    <Ink text={String(poolTarget)} x={C} y={C - 6} size={12} seed={7} anchor="middle" />
                </g>
                {players.map(player => {
                    const name = shortName(names[player] ?? '');
                    return (
                        <g key={player} transform={`rotate(${player * 90} ${C} ${C})`}>
                            <text className={styles.hand} x={C} y={197} textAnchor="middle" {...fitName(name, 80)}>{name}</text>
                            {balance && (
                                <g key={`${player}-${signedInk(balance[player])}`}>
                                    <title>{t.sheet.resultTitle(names[player])}</title>
                                    <path className={styles.ring} d={roundStroke(C, 182, 16, 8)} pathLength={1} />
                                    <Ink text={signedInk(balance[player])} x={C} y={177} size={9} seed={player + 40} anchor="middle" latest={balance[player] < -0.05} write />
                                </g>
                            )}
                            <BandInk band={history.mountain[player]} area={AREA.mountain} lastDeal={lastDeal} seed={player * 10 + 1} />
                            <BandInk band={history.pool[player]} area={AREA.pool} lastDeal={lastDeal} seed={player * 10 + 2} />
                            {[1, 2, 3].map((step, index) => {
                                const target = (player + step) % 4;
                                const box = AREA.whists[index];
                                return (
                                    <g key={target}>
                                        <text className={styles.pencil} x={box.x + 1} y={box.y + 7}>{shortName(names[target] ?? '').slice(0, 2)}</text>
                                        <BandInk band={history.whists[player][target]} area={{ ...box, x: box.x + 10, w: box.w - 10 }} lastDeal={lastDeal} seed={player * 10 + 3 + index} />
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}
            </svg>
            <figcaption className={styles.srOnly}>{players.map(spoken).join('. ')}</figcaption>
            <Quill lastDeal={lastDeal} id={large ? 'quill4-large' : 'quill4'} />
        </figure>
    );
};
// END 2

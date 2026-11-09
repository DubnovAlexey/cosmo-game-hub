// [EN] FILE: games/preferans/components/Pulka.tsx — the score sheet as a sheet of paper on the table, drawn the
//      way players draw a pulka with a pen: a frame, the circle with the pool length, a sector for every player
//      (mountain next to the centre, then the pool, the whists at the edge, split between the opponents). The lines
//      are drawn on the paper when the sheet appears; every new number is then written stroke by stroke, the last
//      one in red, and each player's result is circled by the centre — as on the paper sheet in Alexey's photo.
//      Everything is one SVG (viewBox 300 × 260): it scales with the panel and stays sharp.
// [RU] ФАЙЛ: пуля как лист бумаги на столе, расчерченный так, как его чертят ручкой: рамка, круг с длиной пули, у
//      каждого игрока свой сектор (у центра гора, потом пуля, у края висты, разделённые между соперниками). Линии
//      проводятся на бумаге, когда лист появляется; дальше каждое новое число пишется штрих за штрихом, последнее —
//      красным, а итог каждого обведён у центра — как на бумажном листе с фотографии Алексея.
//      Всё — один SVG (viewBox 300 × 260): масштабируется вместе с панелью и остаётся чётким.
import React from 'react';
import { useTexts } from '../i18n/index.ts';
import { GLYPH_HEIGHT, layoutInk, wrapEntries } from './handwriting';
import { isFresh, type Band, type SheetHistory } from './sheetHistory';
import styles from './ScoreSheet.module.css';

// BEGIN 1. Geometry of the sheet (viewBox units)
interface Rect { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
// [EN] The sheet is drawn 20% taller than it is wide-proportioned (Alexey, 09.11: "stretch it down a little"): every
//      height goes through Y, the writing keeps its size and gets more lines in every band; the circle stays round.
// [RU] Лист расчерчен на 20% выше прежнего (Алексей, 09.11: «чуть-чуть растянул бы вниз»): каждая высота проходит
//      через Y, почерк сохраняет размер и получает больше строк в каждой полосе; круг остаётся круглым.
const SY = 1.2;
const Y = (value: number): number => Math.round(value * SY * 10) / 10;
const HEIGHT = Y(260);
const CIRCLE = { x: 150, y: Y(96), r: 15 };
const area = (x: number, y: number, w: number, h: number): Rect => ({ x, y: Y(y), w, h: Y(h) });
/** [EN] Where the entries of every band are written. [RU] Где пишутся записи каждой полосы. */
const AREA = {
    leftWhistsTop: area(9, 9, 39, 100),
    leftWhistsBottom: area(9, 115, 39, 98),
    leftPool: area(53, 9, 27, 180),
    leftMountain: area(85, 9, 27, 154),
    rightMountain: area(189, 9, 27, 154),
    rightPool: area(221, 9, 27, 180),
    rightWhistsTop: area(253, 9, 39, 100),
    rightWhistsBottom: area(253, 115, 39, 98),
    bottomMountain: area(117, 168, 66, 22),
    bottomPool: area(85, 194, 130, 22),
    bottomWhistsLeft: area(53, 221, 94, 31),
    bottomWhistsRight: area(153, 221, 94, 31),
} satisfies Record<string, Rect>;
/** [EN] A name as the pulka writes it: the last word ("Count Vlad" → "Vlad"). [RU] Имя, как его пишут в пуле: последнее слово. */
const shortName = (name: string): string => name.trim().split(/\s+/).pop() ?? name;
/** [EN] A long name is squeezed into its sector, as a hand writes tighter near a line. [RU] Длинное имя ужимается в свой сектор. */
const fitName = (name: string, room: number): React.SVGProps<SVGTextElement> => (name.length * 5.2 > room ? { textLength: room, lengthAdjust: 'spacingAndGlyphs' } : {});

/** [EN] A slightly uneven pen line. [RU] Чуть неровная линия ручкой. */
const stroke = (x1: number, y1: number, x2: number, y2: number, seed: number): string => {
    const bend = Math.sin(seed * 91.7) * 1.3;
    const nx = -(y2 - y1);
    const ny = x2 - x1;
    const length = Math.hypot(nx, ny) || 1;
    return `M${x1} ${y1} Q${((x1 + x2) / 2 + (nx / length) * bend).toFixed(1)} ${((y1 + y2) / 2 + (ny / length) * bend).toFixed(1)} ${x2} ${y2}`;
};
/** [EN] A hand-drawn circle that overlaps a little where the pen started. [RU] Нарисованный от руки круг с небольшим нахлёстом. */
const roundStroke = (cx: number, cy: number, rx: number, ry: number): string =>
    `M${cx + rx} ${cy - 1} C${cx + rx} ${cy - ry - 1} ${cx - rx} ${cy - ry} ${cx - rx} ${cy + 0.5}`
    + ` C${cx - rx} ${cy + ry + 1} ${cx + rx + 0.5} ${cy + ry} ${cx + rx - 0.4} ${cy - 2.5}`;

const RULES: readonly string[] = [
    stroke(5.5, 6, 294.5, 5.5, 1), stroke(294.5, 5, 295, Y(254), 2), stroke(295, Y(254.5), 5, Y(254), 3), stroke(5.5, Y(255), 6, 5.5, 4),
    stroke(50, 6, 50, Y(218), 5), stroke(82, 6, 82, Y(192), 6), stroke(114, 6, 114, Y(166), 7),
    stroke(250, 6, 250, Y(218), 8), stroke(218, 6, 218, Y(192), 9), stroke(186, 6, 186, Y(166), 10),
    stroke(114, Y(166), 186, Y(166), 11), stroke(82, Y(192), 218, Y(192), 12), stroke(50, Y(218), 250, Y(218), 13),
    stroke(114, Y(166), 6, Y(254), 14), stroke(186, Y(166), 294, Y(254), 15),
    stroke(150, 6, 150, CIRCLE.y - CIRCLE.r, 16),
    stroke(CIRCLE.x - 6.9, CIRCLE.y + 13.3, 114, Y(166), 17), stroke(CIRCLE.x + 6.9, CIRCLE.y + 13.3, 186, Y(166), 18),
    stroke(6, Y(112), 50, Y(112), 19), stroke(250, Y(112), 294, Y(112), 20), stroke(150, Y(218), 150, Y(254), 21),
    roundStroke(CIRCLE.x, CIRCLE.y, CIRCLE.r, CIRCLE.r),
];
// END 1

// BEGIN 2. Ink
const ENTRY_SIZE = 10;
const LINE_HEIGHT = 12;

interface InkProps {
    text: string;
    x: number;
    y: number;
    size: number;
    seed: number;
    latest?: boolean;
    write?: boolean;
    anchor?: 'start' | 'middle';
}

// [EN] One handwritten text; with `write` its strokes appear one after another. [RU] Один рукописный текст; с `write` штрихи появляются один за другим.
const Ink: React.FC<InkProps> = ({ text, x, y, size, seed, latest = false, write = false, anchor = 'start' }) => {
    const { glyphs, width } = layoutInk(text, seed);
    const scale = size / GLYPH_HEIGHT;
    const left = anchor === 'middle' ? x - (width * scale) / 2 : x;
    return (
        <g className={`${styles.ink} ${latest ? styles.inkLatest : ''}`} transform={`translate(${left.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(3)})`}>
            {glyphs.map((glyph, index) => (
                <path key={index} d={glyph.d} pathLength={1}
                    transform={`translate(${glyph.x.toFixed(2)} ${glyph.y.toFixed(2)}) rotate(${glyph.rotate.toFixed(1)} 5 8)`}
                    className={write ? styles.write : undefined} style={write ? { animationDelay: `${(index * 0.14).toFixed(2)}s` } : undefined} />
            ))}
        </g>
    );
};

const show = (value: number): string => String(Math.round(value * 10) / 10);

// [EN] The running totals of one band, wrapped like handwriting; when the band is full the oldest lines go.
// [RU] Нарастающие итоги одной полосы с переносом, как пишут от руки; когда полоса полна, старые строки уходят.
const BandInk: React.FC<{ band: Band; area: Rect; lastDeal: number; seed: number }> = ({ band, area, lastDeal, seed }) => {
    if (band.length === 0) return null;
    const entries = band.map(entry => show(entry.total));
    const scale = ENTRY_SIZE / GLYPH_HEIGHT;
    const lines = wrapEntries(entries, (area.w - 3) / scale);
    const capacity = Math.max(1, Math.floor((area.h - 1) / LINE_HEIGHT));
    const fresh = isFresh(band, lastDeal);
    const last = entries.length - 1;
    return (
        <g>
            {lines.slice(-capacity).map((line, row) => {
                let x = area.x + 1.5;
                const y = area.y + 1 + row * LINE_HEIGHT;
                const pieces = [];
                for (let index = line.from; index < line.to; index += 1) {
                    const text = index < last ? `${entries[index]},` : entries[index];
                    pieces.push(<Ink key={band[index].deal} text={text} x={x} y={y} size={ENTRY_SIZE} seed={seed * 97 + index}
                        latest={index === last} write={fresh && index === last} />);
                    x += (layoutInk(text, seed * 97 + index).width + 2) * scale;
                }
                return <g key={line.from}>{pieces}</g>;
            })}
        </g>
    );
};
// END 2

interface PulkaProps {
    history: SheetHistory;
    names: readonly string[];
    poolTarget: number;
    /** [EN] Each player's result if the pool closed now, circled in his sector. [RU] Итог каждого, если бы пуля закрылась сейчас, обведён в его секторе. */
    balance?: readonly number[];
    large?: boolean;
}

const signed = (value: number): string => `${value > 0.05 ? '+' : ''}${Math.round(value * 10) / 10}`;

// BEGIN 3. The sheet
export const Pulka: React.FC<PulkaProps> = ({ history, names, poolTarget, balance, large = false }) => {
    const t = useTexts();
    const { lastDeal } = history;
    const band = (kind: 'pool' | 'mountain', seat: number, area: Rect, seed: number) =>
        <BandInk band={history[kind][seat]} area={area} lastDeal={lastDeal} seed={seed} />;
    // [EN] Whose whists these are: the first two letters of the name in pencil (Koschei and Carmilla both start with K).
    // [RU] На кого эти висты: первые две буквы имени карандашом (Кощей и Кармилла оба начинаются на «К»).
    const whists = (writer: number, target: number, box: Rect, seed: number) => (
        <>
            <text className={styles.pencil} x={box.x + 1} y={box.y + 7}>{shortName(names[target]).slice(0, 2)}</text>
            <BandInk band={history.whists[writer][target]} area={{ ...box, x: box.x + 10, w: box.w - 10 }} lastDeal={lastDeal} seed={seed} />
        </>
    );
    // [EN] Results by the circle, as on paper: left, right and below it. [RU] Итоги у круга, как на бумаге: слева, справа и под ним.
    const result = (seat: number, x: number, y: number) => balance && (
        <g key={`${seat}-${signed(balance[seat])}`}>
            <title>{t.sheet.resultTitle(names[seat])}</title>
            <path className={styles.ring} d={roundStroke(x, y + 5, 15, 8)} pathLength={1} />
            <Ink text={signed(balance[seat])} x={x} y={y} size={9} seed={seat + 40} anchor="middle"
                latest={balance[seat] < -0.05} write />
        </g>
    );
    const spoken = (seat: number): string => {
        const list = (values: Band) => (values.length > 0 ? values.map(entry => show(entry.total)).join(', ') : t.sheet.empty);
        const others = [0, 1, 2].filter(other => other !== seat)
            .map(other => `${t.sheet.bandWhists(names[seat], names[other])}: ${list(history.whists[seat][other])}`);
        return [`${t.sheet.bandPool(names[seat])}: ${list(history.pool[seat])}`, `${t.sheet.bandMountain(names[seat])}: ${list(history.mountain[seat])}`, ...others].join('; ');
    };
    return (
        <figure className={`${styles.paper} ${large ? styles.paperLarge : ''}`} dir="ltr">
            <svg viewBox={`0 0 300 ${HEIGHT}`} role="img" aria-label={t.sheet.drawing(poolTarget)}>
                <g className={styles.rules}>
                    {RULES.map((d, index) => <path key={index} d={d} pathLength={1} style={{ animationDelay: `${(index * 0.04).toFixed(2)}s` }} />)}
                </g>
                <g>
                    <text className={styles.hand} x={132} y={Y(22)} textAnchor="middle" {...fitName(shortName(names[1]), 32)}>{shortName(names[1])}</text>
                    <text className={styles.hand} x={168} y={Y(22)} textAnchor="middle" {...fitName(shortName(names[2]), 32)}>{shortName(names[2])}</text>
                    <text className={styles.hand} x={150} y={Y(160)} textAnchor="middle" {...fitName(shortName(names[0]), 64)}>{shortName(names[0])}</text>
                    <g><title>{t.sheet.closesAt(poolTarget * 3)}</title>
                        <Ink text={String(poolTarget)} x={CIRCLE.x} y={CIRCLE.y - 6} size={12} seed={7} anchor="middle" />
                    </g>
                    {result(1, 132, Y(48))}
                    {result(2, 168, Y(48))}
                    {result(0, 150, Y(128))}

                    {whists(1, 2, AREA.leftWhistsTop, 1)}
                    {whists(1, 0, AREA.leftWhistsBottom, 2)}
                    {band('pool', 1, AREA.leftPool, 3)}
                    {band('mountain', 1, AREA.leftMountain, 4)}
                    {band('mountain', 2, AREA.rightMountain, 5)}
                    {band('pool', 2, AREA.rightPool, 6)}
                    {whists(2, 1, AREA.rightWhistsTop, 7)}
                    {whists(2, 0, AREA.rightWhistsBottom, 8)}
                    {band('mountain', 0, AREA.bottomMountain, 9)}
                    {band('pool', 0, AREA.bottomPool, 10)}
                    {whists(0, 1, AREA.bottomWhistsLeft, 11)}
                    {whists(0, 2, AREA.bottomWhistsRight, 12)}
                </g>
            </svg>
            <figcaption className={styles.srOnly}>{[0, 1, 2].map(spoken).join('. ')}</figcaption>
        </figure>
    );
};
// END 3

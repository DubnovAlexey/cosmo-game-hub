// [EN] FILE: games/preferans/components/handwriting.ts — digits written by hand for the paper score sheet. Each
//      glyph is ONE pen stroke (a path in a 10 × 16 box, baseline at 15), drawn on purpose a little uneven. Because
//      they are strokes, not a font, a new number can be written in front of the player: the stroke is revealed from
//      its start to its end (stroke-dashoffset with pathLength = 1). No font is downloaded.
//      Layout adds a small, repeatable wobble per character, so a sheet looks written, not printed.
// [RU] ФАЙЛ: цифры «от руки» для бумажного листа пули. Каждый знак — ОДИН штрих пера (путь в рамке 10 × 16, строка
//      на высоте 15), нарочно чуть неровный. Это штрихи, а не шрифт, поэтому новое число пишется на глазах у игрока:
//      штрих проявляется от начала к концу (stroke-dashoffset при pathLength = 1). Шрифт не скачивается.
//      Раскладка добавляет каждому знаку небольшое повторяемое дрожание: лист выглядит написанным, а не напечатанным.

export interface Glyph {
    /** [EN] SVG path data. [RU] Путь SVG. */
    readonly d: string;
    /** [EN] Advance width in glyph units. [RU] Ширина знака в единицах рамки. */
    readonly width: number;
}

export const GLYPH_HEIGHT = 16;

export const GLYPHS: Readonly<Record<string, Glyph>> = {
    '0': { d: 'M5.2 1.2 C1.6 1.0 1.0 7.5 1.3 10.6 C1.7 14.4 4.0 15.3 5.4 15.1 C8.6 14.7 9.1 9.6 8.8 6.6 C8.5 3.2 7.2 1.3 5.0 1.4', width: 10 },
    '1': { d: 'M2.4 4.6 C3.9 3.4 5.1 2.2 6.0 1.0 C5.8 5.6 5.6 10.4 5.7 15.2', width: 8 },
    '2': { d: 'M1.6 4.6 C2.0 1.8 4.4 0.9 6.2 1.3 C8.6 1.9 8.8 4.6 7.6 6.6 C6.0 9.2 3.2 11.8 1.2 15.0 C3.8 14.8 6.6 14.9 9.2 15.1', width: 10 },
    '3': { d: 'M1.8 2.6 C3.6 0.8 7.6 0.7 8.0 3.6 C8.3 5.9 6.2 7.2 4.0 7.6 C6.8 7.6 9.0 9.4 8.8 11.8 C8.5 14.8 5.6 15.6 3.6 15.0 C2.6 14.7 1.8 14.0 1.4 13.2', width: 10 },
    '4': { d: 'M6.8 15.3 C6.9 10.6 7.0 5.6 7.2 1.0 C5.2 4.6 3.0 8.0 1.0 10.8 C3.8 10.6 6.6 10.6 9.4 10.7', width: 10 },
    '5': { d: 'M8.6 1.2 C6.6 1.3 4.6 1.2 2.7 1.4 C2.4 3.4 2.1 5.2 1.9 7.0 C3.6 5.9 6.2 5.8 7.8 7.4 C9.6 9.2 9.0 13.4 6.6 14.8 C4.8 15.7 2.6 15.2 1.4 13.8', width: 10 },
    '6': { d: 'M7.8 1.4 C4.0 2.0 1.6 5.8 1.4 10.0 C1.2 13.6 3.2 15.4 5.2 15.2 C7.8 15.0 8.9 12.6 8.6 10.6 C8.2 8.2 5.8 7.2 3.8 8.2 C2.8 8.7 2.0 9.6 1.6 10.6', width: 10 },
    '7': { d: 'M1.2 1.6 C3.8 1.4 6.4 1.3 9.0 1.4 C7.0 5.8 5.4 10.4 4.2 15.3', width: 10 },
    '8': { d: 'M5.0 7.6 C2.2 6.8 1.6 4.0 2.8 2.4 C4.0 0.8 7.0 0.9 7.8 2.8 C8.6 4.8 6.8 6.8 5.0 7.6 C2.4 8.6 1.0 10.8 1.8 13.2 C2.6 15.6 6.6 15.8 8.0 13.6 C9.2 11.4 7.6 8.6 5.0 7.6', width: 10 },
    '9': { d: 'M8.2 5.0 C8.4 2.0 6.4 0.8 4.6 1.0 C2.4 1.3 1.2 3.4 1.6 5.4 C2.0 7.6 4.4 8.4 6.2 7.6 C7.2 7.1 8.0 6.2 8.3 5.0 C8.4 8.6 7.6 12.4 5.6 15.2', width: 10 },
    ',': { d: 'M2.6 13.6 C3.2 14.4 3.0 15.8 2.0 17.0', width: 4.5 },
    '.': { d: 'M2.3 14.5 C2.6 14.9 3.0 15.0 3.2 14.7', width: 4.5 },
    '-': { d: 'M1.4 9.0 C3.4 8.8 5.4 8.8 7.4 8.9', width: 8.5 },
    '+': { d: 'M4.6 5.0 C4.5 7.6 4.5 10.2 4.6 12.8 M1.2 9.0 C3.4 8.9 5.8 8.9 8.0 9.0', width: 9 },
};

export interface PlacedGlyph {
    readonly char: string;
    readonly d: string;
    readonly x: number;
    readonly y: number;
    readonly rotate: number;
}

export interface Written {
    readonly glyphs: readonly PlacedGlyph[];
    /** [EN] Total width in glyph units. [RU] Общая ширина в единицах рамки. */
    readonly width: number;
}

/** [EN] A tiny repeatable random number from a seed (the same text always wobbles the same way).
 *  [RU] Маленькое повторяемое случайное число из зерна: один и тот же текст дрожит всегда одинаково. */
const wobble = (seed: number): number => {
    const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return value - Math.floor(value);
};

/** [EN] Places the characters of `text` one after another; unknown characters become a small gap.
 *  [RU] Расставляет знаки текста один за другим; незнакомый знак становится небольшим пробелом. */
export function layoutInk(text: string, seed = 1): Written {
    const glyphs: PlacedGlyph[] = [];
    let x = 0;
    [...text].forEach((char, index) => {
        const glyph = GLYPHS[char];
        const random = wobble(seed * 31 + index);
        if (!glyph) { x += 4; return; }
        glyphs.push({ char, d: glyph.d, x, y: (random - 0.5) * 1.4, rotate: (random - 0.5) * 7 });
        x += glyph.width * (0.94 + random * 0.1);
    });
    return { glyphs, width: x };
}

/** [EN] Width of a text in glyph units, without placing it. [RU] Ширина текста в единицах рамки без расстановки. */
export const inkWidth = (text: string): number => layoutInk(text).width;

export interface InkLine {
    /** [EN] Index of the first entry on this line. [RU] Номер первой записи в этой строке. */
    readonly from: number;
    readonly to: number;
}

/**
 * [EN] Splits running totals into lines that fit `maxWidth` (glyph units), the way a scorer wraps along a band:
 *      «2, 6, 10,» then the next line. Every line holds at least one entry.
 * [RU] Делит нарастающие итоги на строки шириной не больше `maxWidth` (в единицах рамки), как ведущий переносит
 *      записи вдоль полосы: «2, 6, 10,» и дальше новая строка. В каждой строке хотя бы одна запись.
 */
export function wrapEntries(entries: readonly string[], maxWidth: number): InkLine[] {
    const lines: InkLine[] = [];
    let start = 0;
    let width = 0;
    entries.forEach((entry, index) => {
        const piece = inkWidth(index < entries.length - 1 ? `${entry},` : entry) + 2;
        if (index > start && width + piece > maxWidth) {
            lines.push({ from: start, to: index });
            start = index;
            width = 0;
        }
        width += piece;
    });
    if (entries.length > 0) lines.push({ from: start, to: entries.length });
    return lines;
}

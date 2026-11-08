// [EN] FILE: apps/client/scripts/preferans-cover.mjs — draws the preferans cover for the Game Hub catalog:
//      a white (faintly cream) score sheet lying askew on deep green felt, with pencil lines and numbers written
//      in pen, a pencil on it and two cards with the necromancy back beside it. The digits are the same one-stroke
//      glyphs the game writes with (src/games/preferans/components/handwriting.ts); the card back is inlined from
//      src/games/preferans/assets/card-back.svg. The result is one SVG with no fonts and no outside files.
//      Run: node apps/client/scripts/preferans-cover.mjs  →  apps/client/public/games/preferans/cover.svg
// [RU] ФАЙЛ: рисует обложку преферанса для каталога хаба: белый (чуть кремовый) лист пули лежит наискось на
//      глубоком зелёном сукне, линии карандашом, цифры ручкой, сверху карандаш, рядом две карты с рубашкой-
//      некромантией. Цифры — те же штрихи «от руки», которыми пишет игра (handwriting.ts); рубашка вставляется
//      из assets/card-back.svg. Получается один SVG без шрифтов и внешних файлов.
//      Запуск: node apps/client/scripts/preferans-cover.mjs  →  apps/client/public/games/preferans/cover.svg
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLYPH_HEIGHT, layoutInk } from '../src/games/preferans/components/handwriting.ts';

const here = dirname(fileURLToPath(import.meta.url));
const client = join(here, '..');
const W = 740;
const H = 423;

// BEGIN 1. The sheet: the same geometry as Pulka.tsx (300 × 260 units) / Лист: та же геометрия, что в Pulka.tsx
const CIRCLE = { x: 150, y: 96, r: 15 };
const stroke = (x1, y1, x2, y2, seed) => {
    const bend = Math.sin(seed * 91.7) * 1.3;
    const nx = -(y2 - y1);
    const ny = x2 - x1;
    const length = Math.hypot(nx, ny) || 1;
    return `M${x1} ${y1} Q${((x1 + x2) / 2 + (nx / length) * bend).toFixed(1)} ${((y1 + y2) / 2 + (ny / length) * bend).toFixed(1)} ${x2} ${y2}`;
};
const roundStroke = (cx, cy, rx, ry) =>
    `M${cx + rx} ${cy - 1} C${cx + rx} ${cy - ry - 1} ${cx - rx} ${cy - ry} ${cx - rx} ${cy + 0.5}`
    + ` C${cx - rx} ${cy + ry + 1} ${cx + rx + 0.5} ${cy + ry} ${cx + rx - 0.4} ${cy - 2.5}`;
const RULES = [
    stroke(5.5, 6, 294.5, 5.5, 1), stroke(294.5, 5, 295, 254, 2), stroke(295, 254.5, 5, 254, 3), stroke(5.5, 255, 6, 5.5, 4),
    stroke(50, 6, 50, 218, 5), stroke(82, 6, 82, 192, 6), stroke(114, 6, 114, 166, 7),
    stroke(250, 6, 250, 218, 8), stroke(218, 6, 218, 192, 9), stroke(186, 6, 186, 166, 10),
    stroke(114, 166, 186, 166, 11), stroke(82, 192, 218, 192, 12), stroke(50, 218, 250, 218, 13),
    stroke(114, 166, 6, 254, 14), stroke(186, 166, 294, 254, 15),
    stroke(150, 6, 150, CIRCLE.y - CIRCLE.r, 16),
    stroke(143.1, 109.3, 114, 166, 17), stroke(156.9, 109.3, 186, 166, 18),
    stroke(6, 112, 50, 112, 19), stroke(250, 112, 294, 112, 20), stroke(150, 218, 150, 254, 21),
    roundStroke(CIRCLE.x, CIRCLE.y, CIRCLE.r, CIRCLE.r),
];

/** [EN] Handwritten text as pen strokes. [RU] Текст от руки — штрихами ручки. */
function ink(text, x, y, size, seed, color, anchor = 'start') {
    const { glyphs, width } = layoutInk(text, seed);
    const scale = size / GLYPH_HEIGHT;
    const left = anchor === 'middle' ? x - (width * scale) / 2 : x;
    const paths = glyphs.map(glyph => `<path d="${glyph.d}" transform="translate(${glyph.x.toFixed(2)} ${glyph.y.toFixed(2)}) rotate(${glyph.rotate.toFixed(1)} 5 8)"/>`).join('');
    return `<g fill="none" stroke="${color}" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" transform="translate(${left.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(3)})">${paths}</g>`;
}

/** [EN] Running totals written along a band, the last one in red. [RU] Нарастающие итоги вдоль полосы, последний — красным. */
function band(entries, x, y, width, seed) {
    const size = 10;
    const scale = size / GLYPH_HEIGHT;
    let cx = x;
    let cy = y;
    return entries.map((entry, index) => {
        const last = index === entries.length - 1;
        const text = last ? entry : `${entry},`;
        const advance = (layoutInk(text, seed * 97 + index).width + 2) * scale;
        if (cx + advance > x + width && cx > x) { cx = x; cy += 12; }
        const out = ink(text, cx, cy, size, seed * 97 + index, last ? '#b3262e' : '#1f3a8a');
        cx += advance;
        return out;
    }).join('');
}

const INK = [
    band(['2', '7', '11'], 86.5, 10, 24, 1),        // Orion's mountain / гора Ориона
    band(['2', '6', '10'], 54.5, 10, 24, 2),        // Orion's pool / пуля Ориона
    band(['4', '8'], 222.5, 10, 24, 3),             // Vega's pool / пуля Веги
    band(['3', '9'], 190.5, 10, 24, 4),             // Vega's mountain / гора Веги
    band(['2', '4', '8', '10'], 87, 195, 126, 5),   // your pool / ваша пуля
    band(['6'], 119, 169, 62, 6),                   // your mountain / ваша гора
    band(['8', '20'], 10.5, 10, 36, 7),             // whists / висты
    band(['12'], 10.5, 116, 36, 8),
    band(['14', '26'], 254.5, 10, 36, 9),
    band(['6', '14', '30'], 54.5, 222, 90, 10),
    band(['4', '10'], 154.5, 222, 90, 11),
    ink('10', CIRCLE.x, CIRCLE.y - 6, 12, 12, '#1f3a8a', 'middle'),
].join('');

// [EN] Results circled by the centre, as in the game. [RU] Итоги, обведённые у центра, как в игре.
const RESULTS = [['-40', 132, 48], ['+46', 168, 48], ['-6', 150, 128]].map(([text, x, y], index) =>
    `<ellipse cx="${x}" cy="${y + 6}" rx="13" ry="7.5" fill="none" stroke="#1f3a8a" stroke-width="0.9" stroke-opacity="0.7" transform="rotate(${index * 3 - 3} ${x} ${y + 6})"/>`
    + ink(text, x, y, 10, 40 + index, '#1f3a8a', 'middle')).join('');
// END 1

// BEGIN 2. The card back, inlined with its own ids / Рубашка, вставленная со своими id
const back = readFileSync(join(client, 'src/games/preferans/assets/card-back.svg'), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg[^>]*>/, '<symbol id="back" viewBox="0 0 100 142">')
    .replace('</svg>', '</symbol>')
    .replace(/id="([\w-]+)"/g, (_, id) => (id === 'back' ? 'id="back"' : `id="cb-${id}"`))
    .replace(/url\(#([\w-]+)\)/g, 'url(#cb-$1)')
    .replace(/href="#([\w-]+)"/g, 'href="#cb-$1"')
    .replace('<symbol id="cb-back"', '<symbol id="back"');
// END 2

// BEGIN 3. Pencil / Карандаш
const PENCIL = `<g transform="translate(486 296) rotate(-28)">
  <rect x="-2" y="5" width="214" height="17" rx="3" fill="#000" opacity="0.28" filter="url(#soft)"/>
  <rect x="0" y="0" width="190" height="16" fill="#e9b949"/>
  <rect x="0" y="0" width="190" height="5" fill="#f4cd68"/>
  <rect x="0" y="11" width="190" height="5" fill="#c9952f"/>
  <rect x="-16" y="0" width="16" height="16" rx="2" fill="#e58a8a"/>
  <rect x="-3" y="-0.5" width="12" height="17" fill="#b9b9b2"/>
  <path d="M-3 4H9M-3 8H9M-3 12H9" stroke="#8d8d86" stroke-width="0.8"/>
  <path d="M190 0L214 8L190 16Z" fill="#e8c9a0"/>
  <path d="M206 5.4L214 8L206 10.6Z" fill="#3b3b3b"/>
</g>`;
// END 3

// BEGIN 4. A face-up ace of spades / Открытый туз пик
const ACE = `<g transform="translate(618 92) rotate(14)">
  <rect x="-4" y="6" width="108" height="150" rx="11" fill="#000" opacity="0.35" filter="url(#soft)"/>
  <rect x="0" y="0" width="100" height="142" rx="10" fill="#fffdf7" stroke="#d8d2c2"/>
  <path d="M10 26L16 9L22 26M12.3 20H19.7" fill="none" stroke="#151826" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 29C13 33 9.5 35.5 11.5 39C12.7 41 15 40.6 15.6 39C15.4 41.4 14.6 43 13.4 44H18.6C17.4 43 16.6 41.4 16.4 39C17 40.6 19.3 41 20.5 39C22.5 35.5 19 33 16 29Z" fill="#151826"/>
  <path d="M50 42C39 56 24 63 31 79C35 87 45 86 48 79C47.6 89 45 96 40 101H60C55 96 52.4 89 52 79C55 86 65 87 69 79C76 63 61 56 50 42Z" fill="#151826"/>
</g>`;
// END 4

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<!-- Preferans cover: generated by apps/client/scripts/preferans-cover.mjs — edit the script, not this file. -->
<!-- Обложка преферанса: создана apps/client/scripts/preferans-cover.mjs — правьте скрипт, а не этот файл. -->
<defs>
  <radialGradient id="felt" cx="50%" cy="42%" r="75%">
    <stop offset="0" stop-color="#187a4c"/><stop offset="0.4" stop-color="#10603a"/>
    <stop offset="0.72" stop-color="#0b4a2c"/><stop offset="1" stop-color="#06301c"/>
  </radialGradient>
  <radialGradient id="lamp" cx="50%" cy="30%" r="55%">
    <stop offset="0" stop-color="#ffe29e" stop-opacity="0.16"/><stop offset="1" stop-color="#ffe29e" stop-opacity="0"/>
  </radialGradient>
  <filter id="fibres" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0.04  0 0 0 0 0.02  0 0 0 0.3 0"/>
  </filter>
  <filter id="paperGrain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.26  0 0 0 0.07 0"/>
  </filter>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
  <clipPath id="sheetClip"><rect x="0" y="0" width="300" height="260" rx="2"/></clipPath>
  ${back}
</defs>
<rect width="${W}" height="${H}" fill="url(#felt)"/>
<rect width="${W}" height="${H}" filter="url(#fibres)"/>
<rect width="${W}" height="${H}" fill="url(#lamp)"/>

<!-- two cards with the necromancy back / две карты с рубашкой-некромантией -->
<g transform="translate(40 120) rotate(-16)">
  <rect x="-3" y="8" width="106" height="150" rx="11" fill="#000" opacity="0.35" filter="url(#soft)"/>
  <use href="#back" width="100" height="142"/>
</g>
<g transform="translate(92 140) rotate(-3)">
  <rect x="-3" y="8" width="106" height="150" rx="11" fill="#000" opacity="0.35" filter="url(#soft)"/>
  <use href="#back" width="100" height="142"/>
</g>
${ACE}

<!-- the score sheet / лист пули -->
<g transform="translate(372 212) rotate(-7) translate(-172.5 -149.5) scale(1.15)">
  <rect x="7" y="12" width="300" height="260" rx="3" fill="#000" opacity="0.45" filter="url(#soft)"/>
  <rect x="0" y="0" width="300" height="260" rx="2" fill="#fbf7ec"/>
  <rect x="0" y="0" width="300" height="260" rx="2" filter="url(#paperGrain)" clip-path="url(#sheetClip)"/>
  <g fill="none" stroke="#4b5563" stroke-width="0.85" stroke-linecap="round" stroke-opacity="0.8">
    ${RULES.map(d => `<path d="${d}"/>`).join('')}
  </g>
  ${INK}
  ${RESULTS}
</g>
${PENCIL}

<rect width="${W}" height="${H}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="40" filter="url(#soft)"/>
</svg>
`;

const out = join(client, 'public/games/preferans/cover.svg');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg);
console.log(`cover written: ${out} (${(svg.length / 1024).toFixed(1)} KB)`);

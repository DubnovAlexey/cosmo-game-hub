// [EN] The Standard of the Universe — generator of the flag, the patches and the presentation.
//      Alexey, 12.11.2026: «реальный флаг какой-то галактики… будет крепиться в военных и не военных скафандрах…
//      дорого, солидно… весь смысл в деталях». Every detail carries a meaning taken from the Universe project
//      (C:/Projects/Full_Stack/universe: the 108-second cycle, the five phases, the Zero Point, the light echo,
//      the galactic disk, the Ouroboros of the finale, the Mulberry32 generator, the site palette).
//      Writes: public/shared/emblems/universe-flag.svg (clean flag), universe-patch.svg (crew patch, embroidered),
//      universe-patch-tactical.svg (subdued patch for military suits), universe-roundel.svg (round chest seal with the
//      motto) and the presentation «Знамя Universe.html» into the Desktop folder «Знамя Universe».
//      node apps/client/scripts/emblems/universe-standard.mjs
// [RU] Знамя Вселенной Universe — генератор флага, нашивок и презентации. Каждая деталь несёт смысл из проекта
//      Universe: цикл 108 секунд, пять фаз, Точка Нуля, световое эхо, галактический диск, Уроборос финала,
//      генератор Mulberry32, палитра сайта.
import fs from 'node:fs';

const OUT = new URL('../../public/shared/emblems/', import.meta.url);
const DESK = 'C:/Users/alex4/OneDrive/Рабочий стол/Знамя Universe/';

/** [EN] The Universe's own deterministic generator (UNIVERSE_BIBLE §7.1). [RU] Детерминированный ГПСЧ самой Вселенной. */
function mulberry32(seed) {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const f = (n) => Math.round(n * 100) / 100;
const RAD = Math.PI / 180;
/** A point at radius r and angle th (degrees, clockwise from the top). */
const P = (r, th) => [r * Math.sin(th * RAD), -r * Math.cos(th * RAD)];
const pt = ([x, y]) => `${f(x)} ${f(y)}`;

// ---------------------------------------------------------------------------------------------------------------
// The palettes. [RU] Палитры: парадная (цвета сайта Universe) и тактическая (приглушённая, для военных скафандров).
const PARADE = {
    void0: '#070915', void1: '#020308', // Пустота — фаза 01_VOID, полотно сайта (--void-obsidian)
    pale0: '#262262', pale1: '#12103a', // Ультрамарин Генезиса — --accent-ultramarine, фаза 02_GENESIS
    gold0: '#fff1c1', gold1: '#e9c46a', gold2: '#a8781c', // Золото кромки и Звезды Нуля — --github-ink-color
    goldShade: '#8a5f12', goldShort: '#e7b24c', goldShortShade: '#7a510f',
    ice: '#7dd3fc', // Лёд эха — --accent-ice, кольца светового эха RS Кормы
    amber: '#f59e0b', amberLight: '#ffe6a6', // Янтарь ядра — --accent-amber
    pearl0: '#ffffff', pearl1: '#d9dee8', pearl2: '#8d96a8', // Жемчуг Уробороса
    scale: '#2c3240', scaleEdge: '#e9c46a', // чешуя по хребту: графит с золотым кантом
    eye: '#f59e0b',
    star: '#d6f1ff',
};
const TACTICAL = {
    void0: '#3a3d33', void1: '#2c2f27',
    pale0: '#2a2d25', pale1: '#22251e',
    gold0: '#cfc2a0', gold1: '#b3a682', gold2: '#7d7459',
    goldShade: '#6c654e', goldShort: '#a69a78', goldShortShade: '#5f5945',
    ice: '#8e8a74',
    amber: '#b3a682', amberLight: '#cfc2a0',
    pearl0: '#c9c3ae', pearl1: '#a8a28c', pearl2: '#6f6a58',
    scale: '#2a2c24', scaleEdge: '#8e8a74',
    eye: '#2a2c24',
    star: '#cfc2a0',
};

// ---------------------------------------------------------------------------------------------------------------
/** [EN] The defs every drawing shares (gradients by palette, prefixed). [RU] Общие градиенты, у каждой палитры свои id. */
function defs(c, p) {
    return `
    <linearGradient id="${p}pale" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.pale0}"/><stop offset="1" stop-color="${c.pale1}"/></linearGradient>
    <linearGradient id="${p}void" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.void0}"/><stop offset="1" stop-color="${c.void1}"/></linearGradient>
    <linearGradient id="${p}gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.gold0}"/><stop offset="0.45" stop-color="${c.gold1}"/><stop offset="1" stop-color="${c.gold2}"/></linearGradient>
    <linearGradient id="${p}pearl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.pearl0}"/><stop offset="0.5" stop-color="${c.pearl1}"/><stop offset="1" stop-color="${c.pearl2}"/></linearGradient>
    <linearGradient id="${p}disk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.amber}" stop-opacity="0"/><stop offset="0.2" stop-color="${c.amber}" stop-opacity="0.5"/><stop offset="0.5" stop-color="${c.amberLight}" stop-opacity="0.95"/><stop offset="0.8" stop-color="${c.amber}" stop-opacity="0.5"/><stop offset="1" stop-color="${c.amber}" stop-opacity="0"/></linearGradient>
    <radialGradient id="${p}zero" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="${c.amberLight}"/><stop offset="1" stop-color="${c.amber}" stop-opacity="0"/></radialGradient>`;
}

// ---------------------------------------------------------------------------------------------------------------
/**
 * [EN] The Ouroboros of the Universe finale: a pearl serpent around the seal, thick at the neck and tapering to the
 *      tail, which it bites at the top: the cycle closes on itself (108 s, then RESTART_COLLAPSE and VOID again).
 *      The dorsal row of diamond scales is graphite with a gold edge; small crescent scales run along both flanks.
 * [RU] Уроборос финала Universe: жемчужный змей вокруг печати, толстый у шеи и сужающийся к хвосту, который он
 *      кусает наверху: цикл замыкается сам на себя. По хребту — ромбы чешуи (графит с золотым кантом), по бокам —
 *      мелкая серповидная чешуя.
 */
function ouroboros(c, p, { R = 52, wNeck = 13, wTail = 2, thNeck = -7, thTail = 30 } = {}) {
    const span = thNeck - (thTail - 360); // degrees the body runs counter-clockwise from the neck to the tail
    const N = 220;
    const outer = [], inner = [];
    const width = (s) => wTail + (wNeck - wTail) * (1 - s ** 1.9);
    for (let i = 0; i <= N; i++) {
        const s = i / N, th = thNeck - s * span, w = width(s);
        outer.push(P(R + w / 2, th));
        inner.push(P(R - w / 2, th));
    }
    const body = `M${outer.map(pt).join(' L')} L${inner.reverse().map(pt).join(' L')} Z`;
    // dorsal diamonds
    const scales = [], flanks = [];
    const step = 5.1;
    for (let k = 1; ; k++) {
        const s = (k * step) / span;
        if (s > 0.94) break;
        const th = thNeck - s * span, w = width(s);
        const [cx, cy] = P(R, th);
        const tx = Math.cos(th * RAD), ty = Math.sin(th * RAD); // tangent
        const nx = Math.sin(th * RAD), ny = -Math.cos(th * RAD); // radial
        const a = R * step * RAD * 0.5, b = w * 0.3;
        const q = [[cx + tx * a, cy + ty * a], [cx + nx * b, cy + ny * b], [cx - tx * a, cy - ty * a], [cx - nx * b, cy - ny * b]];
        scales.push(`<path d="M${q.map(pt).join(' L')} Z"/>`);
        // flank scales: small crescents on both sides, between the diamonds
        for (const side of [1, -1]) {
            const r1 = R + side * w * 0.36, thm = th + step / 2;
            const [x1, y1] = P(r1, thm - step * 0.32), [x2, y2] = P(r1, thm + step * 0.32), [xm, ym] = P(r1 + side * w * 0.09, thm);
            flanks.push(`M${f(x1)} ${f(y1)} Q${f(xm)} ${f(ym)} ${f(x2)} ${f(y2)}`);
        }
    }
    // the head: a viper's head seen from above, along the chord from the neck to the snout over the tail tip
    const [nx0, ny0] = P(R, thNeck), [sx0, sy0] = P(R - 0.6, thTail - 2);
    const ang = Math.atan2(sy0 - ny0, sx0 - nx0) / RAD, len = Math.hypot(sx0 - nx0, sy0 - ny0), k = len / 30;
    const head = `
      <g transform="translate(${f(nx0)} ${f(ny0)}) rotate(${f(ang)}) scale(${f(k)} 1)">
        <path d="M-1 -6.6 C4 -7.6 8 -10.6 13 -10.9 C19 -10.9 25 -7.6 30 -2.6 C31.2 -1 31.2 1 30 2.6 C25 7.6 19 10.9 13 10.9 C8 10.6 4 7.6 -1 6.6 Z" fill="url(#${p}pearl)" stroke="${c.scaleEdge}" stroke-width="0.6"/>
        <path d="M5 0 L28 0" stroke="${c.pearl2}" stroke-width="0.5"/>
        <path d="M9 -4.5 C14 -5.5 20 -4.8 26 -2.2 M9 4.5 C14 5.5 20 4.8 26 2.2" fill="none" stroke="${c.pearl2}" stroke-width="0.45"/>
        <path d="M12.5 -9.6 C15.6 -11 19.8 -10.4 22.4 -8.2 M12.5 9.6 C15.6 11 19.8 10.4 22.4 8.2" fill="none" stroke="${c.scale}" stroke-width="1.2" stroke-linecap="round"/>
        <ellipse cx="18" cy="-7.4" rx="1.9" ry="1.45" fill="${c.eye}"/><ellipse cx="18" cy="-7.4" rx="0.35" ry="1.25" fill="#05060a"/>
        <ellipse cx="18" cy="7.4" rx="1.9" ry="1.45" fill="${c.eye}"/><ellipse cx="18" cy="7.4" rx="0.35" ry="1.25" fill="#05060a"/>
        <circle cx="28.2" cy="-1.5" r="0.45" fill="#05060a"/><circle cx="28.2" cy="1.5" r="0.45" fill="#05060a"/>
        <path d="M29.6 -2.2 l2.1 0.9 l-1.6 0.6 Z M29.6 2.2 l2.1 -0.9 l-1.6 -0.6 Z" fill="${c.pearl0}"/>
      </g>`;
    return `
    <g class="ouroboros">
      <path d="${body}" fill="#03040a" stroke="#03040a" stroke-width="3" stroke-linejoin="round"/>
      <path d="${body}" fill="url(#${p}pearl)"/>
      <g fill="${c.scale}" stroke="${c.scaleEdge}" stroke-width="0.35">${scales.join('')}</g>
      <path d="${flanks.join(' ')}" fill="none" stroke="${c.pearl2}" stroke-width="0.45" stroke-opacity="0.8"/>
      ${head}
    </g>`;
}

/**
 * [EN] The cycle chronometer: a bezel of exactly 108 divisions — the 108 seconds of the Universe cycle; every 9th is
 *      long (12 hour-like marks). The five phase stars stand at the seconds their phases begin: 0, 17, 39, 64, 79 s.
 * [RU] Хронометр цикла: безель ровно из 108 делений — 108 секунд цикла Вселенной; каждое 9-е длинное (12 «часовых»
 *      меток). Пять звёзд фаз стоят на секундах начала фаз: 0, 17, 39, 64, 79 с.
 */
function chronometer(c, { r = 64 } = {}) {
    const ticks = [];
    for (let s = 0; s < 108; s++) {
        const long = s % 9 === 0, [x1, y1] = P(r, (s * 360) / 108), [x2, y2] = P(r + (long ? 4.2 : 2), (s * 360) / 108);
        ticks.push(`M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`);
    }
    const phases = [0, 17, 39, 64, 79].map((sec) => {
        const [x, y] = P(r + 9.5, (sec * 360) / 108);
        return `<path transform="translate(${f(x)} ${f(y)})" d="M0 -4.6 L1.2 -1.2 L4.6 0 L1.2 1.2 L0 4.6 L-1.2 1.2 L-4.6 0 L-1.2 -1.2 Z" fill="${c.star}"/>`;
    });
    return `
    <g class="chronometer">
      <circle r="${r}" fill="none" stroke="${c.gold1}" stroke-width="0.6" stroke-opacity="0.8"/>
      <path d="${ticks.join(' ')}" stroke="${c.gold1}" stroke-width="0.55" stroke-opacity="0.9"/>
      ${phases.join('')}
    </g>`;
}

/** [EN] The eight-rayed Star of Zero, struck like a metal insignia. [RU] Восьмилучевая Звезда Нуля, как чеканный знак. */
function starOfZero(c, p) {
    const long = (rot) => `<g transform="rotate(${rot})"><path d="M0 0 L0 -40 L5.6 -7 Z" fill="url(#${p}gold)"/><path d="M0 0 L0 -40 L-5.6 -7 Z" fill="${c.goldShade}"/></g>`;
    const short = (rot) => `<g transform="rotate(${rot})"><path d="M0 0 L0 -25 L4 -5 Z" fill="${c.goldShort}"/><path d="M0 0 L0 -25 L-4 -5 Z" fill="${c.goldShortShade}"/></g>`;
    return `
    <g class="star">
      ${[45, 135, 225, 315].map(short).join('')}
      ${[0, 90, 180, 270].map(long).join('')}
      <circle r="10.5" fill="none" stroke="${c.gold1}" stroke-width="0.6" stroke-opacity="0.9"/>
      <circle r="9" fill="url(#${p}zero)"/>
      <circle r="3.2" fill="#ffffff"/>
    </g>`;
}

/**
 * [EN] The galactic disk (phase 02_GENESIS, the favicon galaxy seen edge-on), tilted −0.17 rad like the site's disk,
 *      with dust grains scattered by Mulberry32 — the same generator that seeds the Universe.
 * [RU] Галактический диск (фаза GENESIS, галактика со значка сайта, видна с ребра), наклон −0,17 рад, как у диска на
 *      сайте; пыль рассыпана Mulberry32 — тем же генератором, что засевает Вселенную.
 */
function disk(c, p) {
    const rnd = mulberry32(108), dust = [];
    for (let i = 0; i < 46; i++) {
        const t = rnd() * Math.PI * 2, rr = 0.25 + rnd() * 0.75;
        const x = Math.cos(t) * 96 * rr, y = Math.sin(t) * 7 * rr + (rnd() - 0.5) * 3;
        dust.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.35 + rnd() * 0.7)}" opacity="${f(0.45 + rnd() * 0.5)}"/>`);
    }
    return `
    <g class="disk" transform="rotate(${f(-0.17 / RAD)})">
      <ellipse rx="98" ry="7.6" fill="url(#${p}disk)"/>
      <ellipse rx="60" ry="1.8" fill="${c.amberLight}" opacity="0.75"/>
      <g fill="${c.amberLight}">${dust.join('')}</g>
    </g>`;
}

/** [EN] The Seal of Zero, centred at 0,0. [RU] Печать Нуля с центром в 0,0. */
function seal(c, p) {
    return `
    <g class="echo" fill="none" stroke="${c.ice}">
      ${[80, 84.5, 89].map((r, i) => `<circle r="${r}" stroke-width="${0.7 - i * 0.1}" stroke-opacity="${0.3 - i * 0.08}"/>`).join('')}
    </g>
    ${disk(c, p)}
    ${chronometer(c)}
    ${ouroboros(c, p)}
    <circle r="45.2" fill="none" stroke="${c.gold1}" stroke-width="0.6" stroke-opacity="0.7"/>
    ${starOfZero(c, p)}`;
}

/** [EN] The flag 2:3 with three pales 1:2:1. [RU] Флаг 2:3, три вертикальных поля 1:2:1. */
function flagBody(c, p) {
    return `
    <rect width="75" height="200" fill="url(#${p}pale)"/>
    <rect x="225" width="75" height="200" fill="url(#${p}pale)"/>
    <rect x="75" width="150" height="200" fill="url(#${p}void)"/>
    <rect x="73.4" width="3.2" height="200" fill="url(#${p}gold)"/>
    <rect x="223.4" width="3.2" height="200" fill="url(#${p}gold)"/>
    <rect x="77.6" width="0.8" height="200" fill="${c.ice}" opacity="0.55"/>
    <rect x="221.6" width="0.8" height="200" fill="${c.ice}" opacity="0.55"/>
    <g transform="translate(150 100) scale(0.92)">${seal(c, p)}</g>`;
}

const svg = (viewBox, inner, extra = '') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ${extra}>\n${inner}\n</svg>\n`;

// ---------------------------------------------------------------------------------------------------------------
// Embroidery: thread texture (stretched noise), slight displacement, raised relief lit from the upper left.
const EMBROIDERY = (id, seed = 3) => `
    <filter id="${id}" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.95 0.08" numOctaves="2" seed="${seed}" result="thread"/>
      <feDisplacementMap in="SourceGraphic" in2="thread" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="stitched"/>
      <feColorMatrix in="thread" type="matrix" values="0 0 0 0 0.86  0 0 0 0 0.86  0 0 0 0 0.86  0.35 0.35 0 0 0.55" result="sheen"/>
      <feComposite in="stitched" in2="sheen" operator="arithmetic" k1="1.18" k2="0" k3="0" k4="0" result="threaded"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.3" result="relief"/>
      <feDiffuseLighting in="relief" surfaceScale="2.2" diffuseConstant="1.05" lighting-color="#ffffff" result="light"><feDistantLight azimuth="225" elevation="58"/></feDiffuseLighting>
      <feComposite in="threaded" in2="light" operator="arithmetic" k1="1.05" k2="0" k3="0" k4="0" result="lit"/>
      <feComposite in="lit" in2="SourceAlpha" operator="in"/>
    </filter>`;

/** [EN] A patch: the flag inside a merrowed border. [RU] Нашивка: флаг в обмётанной кромке. */
function patch(c, p, border, threadSeed) {
    return svg('-14 -14 328 228', `
  <defs>${defs(c, p)}${EMBROIDERY(`${p}emb`, threadSeed)}
    <clipPath id="${p}clip"><rect width="300" height="200" rx="10"/></clipPath>
  </defs>
  <g filter="url(#${p}emb)">
    <rect x="-10" y="-10" width="320" height="220" rx="18" fill="${border.base}"/>
    <g clip-path="url(#${p}clip)">${flagBody(c, p)}</g>
    <rect x="-5" y="-5" width="310" height="210" rx="14" fill="none" stroke="${border.thread}" stroke-width="9" stroke-dasharray="1.1 0.9"/>
  </g>`, 'width="328" height="228"');
}

// ---------------------------------------------------------------------------------------------------------------
const flagSvg = svg('0 0 300 200', `  <!-- ЗНАМЯ ВСЕЛЕННОЙ UNIVERSE — generated by apps/client/scripts/emblems/universe-standard.mjs; do not edit by hand. -->
  <defs>${defs(PARADE, 'p-')}</defs>
${flagBody(PARADE, 'p-')}`, 'width="300" height="200"');
const crewPatch = patch(PARADE, 'c-', { base: '#0b0d1a', thread: '#d9b65c' }, 3);
const tacticalPatch = patch(TACTICAL, 't-', { base: '#22251e', thread: '#4a4c3f' }, 9);

/** [EN] The round chest seal with the motto. [RU] Круглая нагрудная печать с девизом. */
const roundel = svg('-120 -120 240 240', `
  <defs>${defs(PARADE, 'r-')}${EMBROIDERY('r-emb', 5)}
    <path id="r-top" d="M -88 0 A 88 88 0 0 1 88 0"/>
    <path id="r-bottom" d="M -96 0 A 96 96 0 0 0 96 0"/>
  </defs>
  <g filter="url(#r-emb)">
    <circle r="116" fill="#0b0d1a"/>
    <circle r="111" fill="url(#r-pale)"/>
    <circle r="98" fill="url(#r-void)" stroke="url(#r-gold)" stroke-width="3"/>
    <g font-family="Cinzel, 'Trajan Pro', Georgia, serif" font-size="13" letter-spacing="4.5" fill="#e9c46a" text-anchor="middle">
      <text><textPath href="#r-top" startOffset="50%">EX NIHILO</textPath></text>
      <text><textPath href="#r-bottom" startOffset="50%">IN AETERNUM</textPath></text>
    </g>
    <g transform="scale(0.98)">${seal(PARADE, 'r-')}</g>
    <circle r="113.5" fill="none" stroke="#d9b65c" stroke-width="5" stroke-dasharray="1.1 0.9"/>
  </g>`, 'width="240" height="240"');

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(new URL('universe-flag.svg', OUT), flagSvg);
fs.writeFileSync(new URL('universe-patch.svg', OUT), crewPatch);
fs.writeFileSync(new URL('universe-patch-tactical.svg', OUT), tacticalPatch);
fs.writeFileSync(new URL('universe-roundel.svg', OUT), roundel);
console.log('svg written');

// ---------------------------------------------------------------------------------------------------------------
// The presentation. [RU] Презентация: смысл, цвета, построение, варианты, на скафандре.
const COLORS = [
    ['Пустота', '#020308', 'Фаза 01_VOID, полотно сайта. Тьма до первого света — из неё всё рождается и в неё всё возвращается.'],
    ['Ультрамарин Генезиса', '#1e1b4b', 'Фаза 02_GENESIS: глубина космоса, по которой закручиваются рукава галактики.'],
    ['Золото Нуля', '#e9c46a', 'Звезда Нуля, кромка и хронометр. Порядок и мера: каждая секунда цикла сосчитана.'],
    ['Лёд эха', '#7dd3fc', 'Кольца светового эха RS Кормы — сигнал, знание, связь. Цвет интерфейсов Вселенной.'],
    ['Янтарь ядра', '#f59e0b', 'Ядро галактики и Точка Нуля: энергия, из которой разгорается диск.'],
    ['Жемчуг Уробороса', '#d9dee8', 'Змей финала: вечность цикла, который сам себя замыкает.'],
];
const SYMBOLS = [
    ['Три поля 1 : 2 : 1', 'Ультрамарин по краям, Пустота в центре: Вселенная, сжатая между двумя Генезисами — прошлым и будущим циклом.'],
    ['Золотая кайма с ледяной нитью', 'Граница между Пустотой и Генезисом. Золото — мера, ледяная нить внутри — первый сигнал светового эха.'],
    ['Звезда Нуля', 'Восемь лучей: четыре длинных — оси цикла, четыре коротких — промежутки между ними. В центре — Точка Нуля, из которой начинается и в которую сжимается Вселенная.'],
    ['Уроборос', 'Змей финала Universe кусает свой хвост: после 108-й секунды цикл схлопывается в Нуль и начинается снова. Толстая шея — сила, тонкий хвост — время, которое кончается.'],
    ['Хронометр цикла', 'Ровно 108 делений — 108 секунд цикла. Каждое 9-е длинное: двенадцать меток, как на циферблате.'],
    ['Пять звёзд фаз', 'Стоят точно на секундах начала фаз: 0 — VOID, 17 — GENESIS, 39 — EVOLUTION, 64 — COLLAPSE, 79 — SINGULARITY.'],
    ['Галактический диск', 'Галактика со значка сайта, видна с ребра, наклон −0,17 радиана — как диск фазы GENESIS. Пыль в нём рассыпана генератором Mulberry32, которым засевается Вселенная.'],
    ['Световое эхо', 'Три бледных кольца за печатью — эхо, расходящееся от Точки Нуля в фазе VOID.'],
];
const VARIANTS = [
    ['universe-patch.svg', 'Нашивка экипажа', 'Полноцветная вышивка, обмётанная золотой нитью. Гражданские и научные скафандры, борта кораблей.'],
    ['universe-patch-tactical.svg', 'Тактическая нашивка', 'Приглушённая: олива и песок, без золота и блеска — не выдаёт бойца в прицеле. Военные скафандры.'],
    ['universe-roundel.svg', 'Нагрудная печать', 'Круг с девизом EX NIHILO · IN AETERNUM — «Из Нуля — в вечность». Командный состав, парадная форма, люки и шлюзы.'],
];
const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>Знамя Вселенной Universe</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root { --void:#020308; --indigo:#060b19; --ultra:#1e1b4b; --gold:#e9c46a; --ice:#7dd3fc; --pearl:#f8fafc; --muted:rgba(186,230,253,.72); }
  * { box-sizing:border-box; margin:0 }
  body { background: radial-gradient(1200px 700px at 50% -10%, #12103a 0%, var(--indigo) 45%, var(--void) 100%); color: var(--pearl); font: 16px/1.6 Inter, system-ui, sans-serif; padding: 48px 24px 80px }
  main { max-width: 1180px; margin: 0 auto; display: grid; gap: 56px }
  .code { font: 600 12px/1 'JetBrains Mono', monospace; letter-spacing: .22em; color: var(--ice); text-transform: uppercase }
  h1 { font: 700 clamp(34px, 5vw, 56px)/1.1 Cinzel, Georgia, serif; letter-spacing: .06em; margin: 10px 0 6px; background: linear-gradient(180deg,#fff7dd,#e9c46a 60%,#a8781c); -webkit-background-clip: text; background-clip: text; color: transparent }
  h2 { font: 700 24px/1.2 Cinzel, Georgia, serif; letter-spacing: .08em; color: var(--gold); margin-bottom: 18px }
  .lead { color: var(--muted); max-width: 760px }
  .panel { border: 1px solid rgba(125,211,252,.18); background: rgba(3,7,18,.48); border-radius: 14px; padding: 28px }
  .hero { display: grid; place-items: center; padding: 36px 12px; perspective: 1400px }
  .cloth { width: min(100%, 900px); filter: drop-shadow(0 30px 40px rgba(0,0,0,.6)) }
  .legend { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 28px; align-items: start }
  .legend ol { padding-left: 1.4em; display: grid; gap: 12px }
  .legend b { color: var(--gold); font-weight: 600 }
  .swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 14px }
  .sw { display: grid; grid-template-columns: 64px minmax(0,1fr); gap: 14px; align-items: center }
  .chip { height: 64px; border-radius: 10px; border: 1px solid rgba(255,255,255,.18) }
  .sw small { display: block; font: 600 12px 'JetBrains Mono', monospace; color: var(--ice); letter-spacing: .1em }
  .variants { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr)); gap: 22px }
  .variant { display: grid; gap: 12px; justify-items: center; text-align: center }
  .variant img { width: 100%; max-width: 330px; filter: drop-shadow(0 14px 20px rgba(0,0,0,.55)) }
  .variant h3 { font: 700 17px Cinzel, Georgia, serif; color: var(--gold); letter-spacing: .06em }
  .variant p { color: var(--muted); font-size: 14px }
  .build svg { width: 100%; height: auto }
  .suit { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 24px; align-items: center }
  .suit img { width: 100%; border-radius: 12px; background: #0b0d1a }
  .motto { text-align: center; font: 700 clamp(22px, 3vw, 34px) Cinzel, Georgia, serif; letter-spacing: .3em; color: var(--gold) }
  .motto + p { text-align: center; color: var(--muted) }
  @media (max-width: 760px) { .legend, .suit { grid-template-columns: minmax(0, 1fr) } }
</style></head>
<body><main>
  <header>
    <div class="code">MASTER_00 // STANDARD_OF_THE_UNIVERSE · CYCLE 108 S</div>
    <h1>Знамя Вселенной Universe</h1>
    <p class="lead">Государственный символ Вселенной Universe: поднимается над станциями, пришивается на гражданские и военные скафандры, наносится на борта кораблей. Каждая деталь взята из самой Вселенной — её 108-секундного цикла, пяти фаз, Точки Нуля, светового эха, галактического диска и Уробороса финала.</p>
  </header>

  <section class="panel hero">
    <svg class="cloth" viewBox="-10 -10 340 230" xmlns="http://www.w3.org/2000/svg">
      <defs>${defs(PARADE, 'h-')}
        <filter id="cloth" x="-6%" y="-8%" width="112%" height="116%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.018" numOctaves="2" seed="11" result="folds"/>
          <feDisplacementMap in="SourceGraphic" in2="folds" scale="16" xChannelSelector="R" yChannelSelector="G" result="wave"/>
          <feDiffuseLighting in="folds" surfaceScale="9" diffuseConstant="1.15" lighting-color="#ffffff" result="shade"><feDistantLight azimuth="200" elevation="38"/></feDiffuseLighting>
          <feComposite in="wave" in2="shade" operator="arithmetic" k1="1.25" k2="0" k3="0" k4="0" result="lit"/>
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="2" result="weave"/>
          <feColorMatrix in="weave" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.18 0" result="weaveA"/>
          <feComposite in="weaveA" in2="lit" operator="atop" result="woven"/>
          <feComposite in="woven" in2="wave" operator="in"/>
        </filter>
      </defs>
      <g filter="url(#cloth)">
        ${flagBody(PARADE, 'h-')}
        <g stroke="#c9a24a" stroke-width="1.1">${Array.from({ length: 70 }, (_, i) => `<path d="M${300 + (i % 2) * 0.6} ${f(i * 2.9)} l${f(7 + (i % 3))} 0"/>`).join('')}</g>
      </g>
    </svg>
  </section>

  <section class="panel">
    <h2>Символика</h2>
    <div class="legend">
      <img src="universe-flag.svg" alt="Знамя Вселенной Universe" style="width:100%;border-radius:6px;box-shadow:0 18px 30px rgba(0,0,0,.5)">
      <ol>${SYMBOLS.map(([t, d]) => `<li><b>${t}.</b> ${d}</li>`).join('')}</ol>
    </div>
  </section>

  <section class="panel">
    <h2>Цвета</h2>
    <div class="swatches">${COLORS.map(([n, hex, d]) => `<div class="sw"><div class="chip" style="background:${hex}"></div><div><b>${n}</b><small>${hex.toUpperCase()}</small><span style="color:var(--muted);font-size:14px">${d}</span></div></div>`).join('')}</div>
  </section>

  <section class="panel build">
    <h2>Построение</h2>
    <svg viewBox="-40 -30 380 270" xmlns="http://www.w3.org/2000/svg" font-family="JetBrains Mono, monospace" font-size="7" fill="#7dd3fc">
      <defs>${defs(PARADE, 'b-')}</defs>
      <g opacity="0.55">${flagBody(PARADE, 'b-')}</g>
      <g stroke="#7dd3fc" stroke-width="0.5" fill="none">
        <path d="M0 -12 H300 M0 -16 V-8 M75 -16 V-8 M225 -16 V-8 M300 -16 V-8"/>
        <path d="M-14 0 V200 M-18 0 H-10 M-18 200 H-10"/>
        <circle cx="150" cy="100" r="${f(64 * 0.92)}" stroke-dasharray="2 2"/>
        <path d="M150 100 L${f(150 + 64 * 0.92)} 100" />
        <path d="M150 0 V200 M75 100 H225" stroke-dasharray="1 3" stroke-opacity="0.6"/>
      </g>
      <g text-anchor="middle">
        <text x="37.5" y="-18">1</text><text x="150" y="-18">2</text><text x="262.5" y="-18">1</text>
        <text x="-24" y="104" transform="rotate(-90 -24 100)">2 : 3</text>
        <text x="${f(150 + 32)}" y="96">⌀ 0,59 H</text>
        <text x="150" y="222">поля 1 : 2 : 1 · кайма 1/94 ширины · печать в центре</text>
        <text x="150" y="233">безель 108 делений · звёзды фаз на 0, 17, 39, 64, 79 с</text>
      </g>
    </svg>
  </section>

  <section class="panel">
    <h2>Варианты</h2>
    <div class="variants">${VARIANTS.map(([file, t, d]) => `<figure class="variant"><img src="${file}" alt="${t}"><h3>${t}</h3><p>${d}</p></figure>`).join('')}</div>
  </section>

  <section class="panel suit">
    <img src="на скафандре.png" alt="Нашивка на скафандре">
    <div><h2>На скафандре</h2><p class="lead">Нашивка экипажа на правом плече: место, где раньше носили земные флаги. На военных скафандрах — тактический вариант того же размера.</p></div>
  </section>

  <section>
    <p class="motto">EX NIHILO · IN AETERNUM</p>
    <p>«Из Нуля — в вечность»: девиз Вселенной. Цикл начинается в Точке Нуля и, замкнувшись Уроборосом, длится вечно.</p>
  </section>
</main></body></html>
`;
fs.mkdirSync(DESK, { recursive: true });
fs.writeFileSync(`${DESK}Знамя Universe.html`, html);
for (const name of ['universe-flag.svg', 'universe-patch.svg', 'universe-patch-tactical.svg', 'universe-roundel.svg']) {
    fs.copyFileSync(new URL(name, OUT), `${DESK}${name}`);
}
console.log('presentation written');

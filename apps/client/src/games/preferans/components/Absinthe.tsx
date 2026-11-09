// [EN] FILE: games/preferans/components/Absinthe.tsx — the club's absinthe in the crypt (Alexey's idea, 09.11.2026,
//      after the bottle of the Czech absinthe with Van Gogh on the label): an expensive square bottle of thick glass
//      with chamfered edges, a ribbed gold cap, a cream label with an engraving of Vincent in his fur cap with the
//      bandaged ear («L'Oreille coupée» — our own label, not a copy of a real brand), the absinthe the colour of
//      wormwood with sprigs of wormwood inside; beside it a large Versailles glass of louche with a slotted silver spoon
//      and a cube of brown sugar, the way absinthe is drunk; a second glass stands by the right candelabrum. The levels
//      come from the game (drink.ts) and flow smoothly. Pure decoration, drawn here, nothing is downloaded.
// [RU] ФАЙЛ: абсент клуба в крипте (идея Алексея, 09.11.2026, по бутылке чешского абсента с Ван Гогом на этикетке):
//      дорогая квадратная бутылка из толстого стекла со скошенными гранями, рифлёный золотой колпачок, кремовая
//      этикетка с гравюрой — Винсент в меховой шапке с перевязанным ухом («L'Oreille coupée» — своя этикетка, а не копия
//      настоящей марки), абсент цвета полыни с веточками полыни внутри; рядом большая версальская рюмка с лушем,
//      серебряной ложечкой с прорезями и кубиком тростникового сахара — так абсент и пьют; вторая рюмка стоит у правого
//      канделябра. Уровни приходят из игры (drink.ts) и меняются плавно. Чистое украшение, нарисовано здесь, ничего не
//      скачивается.
import React from 'react';
import styles from './Lair.module.css';

const clamp = (level: number): number => Math.min(1, Math.max(0, level));
// [EN] The liquid is drawn full and slid down: the bottle from its shoulder (y 74) to the thick base (y 178),
//      the glass from under the rim (y 12) to the bottom of its reservoir (y 77).
// [RU] Жидкость рисуется полной и сдвигается вниз: в бутылке от плеч (y 74) до толстого дна (y 178), в рюмке от
//      края (y 12) до дна резервуара (y 77).
const BOTTLE_SPAN = 104;
const GLASS_SPAN = 64.5;
const sink = (level: number, span: number): React.CSSProperties => ({ transform: `translateY(${((1 - clamp(level)) * span).toFixed(2)}px)` });

const BOTTLE = 'M68 188Q64 188 64 184V86L75.5 72.5Q84 66.4 93 65.2V38H111V65.2Q120 66.4 128.5 72.5L140 86V184Q140 188 136 188Z';
const INSIDE = 'M66.4 178.5V87L77.2 74.4Q85.4 68.6 95.2 67.6V42H108.8V67.6Q118.6 68.6 126.8 74.4L137.6 87V178.5Z';
const BOWL = 'M3.5 8C4.4 30 14.6 48.6 23.2 60.8C20.6 64 20.8 73.6 24.2 76.8C27.6 80 34.4 80 37.8 76.8C41.2 73.6 41.4 64 38.8 60.8C47.4 48.6 57.6 30 58.5 8';
const BOWL_INSIDE = 'M5 9C5.8 30 15.8 48 24.4 60.2C22.2 63.4 22.4 72.4 25.2 75.2C28.2 78 33.8 78 36.8 75.2C39.6 72.4 39.8 63.4 37.6 60.2C46.2 48 56.2 30 57 9Z';
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";

/** [EN] A wormwood leaf: a few narrow lobes. [RU] Лист полыни: несколько узких долей. */
const LEAF = 'M0 0c1.4-1 2.6-1.2 3.8-.6c-.6.4-1 .9-1.1 1.6c.9-.4 1.8-.3 2.6.2c-1.4.9-3 1-4.4.4C.4 1.4.1.8 0 0Z';
const LEAVES: readonly (readonly [number, number, number])[] = [
    [90, 175, -40], [92, 173, 60], [98, 168, -80], [101, 172, 10], [107, 174, -30], [110, 176, 40], [112, 170, -120],
    [132, 141, -70], [133.6, 146, 20], [130, 158, -150], [131, 160, 30], [70, 170, -100], [70.6, 160, -60], [70.2, 152, -120],
];

/** [EN] Gradients and filters a glass and its sugar need, under their own prefix. [RU] Градиенты и фильтры рюмки и сахара под своим префиксом. */
const GlassDefs: React.FC<{ id: string }> = ({ id }) => (
    <>
        <linearGradient id={`${id}-louche`} x1="0" x2="0" y1="12" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#f1f3dc" />
            <stop offset="0.35" stopColor="#e0e5bd" />
            <stop offset="0.72" stopColor="#c3cb8a" />
            <stop offset="1" stopColor="#9ea85a" />
        </linearGradient>
        <linearGradient id={`${id}-louche-side`} x1="4" x2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#5f6a35" stopOpacity="0.45" />
            <stop offset="0.16" stopColor="#5f6a35" stopOpacity="0" />
            <stop offset="0.8" stopColor="#5f6a35" stopOpacity="0" />
            <stop offset="1" stopColor="#5f6a35" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${id}-silver`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.35" stopColor="#c9ced5" />
            <stop offset="0.7" stopColor="#7d838c" />
            <stop offset="1" stopColor="#2c3036" />
        </linearGradient>
        <linearGradient id={`${id}-fade`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fffaf0" stopOpacity="0" />
            <stop offset="0.15" stopColor="#fffaf0" stopOpacity="1" />
            <stop offset="0.7" stopColor="#fffaf0" stopOpacity="0.75" />
            <stop offset="1" stopColor="#fffaf0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-sugar-top`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#ecc58a" />
            <stop offset="1" stopColor="#c99350" />
        </linearGradient>
        <linearGradient id={`${id}-sugar-left`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#c38a4a" />
            <stop offset="0.7" stopColor="#a86f35" />
            <stop offset="1" stopColor="#6d3f17" />
        </linearGradient>
        <linearGradient id={`${id}-sugar-right`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#9c6630" />
            <stop offset="0.7" stopColor="#7f4c1f" />
            <stop offset="1" stopColor="#4f2b0d" />
        </linearGradient>
        <filter id={`${id}-crystals`} x="0" y="0" width="1" height="1">
            <feTurbulence type="fractalNoise" baseFrequency="2.6" numOctaves={1} seed={3} result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 0.93  0 0 0 0 0.78  0 0 0 2.2 -1.25" />
            <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4" /></filter>
        <filter id={`${id}-softer`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.5" /></filter>
        <clipPath id={`${id}-bowl`}><path d={BOWL_INSIDE} /></clipPath>
    </>
);

/** [EN] A cube of brown cane sugar, its crystals catching the light. [RU] Кубик коричневого тростникового сахара, кристаллы ловят свет. */
const SugarCube: React.FC<{ id: string; transform: string; wet?: boolean; shadow?: boolean }> = ({ id, transform, wet = false, shadow = false }) => (
    <g transform={transform}>
        {shadow && <ellipse cx="6" cy="12.6" rx="7" ry="1.6" fill="#000000" opacity="0.55" filter={`url(#${id}-softer)`} />}
        <path d="M0.4 3.4C0.2 3 0.4 2.6 0.8 2.4L5.2 0.2C5.6 0 6 0 6.4 0.2L10.8 2.2C11.2 2.4 11.2 2.8 10.8 3L6.2 5.4C5.8 5.6 5.4 5.6 5 5.4Z" fill={`url(#${id}-sugar-top)`} />
        <path d="M0.4 3.4L5 5.4C5.4 5.6 5.6 6 5.6 6.4V12.6C5.6 13 5.2 13.2 4.8 13L0.6 11C0.2 10.8 0 10.4 0 10V4C0 3.6 0.2 3.4 0.4 3.4Z" fill={`url(#${id}-sugar-left)`} />
        <path d="M6.2 5.4L10.8 3C11.2 2.8 11.4 3 11.4 3.4V9.4C11.4 9.8 11.2 10.2 10.8 10.4L6.4 12.8C6 13 5.6 12.8 5.6 12.4V6.4C5.6 6 5.8 5.6 6.2 5.4Z" fill={`url(#${id}-sugar-right)`} />
        <path d="M0 0H11.4V13.2H0Z" fill="#ffffff" filter={`url(#${id}-crystals)`} opacity="0.6" />
        <path d="M0.8 2.6L5.6 0.4L10.6 2.6" stroke="#fff3d6" strokeOpacity="0.55" strokeWidth="0.35" fill="none" />
        {wet && <path d="M0.6 9.4L5.6 11.6L11 9.2V9.6L5.6 12.6L0.4 10.6Z" fill="#4a2408" opacity="0.45" />}
    </g>
);

/**
 * [EN] A large Versailles absinthe glass of thick pressed glass: a reservoir bulb for the dose, a lace of relief, a
 *      knopped stem on a heavy foot; inside the louche (absinthe clouded by iced water), on the rim a pierced silver
 *      spoon with a cube of sugar and a drop of water on its way down.
 * [RU] Большая версальская рюмка для абсента из толстого прессованного стекла: резервуар-капля для дозы, кружево
 *      рельефа, ножка с «яблоком» на тяжёлой подошве; внутри луш (абсент, помутневший от ледяной воды), на краю
 *      серебряная ложечка с прорезями, кубик сахара и капля воды, падающая вниз.
 */
const VersaillesGlass: React.FC<{ id: string; level: number; transform?: string; melting?: boolean }> = ({ id, level, transform, melting = false }) => (
    <g transform={transform}>
        <ellipse cx="34" cy="102.6" rx="21" ry="3.4" fill="#000000" opacity="0.6" filter={`url(#${id}-soft)`} />
        <ellipse cx="40" cy="105.4" rx="10" ry="1.8" fill="#e4ecc2" opacity="0.2" filter={`url(#${id}-soft)`} />
        {/* [EN] The heavy foot and the knopped stem. [RU] Тяжёлая подошва и ножка с «яблоком». */}
        <path d="M13.4 98.6V100.2A17.6 3.4 0 0 0 48.6 100.2V98.6" fill="#dfe8d8" fillOpacity="0.22" stroke="#eef4e8" strokeOpacity="0.5" strokeWidth="0.4" />
        <ellipse cx="31" cy="98.6" rx="17.6" ry="3.4" fill="#dfe8d8" fillOpacity="0.14" stroke="#eef4e8" strokeOpacity="0.65" strokeWidth="0.5" />
        <path d="M16 98.2Q22 96.2 28 96M34 96Q40 96.2 46 98.2" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="0.5" fill="none" />
        <path d="M28.8 79.6C29.6 82 29.2 83.6 27.6 85.4C26.6 86.6 26.6 88.2 27.8 89.2C29 90.2 29.4 92.6 29.2 96L28.4 98H33.6L32.8 96C32.6 92.6 33 90.2 34.2 89.2C35.4 88.2 35.4 86.6 34.4 85.4C32.8 83.6 32.4 82 33.2 79.6Z"
            fill="#dfe8d8" fillOpacity="0.25" stroke="#eef4e8" strokeOpacity="0.55" strokeWidth="0.4" />
        <path d="M28.4 86.2Q28.2 87.6 29 88.4M30 81V84M30.2 91V96" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.5" fill="none" strokeLinecap="round" />
        {/* [EN] The bowl and the louche in it. [RU] Чаша и луш в ней. */}
        <path d={`${BOWL}Z`} fill="#dfe8d8" fillOpacity="0.08" />
        <g clipPath={`url(#${id}-bowl)`}>
            <g className={styles.level} style={sink(level, GLASS_SPAN)}>
                <rect x="0" y="12" width="62" height="70" fill={`url(#${id}-louche)`} opacity="0.93" />
                <rect x="0" y="12" width="62" height="70" fill={`url(#${id}-louche-side)`} />
                <g fill="none" stroke="#ffffff" filter={`url(#${id}-softer)`}>
                    <path d="M8 18C14 15.4 20 20 26 17.6S38 15.4 44 18.6S52 17 56 18.4" strokeOpacity="0.5" strokeWidth="2.2" />
                    <path d="M14 24C20 22 24 26.4 31 24.6S42 22.6 48 25" strokeOpacity="0.35" strokeWidth="1.8" />
                    <path d="M20 31C24 29.8 28 32.6 33 31.4S39 30.4 42 31.6" strokeOpacity="0.25" strokeWidth="1.4" />
                </g>
                <ellipse cx="31" cy="12" rx="30" ry="2.4" fill="#f6f7e4" opacity="0.92" />
                <ellipse cx="31" cy="12.4" rx="30" ry="2.4" fill="none" stroke="#c8cf98" strokeOpacity="0.6" strokeWidth="0.35" />
            </g>
        </g>
        {/* [EN] The Versailles relief: two rings, a lace of scallops with beads, faint flutes. [RU] Версальский рельеф: два кольца, кружево фестонов с бусинами, бледные каннелюры. */}
        <g fill="none" strokeLinecap="round">
            <path d="M6.6 25.4Q31 28.6 55.4 25.4M7.4 28.4Q31 31.6 54.6 28.4" stroke="#ffffff" strokeOpacity="0.34" strokeWidth="0.5" />
            <path d="M6.8 26.2Q31 29.4 55.2 26.2M7.6 29.2Q31 32.4 54.4 29.2" stroke="#1d2410" strokeOpacity="0.22" strokeWidth="0.4" />
            <path d="M8.2 30.4q2.1 2.8 4.2 0t4.2 0t4.2 0t4.2 0t4.2 0t4.2 0t4.2 0t4.2 0t4.2 0t4.2 0t4.2 0" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="0.45" />
            <path d="M8.6 31.2q2.1 2.8 4.2 0t4.2 0t4.2 0t4.2 0t4.2 0t4.2 0t4.2 0t4.2 0t4.2 0t4.2 0t4.2 0" stroke="#1d2410" strokeOpacity="0.16" strokeWidth="0.35" />
            <path d="M17.4 45.4Q19 52 22 57M24 46.2Q25 53 27 59M31 46.6V60M38 46.2Q37 53 35 59M44.6 45.4Q43 52 40 57" stroke="#ffffff" strokeOpacity="0.13" strokeWidth="0.8" />
        </g>
        <g fill="#ffffff" fillOpacity="0.4">
            {[10.3, 14.5, 18.7, 22.9, 27.1, 31.3, 35.5, 39.7, 43.9, 48.1, 52.3].map(x => <circle key={x} cx={x} cy={34.4 + Math.abs(x - 31) * 0.04} r="0.4" />)}
        </g>
        {/* [EN] Thick walls, the rim, highlights of the candles. [RU] Толстые стенки, край, блики свечей. */}
        <path d={BOWL} fill="none" stroke="#eef5e6" strokeOpacity="0.62" strokeWidth="0.6" />
        <path d="M5 9C5.8 30 15.8 48 24.4 60.2M57 9C56.2 30 46.2 48 37.6 60.2" fill="none" stroke="#eef5e6" strokeOpacity="0.2" strokeWidth="0.5" />
        <ellipse cx="31" cy="8" rx="27.5" ry="3.2" fill="none" stroke="#f4f8ee" strokeOpacity="0.75" strokeWidth="0.6" />
        <ellipse cx="31" cy="8.2" rx="26.2" ry="2.7" fill="none" stroke="#f4f8ee" strokeOpacity="0.3" strokeWidth="0.4" />
        <path d="M5.4 9.6Q12 11.2 22 11.2" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="0.6" fill="none" strokeLinecap="round" />
        <ellipse cx="9" cy="6.8" rx="1.5" ry="0.5" fill="#fff1c8" opacity="0.85" />
        <path d="M7.2 13C8 28 13.6 41.6 20.6 52.6" stroke={`url(#${id}-fade)`} strokeOpacity="0.65" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M9.6 15C10.4 27 14.4 37.6 19.4 46" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.5" fill="none" strokeLinecap="round" />
        <path d="M55.4 13C54.6 25 50.4 36 45 44.6" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="0.7" fill="none" strokeLinecap="round" />
        <path d="M24.2 66.4C23.8 70 24.6 73 26.4 75" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <ellipse cx="35.6" cy="66" rx="0.6" ry="1.4" fill="#ffffff" opacity="0.55" />
        {/* [EN] The pierced spoon resting on the rim. [RU] Ложечка с прорезями лежит на краю. */}
        <ellipse cx="30" cy="12.6" rx="16" ry="1.4" fill="#000000" opacity="0.28" filter={`url(#${id}-softer)`} />
        <path d="M8 7.6C10 4.4 18 3.2 27 3.6C33.6 3.9 38.6 5.2 41 6.8L44 7.2L72 9.4L72.2 10.8L44 9.4L41 10C38 11.8 32.6 12.6 26 12.4C17.4 12.2 10 11 8 7.6Z" fill={`url(#${id}-silver)`} stroke="#23262b" strokeWidth="0.3" />
        <path d="M8.2 8.4C10 11 17.4 12.6 26 12.8C32.6 13 38 12.2 41 10.4L44 9.8L72.2 11.4" stroke="#1a1c20" strokeOpacity="0.8" strokeWidth="0.5" fill="none" />
        <path d="M10.6 6.2C14 4.6 20 4 26.4 4.2C32 4.4 36.6 5.4 39.4 6.6M45 7.8L71.4 9.8" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="0.4" fill="none" strokeLinecap="round" />
        <g fill="#14171a" fillOpacity="0.85">
            <path d="M24.6 6.6c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1Z" />
            <path d="M20.6 6.8l1.6-.3.1 1.2-1.6.3ZM27.1 6.5l1.6.3-.1 1.2-1.6-.3ZM24.1 4.9h1.1l.1.8h-1.3ZM24.1 9.9h1.3l-.1.8h-1.1Z" />
            <path d="M15 7.3c.8-.5 1.6-.5 2.4 0-.8.5-1.6.5-2.4 0ZM32.2 7.5c.8-.5 1.6-.5 2.4 0-.8.5-1.6.5-2.4 0ZM18.4 9.7c.6-.3 1.3-.3 1.9 0-.6.3-1.3.3-1.9 0ZM29.4 9.9c.6-.3 1.3-.3 1.9 0-.6.3-1.3.3-1.9 0ZM18.6 5c.6-.3 1.3-.3 1.9 0-.6.3-1.3.3-1.9 0ZM29.2 5c.6-.3 1.3-.3 1.9 0-.6.3-1.3.3-1.9 0Z" />
            <path d="M11.6 7.6l1-.5.3.5-1 .5ZM36.8 7.8l1.2-.3.2.5-1.2.3Z" />
        </g>
        <path d="M41.6 7.2L43.4 8.6L41.6 9.6" stroke="#1a1c20" strokeWidth="0.4" fill="none" />
        <SugarCube id={id} transform={melting ? 'translate(21 -1.6) scale(0.62)' : 'translate(20.4 -4.2) scale(0.8)'} wet />
        <path d="M24.6 13.4c.5.8.9 1.4.9 1.9s-.4.9-.9.9-.9-.4-.9-.9.4-1.1.9-1.9Z" fill="#f2f8f4" fillOpacity="0.85" stroke="#9fb0a8" strokeWidth="0.2" />
    </g>
);

/**
 * [EN] Vincent as an engraving: fine vertical lines for the tone, the fur cap, the bandage over the ear and under the
 *      chin, the short red beard, cross-hatched coat.
 * [RU] Винсент гравюрой: тонкие вертикальные линии тона, меховая шапка, повязка через ухо и под подбородком, короткая
 *      рыжая борода, пальто в перекрёстной штриховке.
 */
const Vincent: React.FC = () => (
    <g transform="translate(88.5 108.4) scale(0.45)" fill="none" stroke="#4a2c18" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8V62M6.5 4V66M10 2.6V67.4M13.5 2V68M46.5 2V68M50 2.6V67.4M53.5 4V66M57 8V62" strokeWidth="0.35" strokeOpacity="0.3" />
        <path d="M5 70C7 62 13.6 57.2 21.6 55.8L30 63.6L38.4 55.8C46.4 57.2 53 62 55 70Z" fill="#3d2414" fillOpacity="0.14" strokeWidth="0.7" />
        <path d="M9 69.6l5-7M12.4 70l5.6-8M15.8 70l5-7.2M45.2 62l5.6 8M42.2 62.4l5 7.6M39.2 63l4.4 7" strokeWidth="0.4" strokeOpacity="0.7" />
        <path d="M8.4 63.4l9 6M12 61l8 5.6M51.6 63.4l-9 6M48 61l-8 5.6" strokeWidth="0.32" strokeOpacity="0.5" />
        <path d="M21.6 55.8L25.6 61.6M38.4 55.8L34.4 61.6" strokeWidth="0.7" />
        <path d="M24.6 50.2C25 52.6 24.4 54.6 22.6 55.8M34.6 48.6C34.6 51.4 35.6 53.8 37.6 55.4" strokeWidth="0.5" />
        <path d="M20.4 23.4C19 27.4 18.6 31.4 18.8 34.6C19 38.2 19.8 41.6 21.8 44.6C23.8 47.6 26.6 50 29.4 50.4C31.6 50.6 33.8 49.4 35.6 47.6" fill="#f6e3c6" fillOpacity="0.5" strokeWidth="0.7" />
        <path d="M37.4 24.4C38 28 38.2 31.8 37.8 35.4" strokeWidth="0.5" />
        <path d="M20.6 26.6l2.6-1.4M20.2 29.2l3-1.6M19.9 31.8l3.2-1.8M19.9 34.4l3.2-1.8M20.3 37l3-1.7M20.9 39.6l2.8-1.6M21.8 42.2l2.4-1.4" strokeWidth="0.32" strokeOpacity="0.7" />
        <path d="M33.6 34l3-1.6M33.4 36.8l3.2-1.8M33.8 39.6l3-1.6M34.6 42.2l2.6-1.4" strokeWidth="0.32" strokeOpacity="0.65" />
        <path d="M21.2 23.6c3-1 7-1.4 10.6-1.2M21.8 25c3-.8 6-1 9-.8" strokeWidth="0.3" strokeOpacity="0.55" />
        {/* [EN] The fur cap. [RU] Меховая шапка. */}
        <path d="M15.8 22.2C14.6 12.8 21.6 5.8 30.4 5.6C39.4 5.4 46.4 11.8 45.2 21C38.4 18.6 23.2 18.8 15.8 22.2Z" fill="#2b190d" fillOpacity="0.86" strokeWidth="0.6" />
        <path d="M15.6 17.4l-1 .2M16.4 13.4l-.9-.5M18.6 9.8l-.7-.7M22 7.2l-.4-.9M26.2 5.8l-.2-1M30.6 5.4v-1M35 5.8l.3-1M39 7.4l.5-.9M42.2 10.2l.7-.7M44.4 14l.9-.4M45.2 17.8l1 .1" strokeWidth="0.7" />
        <path d="M19 15c1-1.2 2.2-1.6 3.4-1.2M24.6 10.4c1.2-.8 2.4-1 3.6-.6M31.6 9.4c1.2-.2 2.4.2 3.4 1M38 12c1 .6 1.8 1.6 2.2 2.8M21.8 19.4c1.2-1 2.6-1.2 3.8-.8M29 17.8c1.2-.6 2.6-.6 3.8 0M36.4 18.6c1.2.2 2.2 1 2.8 2" stroke="#d9c6a4" strokeWidth="0.45" strokeOpacity="0.5" />
        {/* [EN] The bandage: a pad over the ear and a band under the chin. [RU] Повязка: подушечка на ухе и лента под подбородком. */}
        <path d="M38.6 20C44 21 47.4 26 47 32C46.6 39 42.6 45.4 37.2 49.4C33 52.4 27.8 53.8 23.4 52.6L23.8 49.4C27.6 50.4 31.6 49.4 34.8 47C39 43.8 41.8 38.6 42 33C42.2 28.4 40.6 24.6 37.4 23Z" fill="#fffbf2" strokeWidth="0.65" />
        <path d="M42.4 27.6C45.4 28.6 46.6 32 45.8 35.4C45 38.4 42.8 40.2 40.6 39.8" fill="#fffbf2" strokeWidth="0.55" />
        <path d="M43 25.4c1.6 2 2 4.2 1.6 6.6M38.6 47.6c-2.4 2-5.4 3.2-8.4 3.4M44.6 37c-.8 2.6-2.4 4.6-4.4 6" strokeWidth="0.35" strokeOpacity="0.75" />
        {/* [EN] Brows, eyes, nose. [RU] Брови, глаза, нос. */}
        <path d="M21.8 27.6c2-1.3 4.4-1.5 6.4-.7M31.4 26.8c2-.9 4.2-.7 5.8.5" strokeWidth="0.9" />
        <path d="M22.8 30.3c1.3-.9 3-1 4.4-.1M32 30.1c1.3-.9 3-.9 4.2 0" strokeWidth="0.6" />
        <path d="M23 31.2c1.2.5 2.6.5 3.8 0M32.2 31c1.2.5 2.4.5 3.6 0" strokeWidth="0.3" strokeOpacity="0.6" />
        <circle cx="25" cy="30.6" r="0.75" fill="#4a2c18" stroke="none" />
        <circle cx="34.2" cy="30.4" r="0.75" fill="#4a2c18" stroke="none" />
        <path d="M29.2 30.8C28.6 33.6 27.6 36.4 26.8 38.2C27.8 39.2 29.4 39.6 31 39" strokeWidth="0.7" />
        <path d="M30.2 31.8c.6 2.2.8 4.2.6 5.8" strokeWidth="0.3" strokeOpacity="0.55" />
        {/* [EN] Moustache, mouth, the short red beard. [RU] Усы, рот, короткая рыжая борода. */}
        <path d="M24.2 42.4c2.4-1.4 5.4-1.6 9.2-.2" strokeWidth="0.9" />
        <path d="M25.8 44.4c1.8.5 3.6.5 5.2 0" strokeWidth="0.5" />
        <g stroke="#7a3a16" strokeWidth="0.5">
            <path d="M20.6 38.6l.6 2M21.4 41.6l.8 1.8M22.8 44.2l1 1.4M24.6 46.4l1 1.2M26.8 48.2l.8 1M29 49.2l.4 1M31.4 49l.2 1M33.4 47.8l-.2 1M24.8 45.2l.2 1.4M27 46.4l.2 1.4M29.6 46.6v1.4M32 45.6l-.2 1.4" />
            <path d="M23.4 41.2l-.4 1.2M33.8 41l.6 1.2M26 40.8l-.2.8M31.6 40.6l.2.8" />
        </g>
    </g>
);

/**
 * [EN] The set in front of the left candelabrum: the bottle and your glass, two loose cubes of sugar on the table.
 * [RU] Набор перед левым канделябром: бутылка и ваша рюмка, два кубика сахара на столе.
 */
export const AbsintheSet: React.FC<{ bottle: number; glass: number }> = ({ bottle, glass }) => (
    <svg className={styles.absinthe} viewBox="0 0 160 200" aria-hidden="true">
        <defs>
            <linearGradient id="ab-liquid" x1="64" x2="140" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#262e10" />
                <stop offset="0.06" stopColor="#4a5620" />
                <stop offset="0.1" stopColor="#76843a" />
                <stop offset="0.3" stopColor="#a0aa5c" />
                <stop offset="0.48" stopColor="#b8bf77" />
                <stop offset="0.7" stopColor="#959f50" />
                <stop offset="0.9" stopColor="#66732c" />
                <stop offset="0.94" stopColor="#46521e" />
                <stop offset="1" stopColor="#232a0e" />
            </linearGradient>
            <linearGradient id="ab-depth" x1="0" x2="0" y1="74" y2="180" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#1b2008" stopOpacity="0.35" />
                <stop offset="0.12" stopColor="#1b2008" stopOpacity="0" />
                <stop offset="0.8" stopColor="#fff8c8" stopOpacity="0" />
                <stop offset="1" stopColor="#fff8c8" stopOpacity="0.22" />
            </linearGradient>
            <linearGradient id="ab-base" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#b9c06e" stopOpacity="0.55" />
                <stop offset="0.55" stopColor="#6f7834" stopOpacity="0.4" />
                <stop offset="1" stopColor="#20240f" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="ab-empty" x1="64" x2="140" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#e9eedc" stopOpacity="0.2" />
                <stop offset="0.09" stopColor="#e9eedc" stopOpacity="0.07" />
                <stop offset="0.5" stopColor="#e9eedc" stopOpacity="0.025" />
                <stop offset="0.91" stopColor="#e9eedc" stopOpacity="0.06" />
                <stop offset="1" stopColor="#e9eedc" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id="ab-gold" x1="0" x2="1">
                <stop offset="0" stopColor="#3f2a08" />
                <stop offset="0.16" stopColor="#8a6420" />
                <stop offset="0.34" stopColor="#e2bd62" />
                <stop offset="0.44" stopColor="#fff0b8" />
                <stop offset="0.56" stopColor="#d6ac4c" />
                <stop offset="0.8" stopColor="#7a561a" />
                <stop offset="1" stopColor="#2e1e05" />
            </linearGradient>
            <radialGradient id="ab-gold-top" cx="0.4" cy="0.45" r="0.7">
                <stop offset="0" stopColor="#fff2c0" />
                <stop offset="0.45" stopColor="#d9b25a" />
                <stop offset="1" stopColor="#6e4e14" />
            </radialGradient>
            <linearGradient id="ab-foil" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#f6e2a0" />
                <stop offset="0.5" stopColor="#b48a32" />
                <stop offset="1" stopColor="#f0d68a" />
            </linearGradient>
            <linearGradient id="ab-paper" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#f6eed6" />
                <stop offset="0.5" stopColor="#ece0bf" />
                <stop offset="1" stopColor="#d5c49a" />
            </linearGradient>
            <linearGradient id="ab-paper-shade" x1="0" x2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="1" stopColor="#3a2a10" stopOpacity="0.16" />
            </linearGradient>
            <linearGradient id="ab-neck-paper" x1="0" x2="1">
                <stop offset="0" stopColor="#a99a72" />
                <stop offset="0.25" stopColor="#ece2c4" />
                <stop offset="0.45" stopColor="#f8f1dc" />
                <stop offset="0.75" stopColor="#ddd0ab" />
                <stop offset="1" stopColor="#8e7f5a" />
            </linearGradient>
            <radialGradient id="ab-glow" cx="0.5" cy="0.55" r="0.5">
                <stop offset="0" stopColor="#cdd486" stopOpacity="0.2" />
                <stop offset="1" stopColor="#cdd486" stopOpacity="0" />
            </radialGradient>
            <filter id="ab-grain" x="0" y="0" width="1" height="1">
                <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves={2} seed={11} result="noise" />
                <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.32  0 0 0 0 0.18  0 0 0 1.4 -0.62" />
                <feComposite in2="SourceGraphic" operator="in" />
            </filter>
            <clipPath id="ab-inside"><path d={INSIDE} /></clipPath>
            <clipPath id="ab-oval"><ellipse cx="102" cy="123.6" rx="12.6" ry="14.2" /></clipPath>
            <GlassDefs id="ab" />
        </defs>

        {/* [EN] The glow of the absinthe, the shadow and the light it throws on the table. [RU] Свечение абсента, тень и свет, который он бросает на стол. */}
        <ellipse className={styles.absintheGlow} cx="102" cy="140" rx="58" ry="64" fill="url(#ab-glow)" />
        <ellipse cx="104" cy="189.4" rx="40" ry="4.4" fill="#000000" opacity="0.7" filter="url(#ab-soft)" />
        <ellipse cx="108" cy="193.4" rx="24" ry="2.8" fill="#c6c262" opacity="0.16" filter="url(#ab-soft)" />

        {/* [EN] The bottle: the inner walls show where it is empty. [RU] Бутылка: там, где пусто, видны внутренние стенки. */}
        <path d={BOTTLE} fill="url(#ab-empty)" />
        <g fill="none" stroke="#e6ecd6" strokeLinecap="round">
            <path d="M67.6 89V176M136.4 89V176" strokeOpacity="0.13" strokeWidth="0.8" />
            <path d="M78.2 75.6Q86.4 69.8 95.4 68.8M125.8 75.6Q117.6 69.8 108.6 68.8" strokeOpacity="0.22" strokeWidth="0.7" />
            <path d="M70 88L70 176M134 88V176" strokeOpacity="0.08" strokeWidth="0.5" />
        </g>
        <g clipPath="url(#ab-inside)">
            <g className={styles.level} style={sink(bottle, BOTTLE_SPAN)}>
                <rect x="64" y="74" width="76" height="110" fill="url(#ab-liquid)" opacity="0.95" />
                <rect x="64" y="74" width="76" height="110" fill="url(#ab-depth)" />
                <rect x="64" y="72.2" width="76" height="2.2" fill="#c9cf88" opacity="0.5" />
                <rect x="64" y="74.2" width="76" height="0.7" fill="#f4f6d2" opacity="0.8" />
                <rect x="64" y="74.9" width="76" height="1.4" fill="#2a300f" opacity="0.25" />
            </g>
        </g>
        {/* [EN] Sprigs of wormwood inside; the absinthe in front of them tints them. [RU] Веточки полыни внутри; абсент перед ними их подкрашивает. */}
        <g fill="none" stroke="#545338" strokeLinecap="round">
            <path d="M86 178C92 170 104 162 116 154C122 150 128 145 134 138" strokeWidth="1.1" />
            <path d="M104 162C110 163 118 162 126 158M95 171C99 175 106 176 113 175" strokeWidth="0.7" />
            <path d="M118 153C121 157 126 159 132 160" strokeWidth="0.6" />
            <path d="M69 178C70 168 71 158 70.4 148" strokeWidth="0.8" />
        </g>
        <g fill="#7c8a62">
            {LEAVES.map(([x, y, angle]) => <path key={`${x}-${y}`} d={LEAF} transform={`translate(${x} ${y}) rotate(${angle})`} />)}
        </g>
        <g clipPath="url(#ab-inside)">
            <g className={styles.level} style={sink(bottle, BOTTLE_SPAN)}>
                <rect x="64" y="75" width="76" height="110" fill="url(#ab-liquid)" opacity="0.42" />
            </g>
        </g>
        {/* [EN] The thick base. [RU] Толстое дно. */}
        <path d="M66.4 178.5H137.6V184.2Q137.6 186.6 135 186.6H69Q66.4 186.6 66.4 184.2Z" fill="url(#ab-base)" />
        <path d="M70 185.6Q102 183.2 134 185.6" stroke="#fbffe0" strokeOpacity="0.35" strokeWidth="0.6" fill="none" />
        <path d="M66.4 178.6H137.6" stroke="#f6f8d8" strokeOpacity="0.22" strokeWidth="0.5" />
        {/* [EN] Facets, reflections of the window and of three candle flames, the outline. [RU] Грани, отражения окна и трёх огоньков свечей, контур. */}
        <g fill="none" strokeLinecap="round">
            <path d="M70 87V184M134 87V184M70 87L78.8 74.2M134 87L125.2 74.2" stroke="#f2f6e2" strokeOpacity="0.2" strokeWidth="0.5" />
            <path d="M66 90V180" stroke="url(#ab-fade)" strokeOpacity="0.55" strokeWidth="2.2" />
            <path d="M72.4 90V178" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="0.6" />
            <path d="M74.6 92V176" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="3" />
            <path d="M138.4 92V180" stroke="#fff8e6" strokeOpacity="0.3" strokeWidth="0.8" />
            <path d="M66.2 84.6L75.6 73.6" stroke="#fffbe8" strokeOpacity="0.55" strokeWidth="1.1" />
            <path d="M96 41V64" stroke="#ffffff" strokeOpacity="0.38" strokeWidth="1.1" />
            <path d="M108.6 42V63" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="0.7" />
        </g>
        <g fill="#ffe6a6">
            <ellipse cx="69.4" cy="81.6" rx="0.45" ry="0.95" opacity="0.8" />
            <ellipse cx="71.2" cy="79.4" rx="0.5" ry="1.05" opacity="0.9" />
            <ellipse cx="73" cy="77.2" rx="0.45" ry="0.95" opacity="0.8" />
        </g>
        <ellipse cx="86.6" cy="69" rx="1.1" ry="2" fill="#fffef4" opacity="0.7" transform="rotate(-58 86.6 69)" />
        <ellipse cx="66.8" cy="96" rx="0.7" ry="2.6" fill="#fffef4" opacity="0.65" />
        <path d={BOTTLE} fill="none" stroke="#e8edd8" strokeOpacity="0.42" strokeWidth="0.55" />

        {/* [EN] The label: paper with grain, a red line and gold foil. [RU] Этикетка: бумага с зерном, красная линия и золотое тиснение. */}
        <rect x="74.8" y="96.8" width="56" height="70" fill="#000000" opacity="0.4" filter="url(#ab-softer)" />
        <rect x="74" y="96" width="56" height="70" fill="url(#ab-paper)" />
        <rect x="74" y="96" width="56" height="70" fill="#ffffff" filter="url(#ab-grain)" opacity="0.55" />
        <rect x="74" y="96" width="56" height="70" fill="url(#ab-paper-shade)" />
        <rect x="74" y="96" width="56" height="70" fill="none" stroke="#6c5233" strokeOpacity="0.55" strokeWidth="0.3" />
        <rect x="75.8" y="97.8" width="52.4" height="66.4" fill="none" stroke="#7d2416" strokeWidth="0.55" />
        <rect x="77" y="99" width="50" height="64" fill="none" stroke="url(#ab-foil)" strokeWidth="0.45" />
        <path d="M77 99h1.6L77 100.6ZM127 99h-1.6l1.6 1.6ZM77 163h1.6L77 161.4ZM127 163h-1.6l1.6-1.6Z" fill="url(#ab-foil)" />
        <text x="102" y="106.4" textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize="8.2" fill="#7d2416" textLength="41" lengthAdjust="spacingAndGlyphs">ABSINTHE</text>
        <path d="M91 108.6h22" stroke="#7d2416" strokeWidth="0.3" />
        <path d="M99.6 108.6l2.4-1 2.4 1-2.4 1Z" fill="#7d2416" />
        <ellipse cx="102" cy="123.6" rx="13.6" ry="15.2" fill="none" stroke="url(#ab-foil)" strokeWidth="0.7" />
        <ellipse cx="102" cy="123.6" rx="12.6" ry="14.2" fill="#f3ead0" />
        <g clipPath="url(#ab-oval)"><Vincent /></g>
        <text x="102" y="146.6" textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize="7" fill="#7d2416" textLength="40" lengthAdjust="spacingAndGlyphs">L&apos;OREILLE</text>
        <text x="102" y="153.6" textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontWeight={600} fontSize="6.2" fill="#9c7426">coupée</text>
        <path d="M88 155.6h28" stroke="#9c7426" strokeWidth="0.25" />
        <text x="102" y="158.8" textAnchor="middle" fontFamily={SERIF} fontSize="2.4" fill="#4a2c18" textLength="42" lengthAdjust="spacingAndGlyphs">GRANDE ABSINTHE · DISTILLÉE À ARLES · 1888</text>
        <text x="102" y="162" textAnchor="middle" fontFamily={SERIF} fontSize="2.4" fill="#4a2c18">70% vol · 70 cl</text>
        {/* [EN] The neck label and the ribbed gold cap. [RU] Шейная этикетка и рифлёный золотой колпачок. */}
        <rect x="93" y="42.6" width="18" height="17.6" fill="url(#ab-neck-paper)" />
        <rect x="93" y="42.6" width="18" height="17.6" fill="#ffffff" filter="url(#ab-grain)" opacity="0.4" />
        <path d="M93 44.2H111M93 58.6H111" stroke="#7d2416" strokeWidth="0.35" />
        <path d="M93 45H111M93 57.8H111" stroke="url(#ab-foil)" strokeWidth="0.25" />
        <text x="102" y="52.8" textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize="3.4" fill="#7d2416" transform="rotate(-16 102 51.6)">grande réserve</text>
        <path d="M90.4 17V37.2Q102 40 113.6 37.2V17Z" fill="url(#ab-gold)" />
        <path d="M91.6 19V31.4M93 19.2V31.8M94.4 19.3V32M95.8 19.4V32.1M97.2 19.4V32.2M98.6 19.5V32.3M100 19.5V32.3M101.4 19.5V32.3M102.8 19.5V32.3M104.2 19.5V32.3M105.6 19.5V32.3M107 19.4V32.2M108.4 19.4V32.1M109.8 19.3V32M111.2 19.2V31.8M112.6 19V31.4"
            stroke="#3a2606" strokeOpacity="0.35" strokeWidth="0.35" />
        <path d="M92.2 19V31.4M93.6 19.2V31.8M95 19.3V32M96.4 19.4V32.1M97.8 19.4V32.2M99.2 19.5V32.3M100.6 19.5V32.3M102 19.5V32.3M103.4 19.5V32.3M104.8 19.5V32.3M106.2 19.5V32.3M107.6 19.4V32.2M109 19.4V32.1M110.4 19.3V32"
            stroke="#fff3c4" strokeOpacity="0.25" strokeWidth="0.35" />
        <path d="M90.4 33.6Q102 36.4 113.6 33.6" stroke="#3a2606" strokeOpacity="0.6" strokeWidth="0.5" fill="none" />
        <path d="M90.4 34.4Q102 37.2 113.6 34.4" stroke="#fff0b8" strokeOpacity="0.5" strokeWidth="0.4" fill="none" />
        <ellipse cx="102" cy="17" rx="11.6" ry="2.5" fill="url(#ab-gold-top)" />
        <path d="M90.6 17.2Q102 20.4 113.4 17.2" stroke="#fff6cc" strokeOpacity="0.7" strokeWidth="0.4" fill="none" />
        <ellipse cx="96.4" cy="16.6" rx="2.6" ry="0.7" fill="#fffbe8" opacity="0.7" />
        <path d="M94 21V31" stroke="#ffe9b0" strokeOpacity="0.55" strokeWidth="1" />

        <VersaillesGlass id="ab" level={glass} transform="translate(-1 88)" />
        <SugarCube id="ab" transform="translate(47 181.4) scale(0.95)" shadow />
        <SugarCube id="ab" transform="translate(57.6 186.2) rotate(-14) scale(0.9)" shadow />
    </svg>
);

/** [EN] The host's glass by the right candelabrum, the sugar half melted. [RU] Рюмка хозяина у правого канделябра, сахар наполовину растаял. */
export const AbsintheGlass: React.FC<{ level: number }> = ({ level }) => (
    <svg className={styles.absintheGlass} viewBox="-2 -8 76 116" aria-hidden="true">
        <defs><GlassDefs id="abr" /></defs>
        <VersaillesGlass id="abr" level={level} melting />
        <SugarCube id="abr" transform="translate(50 92.6) rotate(8) scale(0.85)" shadow />
    </svg>
);

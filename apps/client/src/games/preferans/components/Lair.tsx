// [EN] FILE: games/preferans/components/Lair.tsx — the vampire crypt around the card table (DESIGN_CONCEPT_RU.md §6):
//      two antique three-armed candelabra of blackened silver beside the table (claw feet, knopped stems, scrolled
//      arms, drip pans, ivory candles with melted wax, living flames that never flicker in step), a lancet window
//      with cold moonlight above each, two bats under the vaults that flap, blink their red eyes and now and then
//      bare their fangs, faint cobwebs and low fog. Pure decoration: hidden from screen readers, never catches a
//      click, still when the system asks for less motion. Everything is drawn here, nothing is downloaded.
// [RU] ФАЙЛ: вампирская крипта вокруг карточного стола (DESIGN_CONCEPT_RU.md §6): два антикварных трёхрожковых
//      канделябра из черненого серебра у стола (когтистые лапы, ствол с «яблоками», витые рожки, поддоны, свечи
//      слоновой кости с оплывшим воском, живое пламя, которое никогда не мерцает в такт), над каждым — стрельчатое
//      окно с холодным лунным светом, две летучие мыши под сводами (машут крыльями, моргают красными глазами,
//      иногда скалят клыки), едва видная паутина и низкий туман. Чистое украшение: скрыто от экранного диктора, не
//      ловит щелчки, замирает, когда система просит меньше движения. Всё нарисовано здесь, ничего не скачивается.
import React from 'react';
import styles from './Lair.module.css';

type Side = 'left' | 'right';

/** [EN] Candle heights of one candelabrum (left arm, centre, right arm) and the flicker delays. [RU] Высоты свечей. */
interface CandelabrumLook { readonly heights: readonly [number, number, number]; readonly delays: readonly [number, number, number] }
const LOOKS: Readonly<Record<Side, CandelabrumLook>> = {
    left: { heights: [44, 72, 54], delays: [0.3, 0, 1.1] },
    right: { heights: [58, 62, 38], delays: [0.8, 0.45, 1.6] },
};
// [EN] Where the candles stand: x of the axis, y of the top of the socket, width. [RU] Где стоят свечи: ось, верх гнезда, ширина.
const SOCKETS = [{ x: 34, y: 116, w: 12 }, { x: 80, y: 96, w: 14 }, { x: 126, y: 116, w: 12 }] as const;

/** [EN] One candle with its wick, melted wax and a living flame. [RU] Одна свеча с фитилём, оплывшим воском и живым пламенем. */
const Candle: React.FC<{ id: string; x: number; socket: number; width: number; height: number; delay: number; bloodDrip: boolean }> = ({ id, x, socket, width, height, delay, bloodDrip }) => {
    const top = socket - height;
    const left = x - width / 2;
    return (
        <g>
            <circle className={styles.glow} cx={x} cy={top - 12} r={34} fill={`url(#${id}-glow)`} style={{ animationDelay: `${delay}s` }} />
            <rect x={left} y={top} width={width} height={height} rx={2.4} fill={`url(#${id}-wax)`} />
            {/* [EN] Wax that ran down the sides; one drip is dark wine. [RU] Воск, стекший по бокам; одна капля — тёмно-винная. */}
            <path d={`M${left + 1.2} ${top + 1} q-1.6 ${height * 0.22} 0 ${height * 0.34} q1.4 2.6 2.4 0 v-${height * 0.34} z`} fill="#fbf6ea" />
            <path d={`M${left + width - 2.6} ${top + 1} q1.8 ${height * 0.38} 0.2 ${height * 0.52} q1.4 2.2 2.4 -0.2 v-${height * 0.5} z`}
                fill={bloodDrip ? '#6e0f1a' : '#efe6d2'} />
            <ellipse cx={x} cy={top + 1} rx={width / 2 - 0.6} ry={1.6} fill="#fffaf0" opacity={0.85} />
            <path d={`M${x} ${top + 1} v-6`} stroke="#1a120c" strokeWidth={1.5} strokeLinecap="round" />
            <g transform={`translate(${x} ${top - 4})`}>
                <path className={styles.flame} style={{ animationDelay: `${delay}s` }} d="M0 0C-5.4 -5 -5.6 -13 0 -25C5.6 -13 5.4 -5 0 0Z" fill={`url(#${id}-flame)`} />
                <ellipse className={styles.flameCore} style={{ animationDelay: `${delay}s` }} cx={0} cy={-5} rx={1.8} ry={4} fill="#fffdf4" />
            </g>
        </g>
    );
};

/**
 * [EN] A three-armed candelabrum of blackened silver: claw feet, a domed base, a stem with two knops, two scrolled
 *      arms, drip pans with pooled wax. The metal is a cylinder lit from the side (one gradient), so it reads as cast
 *      silver even at 90 px.
 * [RU] Трёхрожковый канделябр из черненого серебра: когтистые лапы, купол основания, ствол с двумя «яблоками», два
 *      витых рожка, поддоны с застывшим воском. Металл — цилиндр, освещённый сбоку (один градиент), поэтому
 *      читается как литое серебро даже при ширине 90 px.
 */
const Candelabrum: React.FC<{ side: Side }> = ({ side }) => {
    const id = `lair-${side}`;
    const look = LOOKS[side];
    const metal = `url(#${id}-metal)`;
    const pan = `url(#${id}-pan)`;
    return (
        <svg className={`${styles.candelabrum} ${side === 'left' ? styles.candelabrumLeft : styles.candelabrumRight}`} viewBox="0 0 160 340" aria-hidden="true">
            <defs>
                <linearGradient id={`${id}-metal`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor="#141619" />
                    <stop offset="0.2" stopColor="#3c4048" />
                    <stop offset="0.42" stopColor="#9097a1" />
                    <stop offset="0.52" stopColor="#d8dbe0" />
                    <stop offset="0.64" stopColor="#7c838d" />
                    <stop offset="0.86" stopColor="#2b2e34" />
                    <stop offset="1" stopColor="#101114" />
                </linearGradient>
                <linearGradient id={`${id}-pan`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#e2e5e9" />
                    <stop offset="0.45" stopColor="#7c838d" />
                    <stop offset="1" stopColor="#15171b" />
                </linearGradient>
                <linearGradient id={`${id}-wax`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor="#a89b80" />
                    <stop offset="0.3" stopColor="#eadfc8" />
                    <stop offset="0.5" stopColor="#fbf6ea" />
                    <stop offset="0.75" stopColor="#d8ccb1" />
                    <stop offset="1" stopColor="#8f8269" />
                </linearGradient>
                <radialGradient id={`${id}-flame`} cx="0.5" cy="0.78" r="0.62">
                    <stop offset="0" stopColor="#fffdf2" />
                    <stop offset="0.28" stopColor="#ffe7a0" />
                    <stop offset="0.58" stopColor="#ffab3d" />
                    <stop offset="0.82" stopColor="#ff6a12" stopOpacity="0.6" />
                    <stop offset="1" stopColor="#ff4500" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={`${id}-glow`}>
                    <stop offset="0" stopColor="#ffc47a" stopOpacity="0.5" />
                    <stop offset="0.45" stopColor="#ff8a3a" stopOpacity="0.16" />
                    <stop offset="1" stopColor="#ff8a3a" stopOpacity="0" />
                </radialGradient>
            </defs>
            {/* [EN] Feet, base and stem. [RU] Лапы, основание, ствол. */}
            <path d="M52 312C43 317 36 325 28 336h13c5-6 11-12 18-16ZM108 312c9 5 16 13 24 24h-13c-5-6-11-12-18-16ZM73 318l-3 18h20l-3-18Z" fill={metal} />
            <ellipse cx="80" cy="316" rx="40" ry="7" fill={pan} />
            <path d="M44 316c0-22 16-31 36-31s36 9 36 31Z" fill={metal} />
            <path d="M74 286V232h12v54Z" fill={metal} />
            <ellipse cx="80" cy="236" rx="13" ry="7.5" fill={metal} />
            <path d="M75 236V194h10v42Z" fill={metal} />
            <ellipse cx="80" cy="194" rx="15" ry="11" fill={metal} />
            <path d="M76.5 190V104h7v86Z" fill={metal} />
            {/* [EN] Scrolled arms with small curls. [RU] Витые рожки с завитками. */}
            <g fill="none" stroke={metal} strokeLinecap="round">
                <path d="M77 178c-18 5-37-2-42-18-3-10-1-22-1-30" strokeWidth="6" />
                <path d="M83 178c18 5 37-2 42-18 3-10 1-22 1-30" strokeWidth="6" />
                <path d="M46 171c-6 5-13 2-12-5 1-4 6-5 8-2" strokeWidth="3" />
                <path d="M114 171c6 5 13 2 12-5-1-4-6-5-8-2" strokeWidth="3" />
            </g>
            <ellipse cx="80" cy="162" rx="9" ry="5.5" fill={metal} />
            {/* [EN] Sockets and drip pans with pooled wax hanging over the rims. [RU] Гнёзда и поддоны с воском, свисающим с краёв. */}
            {SOCKETS.map((socket, index) => (
                <g key={socket.x}>
                    <ellipse cx={socket.x} cy={socket.y + 12} rx={socket.w + 6} ry={4.6} fill={pan} />
                    <path d={`M${socket.x - socket.w / 2 - 2} ${socket.y + 12}l2-12h${socket.w}l2 12Z`} fill={metal} />
                    <path d={`M${socket.x - socket.w - 4} ${socket.y + 12}c1 5 3 7 2 11 3 1 4-2 4-5 1-3 3-5 6-6Z`} fill="#efe6d2" opacity={index === 1 ? 1 : 0.9} />
                    <Candle id={id} x={socket.x} socket={socket.y} width={socket.w} height={look.heights[index]} delay={look.delays[index]}
                        bloodDrip={(side === 'left' && index === 1) || (side === 'right' && index === 0)} />
                </g>
            ))}
            {side === 'right' && <g transform="translate(118 305) scale(0.5)"><SkullShape /></g>}
        </svg>
    );
};

/**
 * [EN] An expensive bottle of absinthe, half empty, with a reservoir glass and a slotted spoon with a sugar cube —
 *      the club's evening is already under way (Alexey's idea, 09.11.2026). It stands by the left candelabrum and
 *      glows faintly green; on narrow screens it goes with the candelabra.
 * [RU] Дорогая бутылка абсента, початая наполовину, с бокалом и ложечкой с кусочком сахара — вечер клуба уже идёт
 *      (идея Алексея, 09.11.2026). Стоит у левого канделябра и чуть светится зелёным; на узких экранах уходит вместе
 *      с канделябрами.
 */
const Absinthe: React.FC = () => (
    <svg className={styles.absinthe} viewBox="0 0 100 140" aria-hidden="true">
        <defs>
            <linearGradient id="absinthe-glass" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#06120b" />
                <stop offset="0.28" stopColor="#1c4630" />
                <stop offset="0.44" stopColor="#4c8a62" />
                <stop offset="0.62" stopColor="#163a26" />
                <stop offset="1" stopColor="#040b07" />
            </linearGradient>
            <linearGradient id="absinthe-liquid" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#1f6e2a" />
                <stop offset="0.45" stopColor="#8be35f" />
                <stop offset="1" stopColor="#1a5a22" />
            </linearGradient>
            <radialGradient id="absinthe-glow">
                <stop offset="0" stopColor="#9dff7a" stopOpacity="0.35" />
                <stop offset="1" stopColor="#9dff7a" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="absinthe-foil" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#3c4048" />
                <stop offset="0.5" stopColor="#d8dbe0" />
                <stop offset="1" stopColor="#23262b" />
            </linearGradient>
            <clipPath id="absinthe-body">
                <path d="M22 132Q20 132 20 128V62Q20 48 28.5 41.5V20H39.5V41.5Q48 48 48 62V128Q48 132 46 132Z" />
            </clipPath>
        </defs>
        <ellipse cx="50" cy="135" rx="42" ry="4" fill="#000000" opacity="0.55" />
        <circle className={styles.absintheGlow} cx="34" cy="104" r="30" fill="url(#absinthe-glow)" />
        {/* [EN] The bottle: dark green glass, the absinthe down to the label's middle. [RU] Бутылка: тёмно-зелёное стекло, абсент до середины этикетки. */}
        <path d="M22 132Q20 132 20 128V62Q20 48 28.5 41.5V20H39.5V41.5Q48 48 48 62V128Q48 132 46 132Z" fill="url(#absinthe-glass)" opacity="0.92" />
        <g clipPath="url(#absinthe-body)">
            <rect x="18" y="88" width="32" height="46" fill="url(#absinthe-liquid)" opacity="0.88" />
            <ellipse cx="34" cy="88" rx="14" ry="1.4" fill="#d6ffb8" opacity="0.65" />
        </g>
        <path d="M22 132Q20 132 20 128V62Q20 48 28.5 41.5V20H39.5V41.5Q48 48 48 62V128Q48 132 46 132Z" fill="none" stroke="#0a1a10" strokeWidth="0.8" />
        <path d="M24.2 60V126M31 22V40" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.5" strokeLinecap="round" />
        {/* [EN] The label: cream paper in a silver line, a bat over the word. [RU] Этикетка: кремовая бумага в серебряной линии, летучая мышь над словом. */}
        <rect x="21.3" y="64" width="25.4" height="21" rx="1" fill="#e9dfc2" stroke="#7a6a45" strokeWidth="0.5" />
        <rect x="22.6" y="65.3" width="22.8" height="18.4" fill="none" stroke="#9097a1" strokeWidth="0.35" />
        <path d="M34 69.2l.5-.8.3 1c.9-.7 2.6-1.1 4.8-.1-.9.4-1.2 1.1-1.1 1.8-.8-.6-1.6-.5-1.9.3-.6-.4-1.3-.3-1.6.5-.3-.3-.6-.1-1 .5-.4-.6-.7-.8-1-.5-.3-.8-1-.9-1.6-.5-.3-.8-1.1-.9-1.9-.3.1-.7-.2-1.4-1.1-1.8 2.2-1 3.9-.6 4.8.1l.3-1Z" fill="#2a0208" />
        <text x="34" y="77.6" textAnchor="middle" fontFamily="Ponomar, 'Cormorant Garamond', Georgia, serif" fontSize="5.4" fill="#1f4a30" letterSpacing="0.3">ABSINTHE</text>
        <text x="34" y="82.2" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="2.6" fill="#5a0711" fontStyle="italic">la fée verte · 72°</text>
        {/* [EN] Foil, a cork sealed in black-red wax. [RU] Фольга, пробка под чёрно-красным сургучом. */}
        <rect x="28" y="20" width="12" height="9" fill="url(#absinthe-foil)" />
        <rect x="29.4" y="12.5" width="9.2" height="8" rx="1.6" fill="#4a0610" stroke="#1a0206" strokeWidth="0.5" />
        <path d="M30 14.2h8" stroke="#ff9aa6" strokeOpacity="0.35" strokeWidth="0.6" />
        {/* [EN] The reservoir glass with a slotted spoon and a sugar cube. [RU] Бокал с резервуаром, ложечка с прорезями и кусочек сахара. */}
        <path d="M60 104Q60 96 63 92H85Q88 96 88 104Q88 116 74 118Q60 116 60 104Z" fill="#cfe9d6" fillOpacity="0.12" stroke="#a9c7b2" strokeOpacity="0.55" strokeWidth="0.6" />
        <path d="M61.2 106Q62 115.4 74 116.8Q86 115.4 86.8 106Z" fill="url(#absinthe-liquid)" opacity="0.75" />
        <path d="M74 118V130M66 132H82" stroke="#a9c7b2" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M56 91.5H92" stroke="url(#absinthe-foil)" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M66 91.2V92M70 91.2V92M78 91.2V92M82 91.2V92" stroke="#15171b" strokeWidth="0.5" />
        <rect x="70.5" y="85.6" width="7" height="5.6" rx="0.6" fill="#f6f3ec" stroke="#cfc7b5" strokeWidth="0.4" />
        <path d="M64 96.5V113" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
);

/** [EN] A lancet window of the crypt: stone arch, leaded glass, a tracery rosette, cold moonlight. [RU] Стрельчатое окно. */
const LancetWindow: React.FC<{ side: Side }> = ({ side }) => {
    const id = `window-${side}`;
    return (
        <svg className={`${styles.window} ${side === 'left' ? styles.windowLeft : styles.windowRight}`} viewBox="0 0 120 240" aria-hidden="true">
            <defs>
                <linearGradient id={`${id}-moon`} x1="0" x2="0.4" y1="0" y2="1">
                    <stop offset="0" stopColor="#c9d6e8" stopOpacity="0.55" />
                    <stop offset="0.55" stopColor="#8ea3c0" stopOpacity="0.28" />
                    <stop offset="1" stopColor="#5b6f8c" stopOpacity="0.12" />
                </linearGradient>
            </defs>
            <path d="M6 240V88C6 40 60 4 60 4s54 36 54 84v152Z" fill="#17141a" stroke="#2c2730" strokeWidth="3" />
            <path d="M18 236V90c0-38 42-68 42-68s42 30 42 68v146Z" fill={`url(#${id}-moon)`} />
            <g fill="none" stroke="#0d0b0f" strokeWidth="2.4">
                <path d="M60 22V236M18 128H102M18 182H102" />
                <path d="M18 100L60 142L102 100M18 154L60 196L102 154M18 208L46 236M102 208L74 236" strokeWidth="1.2" />
                <circle cx="60" cy="72" r="15" />
                <path d="M60 57v30M45 72h30" strokeWidth="1.4" />
            </g>
        </svg>
    );
};

/** [EN] A bat: wings, body, ears, red eyes that blink, a mouth that opens on two fangs. [RU] Летучая мышь. */
const Bat: React.FC<{ className: string }> = ({ className }) => (
    <svg className={`${styles.bat} ${className}`} viewBox="0 0 120 70" aria-hidden="true">
        <g className={styles.wingLeft}>
            <path d="M57 31C46 12 26 8 3 17c10 4 14 12 12 21 8-6 15-2 17 7 6-8 14-6 18 1 2-6 5-11 7-15Z" />
        </g>
        <g className={styles.wingRight}>
            <path d="M63 31c11-19 31-23 54-14-10 4-14 12-12 21-8-6-15-2-17 7-6-8-14-6-18 1-2-6-5-11-7-15Z" />
        </g>
        <path d="M53 22l-2-12 7 9ZM67 22l2-12-7 9Z" />
        <ellipse cx="60" cy="40" rx="8.5" ry="13" />
        <circle cx="60" cy="27" r="8" />
        <g className={styles.eyes}>
            <circle cx="56.8" cy="25.6" r="1.9" />
            <circle cx="63.2" cy="25.6" r="1.9" />
        </g>
        <g className={styles.fangs}>
            <path d="M55.5 30.5h9l-1 2.6h-7Z" fill="#3a0008" />
            <path d="M56.6 30.6l1 4 1-4ZM61.4 30.6l1 4 1-4Z" fill="#f4efe6" />
        </g>
    </svg>
);

/** [EN] A small skull at the foot of a candelabrum: bone, embers instead of eyes — a memento mori. [RU] Небольшой череп у подножия канделябра. */
const SkullShape: React.FC = () => (
    <g>
        <path d="M32 2C16 2 6 13 6 27c0 8 4 13 9 16v9c0 3 2 5 5 5h24c3 0 5-2 5-5v-9c5-3 9-8 9-16C58 13 48 2 32 2Z" fill="#cfc2a6" stroke="#5b4a33" strokeWidth="1.5" />
        <ellipse cx="21" cy="28" rx="7.5" ry="8.5" fill="#1a0d0b" />
        <ellipse cx="43" cy="28" rx="7.5" ry="8.5" fill="#1a0d0b" />
        <circle className={styles.skullEye} cx="21" cy="29" r="1.8" fill="#b3121f" />
        <circle className={styles.skullEye} cx="43" cy="29" r="1.8" fill="#b3121f" />
        <path d="M32 35l-4 8h8z" fill="#1a0d0b" />
        <path d="M20 48v8M26 49v8M32 49v8M38 49v8M44 48v8" stroke="#5b4a33" strokeWidth="1.6" />
    </g>
);

/** [EN] A cobweb for a corner (mirrored for the other one). [RU] Паутина для угла (для другого — зеркально). */
const Cobweb: React.FC<{ className: string }> = ({ className }) => (
    <svg className={`${styles.cobweb} ${className}`} viewBox="0 0 160 160" aria-hidden="true">
        <path d="M0 0L150 40M0 0L120 100M0 0L70 150M0 0L20 160M0 0L160 10" />
        <path d="M30 8Q26 24 25 34Q16 37 6 34" />
        <path d="M62 17Q55 42 50 64Q30 70 12 68" />
        <path d="M96 26Q86 58 78 92Q50 102 18 104" />
        <path d="M130 35Q118 74 106 120Q70 132 22 138" />
    </svg>
);

export const Lair: React.FC = () => (
    <div className={styles.lair} aria-hidden="true">
        <Cobweb className={styles.cobwebLeft} />
        <Cobweb className={styles.cobwebRight} />
        <LancetWindow side="left" />
        <LancetWindow side="right" />
        <div className={`${styles.moonbeam} ${styles.moonbeamLeft}`} />
        <div className={`${styles.moonbeam} ${styles.moonbeamRight}`} />
        <Candelabrum side="left" />
        <Candelabrum side="right" />
        <Absinthe />
        <Bat className={styles.batLeft} />
        <Bat className={styles.batRight} />
        <div className={styles.fog} />
        <div className={`${styles.fog} ${styles.fogSecond}`} />
    </div>
);

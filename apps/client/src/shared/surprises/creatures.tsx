// [EN] FILE: shared/surprises/creatures.tsx — the drawn (cartoon) «surprises»: deep space for chess (a comet, a UFO
//      abducting a pawn, an astronaut eating noodles, an alien peeking, a satellite with a sock drying on its
//      antenna), the sea for sea battle (a gull with a stolen captain's cap, a shark fin, a tentacle squeezing a paper
//      boat, a bottle with a fish inside, a periscope with an eye in its lens), and two small things of the realistic
//      games: a drop of blood (preferans) and the spinning card (poker). The realistic creatures are photographs
//      (public/shared/surprises/*.webp). Black humour on purpose (Alexey, 12.11.2026). Every creature faces right;
//      Surprises.tsx mirrors it when it goes left. Only light SVG: no filters on moving things.
// [RU] ФАЙЛ: нарисованные (мультяшные) «неожиданности»: космос шахмат (комета, НЛО похищает пешку, космонавт ест
//      лапшу, пришелец выглядывает, спутник с носком на антенне), море морского боя (чайка с украденной фуражкой,
//      акулий плавник, щупальце сжимает бумажный кораблик, бутылка с рыбкой, перископ с глазом в стекле) и две мелочи
//      реалистичных игр: капля крови (преферанс) и летящая карта (покер). Реалистичные существа — фотографии
//      (public/shared/surprises/*.webp). Чёрный юмор — нарочно (Алексей, 12.11.2026). Все смотрят вправо;
//      Surprises.tsx зеркалит, когда существо идёт влево. Только лёгкий SVG: никаких фильтров на движущемся.
import React from 'react';
import type { Drawn } from './logic';
import styles from './Surprises.module.css';

interface Art { readonly size: number }

/** [EN] A comet: a white-hot head and a long tail behind it. [RU] Комета: раскалённая голова и длинный хвост. */
const Comet: React.FC<Art> = ({ size }) => (
    <svg width={size} height={size * 0.3} viewBox="0 0 200 60" className={styles.creature}>
        <defs>
            <linearGradient id="srp-tail" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#7fd3ff" stopOpacity="0" />
                <stop offset="0.7" stopColor="#9fe1ff" stopOpacity="0.55" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.95" />
            </linearGradient>
            <radialGradient id="srp-head">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.45" stopColor="#d6f2ff" />
                <stop offset="1" stopColor="#7fd3ff" stopOpacity="0" />
            </radialGradient>
        </defs>
        <path d="M0 30 170 20a10 10 0 0 1 0 20Z" fill="url(#srp-tail)" />
        <path d="M40 34 168 26v8Z" fill="#ffd27a" opacity="0.35" />
        <circle cx="172" cy="30" r="16" fill="url(#srp-head)" />
        <circle cx="172" cy="30" r="6" fill="#ffffff" />
    </svg>
);

/** [EN] A UFO abducting a chess pawn in its beam; a tiny pilot behind the dome. [RU] НЛО утаскивает лучом шахматную пешку; за куполом — крошечный пилот. */
const Ufo: React.FC<Art> = ({ size }) => (
    <svg width={size} height={size * 0.9} viewBox="0 0 160 144" className={styles.creature}>
        <defs>
            <linearGradient id="srp-beam" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#b8ffcf" stopOpacity="0.7" />
                <stop offset="1" stopColor="#b8ffcf" stopOpacity="0" />
            </linearGradient>
        </defs>
        <path className={styles.beam} d="M62 52h36l26 92H36Z" fill="url(#srp-beam)" />
        <g className={styles.lift}>
            <path d="M74 120a6 6 0 1 1 12 0c0 3-2 5-3 6l4 10H73l4-10c-1-1-3-3-3-6Z" fill="#f2efe6" stroke="#8a8578" strokeWidth="1" />
        </g>
        <ellipse cx="80" cy="30" rx="22" ry="20" fill="#9fd8ff" opacity="0.55" />
        <ellipse cx="80" cy="34" rx="7" ry="9" fill="#7ad67a" />
        <ellipse cx="77" cy="32" rx="2" ry="3" fill="#0b0b0b" />
        <ellipse cx="83" cy="32" rx="2" ry="3" fill="#0b0b0b" />
        <ellipse cx="80" cy="46" rx="62" ry="14" fill="#5b6472" />
        <ellipse cx="80" cy="42" rx="58" ry="9" fill="#a7b0bd" />
        <g className={styles.blink}>
            <circle cx="40" cy="48" r="3.4" fill="#ff5a5a" />
            <circle cx="80" cy="54" r="3.4" fill="#ffe066" />
            <circle cx="120" cy="48" r="3.4" fill="#5ad1ff" />
        </g>
    </svg>
);

/** [EN] An astronaut drifting past, calmly eating noodles from a cup; the cut tether trails behind. [RU] Космонавт проплывает мимо и спокойно ест лапшу из стаканчика; сзади болтается оборванный трос. */
const Astronaut: React.FC<Art> = ({ size }) => (
    <svg width={size} height={size * 1.1} viewBox="0 0 120 132" className={styles.creature}>
        <path d="M30 86C14 96 10 112 2 126" stroke="#c9ced6" strokeWidth="2" fill="none" strokeDasharray="5 4" />
        <rect x="26" y="52" width="16" height="34" rx="5" fill="#8f98a6" />
        <g fill="#eef1f5" stroke="#9aa3b0" strokeWidth="1.5">
            <rect x="36" y="50" width="42" height="46" rx="14" />
            <path d="M44 94l-6 26h12l6-24ZM68 94l6 26H62l-6-24Z" />
            <path d="M76 60c10 0 16 4 20 10l-6 6c-4-4-8-6-14-6Z" />
            <circle cx="57" cy="34" r="22" />
        </g>
        <path d="M44 30a14 12 0 0 1 28 0v6a14 12 0 0 1-28 0Z" fill="#2a3a5a" />
        <path d="M48 28c4-4 10-5 14-3" stroke="#9fd8ff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M90 66l8 16h14l4-16Z" fill="#f4f1ea" stroke="#b9472f" strokeWidth="2" />
        <path d="M92 70h22" stroke="#b9472f" strokeWidth="3" />
        <g className={styles.noodles} stroke="#f2d27a" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M100 66c-2-8 4-10 2-18M106 66c3-6-3-12 1-18M111 66c-1-5 4-8 2-14" />
        </g>
        <path d="M104 40 96 66M110 40l-6 26" stroke="#7a5230" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

/** [EN] A grey alien with huge black eyes peeking from behind the edge, three fingers on the frame. [RU] Серый пришелец с огромными чёрными глазами выглядывает из-за края, три пальца на рамке. */
const Alien: React.FC<Art> = ({ size }) => (
    <svg width={size * 0.8} height={size} viewBox="0 0 128 160" className={styles.creature}>
        <path d="M0 40c40-20 92-12 100 30 6 30-14 64-40 76-18 8-40 6-60-2Z" fill="#a9b8a0" stroke="#6f7f67" strokeWidth="2" />
        <g className={styles.blinkEyes}>
            <path d="M30 72c8-14 34-18 46-6-6 14-32 20-46 6Z" fill="#0b0d0b" />
            <path d="M44 66c4-2 10-2 14 0" stroke="#5b6b5b" strokeWidth="2" fill="none" />
        </g>
        <path d="M50 116c6 2 12 2 16 0" stroke="#6f7f67" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <g fill="#a9b8a0" stroke="#6f7f67" strokeWidth="2">
            <path d="M0 96h40c6 0 10 2 10 6s-4 6-10 6H0Z" />
            <path d="M0 110h46c5 0 9 2 9 5s-4 5-9 5H0Z" />
            <path d="M0 124h40c5 0 8 2 8 5s-3 5-8 5H0Z" />
        </g>
    </svg>
);

/** [EN] A satellite with solar wings and a blinking light; somebody's sock dries on the antenna. [RU] Спутник с солнечными крыльями и мигающим огоньком; на антенне сохнет чей-то носок. */
const Satellite: React.FC<Art> = ({ size }) => (
    <svg width={size} height={size * 0.5} viewBox="0 0 200 100" className={styles.creature}>
        <g fill="#24406e" stroke="#9fb8de" strokeWidth="1.2">
            <rect x="6" y="36" width="64" height="28" />
            <rect x="130" y="36" width="64" height="28" />
        </g>
        <path d="M22 36v28M38 36v28M54 36v28M146 36v28M162 36v28M178 36v28" stroke="#9fb8de" strokeWidth="1" />
        <path d="M70 50h18M112 50h18" stroke="#c9ced6" strokeWidth="3" />
        <rect x="88" y="34" width="24" height="32" rx="3" fill="#d9b44a" stroke="#8a6d1f" strokeWidth="1.5" />
        <path d="M100 34V14" stroke="#c9ced6" strokeWidth="2" />
        <path d="M90 14a10 6 0 0 1 20 0Z" fill="#e6e9ee" />
        <path d="M100 18c4 2 6 6 5 12l6 2c1 3-1 5-4 4l-8-3c-2-4-1-10 1-15Z" fill="#e2546a" />
        <circle className={styles.blink} cx="100" cy="72" r="3.5" fill="#ff4d4d" />
    </svg>
);

/** [EN] A seagull; the big one has stolen a captain's cap. [RU] Чайка; большая утащила капитанскую фуражку. */
const Gull: React.FC<Art> = ({ size }) => (
    <svg width={size} height={size * 0.5} viewBox="0 0 120 60" className={styles.creature}>
        <g className={styles.wingLeft}><path d="M56 30C44 16 28 10 6 12c14 6 24 14 30 22Z" fill="#d7dde4" stroke="#7a8492" strokeWidth="1" /></g>
        <g className={styles.wingRight}><path d="M62 30c10-14 24-20 44-20-12 6-20 14-26 22Z" fill="#c9d0d9" stroke="#7a8492" strokeWidth="1" /></g>
        <ellipse cx="60" cy="34" rx="22" ry="9" fill="#f4f6f8" />
        <circle cx="82" cy="28" r="7" fill="#f4f6f8" />
        <path d="M88 28l10 2-10 3Z" fill="#f2b632" />
        <circle cx="84" cy="26" r="1.3" fill="#111" />
        <path d="M38 34l-12 4 12 2Z" fill="#3b4048" />
        {size > 80 && (
            <g>
                <path d="M74 44h20l2 5H72Z" fill="#1d2433" />
                <path d="M72 44c2-6 22-6 24 0Z" fill="#f4f6f8" stroke="#1d2433" strokeWidth="1.2" />
                <circle cx="84" cy="42" r="1.6" fill="#d9b44a" />
            </g>
        )}
    </svg>
);

/** [EN] A shark fin cutting the water. [RU] Акулий плавник режет воду. */
const Fin: React.FC<Art> = ({ size }) => (
    <svg width={size} height={size * 0.5} viewBox="0 0 140 70" className={styles.creature}>
        <g className={styles.bob}>
            <path d="M40 58C52 40 62 18 78 4c4 18 8 38 22 54Z" fill="#4a5664" stroke="#2c3440" strokeWidth="1.5" />
            <path d="M58 40c6-4 12-6 18-4" stroke="#7a8796" strokeWidth="1.5" fill="none" />
        </g>
        <path d="M0 58c12-6 24 6 36 0s24-6 36 0 24 6 36 0 24-6 32 0v12H0Z" fill="#2c6a96" opacity="0.85" />
        <path d="M30 56c10-4 18-2 24 2M98 58c8-6 18-6 26-2" stroke="#e8f4ff" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
);

/** [EN] A kraken tentacle rising from the water and squeezing a paper boat. [RU] Щупальце кракена поднимается из воды и сжимает бумажный кораблик. */
const Tentacle: React.FC<Art> = ({ size }) => (
    <svg width={size * 0.5} height={size} viewBox="0 0 100 200" className={styles.creature}>
        <g className={styles.sway}>
            <path d="M40 200c-6-40 4-80 20-110 12-24 10-44-6-52-12-6-24 2-22 14 2 10 14 10 16 2" fill="none" stroke="#7a2e5a" strokeWidth="22" strokeLinecap="round" />
            <path d="M40 200c-6-40 4-80 20-110 12-24 10-44-6-52" fill="none" stroke="#a24a7a" strokeWidth="10" strokeLinecap="round" />
            <g fill="#f0c6d8">
                <circle cx="44" cy="176" r="3.5" /><circle cx="46" cy="150" r="3.5" /><circle cx="52" cy="124" r="3.5" />
                <circle cx="62" cy="100" r="3" /><circle cx="68" cy="76" r="3" /><circle cx="64" cy="54" r="2.6" />
            </g>
            <path d="M30 28h36l-6 10H36Z" fill="#f4f1ea" stroke="#9a948a" strokeWidth="1.2" />
            <path d="M48 28V12l12 16Z" fill="#f4f1ea" stroke="#9a948a" strokeWidth="1.2" />
        </g>
    </svg>
);

/** [EN] A bottle with a rolled message and a small fish that lives inside. [RU] Бутылка со свёрнутой запиской и рыбкой, которая живёт внутри. */
const Bottle: React.FC<Art> = ({ size }) => (
    <svg width={size} height={size * 1.4} viewBox="0 0 80 112" className={styles.creature}>
        <g className={styles.bob}>
            <g transform="rotate(-62 40 60)">
                <path d="M32 18h16v14c8 4 12 12 12 22v40c0 6-4 10-10 10H30c-6 0-10-4-10-10V54c0-10 4-18 12-22Z" fill="#5fae8a" fillOpacity="0.45" stroke="#2f7a5a" strokeWidth="2" />
                <rect x="33" y="10" width="14" height="10" rx="2" fill="#a0784a" />
                <rect x="28" y="56" width="14" height="30" rx="3" fill="#efe2bf" />
                <path d="M44 66c4-4 10-4 12 0-2 4-8 4-12 0Zm0 0-4-3v6Z" fill="#ff9a3a" />
            </g>
        </g>
        <path d="M0 96c10-6 20 6 30 0s20-6 30 0 14 4 20 0v16H0Z" fill="#2c6a96" opacity="0.8" />
    </svg>
);

/** [EN] A periscope rising from the water; a suspicious eye looks out of its lens. [RU] Перископ поднимается из воды; из стекла смотрит подозрительный глаз. */
const Periscope: React.FC<Art> = ({ size }) => (
    <svg width={size * 0.5} height={size} viewBox="0 0 80 160" className={styles.creature}>
        <g className={styles.look}>
            <rect x="32" y="30" width="14" height="130" fill="#56606c" stroke="#2e353e" strokeWidth="1.5" />
            <path d="M28 14h28v22H28Z" fill="#56606c" stroke="#2e353e" strokeWidth="1.5" />
            <rect x="54" y="16" width="10" height="18" rx="2" fill="#9fd8ff" stroke="#2e353e" strokeWidth="1.5" />
            <circle cx="59" cy="25" r="5" fill="#ffffff" />
            <circle cx="60" cy="25" r="2.4" fill="#1c2a3a" />
        </g>
        <path d="M0 150c10-6 20 4 30 0s16-6 26-2 16 4 24 0v12H0Z" fill="#2c6a96" opacity="0.85" />
    </svg>
);

/** [EN] A thick dark drop of blood with a highlight. [RU] Густая тёмная капля крови с бликом. */
const BloodDrop: React.FC<Art> = ({ size }) => (
    <svg width={size} height={size * 1.5} viewBox="0 0 20 30" className={styles.creature}>
        <path d="M10 1C10 1 2 13 2 19a8 8 0 0 0 16 0C18 13 10 1 10 1Z" fill="#6e0612" />
        <path d="M10 4C8 9 4 15 4.5 19.5a5.5 5.5 0 0 0 4 4.8C6 21 6.5 13 10 4Z" fill="#9b0f1f" />
        <ellipse cx="13" cy="19" rx="1.6" ry="2.6" fill="#ffd6dc" opacity="0.7" />
    </svg>
);

/** [EN] The back of a playing card of the lair: crimson, silver filigree, a fang medallion. [RU] Рубашка карты логова: багровая, серебряная скань, медальон с клыком. */
const Card: React.FC<Art> = ({ size }) => (
    <svg width={size} height={size * 1.4} viewBox="0 0 50 70" className={styles.creature}>
        <rect x="1" y="1" width="48" height="68" rx="4" fill="#f4efe6" stroke="#2a1416" strokeWidth="1.2" />
        <rect x="4" y="4" width="42" height="62" rx="2.5" fill="#7a0d18" />
        <path d="M4 4l42 62M46 4 4 66M25 4v62M4 35h42" stroke="#c9ced6" strokeWidth="0.5" opacity="0.5" />
        <circle cx="25" cy="35" r="10" fill="#7a0d18" stroke="#d9dde3" strokeWidth="1.4" />
        <path d="M21 30h8l-1.5 4-1 7-1.5-6.5-1.5 6.5-1-7Z" fill="#f4efe6" />
    </svg>
);

/** [EN] The drawing of every drawn creature by its name (logic.ts DRAWN). [RU] Рисунок каждого нарисованного существа по имени. */
export const ART: Readonly<Record<Drawn, React.FC<Art>>> = {
    comet: Comet, ufo: Ufo, astronaut: Astronaut, alien: Alien, satellite: Satellite,
    gull: Gull, fin: Fin, tentacle: Tentacle, bottle: Bottle, periscope: Periscope,
    bloodDrop: BloodDrop, card: Card,
};

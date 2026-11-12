// [EN] FILE: shared/surprises/creatures.tsx — the two small drawn things of the «surprises»: a drop of blood
//      (preferans) and the spinning card back (poker). Everything else is a photograph generated on our own GPU
//      (public/shared/surprises/*.webp): since the evening of 12.11.2026 no game is a cartoon (Alexey: «мультяшные
//      картинки не очень… реалистичней, для взрослых, позлее»). Only light SVG: no filters on moving things.
// [RU] ФАЙЛ: две маленькие нарисованные вещи «неожиданностей»: капля крови (преферанс) и летящая рубашка карты
//      (покер). Всё остальное — фотографии, сгенерированные на нашей видеокарте (public/shared/surprises/*.webp): с
//      вечера 12.11.2026 ни одна игра не мультяшная (Алексей: «мультяшные картинки не очень… реалистичней, для
//      взрослых, позлее»). Только лёгкий SVG: никаких фильтров на движущемся.
import React from 'react';
import type { Drawn } from './logic';
import styles from './Surprises.module.css';

interface Art { readonly size: number }

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
export const ART: Readonly<Record<Drawn, React.FC<Art>>> = { bloodDrop: BloodDrop, card: Card };

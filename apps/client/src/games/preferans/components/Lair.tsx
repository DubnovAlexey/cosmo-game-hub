// [EN] FILE: games/preferans/components/Lair.tsx — the vampire lair around the card table: burning candles of bone-white
//      wax with blood-red drips on both sides (one stands on a skull), two bats in the upper corners that flap, blink
//      their red eyes now and then and bare their fangs from time to time, cobwebs in the corners and low fog creeping
//      over the floor. Pure decoration: hidden from screen readers, never catches a click, still without motion when
//      the system asks for less motion. Everything is drawn here (CSS and small inline SVG), nothing is downloaded.
// [RU] ФАЙЛ: вампирское логово вокруг карточного стола: горящие свечи из костяно-белого воска с кровавыми потёками по
//      обе стороны (одна стоит на черепе), две летучие мыши в верхних углах — машут крыльями, иногда моргают красными
//      глазами и время от времени скалят клыки, паутина по углам и низкий туман над полом. Чистое украшение: скрыто от
//      экранного диктора, не ловит щелчки, замирает, когда система просит меньше движения. Всё нарисовано здесь
//      (CSS и маленькие встроенные SVG), ничего не скачивается.
import React from 'react';
import styles from './Lair.module.css';

/** [EN] One candle: height of the wax and flicker timing differ, so the flames never move in step. [RU] Одна свеча. */
const Candle: React.FC<{ height: number; width: number; delay: number }> = ({ height, width, delay }) => (
    <span className={styles.candle} style={{ '--h': `${height}px`, '--w': `${width}px`, '--d': `${delay}s` } as React.CSSProperties}>
        <span className={styles.glow} />
        <span className={styles.flame} />
        <span className={styles.wick} />
        <span className={styles.wax} />
    </span>
);

const Skull: React.FC = () => (
    <svg className={styles.skull} viewBox="0 0 64 60" aria-hidden="true">
        <path d="M32 2C16 2 6 13 6 27c0 8 4 13 9 16v9c0 3 2 5 5 5h24c3 0 5-2 5-5v-9c5-3 9-8 9-16C58 13 48 2 32 2Z" fill="#d9ccb0" />
        <path d="M32 2C16 2 6 13 6 27c0 8 4 13 9 16v9c0 3 2 5 5 5h24c3 0 5-2 5-5v-9c5-3 9-8 9-16C58 13 48 2 32 2Z" fill="none" stroke="#5b4a33" strokeWidth="1.5" />
        <ellipse cx="21" cy="28" rx="7.5" ry="8.5" fill="#1a0d0b" />
        <ellipse cx="43" cy="28" rx="7.5" ry="8.5" fill="#1a0d0b" />
        <circle className={styles.skullEye} cx="21" cy="29" r="2.2" fill="#ff3b2f" />
        <circle className={styles.skullEye} cx="43" cy="29" r="2.2" fill="#ff3b2f" />
        <path d="M32 35l-4 8h8z" fill="#1a0d0b" />
        <path d="M20 48v8M26 49v8M32 49v8M38 49v8M44 48v8" stroke="#5b4a33" strokeWidth="1.6" />
    </svg>
);

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
        <div className={`${styles.candles} ${styles.candlesLeft}`}>
            <Candle height={118} width={18} delay={0} />
            <span className={styles.onSkull}>
                <Candle height={64} width={15} delay={0.7} />
                <Skull />
            </span>
            <Candle height={88} width={16} delay={1.3} />
        </div>
        <div className={`${styles.candles} ${styles.candlesRight}`}>
            <Candle height={92} width={16} delay={0.4} />
            <Candle height={130} width={19} delay={1.1} />
            <span className={styles.onSkull}>
                <Candle height={58} width={14} delay={0.2} />
                <Skull />
            </span>
        </div>
        <Bat className={styles.batLeft} />
        <Bat className={styles.batRight} />
        <div className={styles.fog} />
        <div className={`${styles.fog} ${styles.fogSecond}`} />
    </div>
);

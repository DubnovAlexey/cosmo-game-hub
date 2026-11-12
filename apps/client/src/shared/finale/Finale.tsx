// [EN] FILE: shared/finale/Finale.tsx — the scene at the end of a game, the same in every game of the hub. You lost: the
//      opponent bursts in, shakes with laughter, «HA-HA» flies up from him, he throws a tomato that splats on the glass
//      and runs down, a sad trombone plays and he mocks you aloud. You won: golden rays, the opponent bows twice, a
//      laurel wreath comes down onto him, rose petals fall, a fanfare plays and he praises you aloud. A tap closes it;
//      after FINALE_TIME it leaves by itself and the game's own result stays. «Reduce motion» keeps everything still.
// [RU] ФАЙЛ: сцена конца партии, одинаковая во всех играх хаба. Вы проиграли: соперник врывается, трясётся от хохота,
//      от него взлетает «ХА-ХА», он бросает помидор, который шлёпается о стекло и стекает, играет грустный тромбон, и он
//      вслух издевается. Вы победили: золотые лучи, соперник дважды кланяется, на него опускается лавровый венок,
//      падают лепестки роз, звучат фанфары, и он вслух хвалит вас. Касание закрывает сцену; через FINALE_TIME она
//      уходит сама, а собственный итог игры остаётся. «Уменьшить движение» оставляет всё неподвижным.
import React, { useEffect, useRef, useState } from 'react';
import { withBase } from '@shell/utils/withBase';
import { characterFacts, portraitFocus, portraitPath, type CharacterId } from '../characters/roster.ts';
import { loadCharacterTexts } from '../characters/texts/index.ts';
import { directionOf } from '../i18n/languages.ts';
import { useLanguage } from '../i18n/useLanguage.ts';
import { FINALE_TIME, FINALE_WORDS, pickLine, type Outcome } from './logic.ts';
import { hush, playFinale, speakLine } from './sound.ts';
import styles from './Finale.module.css';

interface FinaleProps {
    /** [EN] null while the game goes on; 'win' or 'lose' once it ends for you. [RU] null, пока игра идёт; 'win' или 'lose', когда она для вас закончилась. */
    readonly outcome: Outcome | null;
    /** [EN] Who speaks: the opponent who beat you or whom you beat. [RU] Кто говорит: соперник, который вас обыграл или которого обыграли вы. */
    readonly hero: CharacterId | null;
}

const css = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

/** [EN] Rose petals: places and paces fixed per index, so the render stays pure. [RU] Лепестки роз: места и темпы по номеру, чтобы отрисовка оставалась чистой. */
const PETALS = Array.from({ length: 16 }, (_, index) => ({
    x: `${(index * 37 + 11) % 100}vw`,
    delay: `${((index * 53) % 30) / 10}s`,
    time: `${4 + ((index * 29) % 30) / 10}s`,
    turn: `${index % 2 === 0 ? 1 : -1}`,
}));

export const Finale: React.FC<FinaleProps> = ({ outcome, hero }) => {
    const [language] = useLanguage();
    const [shown, setShown] = useState<{ readonly outcome: Outcome; readonly line: string; readonly serial: number } | null>(null);
    const [name, setName] = useState('');
    const previous = useRef<Outcome | null>(null);
    const lastLine = useRef<string | null>(null);
    const serial = useRef(0);

    // [EN] The scene starts once per end of a game: when the outcome turns from nothing into something.
    // [RU] Сцена начинается один раз на конец партии: когда исход из «ничего» становится чем-то.
    useEffect(() => {
        if (outcome && previous.current !== outcome) {
            const line = pickLine(outcome, language, Math.random, lastLine.current);
            lastLine.current = line;
            serial.current += 1;
            setShown({ outcome, line, serial: serial.current });
            playFinale(outcome);
            const female = hero ? characterFacts(hero).female : false;
            const voice = window.setTimeout(() => speakLine(line, language, outcome, female), outcome === 'lose' ? 1700 : 1500);
            previous.current = outcome;
            return () => window.clearTimeout(voice);
        }
        if (!outcome) {
            previous.current = null;
            setShown(null);
        }
        return undefined;
    }, [outcome, hero, language]);

    useEffect(() => {
        if (!shown) return undefined;
        const timer = window.setTimeout(() => setShown(null), FINALE_TIME);
        return () => window.clearTimeout(timer);
    }, [shown]);

    useEffect(() => () => hush(), []);

    useEffect(() => {
        let alive = true;
        if (hero) void loadCharacterTexts(language).then(texts => { if (alive) setName(texts[hero].name); });
        return () => { alive = false; };
    }, [hero, language]);

    if (!shown) return null;
    const words = FINALE_WORDS[language];
    const lose = shown.outcome === 'lose';
    const close = () => { hush(); setShown(null); };
    return (
        <div key={shown.serial} className={`${styles.layer} ${lose ? styles.lose : styles.win}`} role="status" aria-live="polite"
            dir={directionOf(language)} lang={language} onClick={close}>
            {lose ? <i className={styles.vignette} /> : <i className={styles.rays} />}
            {!lose && PETALS.map((petal, index) => (
                <i key={index} className={styles.petal} style={css({ '--x': petal.x, '--delay': petal.delay, '--time': petal.time, '--turn': petal.turn })} />
            ))}
            <div className={styles.stage}>
                <p className={styles.title}>{words.title[shown.outcome]}</p>
                <div className={styles.hero}>
                    {!lose && (
                        <svg className={styles.wreath} viewBox="0 0 120 70" aria-hidden="true">
                            {Array.from({ length: 7 }, (_, index) => {
                                const angle = 200 + index * 18;
                                const x = 60 + 50 * Math.cos((angle * Math.PI) / 180);
                                const y = 60 + 50 * Math.sin((angle * Math.PI) / 180);
                                return (
                                    <g key={index}>
                                        <ellipse cx={x} cy={y} rx="9" ry="4" transform={`rotate(${angle + 60} ${x} ${y})`} fill="#c9a227" stroke="#5c4708" strokeWidth="0.8" />
                                        <ellipse cx={120 - x} cy={y} rx="9" ry="4" transform={`rotate(${120 - angle} ${120 - x} ${y})`} fill="#e0b93a" stroke="#5c4708" strokeWidth="0.8" />
                                    </g>
                                );
                            })}
                            <circle cx="60" cy="62" r="5" fill="#8e0f1c" stroke="#3a0408" />
                        </svg>
                    )}
                    {hero && (
                        <span className={styles.portrait}>
                            <img src={withBase(portraitPath(hero))} alt="" draggable={false} style={portraitFocus(hero)} />
                        </span>
                    )}
                    {lose && Array.from({ length: 7 }, (_, index) => (
                        <b key={index} className={styles.ha} style={css({ '--i': index, '--side': index % 2 === 0 ? -1 : 1 })} aria-hidden="true">{words.laugh}</b>
                    ))}
                </div>
                <p className={styles.bubble}>
                    {name && <b className={styles.name}>{name}</b>}
                    <span>{shown.line}</span>
                </p>
            </div>
            {lose && (
                <>
                    <span className={styles.tomato} aria-hidden="true">
                        <svg viewBox="0 0 40 40">
                            <circle cx="20" cy="22" r="16" fill="#d42a1e" />
                            <ellipse cx="14" cy="16" rx="5" ry="3" fill="#ff7a5c" opacity="0.7" />
                            <path d="M20 7l-5 4 5-1 1 4 2-4 5 1-4-4z" fill="#2f7d2a" />
                        </svg>
                    </span>
                    <span className={styles.splat} aria-hidden="true">
                        <svg viewBox="0 0 200 220">
                            <path fill="#b3160d" d="M100 20c14 0 18 20 30 18s22-14 30-4-6 22 4 30 30 4 30 18-22 14-22 26 18 24 8 34-28-2-38 8-6 30-24 32-20-22-34-24-26 16-38 8 4-28-6-38-34 0-36-14 22-18 22-30-22-22-14-34 30 4 36-8 0-30 12-36 14 8 20 2z" />
                            <ellipse cx="80" cy="90" rx="22" ry="14" fill="#e8442f" opacity="0.6" />
                            <circle cx="120" cy="130" r="5" fill="#f2c94c" opacity="0.8" />
                            <circle cx="90" cy="120" r="4" fill="#f2c94c" opacity="0.8" />
                            <circle cx="110" cy="100" r="3.5" fill="#f2c94c" opacity="0.8" />
                        </svg>
                        <i className={styles.drip} style={css({ '--left': '30%', '--delay': '3.1s', '--long': '22vh' })} />
                        <i className={styles.drip} style={css({ '--left': '52%', '--delay': '3.4s', '--long': '34vh' })} />
                        <i className={styles.drip} style={css({ '--left': '68%', '--delay': '3.2s', '--long': '16vh' })} />
                    </span>
                </>
            )}
            <button type="button" className={styles.close} onClick={close} aria-label={words.close}>×</button>
        </div>
    );
};

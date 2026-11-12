// [EN] FILE: shared/finale/Finale.tsx — the scene at the end of a game, the same in every game of the hub.
//      You lost — the grown-up mockery Alexey asked for (12.11.2026): the lights go out, a cold spotlight falls on you,
//      the winner looms above and looks down on you, a slow sarcastic applause rings through the crypt (the frame
//      flashes at every clap), a coin is tossed to you as alms and lies at your feet, and then the cold words aloud.
//      You won — honour: golden rays, the opponent bows twice, a laurel wreath comes down onto him, rose petals fall,
//      a fanfare plays and he praises you aloud.
//      A tap closes the scene; after FINALE_TIME it leaves by itself and the game's own result stays. «Reduce motion»
//      keeps everything still.
// [RU] ФАЙЛ: сцена конца партии, одинаковая во всех играх хаба.
//      Вы проиграли — взрослая издёвка, о которой просил Алексей (12.11.2026): гаснет свет, на вас падает холодный луч
//      прожектора, победитель нависает сверху и смотрит на вас свысока, по склепу разносятся медленные саркастические
//      аплодисменты (рамка вспыхивает на каждом хлопке), вам бросают монету-подачку, она ложится у ваших ног, и потом
//      — холодные слова вслух.
//      Вы победили — почёт: золотые лучи, соперник дважды кланяется, на него опускается лавровый венок, падают
//      лепестки роз, звучат фанфары, и он вслух хвалит вас.
//      Касание закрывает сцену; через FINALE_TIME она уходит сама, а собственный итог игры остаётся. «Уменьшить
//      движение» оставляет всё неподвижным.
import React, { useEffect, useRef, useState } from 'react';
import { withBase } from '@shell/utils/withBase';
import { characterFacts, portraitFocus, portraitPath, type CharacterId } from '../characters/roster.ts';
import { loadCharacterTexts } from '../characters/texts';
import { directionOf } from '../i18n/languages.ts';
import { useLanguage } from '../i18n/useLanguage.ts';
import {
    AWARD_WORDS, FINALE_EVENT, FINALE_TIME, FINALE_WORDS, STREAK_KEY, VOICE_AT, awardFor, nextStreak, pickLine, pickScene, speechOf,
    type AwardId, type MockScene, type Outcome,
} from './logic.ts';
import { hush, playFinale, speakLine } from './sound.ts';
import styles from './Finale.module.css';

interface FinaleProps {
    /** [EN] The game, for its own losing streak. [RU] Игра — для её собственной серии проигрышей. */
    readonly game: string;
    /** [EN] null while the game goes on; 'win' or 'lose' once it ends for you. [RU] null, пока игра идёт; 'win' или 'lose', когда она для вас закончилась. */
    readonly outcome: Outcome | null;
    /** [EN] Who speaks: the opponent who beat you or whom you beat. [RU] Кто говорит: соперник, который вас обыграл или которого обыграли вы. */
    readonly hero: CharacterId | null;
}

/** [EN] The losing streak of a game, kept in the browser. [RU] Серия проигрышей игры, хранится в браузере. */
function advanceStreak(game: string, outcome: Outcome): number {
    try {
        const streak = nextStreak(Number(globalThis.localStorage?.getItem(STREAK_KEY + game)) || 0, outcome);
        globalThis.localStorage?.setItem(STREAK_KEY + game, String(streak));
        return streak;
    } catch {
        return outcome === 'lose' ? 1 : 0;
    }
}

const css = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

/** [EN] Rose petals: places and paces fixed per index, so the render stays pure. [RU] Лепестки роз: места и темпы по номеру, чтобы отрисовка оставалась чистой. */
const PETALS = Array.from({ length: 16 }, (_, index) => ({
    x: `${(index * 37 + 11) % 100}vw`,
    delay: `${((index * 53) % 30) / 10}s`,
    time: `${4 + ((index * 29) % 30) / 10}s`,
    turn: `${index % 2 === 0 ? 1 : -1}`,
}));

/** [EN] The bursts of the salute for the «Clinical Idiot», in time with sound.ts. [RU] Разрывы салюта для «Клинического идиота», в такт sound.ts. */
const FIREWORKS = [
    { x: '22vw', y: '24vh', delay: '2.55s' },
    { x: '76vw', y: '20vh', delay: '3.15s' },
    { x: '48vw', y: '12vh', delay: '3.85s' },
    { x: '14vw', y: '52vh', delay: '4.45s' },
    { x: '84vw', y: '48vh', delay: '5.15s' },
];

/** [EN] The moments of the six claps, s (the same as in sound.ts). [RU] Моменты шести хлопков, с (те же, что в sound.ts). */
const CLAPS = [0.8, 1.45, 2.1, 2.75, 3.55, 4.45];

export const Finale: React.FC<FinaleProps> = ({ game, outcome, hero }) => {
    const [language] = useLanguage();
    const [shown, setShown] = useState<{ readonly outcome: Outcome; readonly scene: MockScene; readonly award: AwardId | null; readonly line: string; readonly serial: number } | null>(null);
    const [name, setName] = useState('');
    const previous = useRef<Outcome | null>(null);
    const lastLine = useRef<string | null>(null);
    const lastScene = useRef<MockScene | null>(null);
    const serial = useRef(0);

    // [EN] The scene starts once per end of a game: when the outcome turns from nothing into something.
    // [RU] Сцена начинается один раз на конец партии: когда исход из «ничего» становится чем-то.
    useEffect(() => {
        if (outcome && previous.current !== outcome) {
            // [EN] a scene of mockery, never the same twice running / [RU] сцена издёвки, никогда одна и та же дважды подряд
            const scene = outcome === 'lose' ? pickScene(Math.random, lastScene.current) : 'alms';
            if (outcome === 'lose') lastScene.current = scene;
            // [EN] three, five, ten defeats in a row are crowned instead / [RU] три, пять, десять поражений подряд вместо этого награждаются
            const streak = advanceStreak(game, outcome);
            const award = outcome === 'lose' ? awardFor(streak) : null;
            const line = award ? AWARD_WORDS[language][award].lines[0] : pickLine(speechOf(language, outcome, scene), Math.random, lastLine.current);
            lastLine.current = line;
            serial.current += 1;
            setShown({ outcome, scene, award, line, serial: serial.current });
            playFinale(outcome, award === 'clinical' ? 'clinical' : award ? 'award' : scene);
            const female = hero ? characterFacts(hero).female : false;
            const voice = window.setTimeout(() => speakLine(line, language, outcome, female), VOICE_AT[outcome === 'win' ? 'honour' : award ? 'award' : scene]);
            previous.current = outcome;
            return () => window.clearTimeout(voice);
        }
        if (!outcome) {
            previous.current = null;
            setShown(null);
        }
        return undefined;
    }, [outcome, hero, language, game]);

    useEffect(() => {
        if (!shown) return undefined;
        const timer = window.setTimeout(() => setShown(null), FINALE_TIME);
        return () => window.clearTimeout(timer);
    }, [shown]);

    useEffect(() => () => hush(), []);

    // [EN] Any scene on demand, for a look without losing ten times: window.dispatchEvent(new CustomEvent(FINALE_EVENT,
    //      { detail: { outcome: 'lose', scene: 'condolences' } })) or { outcome: 'lose', award: 'clinical' }.
    // [RU] Любая сцена по запросу — посмотреть, не проигрывая десять раз: событие FINALE_EVENT с { outcome, scene } или
    //      { outcome: 'lose', award: 'clinical' }.
    useEffect(() => {
        const onDemand = (event: Event) => {
            const detail = (event as CustomEvent<{ outcome?: Outcome; scene?: MockScene; award?: AwardId }>).detail ?? {};
            const wanted: Outcome = detail.outcome === 'win' ? 'win' : 'lose';
            const scene = detail.scene ?? pickScene(Math.random, lastScene.current);
            const award = wanted === 'lose' ? detail.award ?? null : null;
            const line = award ? AWARD_WORDS[language][award].lines[0] : pickLine(speechOf(language, wanted, scene), Math.random, lastLine.current);
            lastLine.current = line;
            serial.current += 1;
            setShown({ outcome: wanted, scene, award, line, serial: serial.current });
            playFinale(wanted, award === 'clinical' ? 'clinical' : award ? 'award' : wanted === 'win' ? 'alms' : scene);
            const female = hero ? characterFacts(hero).female : false;
            window.setTimeout(() => speakLine(line, language, wanted, female), VOICE_AT[wanted === 'win' ? 'honour' : award ? 'award' : scene]);
        };
        window.addEventListener(FINALE_EVENT, onDemand);
        return () => window.removeEventListener(FINALE_EVENT, onDemand);
    }, [hero, language]);

    useEffect(() => {
        let alive = true;
        if (hero) void loadCharacterTexts(language).then(texts => { if (alive) setName(texts[hero].name); });
        return () => { alive = false; };
    }, [hero, language]);

    if (!shown) return null;
    const words = FINALE_WORDS[language];
    const lose = shown.outcome === 'lose';
    const award = lose ? shown.award : null;
    const scene = lose ? (award ? 'award' : shown.scene) : null;
    const speech = award ? AWARD_WORDS[language][award] : speechOf(language, shown.outcome, shown.scene);
    const close = () => { hush(); setShown(null); };
    return (
        <div key={shown.serial} className={`${styles.layer} ${lose ? styles.lose : styles.win} ${scene ? styles[scene] : ''}`} role="status" aria-live="polite"
            dir={directionOf(language)} lang={language} onClick={close}>
            {(scene === 'alms' || scene === 'award') && <i className={styles.spotlight} />}
            {!lose && <i className={styles.rays} />}
            {!lose && PETALS.map((petal, index) => (
                <i key={index} className={styles.petal} style={css({ '--x': petal.x, '--delay': petal.delay, '--time': petal.time, '--turn': petal.turn })} />
            ))}
            <div className={styles.stage}>
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
                            {(scene === 'alms' || scene === 'award') && CLAPS.map(at => <i key={at} className={styles.clap} style={css({ '--delay': `${at}s` })} />)}
                        </span>
                    )}
                    {scene === 'condolences' && (
                        // [EN] the smallest violin in the world, played with false grief / [RU] самая маленькая скрипка в мире, с притворной скорбью
                        <svg className={styles.violin} viewBox="0 0 60 60" aria-hidden="true">
                            <g transform="rotate(-35 30 30)">
                                <path d="M30 14c-6 0-8 5-6 9-4 2-5 6-3 10-3 3-3 9 3 12 2 1 4 1 6 1s4 0 6-1c6-3 6-9 3-12 2-4 1-8-3-10 2-4 0-9-6-9z"
                                    fill="#7a3b12" stroke="#2b1204" strokeWidth="1.2" />
                                <rect x="28.8" y="2" width="2.4" height="14" fill="#1c0e05" />
                                <path d="M27 30q3 3 6 0M27 37q3-3 6 0" stroke="#1c0e05" strokeWidth="1" fill="none" />
                            </g>
                            <line className={styles.bow} x1="8" y1="44" x2="54" y2="24" stroke="#d9c9a8" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                    )}
                </div>
                <p className={styles.title}>{speech.title}</p>
                <p className={styles.bubble}>
                    {name && <b className={styles.name}>{name}</b>}
                    <span>{shown.line}</span>
                </p>
            </div>
            {scene === 'alms' && (
                // [EN] alms for the loser: a coin falls into the spotlight at your feet / [RU] подачка проигравшему: монета падает в луч у ваших ног
                <span className={styles.coin} aria-hidden="true">
                    <svg viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="18" fill="#c9a227" stroke="#6b5310" strokeWidth="2" />
                        <circle cx="20" cy="20" r="13" fill="none" stroke="#f3d77a" strokeWidth="1.5" />
                        <path d="M14 22c3-6 9-6 12 0-3-1-4 3-6 3s-3-4-6-3z" fill="#6b5310" />
                    </svg>
                </span>
            )}
            {award && (
                // [EN] the award comes down into the spotlight with its plaque / [RU] награда спускается в луч вместе с табличкой
                <span className={`${styles.prize} ${styles[award]}`} aria-hidden="true">
                    {award === 'decade' ? (
                        <svg viewBox="0 0 80 100">
                            <path d="M18 8h44v18c0 18-10 30-22 30S18 44 18 26z" fill="#d9b13b" stroke="#6b5310" strokeWidth="2.5" />
                            <path d="M18 14H6c0 14 6 22 14 22M62 14h12c0 14-6 22-14 22" fill="none" stroke="#d9b13b" strokeWidth="5" />
                            <rect x="34" y="56" width="12" height="16" fill="#b48d22" />
                            <rect x="20" y="72" width="40" height="14" rx="2" fill="#3b2a12" stroke="#6b5310" strokeWidth="2" />
                            <path d="M30 22c4-4 16-4 20 0" stroke="#f6e09a" strokeWidth="2.5" fill="none" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 60 120">
                            <path d="M22 0h16l-4 66h-8z" fill={award === 'clinical' ? '#5b3a1a' : '#8e0f1c'} />
                            <path d="M26 0h8l-2 66h-4z" fill={award === 'clinical' ? '#7a5228' : '#c22b3a'} />
                            <circle cx="30" cy="90" r={award === 'year' ? 22 : 26} fill={award === 'clinical' ? '#8a5a2b' : '#d9b13b'} stroke="#5a3a10" strokeWidth="3" />
                            <circle cx="30" cy="90" r={award === 'year' ? 16 : 19} fill="none" stroke="#f6e09a" strokeWidth="1.5" />
                            {award === 'clinical' ? (
                                // [EN] a brain in the medal, for the clinical case / [RU] мозг в медали — для клинического случая
                                <path d="M20 92c-4-2-3-9 2-9 0-5 7-6 9-2 3-4 10-2 9 3 5 1 5 8 0 9 1 4-5 7-8 4-2 3-8 3-9-1-3 1-5-2-3-4z" fill="#e9a3b1" stroke="#6b2f3a" strokeWidth="1.2" />
                            ) : (
                                <path d="M30 77l4 8.5 9.3.9-7 6.2 2 9.1L30 97l-8.3 4.7 2-9.1-7-6.2 9.3-.9z" fill="#f6e09a" />
                            )}
                        </svg>
                    )}
                    <b className={styles.plaque}>{speech.title}</b>
                </span>
            )}
            {award === 'clinical' && FIREWORKS.map((burst, index) => (
                // [EN] a salute of dung: brown bursts over the crypt / [RU] салют из говна: коричневые разрывы над склепом
                <span key={index} className={styles.burst} style={css({ '--x': burst.x, '--y': burst.y, '--delay': burst.delay })} aria-hidden="true">
                    {Array.from({ length: 10 }, (_, piece) => (
                        <i key={piece} className={styles.dung} style={css({ '--angle': `${piece * 36}deg` })} />
                    ))}
                </span>
            ))}
            {scene === 'condolences' && (
                // [EN] your own portrait in a mourning frame, a black ribbon across its corner, a candle beside it
                // [RU] ваш собственный портрет в траурной рамке, чёрная лента через угол, рядом свеча
                <span className={styles.mourning} aria-hidden="true">
                    <svg viewBox="0 0 120 120">
                        <rect x="14" y="6" width="80" height="100" rx="6" fill="#16131a" stroke="#4b4652" strokeWidth="5" />
                        <ellipse cx="54" cy="42" rx="16" ry="19" fill="#2b2731" />
                        <path d="M26 104c2-22 14-34 28-34s26 12 28 34z" fill="#2b2731" />
                        <path d="M70 6h24v24z" fill="#050406" />
                        <path d="M64 6l30 30" stroke="#050406" strokeWidth="7" />
                        <rect x="100" y="76" width="9" height="30" rx="2" fill="#e8e0cc" />
                        <path className={styles.candle} d="M104.5 60c-4 6-4 10 0 14 4-4 4-8 0-14z" fill="#ffc35a" />
                    </svg>
                </span>
            )}
            {scene === 'medal' && (
                // [EN] a tin medal «for taking part» comes down on a faded ribbon to your place
                // [RU] жестяная медаль «за участие» спускается на выцветшей ленте к вашему месту
                <span className={styles.tinMedal} aria-hidden="true">
                    <svg viewBox="0 0 60 120">
                        <path d="M22 0h16l-4 70h-8z" fill="#7d8ba3" />
                        <path d="M26 0h8l-2 70h-4z" fill="#a9b4c6" />
                        <circle cx="30" cy="92" r="22" fill="#9a9d9f" stroke="#5b5e61" strokeWidth="3" />
                        <circle cx="30" cy="92" r="15" fill="none" stroke="#c4c7c9" strokeWidth="1.5" strokeDasharray="3 2" />
                        <path d="M30 80l3.5 7.5 8 .8-6 5.4 1.8 8-7.3-4.2-7.3 4.2 1.8-8-6-5.4 8-.8z" fill="#c4c7c9" />
                        <path d="M14 84q4 3 2 7" stroke="#5b5e61" strokeWidth="1.5" fill="none" />
                    </svg>
                </span>
            )}
            <button type="button" className={styles.close} onClick={close} aria-label={words.close}>×</button>
        </div>
    );
};

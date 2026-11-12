// [EN] FILE: shared/surprises/Surprises.tsx — the layer of «surprises» over a game: keeps a timer, plays one surprise
//      at a time and removes it when it is over. The first comes after 15–30 s, the next 35–80 s after the previous;
//      the schedule never cuts a surprise short. The layer never catches a click. No surprises when the player switched
//      them off (the 🦇 button in the header of the hub), when the system asks for less motion or the tab is hidden;
//      while the player types, the surprise waits. A game places it once: <Surprises set="preferans" />. Every
//      choreography has its own markup here and its own keyframes in Surprises.module.css.
// [RU] ФАЙЛ: слой «неожиданностей» над игрой: держит таймер, играет одну неожиданность за раз и убирает её по
//      окончании. Первая — через 15–30 с, следующие — через 35–80 с после предыдущей; расписание никогда не обрывает
//      неожиданность. Слой никогда не ловит нажатия. Неожиданностей нет, если игрок их выключил (кнопка 🦇 в шапке
//      хаба), система просит меньше движения или вкладка скрыта; пока игрок печатает, неожиданность ждёт. Игра ставит
//      слой один раз: <Surprises set="preferans" />. У каждой хореографии здесь своя разметка, а в
//      Surprises.module.css — свои ключевые кадры.
import React, { useEffect, useRef, useState } from 'react';
import { withBase } from '@shell/utils/withBase';
import { ART } from './creatures';
import { RigFigure } from './Rig';
import { RIGS } from './rigs';
import {
    buildSurprise, isSprite, nextDelay, pickSurprise, SURPRISE_EVENT, SURPRISE_SETS, SURPRISES_EVENT, SURPRISES_KEY, surprisesEnabled,
    type Actor, type Creature, type Surprise, type SurpriseSetId,
} from './logic';
import styles from './Surprises.module.css';

const RETRY_MS = 6000; // [EN] the player types or the tab is hidden — look again later / [RU] игрок печатает или вкладка скрыта — заглянем позже

/** [EN] The stored setting, safe without storage. [RU] Сохранённая настройка; безопасно и без хранилища. */
function readSetting(): boolean {
    try {
        return surprisesEnabled(globalThis.localStorage?.getItem(SURPRISES_KEY) ?? null);
    } catch {
        return true;
    }
}

/** [EN] Is the player typing right now? [RU] Игрок сейчас печатает? */
function isTyping(): boolean {
    const element = document.activeElement;
    return Boolean(element && ((element as HTMLElement).isContentEditable
        || element.matches('textarea, input:not([type="radio"]):not([type="checkbox"]):not([type="button"]):not([type="range"])')));
}

/** [EN] Follows the setting (the header button) and the system wish for less motion. [RU] Следит за настройкой и просьбой системы о меньшем движении. */
function useAllowed(): boolean {
    const [enabled, setEnabled] = useState(true);
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = (): void => {
            setEnabled(readSetting());
            setReduced(motion.matches);
        };
        update();
        const onStorage = (event: StorageEvent): void => { if (event.key === SURPRISES_KEY) update(); };
        window.addEventListener(SURPRISES_EVENT, update);
        window.addEventListener('storage', onStorage);
        motion.addEventListener('change', update);
        return () => {
            window.removeEventListener(SURPRISES_EVENT, update);
            window.removeEventListener('storage', onStorage);
            motion.removeEventListener('change', update);
        };
    }, []);
    return enabled && !reduced;
}

const css = (style: Readonly<Record<string, string>>, extra?: React.CSSProperties): React.CSSProperties =>
    ({ ...style, ...extra }) as React.CSSProperties;

/** [EN] A creature: a photograph or a drawing, mirrored when asked. [RU] Существо: фотография или рисунок, зеркально по просьбе. */
const Figure: React.FC<{ creature: Creature; size: number; flip?: boolean; className?: string }> = ({ creature, size, flip = false, className = '' }) => {
    const mirror = flip ? styles.flip : styles.facing;
    if (isSprite(creature)) {
        const href = withBase(`shared/surprises/${creature}.webp`);
        // [EN] A rigged photograph moves its head, tail, fingers and lids; the rest is a plain picture.
        // [RU] Оснащённая фотография двигает головой, хвостом, пальцами и веками; остальные — простая картинка.
        const rig = RIGS[creature];
        return (
            <span className={`${mirror} ${className}`}>
                {rig
                    ? <RigFigure href={href} rig={rig} size={size} />
                    : <img className={styles.sprite} src={href} width={size} alt="" draggable={false} decoding="async" />}
            </span>
        );
    }
    const Art = ART[creature];
    return <span className={`${mirror} ${className}`}><Art size={size} /></span>;
};

/** [EN] One actor of a surprise, wrapped in its choreography. [RU] Одна фигура неожиданности, обёрнутая в свою хореографию. */
const ActorView: React.FC<{ surprise: Surprise; actor: Actor }> = ({ surprise, actor }) => {
    const style = css(actor.style);
    const creature = surprise.creature;
    const figure = creature ? <Figure creature={creature} size={actor.size} flip={actor.flip} /> : null;
    switch (surprise.motion) {
        // ---------------- [EN] chess / [RU] шахматы ----------------
        case 'fly':
        case 'swarm':
            return (
                <span className={styles.across} style={style}>
                    <span className={styles.swoop}><span className={styles.flutter}>{figure}</span></span>
                </span>
            );
        case 'peek':
            return <span className={`${styles.peeker} ${actor.flip ? styles.peekRight : ''}`} style={style}>{figure}</span>;
        case 'drift':
            return <span className={styles.drifter} style={style}><span className={styles.turn}>{figure}</span></span>;

        // ---------------- [EN] sea battle / [RU] морской бой ----------------
        case 'glideGull':
            return <span className={styles.gullPath} style={style}><span className={styles.bank}>{figure}</span></span>;
        case 'flock':
            return (
                <span className={styles.across} style={style}>
                    <span className={styles.swoop}><span className={styles.bank}>{figure}</span></span>
                </span>
            );
        case 'cut':
            return <span className={styles.cutter} style={style}><span className={styles.finTurn}>{figure}</span></span>;
        case 'rise':
            return <span className={styles.riser} style={style}>{figure}</span>;
        case 'bob':
            return <span className={styles.bobber} style={style}><span className={styles.rock}>{figure}</span></span>;
        case 'sonar':
            return (
                <span className={styles.sonar} style={css(actor.style, { width: actor.size, height: actor.size })}>
                    <i className={styles.ping} /><i className={`${styles.ping} ${styles.pingLate}`} /><i className={`${styles.ping} ${styles.pingLast}`} />
                    <b className={styles.blip} />
                </span>
            );

        // ---------------- [EN] preferans / [RU] преферанс ----------------
        case 'hop':
            return <span className={styles.hopPath} style={style}><span className={styles.hopBody}>{figure}</span></span>;
        case 'reach':
            return (
                <span className={`${styles.reach} ${actor.flip ? styles.reachRight : styles.reachLeft}`} style={style}>
                    <span className={styles.tremble}>{figure}</span>
                </span>
            );
        case 'curl':
            return <span className={styles.curl} style={style}>{figure}</span>;
        case 'orbit':
            return (
                <span className={styles.orbit} style={style}>
                    <span className={styles.orbitArm}>
                        <span className={styles.orbitBody}>{figure}</span>
                    </span>
                    <i className={styles.flare} />
                    <i className={styles.ash} /><i className={`${styles.ash} ${styles.ashLate}`} /><i className={`${styles.ash} ${styles.ashLast}`} />
                </span>
            );
        case 'trickle':
            return (
                <span className={styles.trickle} style={style}>
                    <i className={styles.trail} />
                    <span className={styles.drop}>{figure}</span>
                </span>
            );

        // ---------------- [EN] poker / [RU] покер ----------------
        case 'prowl': {
            // [EN] The sitting cat stands where the walking one stopped, centred under it. [RU] Сидящий кот — там, где остановился идущий, по центру.
            const sit = Number.parseFloat(actor.style['--sit'] ?? '') || Math.round(actor.size * 0.7);
            return (
                <span className={styles.prowlPath} style={style}>
                    <Figure creature="cat-walk" size={actor.size} flip={actor.flip} className={styles.catIn} />
                    <span className={styles.catSit} style={{ left: Math.round((actor.size - sit) / 2) }}><Figure creature="cat-yawn" size={sit} /></span>
                    <Figure creature="cat-walk" size={actor.size} flip={!actor.flip} className={styles.catOut} />
                </span>
            );
        }
        case 'scurry':
            return <span className={styles.scurry} style={style}><span className={styles.scuttle}>{figure}</span></span>;
        case 'throw':
            return <span className={styles.thrown} style={style}>{figure}</span>;
        case 'roll':
            return (
                <span className={styles.rollPath} style={style}>
                    <span className={styles.rollFall}><span className={styles.rollSpin}>{figure}</span></span>
                </span>
            );
        case 'tumble':
            return <span className={styles.tumble} style={style}>{figure}</span>;
        case 'ring':
            return <span className={styles.ring} style={style}>{figure}</span>;

        // ---------------- [EN] checkers / [RU] шашки ----------------
        case 'wriggle':
            return <span className={styles.worm} style={style}><span className={styles.writhe}>{figure}</span></span>;
        case 'rollStop':
            return <span className={styles.skullPath} style={style}><span className={styles.skullSpin}>{figure}</span></span>;
        case 'swing':
            return (
                <span className={styles.swing} style={style}>
                    <span className={styles.pendulum}>
                        <i className={styles.chain} />
                        <i className={styles.halo} />
                        {figure}
                    </span>
                </span>
            );
        case 'flash':
            return (
                <>
                    {/* [EN] the same clock as the figure, or the second flash misses it / [RU] те же часы, что у фигуры, иначе вторая вспышка её пропустит */}
                    <i className={styles.lightning} style={style} />
                    <span className={`${styles.apparition} ${styles.apparitionFirst}`} style={style}>
                        {creature && <Figure creature={creature} size={actor.size} />}
                    </span>
                    <span className={`${styles.apparition} ${styles.apparitionSecond}`} style={style}>
                        {creature && <Figure creature={creature} size={actor.size * 1.5} />}
                    </span>
                </>
            );
        case 'glide':
            return <span className={styles.glider} style={css(actor.style, { fontSize: actor.size })}><i /><i /></span>;
    }
};

export const Surprises: React.FC<{ set: SurpriseSetId }> = ({ set }) => {
    const allowed = useAllowed();
    const [shown, setShown] = useState<{ serial: number; surprise: Surprise } | null>(null);
    const serial = useRef(0);
    // [EN] Until when the stage is busy: the schedule never cuts a surprise short. [RU] До какого времени сцена занята: расписание не обрывает неожиданность.
    const busyUntil = useRef(0);

    // [EN] Builds and shows one surprise; returns it. [RU] Строит и показывает одну неожиданность; возвращает её.
    const launch = useRef((id: string | null, previous: string | null): Surprise => {
        const kind = SURPRISE_SETS[set].find(item => item.id === id) ?? pickSurprise(set, Math.random, previous);
        const surprise = buildSurprise(kind, Math.random, { width: window.innerWidth, height: window.innerHeight });
        serial.current += 1;
        busyUntil.current = Date.now() + surprise.duration + 200;
        setShown({ serial: serial.current, surprise });
        return surprise;
    });

    // [EN] The schedule, only while allowed. [RU] Расписание — только пока разрешено.
    useEffect(() => {
        if (!allowed) return undefined;
        let timer = 0;
        let previous: string | null = null;
        const fire = (): void => {
            if (document.hidden || isTyping()) {
                timer = window.setTimeout(fire, RETRY_MS);
                return;
            }
            const busy = busyUntil.current - Date.now();
            if (busy > 0) {
                timer = window.setTimeout(fire, busy + 2000);
                return;
            }
            const surprise = launch.current(null, previous);
            previous = surprise.id;
            timer = window.setTimeout(fire, surprise.duration + nextDelay(Math.random));
        };
        timer = window.setTimeout(fire, nextDelay(Math.random, true));
        return () => window.clearTimeout(timer);
    }, [allowed]);

    // [EN] By hand: the event with detail.id (any kind of this set). [RU] Вручную: событие с detail.id (любой вид этого набора).
    useEffect(() => {
        if (!allowed) return undefined;
        const onCall = (event: Event): void => {
            const id = (event as CustomEvent<{ id?: string }>).detail?.id ?? null;
            launch.current(id, null);
        };
        window.addEventListener(SURPRISE_EVENT, onCall);
        return () => window.removeEventListener(SURPRISE_EVENT, onCall);
    }, [allowed]);

    // [EN] Played out — off the stage. [RU] Отыграла — убираем со сцены.
    useEffect(() => {
        if (!shown) return undefined;
        const timer = window.setTimeout(() => setShown(null), shown.surprise.duration + 200);
        return () => window.clearTimeout(timer);
    }, [shown]);

    if (!shown || !allowed) return null;
    return (
        <div className={`${styles.layer} ${styles[set]}`} aria-hidden="true" data-surprise={shown.surprise.id}>
            {/* [EN] key: a new surprise — new elements, the animations start from the beginning. [RU] key: новая неожиданность — новые элементы, анимации с начала. */}
            <React.Fragment key={shown.serial}>
                {shown.surprise.actors.map(actor => <ActorView key={actor.key} surprise={shown.surprise} actor={actor} />)}
            </React.Fragment>
        </div>
    );
};

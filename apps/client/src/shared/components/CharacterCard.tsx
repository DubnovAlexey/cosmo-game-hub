// [EN] FILE: shared/components/CharacterCard.tsx — a hero of the lair on the screen, the same in every game of the hub
//      (the company is shared: shared/characters). Three pieces:
//        • CharacterCard — the hero's card: the picture whole and large, the name, «dweller» or «guest», the biography,
//          what the hero is like in this game (a line, a table of manners), a button to close it;
//        • CharacterFace — a small picture in the frame the game gives it: under the mouse the whole picture grows
//          two and a half times out of it and goes back when the mouse leaves; a press opens the card under it,
//          Escape or a press anywhere else closes it (so two cards never lie on each other);
//        • CharacterPeek — the card floating beside a small portrait in a list (choosing opponents): it appears while
//          the mouse or the keyboard is on the portrait, or after a finger's tap, and always stands whole on the
//          screen.
//      The texts come from the caller (each game loads its language), so this file knows no language.
// [RU] ФАЙЛ: герой логова на экране, одинаковый в любой игре хаба (компания общая: shared/characters). Три детали:
//        • CharacterCard — карточка героя: картинка целиком и крупно, имя, «обитатель» или «гость», биография, каков
//          герой в этой игре (реплика, таблица манер), кнопка «закрыть»;
//        • CharacterFace — маленькая картинка в рамке, которую даёт игра: под мышью из неё вырастает вся картинка в
//          два с половиной раза и уходит обратно, когда мышь убрали; нажатие раскрывает под ней карточку, Escape или
//          нажатие где угодно ещё закрывает её (так две карточки никогда не лежат друг на друге);
//        • CharacterPeek — карточка, всплывающая рядом с маленьким портретом в списке (выбор соперников): появляется,
//          пока на портрете мышь или клавиатура, или после касания пальцем, и всегда стоит на экране целиком.
//      Тексты приходят от вызывающего (каждая игра загружает свой язык), поэтому этот файл не знает языков.
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '@fontsource/marck-script/400.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import { withBase } from '@shell/utils/withBase';
import { portraitFocus, portraitPath, type CharacterId } from '../characters/roster.ts';
import { useKeepOnScreen, type CaptionSide } from '../hooks/useKeepOnScreen.ts';
import { placeBeside, placeOver } from '../utils/placeBeside.ts';
import styles from './CharacterCard.module.css';

/** [EN] What a card tells about a hero; every text is already in the reader's language. [RU] Что карточка рассказывает о герое; все тексты уже на языке читателя. */
export interface CharacterStory {
    readonly id: CharacterId;
    readonly name: string;
    readonly bio: string;
    /** [EN] «Dweller of the crypt» or «guest». [RU] «Обитатель склепа» или «гость». */
    readonly tag?: string;
    /** [EN] What the hero is like in this very game (a poker line). [RU] Каков герой именно в этой игре (покерная реплика). */
    readonly note?: string;
    /** [EN] Manners in pairs «what: how». [RU] Манеры парами «что: как». */
    readonly manner?: readonly (readonly [string, string])[];
}

interface CharacterCardProps extends CharacterStory {
    readonly wide?: boolean;
    readonly className?: string;
    readonly domId?: string;
    /** [EN] 'dialog' for a card the reader opened, 'note' for one that floats beside a list. [RU] 'dialog' — карточку раскрыл читатель, 'note' — она всплывает рядом со списком. */
    readonly role?: 'dialog' | 'note';
    readonly label?: string;
    readonly closeLabel?: string;
    readonly onClose?: () => void;
    readonly cardRef?: React.Ref<HTMLDivElement>;
    readonly style?: React.CSSProperties;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
    id, name, bio, tag, note, manner, wide = false, className = '', domId, role = 'note', label, closeLabel, onClose, cardRef, style,
}) => (
    <div ref={cardRef} id={domId} className={`${styles.card} ${wide ? styles.wide : ''} ${className}`} role={role} aria-label={label ?? name} style={style}>
        <img className={styles.picture} src={withBase(portraitPath(id))} alt="" decoding="async" draggable={false} />
        <div>
            <p className={styles.name}>{name}</p>
            {tag && <p className={styles.tag}>{tag}</p>}
            <p className={styles.text}>{bio}</p>
            {note && <p className={styles.note}>{note}</p>}
            {manner && manner.length > 0 && (
                <ul className={styles.manner}>
                    {manner.map(([what, how]) => <li key={what}><b>{what}:</b> {how}</li>)}
                </ul>
            )}
            {onClose && closeLabel && <button type="button" className={styles.close} onClick={onClose}>{closeLabel}</button>}
        </div>
    </div>
);

interface CharacterFaceProps {
    readonly story: CharacterStory;
    /** [EN] The spoken name of the button: «About Koschei». [RU] Название кнопки для диктора: «О герое Кощей». */
    readonly label: string;
    readonly closeLabel: string;
    /** [EN] The game's own frame of the small picture. [RU] Собственная рамка маленькой картинки в игре. */
    readonly faceClassName?: string;
    readonly className?: string;
    /** [EN] Which corner the large picture and the card grow from, so they stay on the table. [RU] Из какого угла растут крупная картинка и карточка, чтобы остаться на столе. */
    readonly side?: CaptionSide;
    readonly children?: React.ReactNode;
}

export const CharacterFace: React.FC<CharacterFaceProps> = ({ story, label, closeLabel, faceClassName = '', className = '', side = 'center', children }) => {
    const [open, setOpen] = useState(false);
    const wrap = useRef<HTMLSpanElement>(null);
    const card = useRef<HTMLDivElement>(null);
    const cardId = useId();
    useKeepOnScreen(card, wrap, open, story.id, side);
    useEffect(() => { setOpen(false); }, [story.id]);
    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
        const onPress = (event: PointerEvent) => {
            if (event.target instanceof Node && !wrap.current?.contains(event.target)) setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('pointerdown', onPress);
        return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onPress); };
    }, [open]);
    const picture = withBase(portraitPath(story.id));
    // [EN] A wide picture grows wider, so it is as large as a tall one, not a thin strip. [RU] Широкая картинка растёт шире, чтобы быть такой же крупной, как высокая, а не узкой полоской.
    const [wide, setWide] = useState(false);
    const zoom = `${side === 'start' ? styles.zoomStart : side === 'end' ? styles.zoomEnd : ''} ${wide ? styles.zoomWide : ''}`;
    const popover = side === 'end' ? styles.popoverEnd : side === 'center' ? styles.popoverCenter : '';
    return (
        <span ref={wrap} className={`${styles.face} ${open ? styles.faceOpen : ''} ${className}`}>
            <button type="button" className={faceClassName} aria-label={label} aria-expanded={open} aria-controls={cardId} onClick={() => setOpen(value => !value)}>
                <img src={picture} alt="" loading="lazy" decoding="async" draggable={false} style={portraitFocus(story.id)} />
                {children}
            </button>
            <img className={`${styles.zoom} ${zoom}`} src={picture} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false}
                onLoad={event => setWide(event.currentTarget.naturalWidth > event.currentTarget.naturalHeight * 1.2)} />
            {open && (
                <CharacterCard {...story} cardRef={card} domId={cardId} role="dialog" label={label} className={`${styles.popover} ${popover}`}
                    closeLabel={closeLabel} onClose={() => setOpen(false)} />
            )}
        </span>
    );
};

/**
 * [EN] The card of a small portrait in a list (`anchor`); null — nothing is shown. By default it floats beside the
 *      portrait; with `grow` the portrait itself grows into it, as a portrait at a table grows under the mouse: the
 *      large picture starts where the small one is, the biography beside it (Alexey, 11.11.2026: every window must
 *      grow seriously, as during the game, and open the biography). It is drawn at the end of the page, over any
 *      menu (a scrolled list would clip a portrait grown inside it), and never takes a press — the portrait under it
 *      still answers the mouse.
 * [RU] Карточка маленького портрета списка (`anchor`); null — ничего не показано. Обычно она всплывает рядом с
 *      портретом; с `grow` сам портрет вырастает в неё, как портрет за столом под мышью: крупная картинка начинается
 *      там, где маленькая, рядом биография (Алексей, 11.11.2026: каждое окно должно серьёзно увеличиваться, как во
 *      время игры, и открывать биографию). Рисуется в конце страницы, поверх любого меню (прокручиваемый список
 *      обрезал бы выросший внутри него портрет), и никогда не перехватывает нажатия — портрет под ней по-прежнему
 *      отвечает мыши.
 */
export const CharacterPeek: React.FC<{ story: CharacterStory | null; anchor: HTMLElement | null; grow?: boolean }> = ({ story, anchor, grow = false }) => {
    const card = useRef<HTMLDivElement>(null);
    const [place, setPlace] = useState<{ left: number; top: number } | null>(null);
    useLayoutEffect(() => {
        const element = card.current;
        if (!story || !anchor || !element) { setPlace(null); return; }
        const box = anchor.getBoundingClientRect();
        const size = { width: element.offsetWidth, height: element.offsetHeight };
        const screen = { width: document.documentElement.clientWidth, height: window.innerHeight };
        setPlace(grow ? placeOver(box, size, screen) : placeBeside(box, size, screen));
    }, [story, anchor, grow]);
    if (!story || !anchor || typeof document === 'undefined') return null;
    // [EN] Until it is measured the card waits unseen in the corner: no flash in a wrong place, nothing past the screen.
    // [RU] Пока карточка не измерена, она ждёт невидимой в углу: никакой вспышки не на месте и ничего за экраном.
    const style: React.CSSProperties = place ? { left: place.left, top: place.top } : { left: 0, top: 0, visibility: 'hidden' };
    return createPortal(<CharacterCard {...story} wide cardRef={card} className={`${styles.peek} ${grow && place ? styles.peekGrow : ''}`} style={style} />, document.body);
};

/**
 * [EN] Which portrait of a list the mouse, the keyboard or a finger points at: spread `bind(id)` on every portrait
 *      and give `anchor` and the hero's story to CharacterPeek.
 * [RU] На какой портрет списка указывают мышь, клавиатура или палец: разверните `bind(id)` на каждом портрете и
 *      передайте `anchor` и рассказ о герое в CharacterPeek.
 */
export function usePeek<Id extends string>(): {
    readonly id: Id | null;
    readonly anchor: HTMLElement | null;
    readonly bind: (id: Id) => {
        onPointerEnter: (event: React.PointerEvent<HTMLElement>) => void;
        onPointerLeave: (event: React.PointerEvent<HTMLElement>) => void;
        onFocus: (event: React.FocusEvent<HTMLElement>) => void;
        onBlur: () => void;
        onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
    };
} {
    const [shown, setShown] = useState<{ id: Id; anchor: HTMLElement } | null>(null);
    // [EN] After a finger's tap the card stays until the next touch anywhere or a scroll.
    // [RU] После касания пальцем карточка остаётся до следующего касания где угодно или до прокрутки.
    useEffect(() => {
        if (!shown) return;
        const hide = () => setShown(null);
        // [EN] A mouse click on the portrait picks it and the card stays to be read; a finger elsewhere puts it away.
        // [RU] Щелчок мышью по портрету выбирает его, а карточка остаётся, чтобы её дочитали; палец в другом месте убирает её.
        const onPress = (event: PointerEvent) => { if (event.pointerType !== 'mouse') hide(); };
        window.addEventListener('pointerdown', onPress, true);
        window.addEventListener('scroll', hide, true);
        return () => { window.removeEventListener('pointerdown', onPress, true); window.removeEventListener('scroll', hide, true); };
    }, [shown]);
    const bind = (id: Id) => ({
        onPointerEnter: (event: React.PointerEvent<HTMLElement>) => { if (event.pointerType === 'mouse') setShown({ id, anchor: event.currentTarget }); },
        onPointerLeave: (event: React.PointerEvent<HTMLElement>) => { if (event.pointerType === 'mouse') setShown(current => (current?.id === id ? null : current)); },
        onFocus: (event: React.FocusEvent<HTMLElement>) => { if (event.currentTarget.matches(':focus-visible')) setShown({ id, anchor: event.currentTarget }); },
        onBlur: () => setShown(current => (current?.id === id ? null : current)),
        onPointerUp: (event: React.PointerEvent<HTMLElement>) => { if (event.pointerType !== 'mouse') { const anchor = event.currentTarget; window.setTimeout(() => setShown({ id, anchor }), 0); } },
    });
    return { id: shown?.id ?? null, anchor: shown?.anchor ?? null, bind };
}

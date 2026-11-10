// [EN] FILE: games/poker/components/SetupMenu.tsx — the tournament menu: how many regulars sit down, how many chips,
//      how fast the blinds rise, how strong the opponents are; «Continue» when a tournament is saved. No money, play
//      chips only — said on the menu itself.
// [RU] ФАЙЛ: меню турнира: сколько завсегдатаев садится за стол, сколько фишек, как быстро растут блайнды, насколько
//      сильны соперники; «Продолжить», если турнир сохранён. Без денег, только игровые фишки — об этом сказано прямо в
//      меню.
import React, { useState } from 'react';
import { HANDS_PER_LEVEL, type BlindSpeed, type BotStrength, type PokerSave, type PokerSettings } from '../hooks/usePoker';
import { usePokerTexts } from '../i18n';
import styles from './Poker.module.css';

interface SetupMenuProps {
    readonly settings: PokerSettings;
    readonly saved: { readonly save: PokerSave; readonly timestamp: number } | null;
    readonly language: string;
    readonly onStart: (settings: PokerSettings) => void;
    readonly onContinue: (save: PokerSave) => void;
    readonly onClose: (() => void) | null;
}

const OPPONENTS = [1, 2, 3, 4, 5];
const STACKS = [1000, 1500, 3000];
const SPEEDS: readonly BlindSpeed[] = ['slow', 'normal', 'fast'];
const STRENGTHS: readonly BotStrength[] = ['casual', 'strong'];

export const SetupMenu: React.FC<SetupMenuProps> = ({ settings, saved, language, onStart, onContinue, onClose }) => {
    const t = usePokerTexts();
    const [choice, setChoice] = useState<PokerSettings>(settings);
    const pick = <K extends keyof PokerSettings>(key: K, value: PokerSettings[K]) => setChoice(current => ({ ...current, [key]: value }));
    const on = (active: boolean): string => `${styles.button} ${styles.choice} ${active ? styles.choiceOn : ''}`;
    const when = saved ? new Date(saved.timestamp).toLocaleString(language, { dateStyle: 'short', timeStyle: 'short' }) : '';
    return (
        <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="poker-menu-title">
            <div className={styles.menu}>
                <h2 id="poker-menu-title" className={styles.menuTitle}>{t.setup.title}</h2>
                <p className={styles.menuText}>{t.setup.intro}</p>
                <p className={styles.tagline}>{t.setup.noMoney}</p>
                <div className={styles.field} role="group" aria-label={t.setup.opponents}>
                    <span className={styles.fieldLabel}>{t.setup.opponents}</span>
                    <div className={styles.choices}>
                        {OPPONENTS.map(count => (
                            <button key={count} type="button" className={on(choice.opponents === count)} aria-pressed={choice.opponents === count}
                                aria-label={t.setup.opponentsCount(count)} onClick={() => pick('opponents', count)}>{count}</button>
                        ))}
                    </div>
                </div>
                <div className={styles.field} role="group" aria-label={t.setup.stack}>
                    <span className={styles.fieldLabel}>{t.setup.stack}</span>
                    <div className={styles.choices}>
                        {STACKS.map(stack => (
                            <button key={stack} type="button" className={on(choice.stack === stack)} aria-pressed={choice.stack === stack} onClick={() => pick('stack', stack)}>
                                {stack.toLocaleString(language)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className={styles.field} role="group" aria-label={t.setup.speed}>
                    <span className={styles.fieldLabel}>{t.setup.speed}</span>
                    <div className={styles.choices}>
                        {SPEEDS.map(speed => (
                            <button key={speed} type="button" className={on(choice.speed === speed)} aria-pressed={choice.speed === speed}
                                title={t.setup.speedHint(HANDS_PER_LEVEL[speed])} onClick={() => pick('speed', speed)}>{t.setup.speeds[speed]}</button>
                        ))}
                    </div>
                    <span className={styles.tagline}>{t.setup.speedHint(HANDS_PER_LEVEL[choice.speed])}</span>
                </div>
                <div className={styles.field} role="group" aria-label={t.setup.strength}>
                    <span className={styles.fieldLabel}>{t.setup.strength}</span>
                    <div className={styles.choices}>
                        {STRENGTHS.map(strength => (
                            <button key={strength} type="button" className={on(choice.strength === strength)} aria-pressed={choice.strength === strength}
                                onClick={() => pick('strength', strength)}>{t.setup.strengths[strength]}</button>
                        ))}
                    </div>
                </div>
                {saved && <p className={styles.tagline}>{t.setup.savedLine(saved.save.table.handNumber, saved.save.table.seats.filter(seat => seat.stack > 0).length, when)}</p>}
                <div className={styles.menuActions}>
                    {saved && <button type="button" className={styles.button} onClick={() => onContinue(saved.save)}>{t.setup.continue}</button>}
                    <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => onStart(choice)}>{t.setup.start}</button>
                    {onClose && <button type="button" className={styles.button} onClick={onClose}>{t.setup.close}</button>}
                </div>
            </div>
        </div>
    );
};

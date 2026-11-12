// [EN] FILE: games/checkers/components/CheckersMenu.tsx — the menu of a new game of draughts: the rules (Russian or
//      English), how well the opponent plays, the colour of your men, and who the opponent is — a hero of the lair
//      with a portrait that grows and opens the hero's card. A game that was interrupted can be continued from here.
// [RU] ФАЙЛ: меню новой партии в шашки: правила (русские или английские), как сильно играет соперник, цвет ваших
//      шашек и кто соперник — герой логова с портретом, который растёт и раскрывает карточку героя. Прерванную партию
//      можно продолжить отсюда.
import React, { useState } from 'react';
import type { CharacterTexts } from '@shared/characters/texts';
import { characterFacts } from '@shared/characters/roster';
import { CharacterFace } from '@shared/components/CharacterCard';
import type { Language } from '@shared/i18n/languages';
import { CHECKERS_LEVELS, RULE_SETS, type RulesId } from '../engine/index.ts';
import type { CheckersSave, CheckersSettings, ColourChoice, OpponentId } from '../hooks/useCheckers';
import { useCheckersTexts } from '../i18n';
import styles from './Checkers.module.css';

interface CheckersMenuProps {
    readonly settings: CheckersSettings;
    readonly saved: { readonly save: CheckersSave; readonly timestamp: number } | null;
    readonly language: Language;
    readonly people: CharacterTexts;
    readonly opponent: OpponentId;
    readonly onAnother: () => void;
    readonly onStart: (settings: CheckersSettings) => void;
    readonly onContinue: (save: CheckersSave) => void;
    /** null — there is no game to go back to. */
    readonly onClose: (() => void) | null;
}

const COLOURS: readonly ColourChoice[] = ['white', 'black', 'random'];
const RULE_IDS: readonly RulesId[] = ['russian', 'english'];

export const CheckersMenu: React.FC<CheckersMenuProps> = ({ settings, saved, language, people, opponent, onAnother, onStart, onContinue, onClose }) => {
    const t = useCheckersTexts();
    const [choice, setChoice] = useState<CheckersSettings>(settings);
    const on = (active: boolean) => `${styles.button} ${styles.choice} ${active ? styles.choiceOn : ''}`;
    const when = saved ? new Date(saved.timestamp).toLocaleString(language, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';
    const hero = people[opponent];
    return (
        <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="checkers-menu-title">
            <div className={styles.menu}>
                <h2 id="checkers-menu-title" className={styles.menuTitle}>{t.setup.title}</h2>
                <p className={styles.menuText}>{t.setup.intro}</p>

                <div className={styles.field} role="group" aria-label={t.setup.opponent}>
                    <span className={styles.fieldLabel}>{t.setup.opponent}</span>
                    <div className={styles.opponentRow}>
                        <CharacterFace className={styles.face} faceClassName={styles.portrait} side="start" label={t.hero.about(hero.name)} closeLabel={t.hero.close}
                            story={{ id: opponent, name: hero.name, bio: hero.bio, quote: hero.quote, tag: characterFacts(opponent).guest ? t.hero.guest : t.hero.dweller }} />
                        <span className={styles.opponentName}>{hero.name}</span>
                        <button type="button" className={styles.button} onClick={onAnother}>{t.setup.another}</button>
                    </div>
                </div>

                <div className={styles.field} role="group" aria-label={t.setup.rules}>
                    <span className={styles.fieldLabel}>{t.setup.rules}</span>
                    <div className={styles.choices}>
                        {RULE_IDS.map(rules => (
                            <button key={rules} type="button" className={on(choice.rules === rules)} aria-pressed={choice.rules === rules} onClick={() => setChoice({ ...choice, rules })}>
                                {rules === 'russian' ? t.setup.russian : t.setup.english}
                            </button>
                        ))}
                    </div>
                    <span className={styles.hint}>{choice.rules === 'russian' ? t.setup.russianHint : t.setup.englishHint} {t.setup.firstHint(RULE_SETS[choice.rules].firstMover === 'white')}</span>
                </div>

                <div className={styles.field} role="group" aria-label={t.setup.level}>
                    <span className={styles.fieldLabel}>{t.setup.level}</span>
                    <div className={styles.choices}>
                        {CHECKERS_LEVELS.map(level => (
                            <button key={level} type="button" className={on(choice.level === level)} aria-pressed={choice.level === level} onClick={() => setChoice({ ...choice, level })}>
                                {t.setup.levels[level]}
                            </button>
                        ))}
                    </div>
                    <span className={styles.hint}>{t.setup.levelHints[choice.level]}</span>
                </div>

                <div className={styles.field} role="group" aria-label={t.setup.colour}>
                    <span className={styles.fieldLabel}>{t.setup.colour}</span>
                    <div className={styles.choices}>
                        {COLOURS.map(colour => (
                            <button key={colour} type="button" className={on(choice.colour === colour)} aria-pressed={choice.colour === colour} onClick={() => setChoice({ ...choice, colour })}>
                                {t.setup.colours[colour]}
                            </button>
                        ))}
                    </div>
                </div>

                {saved && <p className={styles.hint}>{t.setup.savedLine(when)}</p>}
                <div className={styles.menuActions}>
                    {saved && <button type="button" className={styles.button} onClick={() => onContinue(saved.save)}>{t.setup.continue}</button>}
                    <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => onStart(choice)}>{t.setup.start}</button>
                    {onClose && <button type="button" className={styles.button} onClick={onClose}>{t.setup.close}</button>}
                </div>
            </div>
        </div>
    );
};

// [EN] FILE: games/battleship/components/BattleMenu.tsx — the menu of a new battle: the rules (the classic notebook
//      game or the boxed one) with two switches between them, how well the opponent shoots, whose shot is first,
//      and who the opponent is — a hero of the lair with a portrait that grows and opens the hero's card. A battle
//      that was interrupted can be continued from here.
// [RU] ФАЙЛ: меню нового боя: правила (тетрадная классика или коробочная игра) с двумя переключателями между ними,
//      как метко стреляет соперник, чей выстрел первый и кто соперник — герой логова с портретом, который растёт и
//      раскрывает карточку героя. Прерванный бой можно продолжить отсюда.
import React, { useState } from 'react';
import type { CharacterTexts } from '@shared/characters/texts';
import { characterFacts } from '@shared/characters/roster';
import { CharacterFace } from '@shared/components/CharacterCard';
import type { Language } from '@shared/i18n/languages';
import { GUNNER_LEVELS, RULE_SETS, type RulesId } from '../engine/index.ts';
import type { BattleSave, BattleSettings, FirstMove, OpponentId } from '../hooks/useBattleship';
import { useBattleTexts } from '../i18n';
import styles from './Battleship.module.css';

interface BattleMenuProps {
    readonly settings: BattleSettings;
    readonly saved: { readonly save: BattleSave; readonly timestamp: number } | null;
    readonly language: Language;
    readonly people: CharacterTexts;
    readonly opponent: OpponentId;
    readonly onAnother: () => void;
    readonly onStart: (settings: BattleSettings) => void;
    readonly onContinue: (save: BattleSave) => void;
    /** null — there is no battle to go back to. */
    readonly onClose: (() => void) | null;
}

const FIRST_MOVES: readonly FirstMove[] = ['you', 'opponent', 'random'];
const RULE_IDS: readonly RulesId[] = ['classic', 'western'];

export const BattleMenu: React.FC<BattleMenuProps> = ({ settings, saved, language, people, opponent, onAnother, onStart, onContinue, onClose }) => {
    const t = useBattleTexts();
    const [choice, setChoice] = useState<BattleSettings>(settings);
    const on = (active: boolean) => `${styles.button} ${styles.choice} ${active ? styles.choiceOn : ''}`;
    // [EN] A set of rules brings its own two switches; they can then be changed one by one.
    // [RU] Набор правил приносит свои два переключателя; потом их можно менять по одному.
    const pickRules = (rules: RulesId) => setChoice({ ...choice, rules, touching: RULE_SETS[rules].touching, shootAgain: RULE_SETS[rules].shootAgain });
    const when = saved ? new Date(saved.timestamp).toLocaleString(language, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';
    const hero = people[opponent];
    return (
        <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="battleship-menu-title">
            <div className={styles.menu}>
                <h2 id="battleship-menu-title" className={styles.menuTitle}>{t.setup.title}</h2>
                <p className={styles.menuText}>{t.setup.intro}</p>

                <div className={styles.field} role="group" aria-label={t.setup.opponent}>
                    <span className={styles.fieldLabel}>{t.setup.opponent}</span>
                    <div className={styles.opponentRow}>
                        <CharacterFace className={styles.face} faceClassName={styles.portrait} side="start" label={t.hero.about(hero.name)} closeLabel={t.hero.close}
                            story={{ id: opponent, name: hero.name, bio: hero.bio, tag: characterFacts(opponent).guest ? t.hero.guest : t.hero.dweller }} />
                        <span className={styles.opponentName}>{hero.name}</span>
                        <button type="button" className={styles.button} onClick={onAnother}>{t.setup.another}</button>
                    </div>
                </div>

                <div className={styles.field} role="group" aria-label={t.setup.rules}>
                    <span className={styles.fieldLabel}>{t.setup.rules}</span>
                    <div className={styles.choices}>
                        {RULE_IDS.map(rules => (
                            <button key={rules} type="button" className={on(choice.rules === rules)} aria-pressed={choice.rules === rules} onClick={() => pickRules(rules)}>
                                {rules === 'classic' ? t.setup.classic : t.setup.western}
                            </button>
                        ))}
                    </div>
                    <span className={styles.hint}>{choice.rules === 'classic' ? t.setup.classicHint : t.setup.westernHint}</span>
                    <label className={styles.switch}>
                        <input type="checkbox" checked={choice.touching} onChange={event => setChoice({ ...choice, touching: event.target.checked })} />
                        <span>{t.setup.touching}</span>
                    </label>
                    <span className={styles.hint}>{t.setup.touchingHint}</span>
                    <label className={styles.switch}>
                        <input type="checkbox" checked={choice.shootAgain} onChange={event => setChoice({ ...choice, shootAgain: event.target.checked })} />
                        <span>{t.setup.shootAgain}</span>
                    </label>
                    <span className={styles.hint}>{t.setup.shootAgainHint}</span>
                </div>

                <div className={styles.field} role="group" aria-label={t.setup.level}>
                    <span className={styles.fieldLabel}>{t.setup.level}</span>
                    <div className={styles.choices}>
                        {GUNNER_LEVELS.map(level => (
                            <button key={level} type="button" className={on(choice.level === level)} aria-pressed={choice.level === level} onClick={() => setChoice({ ...choice, level })}>
                                {t.setup.levels[level]}
                            </button>
                        ))}
                    </div>
                    <span className={styles.hint}>{t.setup.levelHints[choice.level]}</span>
                </div>

                <div className={styles.field} role="group" aria-label={t.setup.first}>
                    <span className={styles.fieldLabel}>{t.setup.first}</span>
                    <div className={styles.choices}>
                        {FIRST_MOVES.map(first => (
                            <button key={first} type="button" className={on(choice.first === first)} aria-pressed={choice.first === first} onClick={() => setChoice({ ...choice, first })}>
                                {t.setup.firstMoves[first]}
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

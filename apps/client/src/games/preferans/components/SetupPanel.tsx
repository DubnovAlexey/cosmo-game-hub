// [EN] FILE: games/preferans/components/SetupPanel.tsx — the table menu before a pool, ordered like a menu in a
//      restaurant and drawn like a page of a home notebook: players first, then the required rules (variant, pool,
//      all-pass prices, bots), then the conventions of the variant and the extras. Options that contradict each
//      other cannot be on together, and a closed option says why. Every item explains itself on hover or with its
//      "?" button: what it is, how it plays, what it changes in the score. "Play plain preferans" starts at once.
//      The constraints live in ../engine/tableOptions.ts, the texts in ../i18n.
// [RU] ФАЙЛ: меню стола перед пулей, как меню в ресторане, нарисованное как страница домашней тетради: сначала
//      игроки, потом обязательные правила (вариант, пуля, цены распасов, боты), потом настройки варианта и добавки.
//      Противоречащие опции нельзя включить вместе, закрытая опция объясняет почему. Каждый пункт объясняет себя
//      при наведении или кнопкой «?»: что это, как играть, что меняется в счёте. «Играть простой преферанс» сразу
//      начинает игру. Условия — в ../engine/tableOptions.ts, тексты — в ../i18n.
import React, { useState } from 'react';
import type { GameResult, GameSaveState } from '@shared/utils/storageEngine';
import { LanguageSwitch } from '@shared/components/LanguageSwitch';
import type { Language } from '@shared/i18n/languages';
import {
    OPTIONS, PLAYER_CHOICES, POOL_CHOICES, PROGRESSION_CHOICES, VARIANT_CHOICES, allPassPrices, hasProgression,
    choosePlayers, choosePool, chooseProgression, chooseVariant, closedReason, isOn, isPlayable, normalizeTable, plainTable, toggleOption,
    type Change, type Choice, type OptionId, type OptionKind, type TableConfig,
} from '../engine/index.ts';
import { championOf, type BotStrength, type PreferansResultSummary, type PreferansSave, type PreferansSettings } from '../hooks/usePreferans';
import { ROSTER, isFemale, portraitPath, type CharacterId } from '../characters/roster.ts';
import { withBase } from '@shell/utils/withBase';
import { useTexts, type Dictionary, type Explained } from '../i18n/index.ts';
import { signed } from './format';
import styles from './Preferans.module.css';

interface SetupPanelProps {
    initial: PreferansSettings;
    saved: GameSaveState<PreferansSave> | null;
    results: readonly GameResult<PreferansResultSummary>[];
    language: Language;
    onLanguage: (language: Language) => void;
    onContinue: (save: PreferansSave) => void;
    onStart: (settings: PreferansSettings) => void;
    onClose: (() => void) | null;
}

const when = (timestamp: number, language: Language): string =>
    new Date(timestamp).toLocaleString(language, { dateStyle: 'short', timeStyle: 'short' });
const STRENGTHS: readonly Choice<BotStrength>[] = [{ value: 'casual', ready: true }, { value: 'strong', ready: true }];

/** [EN] What / how / effect of one item. [RU] Что / как / к чему приводит. */
const Explanation: React.FC<{ text: Explained; t: Dictionary }> = ({ text, t }) => (
    <>
        <p><b>{t.setup.what}</b> {text.what}</p>
        <p><b>{t.setup.how}</b> {text.how}</p>
        <p><b>{t.setup.effect}</b> {text.effect}</p>
    </>
);

/** [EN] One line per value of a required choice. [RU] По строке на каждое значение обязательного выбора. */
const ValueList: React.FC<{ texts: readonly Explained[] }> = ({ texts }) => (
    <>
        {texts.map(text => (
            <p key={text.name}><b>{text.name}</b>{text.term ? ` ${text.term}` : ''}. {text.what} {text.how} {text.effect}</p>
        ))}
    </>
);

const InfoButton: React.FC<{ open: boolean; controls: string; label: string; onToggle: () => void }> = ({ open, controls, label, onToggle }) => (
    <button type="button" className={styles.infoButton} aria-expanded={open} aria-controls={controls} aria-label={label} onClick={onToggle}>?</button>
);

interface GroupProps<T> {
    id: string;
    title: string;
    choices: readonly Choice<T>[];
    value: T;
    label: (value: T) => string;
    hint: (value: T) => string;
    info: React.ReactNode;
    open: boolean;
    onInfo: () => void;
    onChoose: (value: T) => void;
}

// [EN] A required choice: one value is always chosen (circled, like with a pen); values not ready yet say "soon".
// [RU] Обязательный выбор: одно значение выбрано всегда (обведено, как ручкой); ещё не готовое помечено «скоро».
function ChoiceGroup<T extends string | number>({ id, title, choices, value, label, hint, info, open, onInfo, onChoose }: GroupProps<T>) {
    const t = useTexts();
    return (
        <section className={`${styles.setupSection} ${styles.menuItem}`} data-open={open}>
            <div className={styles.menuHead}>
                <p className={styles.setupLabel}>{title}</p>
                <InfoButton open={open} controls={id} label={t.setup.about(title)} onToggle={onInfo} />
            </div>
            <div className={styles.infoCard} id={id}>{info}</div>
            <div className={styles.choiceRow}>
                {choices.map(choice => (
                    <button key={String(choice.value)} type="button" title={hint(choice.value)} disabled={!choice.ready}
                        className={`${styles.choice} ${value === choice.value ? styles.choiceOn : ''}`} aria-pressed={value === choice.value}
                        onClick={() => onChoose(choice.value)}>
                        {label(choice.value)}{!choice.ready && <small>{t.setup.soon}</small>}
                    </button>
                ))}
            </div>
        </section>
    );
}

// [EN] A toggle with its explanation and, when closed, the reason. [RU] Переключатель с объяснением и причиной закрытия.
const OptionRow: React.FC<{ id: OptionId; table: TableConfig; open: boolean; onInfo: () => void; onToggle: () => void }> = ({ id, table, open, onInfo, onToggle }) => {
    const t = useTexts();
    const text = t.explain.options[id];
    const on = isOn(table, id);
    const closed = on ? null : closedReason(table, id);
    const infoId = `preferans-option-${id}`;
    return (
        <div className={`${styles.menuItem} ${closed ? styles.menuItemClosed : ''}`} data-open={open}>
            <div className={styles.menuHead}>
                <label className={styles.toggle}>
                    <input type="checkbox" checked={on} disabled={closed !== null} onChange={onToggle}
                        aria-describedby={closed && closed.kind !== 'notReady' ? `${infoId}-why` : undefined} />
                    <span>{text.name}{text.term && <span className={styles.term}> {text.term}</span>}{closed?.kind === 'notReady' && <small className={styles.soon}>{t.setup.soon}</small>}</span>
                </label>
                <InfoButton open={open} controls={infoId} label={t.setup.about(text.name)} onToggle={onInfo} />
            </div>
            {closed && closed.kind !== 'notReady' && <p id={`${infoId}-why`} className={styles.closedNote}>{t.closed(closed)}</p>}
            <div className={styles.infoCard} id={infoId}><Explanation text={text} t={t} /></div>
        </div>
    );
};

// [EN] Who will sit at the table: the whole company of the lair as small portraits pinned to the page. A click picks
//      a character for the next free seat (two at most, in order); a second click lets it go. "Random" leaves both
//      seats to the lair, and the winner of the last pool then keeps a seat (the note says who).
// [RU] Кто сядет за стол: все обитатели логова маленькими портретами, приколотыми к странице. Нажатие сажает
//      персонажа на следующее свободное место (не больше двух, по порядку); повторное — отпускает. «Случайные» отдаёт
//      оба места логову, и тогда победитель прошлой пули сохраняет место (записка говорит, кто это).
const OpponentPicker: React.FC<{ value: readonly (CharacterId | null)[]; champion: CharacterId | null; onChange: (next: readonly (CharacterId | null)[]) => void }> = ({ value, champion, onChange }) => {
    const t = useTexts();
    const chosen = value.filter((id): id is CharacterId => id !== null);
    const toggle = (id: CharacterId) => {
        const next = chosen.includes(id) ? chosen.filter(other => other !== id) : [...chosen, id].slice(-2);
        onChange([next[0] ?? null, next[1] ?? null]);
    };
    return (
        <section className={`${styles.setupSection} ${styles.menuItem}`}>
            <p className={styles.setupLabel}>{t.setup.opponents} <span className={styles.setupNote}>{t.setup.opponentsNote}</span></p>
            <div className={styles.gallery} role="group" aria-label={t.setup.opponents}>
                {ROSTER.map(({ id }) => {
                    const seat = chosen.indexOf(id);
                    return (
                        <button key={id} type="button" className={`${styles.galleryItem} ${seat >= 0 ? styles.galleryOn : ''}`}
                            aria-pressed={seat >= 0} title={t.characters[id].bio} onClick={() => toggle(id)}>
                            <img src={withBase(portraitPath(id))} alt="" loading="lazy" decoding="async" />
                            <span>{t.characters[id].name}</span>
                            {seat >= 0 && <b className={styles.galleryMark} aria-hidden="true">{seat + 1}</b>}
                        </button>
                    );
                })}
            </div>
            <div className={styles.row}>
                <button type="button" className={styles.button} disabled={chosen.length === 0} onClick={() => onChange([null, null])}>{t.setup.randomOpponents}</button>
                {champion && chosen.length < 2 && <span className={styles.hint}>{t.setup.champion(t.characters[champion].name, isFemale(champion))}</span>}
            </div>
        </section>
    );
};

/** [EN] The order, read back like a waiter does. [RU] Заказ, прочитанный вслух, как это делает официант. */
function tableSummary(table: TableConfig, strength: BotStrength, t: Dictionary): string {
    const parts = [
        t.setup.summary.players(table.players), t.explain.variants[table.variant].name, t.setup.summary.pool(table.poolTarget),
        // [EN] Leningrad doubles the prices (2 · 4 · 6); Rostov pays all-pass in whists. [RU] Ленинградка удваивает цены; Ростовка платит вистами.
        hasProgression(table) ? t.setup.summary.allPass(t.explain.progressionLabel(allPassPrices(table))) : t.setup.summary.allPassWhists,
    ];
    for (const spec of OPTIONS) {
        if (spec.kind === 'convention' && !isOn(table, spec.id) && closedReason(table, spec.id)?.kind !== 'variant') parts.push(t.setup.summary.without(t.explain.options[spec.id].name));
        if (spec.kind === 'extra' && isOn(table, spec.id)) parts.push(t.explain.options[spec.id].name);
    }
    parts.push(t.setup.summary.bots[strength]);
    return parts.join(' · ');
}

export const SetupPanel: React.FC<SetupPanelProps> = ({ initial, saved, results, language, onLanguage, onContinue, onStart, onClose }) => {
    const t = useTexts();
    const [table, setTable] = useState<TableConfig>(() => normalizeTable(initial.table));
    const [strength, setStrength] = useState<BotStrength>(initial.strength);
    const [opponents, setOpponents] = useState<readonly (CharacterId | null)[]>(() => initial.opponents ?? [null, null]);
    const champion = championOf(results);
    const [dropped, setDropped] = useState<readonly OptionId[]>([]);
    const [openInfo, setOpenInfo] = useState<string | null>(null);
    const info = (key: string) => ({ open: openInfo === key, onInfo: () => setOpenInfo(current => (current === key ? null : key)) });

    const apply = (change: Change) => {
        setTable(change.config);
        setDropped(change.dropped);
    };
    const optionRows = (kind: OptionKind) => OPTIONS.filter(spec => spec.kind === kind).map(spec => (
        <OptionRow key={spec.id} id={spec.id} table={table} {...info(spec.id)} onToggle={() => apply(toggleOption(table, spec.id))} />
    ));

    const savedData = saved?.data ?? null;
    const savedPool = savedData ? savedData.sheet.pool.reduce((sum, value) => sum + value, 0) : 0;

    return (
        <div className={styles.setupBackdrop} role="dialog" aria-modal="true" aria-labelledby="preferans-setup-title">
            <div className={styles.setup}>
                <div className={styles.setupTop}>
                    <h2 id="preferans-setup-title" className={styles.setupTitle}>{t.setup.title}</h2>
                    <LanguageSwitch value={language} onChange={onLanguage} label={t.header.language} className={styles.language} />
                </div>

                {savedData && (
                    <section className={styles.setupSection}>
                        <p className={styles.setupLabel}>{t.setup.savedPool}</p>
                        <p className={styles.hint}>{t.setup.savedLine(savedData.log.length + (savedData.deal.phase === 'done' ? 0 : 1), savedPool, savedData.settings.table.poolTarget * 3, when(saved!.timestamp, language))}</p>
                        <button type="button" className={`${styles.button} ${styles.buttonPrimary} ${styles.setupWide}`} onClick={() => onContinue(savedData)}>
                            {t.setup.continueSaved}
                        </button>
                    </section>
                )}

                <section className={styles.setupSection}>
                    <button type="button" className={`${styles.button} ${savedData ? '' : styles.buttonPrimary} ${styles.setupWide}`} onClick={() => onStart({ table: plainTable(), strength, opponents })}>
                        {t.setup.playPlain}
                    </button>
                    <p className={styles.hint}>{t.setup.playPlainHint}</p>
                </section>

                <ChoiceGroup id="preferans-info-players" title={t.setup.players} choices={PLAYER_CHOICES} value={table.players}
                    label={value => t.explain.players[value].name} hint={value => t.explain.players[value].what}
                    info={<ValueList texts={PLAYER_CHOICES.map(choice => t.explain.players[choice.value])} />} {...info('players')}
                    onChoose={value => apply(choosePlayers(table, value))} />
                <ChoiceGroup id="preferans-info-variant" title={t.setup.rules} choices={VARIANT_CHOICES} value={table.variant}
                    label={value => t.explain.variants[value].name} hint={value => t.explain.variants[value].what}
                    info={<ValueList texts={VARIANT_CHOICES.map(choice => t.explain.variants[choice.value])} />} {...info('variant')}
                    onChoose={value => apply(chooseVariant(table, value))} />
                <ChoiceGroup id="preferans-info-pool" title={t.setup.pool} choices={POOL_CHOICES} value={table.poolTarget}
                    label={value => String(value)} hint={() => t.explain.pool.what}
                    info={<Explanation text={t.explain.pool} t={t} />} {...info('pool')} onChoose={value => apply(choosePool(table, value))} />
                {hasProgression(table) && (
                    // [EN] Rostov has no all-pass progression: the group is not shown there. [RU] В Ростовке прогрессии распасов нет: группа не показывается.
                    <ChoiceGroup id="preferans-info-progression" title={t.setup.progression} choices={PROGRESSION_CHOICES} value={table.progression}
                        label={value => t.explain.progressionLabel(allPassPrices({ ...table, progression: value }))} hint={() => t.explain.progression.what}
                        info={<Explanation text={t.explain.progression} t={t} />} {...info('progression')} onChoose={value => apply(chooseProgression(table, value))} />
                )}
                <ChoiceGroup id="preferans-info-bots" title={t.setup.bots} choices={STRENGTHS} value={strength}
                    label={value => t.setup.strength[value]} hint={() => t.explain.bots.what}
                    info={<Explanation text={t.explain.bots} t={t} />} {...info('bots')} onChoose={setStrength} />
                <OpponentPicker value={opponents} champion={champion} onChange={setOpponents} />

                <section className={styles.setupSection}>
                    <p className={styles.setupLabel}>{t.setup.conventions} <span className={styles.setupNote}>{t.setup.conventionsNote}</span></p>
                    {optionRows('convention')}
                </section>
                <section className={styles.setupSection}>
                    <p className={styles.setupLabel}>{t.setup.extras} <span className={styles.setupNote}>{t.setup.extrasNote}</span></p>
                    {optionRows('extra')}
                </section>

                {dropped.length > 0 && (
                    <p className={styles.notice} role="status">{t.setup.dropped(dropped.map(id => `«${t.explain.options[id].name}»`).join(', '))}</p>
                )}
                <p className={styles.order}><b>{t.setup.yourTable}</b> {tableSummary(table, strength, t)}</p>
                <div className={styles.row}>
                    <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} disabled={!isPlayable(table)} onClick={() => onStart({ table, strength, opponents })}>{t.setup.play}</button>
                    <button type="button" className={styles.button} onClick={() => apply({ config: plainTable(), dropped: [] })}>{t.setup.reset}</button>
                    {onClose && <button type="button" className={styles.button} onClick={onClose}>{t.setup.back}</button>}
                </div>

                {results.length > 0 && (
                    <section className={styles.setupSection}>
                        <p className={styles.setupLabel}>{t.setup.lastPools}</p>
                        <ul className={styles.log}>
                            {results.slice(0, 5).map(result => (
                                <li key={result.timestamp}>{t.setup.resultLine(when(result.timestamp, language), result.summary.deals, signed(result.summary.balance[0]))}</li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </div>
    );
};

// [EN] FILE: games/preferans/components/ScoreSheet.tsx — the score sheet panel: the paper sheet (pool, mountain,
//      whists written by hand), a legend, the balance if the pool closed now, the list of deals and the rules in
//      short. On a computer it lies next to the table all the time; anywhere it also opens large in a window.
// [RU] ФАЙЛ: панель пули — бумажный лист (пуля, гора, висты от руки), легенда, итог, если бы пуля закрылась
//      сейчас, список раздач и коротко правила. На компьютере всё время лежит рядом со столом; на любом экране
//      ещё и открывается крупно в окне.
import React from 'react';
import type { VariantId } from '../engine/index.ts';
import type { DealLogEntry } from '../hooks/usePreferans';
import { useTexts } from '../i18n/index.ts';
import { resultText, signed } from './format';
import { Pulka } from './Pulka';
import { Pulka4 } from './Pulka4';
import type { SheetHistory } from './sheetHistory';
import type { Tooth } from './teeth';
import gameStyles from './Preferans.module.css';
import styles from './ScoreSheet.module.css';

interface ScoreSheetProps {
    history: SheetHistory;
    balance: readonly number[];
    log: readonly DealLogEntry[];
    names: readonly string[];
    poolTarget: number;
    poolTotal: number;
    /** [EN] Players at the table: two write no pool for the dummy. [RU] Игроков за столом: вдвоём пулю за болвана не пишут. */
    players: number;
    /** [EN] The rule variant of this table: its prices close the short rules. [RU] Вариант правил стола: его цены завершают краткие правила. */
    variant: VariantId;
    titleId: string;
    large?: boolean;
    onExpand?: () => void;
    onClose?: () => void;
    /** [EN] Teeth on the sheet (an option); null when the table does not draw them. [RU] Зубы на листе (опция); null, если стол их не рисует. */
    teeth?: readonly Tooth[] | null;
}

const tone = (value: number): string => (value > 0.05 ? styles.plus : value < -0.05 ? styles.minus : '');

export const ScoreSheet: React.FC<ScoreSheetProps> = ({ history, balance, log, names, poolTarget, poolTotal, players, variant, titleId, large = false, onExpand, onClose, teeth = null }) => {
    const t = useTexts();
    const rules = t.explain.variants[variant];
    return (
        <section className={`${styles.sheet} ${large ? styles.sheetLarge : ''}`} aria-labelledby={titleId}>
            <header className={styles.sheetHeader}>
                <h2 id={titleId}>{t.sheet.title}</h2>
                <span className={styles.sheetMeta}>{t.sheet.meta(poolTarget, poolTotal, poolTarget * players)}</span>
                {onClose && <button type="button" className={styles.iconButton} onClick={onClose} aria-label={t.sheet.close} title={t.sheet.close}>✕</button>}
                {onExpand && <button type="button" className={styles.iconButton} onClick={onExpand} aria-label={t.sheet.openLarge} title={t.sheet.openLarge}>⤢</button>}
            </header>

            {names.length === 4
                ? <Pulka4 history={history} names={names} poolTarget={poolTarget} balance={balance} large={large} />
                : <Pulka history={history} names={names} poolTarget={poolTarget} balance={balance} large={large} />}

            <p className={styles.legend}>
                <span><i className={styles.dotMountain} /> {t.sheet.legend.mountain}</span>
                <span><i className={styles.dotPool} /> {t.sheet.legend.pool}</span>
                <span><i className={styles.dotWhists} /> {t.sheet.legend.whists}</span>
            </p>
            <p className={styles.balance}>
                {t.sheet.ifClosedNow}{' '}
                {names.slice(0, players).map((name, seat) => <span key={name} className={tone(balance[seat])}>{name} {signed(balance[seat])}</span>)}
                <span className={styles.balanceUnit}>{t.sheet.sumsToZero}</span>
            </p>

            {teeth && teeth.length > 0 && (
                // [EN] Teeth: who promised to pay whom back. [RU] Зубы: кто кому обещал отплатить.
                <p className={styles.teeth}>
                    <b>{t.extra.teeth}:</b>{' '}
                    {teeth.map(tooth => <span key={`${tooth.from}-${tooth.to}`} className={styles.tooth}>{t.extra.tooth(names[tooth.from], names[tooth.to], tooth.count)}</span>)}
                </p>
            )}

            {log.length > 0 && (
                <details className={styles.deals} open={large}>
                    <summary>{t.sheet.deals(log.length)}</summary>
                    <ol reversed className={gameStyles.log}>
                        {[...log].reverse().map(entry => <li key={entry.number}>{t.sheet.deal(entry.number)} · {resultText(entry.result, names, t, entry.seating)}</li>)}
                    </ol>
                </details>
            )}

            <details className={gameStyles.rules}>
                <summary>{t.sheet.rulesTitle(rules.name)}</summary>
                <ul>{[...t.sheet.rules, rules.how, rules.effect].map(rule => <li key={rule}>{rule}</li>)}</ul>
            </details>
        </section>
    );
};

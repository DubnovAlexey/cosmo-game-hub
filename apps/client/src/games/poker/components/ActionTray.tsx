// [EN] FILE: games/poker/components/ActionTray.tsx — your decisions under the table: fold, check or call, a bet or a
//      raise with a slider, a number field and quick sizes (half the pot, three quarters, the pot, everything), and
//      all-in. Only legal choices are offered (engine/holdem.ts legalActions); every button is a finger wide.
// [RU] ФАЙЛ: ваши решения под столом: фолд, чек или колл, бет или рейз с ползунком, полем для числа и быстрыми
//      размерами (полбанка, три четверти, банк, всё) и олл-ин. Предлагается только то, что разрешено
//      (engine/holdem.ts legalActions); каждая кнопка шириной с палец.
import React, { useEffect, useState } from 'react';
import { potSize, type HandState, type LegalActions, type PokerAction } from '../engine/index.ts';
import { usePokerTexts } from '../i18n';
import styles from './Poker.module.css';

interface ActionTrayProps {
    readonly state: HandState;
    readonly legal: LegalActions;
    readonly seat: number;
    readonly format: (chips: number) => string;
    readonly onAct: (action: PokerAction) => void;
}

export const ActionTray: React.FC<ActionTrayProps> = ({ state, legal, seat, format, onAct }) => {
    const t = usePokerTexts();
    const raise = legal.raise;
    const [to, setTo] = useState(raise?.min ?? 0);
    // [EN] A new decision starts at the smallest raise. [RU] Новое решение начинается с минимального рейза.
    useEffect(() => { setTo(raise?.min ?? 0); }, [raise?.min, raise?.max, state.street, state.turn]);
    const clamp = (value: number): number => (raise ? Math.min(raise.max, Math.max(raise.min, Math.round(value))) : value);
    const toCall = legal.call;
    const potAfterCall = potSize(state) + toCall;
    const preset = (fraction: number): number => clamp(state.currentBet + potAfterCall * fraction);
    const betting = state.currentBet === 0;
    const allInTotal = legal.allIn;
    const allInIsRaise = allInTotal !== null && allInTotal > state.currentBet;
    return (
        <section className={styles.tray} aria-label={t.actions.yourTurn}>
            <h2 className={styles.trayTitle}>{t.actions.yourTurn}</h2>
            <div className={styles.actions}>
                {legal.fold && <button type="button" className={`${styles.button} ${styles.buttonFold}`} onClick={() => onAct({ type: 'fold', seat })}>{t.actions.fold}</button>}
                {legal.check && <button type="button" className={styles.button} onClick={() => onAct({ type: 'check', seat })}>{t.actions.check}</button>}
                {toCall > 0 && <button type="button" className={styles.button} onClick={() => onAct({ type: 'call', seat })}>{t.actions.call(format(toCall))}</button>}
                {raise && (
                    <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => onAct(to >= raise.max ? { type: 'allIn', seat } : { type: 'raise', seat, to })}>
                        {to >= raise.max ? t.actions.allIn(format(raise.max)) : betting ? t.actions.bet(format(to)) : t.actions.raise(format(to))}
                    </button>
                )}
                {!raise && allInTotal !== null && allInIsRaise && (
                    <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={() => onAct({ type: 'allIn', seat })}>{t.actions.allIn(format(allInTotal))}</button>
                )}
            </div>
            {raise && raise.max > raise.min && (
                <div className={styles.raiseRow}>
                    <input type="range" min={raise.min} max={raise.max} step={Math.max(1, state.level.small)} value={to}
                        aria-label={t.actions.amount} onChange={event => setTo(clamp(Number(event.target.value)))} />
                    <input className={styles.amount} type="number" inputMode="numeric" min={raise.min} max={raise.max} value={to}
                        aria-label={t.actions.amount} onChange={event => setTo(Number(event.target.value) || raise.min)} onBlur={() => setTo(current => clamp(current))} />
                    <div className={styles.presets}>
                        <button type="button" className={styles.button} onClick={() => setTo(preset(0.5))}>{t.actions.presets.half}</button>
                        <button type="button" className={styles.button} onClick={() => setTo(preset(0.75))}>{t.actions.presets.threeQuarters}</button>
                        <button type="button" className={styles.button} onClick={() => setTo(preset(1))}>{t.actions.presets.pot}</button>
                        <button type="button" className={styles.button} onClick={() => setTo(raise.max)}>{t.actions.presets.max}</button>
                    </div>
                </div>
            )}
        </section>
    );
};

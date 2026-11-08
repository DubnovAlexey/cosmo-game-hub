// [EN] FILE: games/preferans/components/ScoreSheetDialog.tsx — the score sheet opened large: a window over the table
//      on a computer, a sheet sliding up from the bottom on a phone. Escape, the close button or a click outside
//      closes it, and focus returns where it was. The bots wait while it is open.
// [RU] ФАЙЛ: запись, открытая крупно: окно поверх стола на компьютере, лист снизу на телефоне. Закрывается Escape,
//      кнопкой или щелчком мимо окна, фокус возвращается на место. Пока окно открыто, боты ждут.
import React, { useEffect, useRef } from 'react';
import styles from './ScoreSheet.module.css';

interface ScoreSheetDialogProps {
    labelledBy: string;
    onClose: () => void;
    children: React.ReactNode;
}

export const ScoreSheetDialog: React.FC<ScoreSheetDialogProps> = ({ labelledBy, onClose, children }) => {
    const panel = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        panel.current?.querySelector<HTMLElement>('button')?.focus();
        const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            previous?.focus();
        };
    }, [onClose]);
    return (
        <div className={styles.dialogBackdrop} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
            <div ref={panel} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
                {children}
            </div>
        </div>
    );
};

// [EN] FILE: shared/finale/logic.ts — the end of a game in every game of the hub (Alexey, 12.11.2026: «при проигрышах
//      необходимо сделать издевательскую анимацию и звук, при выигрыше уважительную анимацию и озвучку, касается всех
//      игр»). The opponent who beat you mocks you aloud; the opponent you beat bows and praises you. Here are the
//      lines in five languages, the choice of a line, the voice of a hero and the sound switch of the header — pure
//      data and functions, tested; the picture is Finale.tsx, the sound is sound.ts.
// [RU] ФАЙЛ: конец партии во всех играх хаба (Алексей, 12.11.2026: «при проигрышах необходимо сделать издевательскую
//      анимацию и звук, при выигрыше уважительную анимацию и озвучку, касается всех игр»). Соперник, который вас
//      обыграл, вслух издевается; соперник, которого вы обыграли, кланяется и хвалит. Здесь реплики на пяти языках,
//      выбор реплики, голос героя и выключатель звука в шапке — чистые данные и функции, есть тесты; картинка —
//      Finale.tsx, звук — sound.ts.
import type { Language } from '../i18n/languages.ts';

export type Outcome = 'win' | 'lose';

interface FinaleWords {
    /** [EN] The big word over the hero. [RU] Большое слово над героем. */
    readonly title: Readonly<Record<Outcome, string>>;
    /** [EN] The syllable of the laugh that flies up from the mocking hero. [RU] Слог смеха, который взлетает от насмешника. */
    readonly laugh: string;
    /** [EN] What the hero says. [RU] Что говорит герой. */
    readonly lines: Readonly<Record<Outcome, readonly string[]>>;
    readonly close: string;
}

const NB = ' ';

export const FINALE_WORDS: Readonly<Record<Language, FinaleWords>> = Object.freeze({
    ru: {
        title: { win: 'Победа', lose: 'Ха-ха-ха!' },
        laugh: 'ХА',
        lines: {
            lose: [
                'Ха! Я видел зомби, которые играли лучше. Без головы.',
                'Не расстраивайтесь. Хотя нет — расстраивайтесь, мне это нравится.',
                'Ваша игра была как солнце для вампира: коротко и больно.',
                'Приходите ещё. Мне как раз нужны свежая кровь и свежие проигрыши.',
                'Я бы вас пожалел, но у меня нет сердца. Буквально.',
                'Запишу эту партию в летопись логова. В раздел «Анекдоты».',
                'Не плачьте: солёное портит мне аппетит.',
                'Браво! Так красиво проигрывают только у нас в склепе.',
            ],
            win: [
                'Склоняю голову. Сегодня вы были сильнее тьмы.',
                'Достойная победа. Логово запомнит ваше имя.',
                'Признаю поражение. Это было честно и красиво.',
                'Браво! Даже мертвецы аплодируют вам стоя.',
                'Вы победили. Я выпью за вас — чего-нибудь красного.',
                'Редкий гость уходит отсюда победителем. Вы — один из них.',
                'Сильная игра. В следующий раз я подготовлюсь лучше, обещаю.',
                'Снимаю шляпу. И, пожалуй, корону — сегодня она ваша.',
            ],
        },
        close: 'Закрыть',
    },
    en: {
        title: { win: 'Victory', lose: 'Ha-ha-ha!' },
        laugh: 'HA',
        lines: {
            lose: [
                'Ha! I have seen zombies play better. Headless ones.',
                'Don’t be upset. Actually, do be upset — I enjoy it.',
                'Your game was like sunlight to a vampire: short and painful.',
                'Come again. I could use fresh blood — and fresh defeats.',
                'I would pity you, but I have no heart. Literally.',
                'I shall write this game into the chronicle of the lair. Under “Jokes”.',
                'Don’t cry: salty things spoil my appetite.',
                'Bravo! Only in our crypt does anyone lose so beautifully.',
            ],
            win: [
                'I bow my head. Today you were stronger than the dark.',
                'A worthy victory. The lair will remember your name.',
                'I admit defeat. That was fair and beautiful.',
                'Bravo! Even the dead give you a standing ovation.',
                'You have won. I shall drink to you — something red.',
                'Few guests leave this place as victors. You are one of them.',
                'A strong game. Next time I shall prepare better, I promise.',
                'I take off my hat. And my crown too — today it is yours.',
            ],
        },
        close: 'Close',
    },
    he: {
        title: { win: 'ניצחון', lose: 'חה־חה־חה!' },
        laugh: 'חה',
        lines: {
            lose: [
                'הא! ראיתי זומבים שמשחקים טוב יותר. בלי ראש.',
                'אל תתעצבו. בעצם, כן תתעצבו — אני נהנה מזה.',
                'המשחק שלכם היה כמו שמש לערפד: קצר וכואב.',
                'בואו שוב. אני צריך דם טרי — והפסדים טריים.',
                'הייתי מרחם עליכם, אבל אין לי לב. ממש.',
                'ארשום את המשחק הזה בדברי הימים של המאורה. במדור „בדיחות“.',
                'אל תבכו: מלוח מקלקל לי את התיאבון.',
                'בראבו! רק אצלנו בקריפטה מפסידים כל כך יפה.',
            ],
            win: [
                'אני מרכין ראש. היום הייתם חזקים מהחושך.',
                'ניצחון ראוי. המאורה תזכור את שמכם.',
                'אני מודה בהפסד. זה היה הוגן ויפה.',
                'בראבו! אפילו המתים מוחאים לכם כפיים בעמידה.',
                'ניצחתם. אשתה לחייכם — משהו אדום.',
                'מעט אורחים יוצאים מכאן כמנצחים. אתם ביניהם.',
                'משחק חזק. בפעם הבאה אתכונן טוב יותר, מבטיח.',
                'אני מוריד בפניכם את הכובע. וגם את הכתר — היום הוא שלכם.',
            ],
        },
        close: 'סגירה',
    },
    es: {
        title: { win: 'Victoria', lose: '¡Ja, ja, ja!' },
        laugh: 'JA',
        lines: {
            lose: [
                '¡Ja! He visto zombis jugar mejor. Y sin cabeza.',
                'No te enfades. Bueno, sí, enfádate: me encanta.',
                'Tu partida fue como el sol para un vampiro: corta y dolorosa.',
                'Vuelve pronto. Me hace falta sangre fresca y derrotas frescas.',
                'Te tendría lástima, pero no tengo corazón. Literalmente.',
                'Apuntaré esta partida en la crónica de la guarida. En la sección «Chistes».',
                'No llores: lo salado me quita el apetito.',
                '¡Bravo! Solo en nuestra cripta se pierde con tanta elegancia.',
            ],
            win: [
                'Inclino la cabeza. Hoy fuiste más fuerte que la oscuridad.',
                'Una victoria digna. La guarida recordará tu nombre.',
                'Reconozco la derrota. Fue limpio y hermoso.',
                '¡Bravo! Hasta los muertos te aplauden de pie.',
                'Has ganado. Brindaré por ti con algo rojo.',
                'Pocos invitados salen de aquí victoriosos. Tú eres uno de ellos.',
                'Una gran partida. La próxima vez me prepararé mejor, lo prometo.',
                'Me quito el sombrero. Y la corona también: hoy es tuya.',
            ],
        },
        close: 'Cerrar',
    },
    fr: {
        title: { win: 'Victoire', lose: `Ha, ha, ha${NB}!` },
        laugh: 'HA',
        lines: {
            lose: [
                `Ha${NB}! J’ai vu des zombies mieux jouer. Sans tête.`,
                'Ne soyez pas triste. Enfin si, soyez-le — j’adore ça.',
                `Votre partie était comme le soleil pour un vampire${NB}: courte et douloureuse.`,
                'Revenez vite. J’ai besoin de sang frais — et de défaites fraîches.',
                'Je vous plaindrais bien, mais je n’ai pas de cœur. Littéralement.',
                `J’inscrirai cette partie dans la chronique du repaire. Rubrique «${NB}Blagues${NB}».`,
                `Ne pleurez pas${NB}: le salé me coupe l’appétit.`,
                `Bravo${NB}! Il n’y a que dans notre crypte qu’on perd avec tant d’élégance.`,
            ],
            win: [
                'Je m’incline. Aujourd’hui, vous étiez plus fort que les ténèbres.',
                'Une victoire méritée. Le repaire se souviendra de votre nom.',
                'Je reconnais ma défaite. C’était loyal et beau.',
                `Bravo${NB}! Même les morts vous applaudissent debout.`,
                'Vous avez gagné. Je boirai à votre santé — quelque chose de rouge.',
                'Rares sont les invités qui repartent vainqueurs. Vous en êtes.',
                'Belle partie. La prochaine fois, je me préparerai mieux, promis.',
                'Je vous tire mon chapeau. Et ma couronne aussi — aujourd’hui, elle est à vous.',
            ],
        },
        close: 'Fermer',
    },
});

/**
 * [EN] A line for this end, never the one said last time. [RU] Реплика для этого конца, никогда не та, что прозвучала прошлый раз.
 */
export function pickLine(outcome: Outcome, language: Language, random: () => number, previous: string | null = null): string {
    const lines = FINALE_WORDS[language].lines[outcome];
    const fresh = lines.filter(line => line !== previous);
    return fresh[Math.min(fresh.length - 1, Math.floor(random() * fresh.length))];
}

/** [EN] The language tag a voice of the browser must start with. [RU] С чего должен начинаться язык голоса браузера. */
export const VOICE_LANG: Readonly<Record<Language, string>> = Object.freeze({ ru: 'ru', en: 'en', he: 'he', es: 'es', fr: 'fr' });

/**
 * [EN] How the hero speaks: the winner sneers low and slow; the loser speaks calmly and with dignity. A woman's voice
 *      sits higher. [RU] Как говорит герой: победитель-насмешник — низко и медленно, с издёвкой; проигравший — спокойно и
 *      с достоинством. Женский голос выше.
 */
export function voiceOf(outcome: Outcome, female: boolean): { readonly pitch: number; readonly rate: number } {
    const base = outcome === 'lose' ? { pitch: 0.55, rate: 0.9 } : { pitch: 1, rate: 0.92 };
    return { pitch: Math.min(2, base.pitch + (female ? 0.35 : 0)), rate: base.rate };
}

/** [EN] How long the finale stays on the screen, ms. [RU] Сколько финал держится на экране, мс. */
export const FINALE_TIME = 7600;

/** [EN] The sound switch of the header: the key in the storage and the window event. [RU] Выключатель звука в шапке: ключ хранилища и событие окна. */
export const SOUND_KEY = 'cosmo-game-hub:sound';
export const SOUND_EVENT = 'cosmo-game-hub:sound';
/** [EN] Sound is on unless the player switched it off. [RU] Звук включён, пока игрок его не выключил. */
export const soundEnabled = (stored: string | null): boolean => stored !== 'off';

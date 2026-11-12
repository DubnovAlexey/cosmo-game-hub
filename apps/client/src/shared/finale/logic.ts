// [EN] FILE: shared/finale/logic.ts — the end of a game in every game of the hub (Alexey, 12.11.2026: «при проигрышах
//      необходимо сделать издевательскую анимацию и звук, при выигрыше уважительную анимацию и озвучку, касается всех
//      игр»). The opponent you beat bows and praises you. The opponent who beat you mocks you — the grown-up way, with
//      false sympathy, in one of several scenes («не детская дразнилка… можно несколько разных концовок… что какой же
//      ты идиот, я сожалею… как же тебе не повезло»). Here are the scenes and the lines in five languages, the choice
//      of a scene and a line, the voice of a hero and the sound switch of the header — pure data and functions,
//      tested; the picture is Finale.tsx, the sound is sound.ts.
// [RU] ФАЙЛ: конец партии во всех играх хаба (Алексей, 12.11.2026: «при проигрышах необходимо сделать издевательскую
//      анимацию и звук, при выигрыше уважительную анимацию и озвучку, касается всех игр»). Соперник, которого вы
//      обыграли, кланяется и хвалит. Соперник, который обыграл вас, издевается — по-взрослому, с фальшивым
//      сочувствием, в одной из нескольких сцен («не детская дразнилка… можно несколько разных концовок… что какой же
//      ты идиот, я сожалею… как же тебе не повезло»). Здесь сцены и реплики на пяти языках, выбор сцены и реплики,
//      голос героя и выключатель звука в шапке — чистые данные и функции, есть тесты; картинка — Finale.tsx, звук —
//      sound.ts.
import type { Language } from '../i18n/languages.ts';

export type Outcome = 'win' | 'lose';

/**
 * [EN] The scenes of mockery: alms (a spotlight, a slow sarcastic applause, a coin tossed to you); condolences (your
 *      portrait in a mourning frame, the smallest violin in the world); a shake of the head (a sigh, «tsk-tsk-tsk»); a
 *      medal for taking part (a tin medal, a few polite claps).
 * [RU] Сцены издёвки: подачка (прожектор, медленные саркастические аплодисменты, вам бросают монету); соболезнования
 *      (ваш портрет в траурной рамке, самая маленькая скрипка в мире); покачивание головой (вздох, «тц-тц-тц»); медаль за
 *      участие (жестяная медаль, несколько вежливых хлопков).
 */
export type MockScene = 'alms' | 'condolences' | 'headshake' | 'medal';
export const MOCK_SCENES: readonly MockScene[] = Object.freeze(['alms', 'condolences', 'headshake', 'medal']);

interface Speech {
    /** [EN] The big words over the hero. [RU] Большие слова над героем. */
    readonly title: string;
    /** [EN] What the hero says. [RU] Что говорит герой. */
    readonly lines: readonly string[];
}

interface FinaleWords {
    readonly honour: Speech;
    readonly mock: Readonly<Record<MockScene, Speech>>;
    readonly close: string;
}

const NB = '\u00a0';

export const FINALE_WORDS: Readonly<Record<Language, FinaleWords>> = Object.freeze({
    ru: {
        honour: {
            title: 'Победа',
            lines: [
                'Склоняю голову. Сегодня вы были сильнее тьмы.',
                'Достойная победа. Логово запомнит ваше имя.',
                'Признаю поражение. Это было честно и красиво.',
                'Браво! Даже мертвецы аплодируют вам стоя.',
                'Вы победили. Я выпью за вас — чего-нибудь красного.',
                'Редкий гость уходит отсюда победителем. Вы — один из них.',
            ],
        },
        mock: {
            alms: {
                title: 'Браво… браво.',
                lines: [
                    'Возьмите монетку. На новую голову — старая, похоже, не работает.',
                    'Не благодарите. Мы в логове всегда подаём убогим.',
                    'Браво. Так уверенно проиграть — тоже надо уметь.',
                ],
            },
            condolences: {
                title: 'Соболезную.',
                lines: [
                    'Мои искренние соболезнования. Вашему уму.',
                    'Как же вам не повезло… родиться без таланта.',
                    'Слышите скрипку? Самая маленькая в мире — играет лично для вас.',
                ],
            },
            headshake: {
                title: 'Тц-тц-тц…',
                lines: [
                    'Ох… Я даже не знаю, что сказать. Хотя нет, знаю: это было ужасно.',
                    'Мне вас жаль. Правда. Совсем чуть-чуть.',
                    'Какой же вы… нет, не скажу. Воспитание не позволяет.',
                ],
            },
            medal: {
                title: 'Почётный участник',
                lines: [
                    'Поздравляю с почётным вторым местом. Из двух.',
                    'Вот вам медаль. За участие. И за смелость проигрывать так открыто.',
                    'Главное — не победа, а участие. Это придумали проигравшие.',
                ],
            },
        },
        close: 'Закрыть',
    },
    en: {
        honour: {
            title: 'Victory',
            lines: [
                'I bow my head. Today you were stronger than the dark.',
                'A worthy victory. The lair will remember your name.',
                'I admit defeat. That was fair and beautiful.',
                'Bravo! Even the dead give you a standing ovation.',
                'You have won. I shall drink to you — something red.',
                'Few guests leave this place as victors. You are one of them.',
            ],
        },
        mock: {
            alms: {
                title: 'Bravo… bravo.',
                lines: [
                    'Take a coin. For a new head — the old one doesn’t seem to work.',
                    'Don’t thank me. In the lair we always give to the poor in spirit.',
                    'Bravo. Losing with such confidence is a skill too.',
                ],
            },
            condolences: {
                title: 'My condolences.',
                lines: [
                    'My sincere condolences. To your mind.',
                    'How unlucky you are… to be born without talent.',
                    'Hear the violin? The smallest in the world — playing just for you.',
                ],
            },
            headshake: {
                title: 'Tsk, tsk, tsk…',
                lines: [
                    'Oh… I don’t even know what to say. Actually, I do: that was awful.',
                    'I feel sorry for you. Really. Just a little.',
                    'What an… no, I won’t say it. My upbringing forbids it.',
                ],
            },
            medal: {
                title: 'Honourable participant',
                lines: [
                    'Congratulations on an honourable second place. Out of two.',
                    'Here is a medal. For taking part. And for the courage to lose so openly.',
                    'Taking part is what matters, not winning. Losers made that up.',
                ],
            },
        },
        close: 'Close',
    },
    he: {
        honour: {
            title: 'ניצחון',
            lines: [
                'אני מרכין ראש. היום הייתם חזקים מהחושך.',
                'ניצחון ראוי. המאורה תזכור את שמכם.',
                'זה היה הוגן ויפה. ההפסד שלי, הכבוד שלכם.',
                'בראבו! אפילו המתים מוחאים לכם כפיים בעמידה.',
                'ניצחתם. אשתה לחייכם — משהו אדום.',
                'מעט אורחים יוצאים מכאן כמנצחים. אתם ביניהם.',
            ],
        },
        mock: {
            alms: {
                title: 'בראבו… בראבו.',
                lines: [
                    'קחו מטבע. לראש חדש — הישן, כנראה, לא עובד.',
                    'אל תודו לי. במאורה אנחנו תמיד נותנים לעניי רוח.',
                    'בראבו. להפסיד בביטחון כזה — גם זו אמנות.',
                ],
            },
            condolences: {
                title: 'תנחומיי.',
                lines: [
                    'תנחומיי הכנים. לשכל שלכם.',
                    'כמה חבל… שנולדתם בלי כישרון.',
                    'שומעים את הכינור? הקטן בעולם — מנגן רק בשבילכם.',
                ],
            },
            headshake: {
                title: 'נו, נו, נו…',
                lines: [
                    'אוי… אין לי מילים. בעצם יש: זה היה נורא.',
                    'חבל לי עליכם. באמת. רק קצת.',
                    'איזה… לא, לא אגיד. החינוך שלי לא מרשה.',
                ],
            },
            medal: {
                title: 'משתתף של כבוד',
                lines: [
                    'מזל טוב על המקום השני המכובד. מתוך שניים.',
                    'הנה מדליה. על ההשתתפות. ועל האומץ להפסיד בגלוי כל כך.',
                    'העיקר ההשתתפות, לא הניצחון. את זה המציאו המפסידים.',
                ],
            },
        },
        close: 'סגירה',
    },
    es: {
        honour: {
            title: 'Victoria',
            lines: [
                'Inclino la cabeza. Hoy fuiste más fuerte que la oscuridad.',
                'Una victoria digna. La guarida recordará tu nombre.',
                'Reconozco la derrota. Fue limpio y hermoso.',
                '¡Bravo! Hasta los muertos te aplauden de pie.',
                'Has ganado. Brindaré por ti con algo rojo.',
                'Pocos invitados salen de aquí victoriosos. Tú eres uno de ellos.',
            ],
        },
        mock: {
            alms: {
                title: 'Bravo… bravo.',
                lines: [
                    'Toma una moneda. Para una cabeza nueva: la vieja no parece funcionar.',
                    'No me lo agradezcas. En la guarida siempre damos limosna a los pobres de espíritu.',
                    'Bravo. Perder con tanta seguridad también tiene su mérito.',
                ],
            },
            condolences: {
                title: 'Mis condolencias.',
                lines: [
                    'Mi más sentido pésame. A tu cerebro.',
                    'Qué mala suerte… nacer sin talento.',
                    '¿Oyes el violín? El más pequeño del mundo, y toca solo para ti.',
                ],
            },
            headshake: {
                title: 'Tsk, tsk, tsk…',
                lines: [
                    'Ay… No sé ni qué decir. Bueno, sí: ha sido horrible.',
                    'Me das pena. De verdad. Un poquito.',
                    'Qué… no, no lo diré. Mi educación no me lo permite.',
                ],
            },
            medal: {
                title: 'Participante de honor',
                lines: [
                    'Enhorabuena por tu honroso segundo puesto. De dos.',
                    'Aquí tienes una medalla. Por participar. Y por el valor de perder tan abiertamente.',
                    'Lo importante es participar, no ganar. Eso lo inventaron los perdedores.',
                ],
            },
        },
        close: 'Cerrar',
    },
    fr: {
        honour: {
            title: 'Victoire',
            lines: [
                'Je m’incline. Aujourd’hui, vous étiez plus fort que les ténèbres.',
                'Une victoire méritée. Le repaire se souviendra de votre nom.',
                'Je reconnais ma défaite. C’était loyal et beau.',
                `Bravo${NB}! Même les morts vous applaudissent debout.`,
                'Vous avez gagné. Je boirai à votre santé — quelque chose de rouge.',
                'Rares sont les invités qui repartent vainqueurs. Vous en êtes.',
            ],
        },
        mock: {
            alms: {
                title: 'Bravo… bravo.',
                lines: [
                    'Prenez une pièce. Pour une tête neuve — l’ancienne ne semble pas marcher.',
                    'Ne me remerciez pas. Au repaire, nous donnons toujours aux pauvres d’esprit.',
                    'Bravo. Perdre avec tant d’assurance, c’est un talent aussi.',
                ],
            },
            condolences: {
                title: 'Mes condoléances.',
                lines: [
                    'Mes sincères condoléances. À votre cerveau.',
                    'Quelle malchance… être né sans talent.',
                    `Vous entendez le violon${NB}? Le plus petit du monde — il joue rien que pour vous.`,
                ],
            },
            headshake: {
                title: 'Tss, tss, tss…',
                lines: [
                    `Oh… Je ne sais même pas quoi dire. Si, je sais${NB}: c’était affreux.`,
                    'Je vous plains. Vraiment. Un tout petit peu.',
                    'Quel… non, je ne le dirai pas. Mon éducation me l’interdit.',
                ],
            },
            medal: {
                title: 'Participant d’honneur',
                lines: [
                    'Félicitations pour cette honorable deuxième place. Sur deux.',
                    'Voici une médaille. Pour la participation. Et pour le courage de perdre si ouvertement.',
                    'L’important, c’est de participer, pas de gagner. Ce sont les perdants qui l’ont inventé.',
                ],
            },
        },
        close: 'Fermer',
    },
});

/**
 * [EN] Losing streaks in one game are crowned (Alexey, 12.11.2026: «если проиграл 3 раза подряд или 5 раз подряд, то
 *      прям вручается медаль „Идиот года“»): three in a row — the medal «Idiot of the Year», five — the cup «Idiot of
 *      the Decade», seven — «Idiot of the Century», ten and every five more — the super medal «Clinical Idiot» with
 *      fireworks of dung («фейерверки из говна»). A win breaks the streak.
 * [RU] Серии проигрышей в одной игре награждаются (Алексей, 12.11.2026: «если проиграл 3 раза подряд или 5 раз подряд,
 *      то прям вручается медаль „Идиот года“»): три подряд — медаль «Идиот года», пять — кубок «Идиот десятилетия»,
 *      семь — «Идиот века», десять и каждые следующие пять — супермедаль «Клинический идиот» с фейерверком из говна.
 *      Победа обрывает серию.
 */
export type AwardId = 'year' | 'decade' | 'century' | 'clinical';

export function awardFor(streak: number): AwardId | null {
    if (streak >= 10 && streak % 5 === 0) return 'clinical';
    if (streak === 7) return 'century';
    if (streak === 5) return 'decade';
    if (streak === 3) return 'year';
    return null;
}

/** [EN] The streak after this end. [RU] Серия после этого конца. */
export const nextStreak = (streak: number, outcome: Outcome): number => (outcome === 'lose' ? streak + 1 : 0);

/** [EN] Where a game keeps its losing streak: the key plus the name of the game. [RU] Где игра хранит серию проигрышей: ключ плюс имя игры. */
export const STREAK_KEY = 'cosmo-game-hub:losing-streak:';

export const AWARD_WORDS: Readonly<Record<Language, Readonly<Record<AwardId, Speech>>>> = Object.freeze({
    ru: {
        year: { title: '«Идиот года»', lines: ['Три поражения подряд! Логово торжественно вручает вам медаль «Идиот года». Носите с гордостью.'] },
        decade: { title: '«Идиот десятилетия»', lines: ['Пять поражений подряд. Это уже не случайность, это талант. Кубок «Идиот десятилетия» — ваш.'] },
        century: { title: '«Идиот века»', lines: ['Семь поражений подряд! Склеп такого не видел сто лет. Вы — «Идиот века». Памятник уже заказан.'] },
        clinical: { title: '«Клинический идиот»', lines: ['Медицина бессильна. Вручаем высшую награду логова — «Клинический идиот». Салют в вашу честь!'] },
    },
    en: {
        year: { title: '“Idiot of the Year”', lines: ['Three defeats in a row! The lair solemnly presents you with the medal “Idiot of the Year”. Wear it with pride.'] },
        decade: { title: '“Idiot of the Decade”', lines: ['Five defeats in a row. That is no accident any more, that is a gift. The cup “Idiot of the Decade” is yours.'] },
        century: { title: '“Idiot of the Century”', lines: ['Seven defeats in a row! The crypt has not seen the like in a hundred years. You are the “Idiot of the Century”.'] },
        clinical: { title: '“Clinical Idiot”', lines: ['Medicine is powerless. The highest award of the lair — “Clinical Idiot”. A salute in your honour!'] },
    },
    he: {
        year: { title: '„אידיוט השנה“', lines: ['שלושה הפסדים ברצף! המאורה מעניקה לכם בטקס חגיגי את המדליה „אידיוט השנה“. ענדו אותה בגאווה.'] },
        decade: { title: '„אידיוט העשור“', lines: ['חמישה הפסדים ברצף. זה כבר לא מקרה, זה כישרון. הגביע „אידיוט העשור“ שלכם.'] },
        century: { title: '„אידיוט המאה“', lines: ['שבעה הפסדים ברצף! הקריפטה לא ראתה דבר כזה מאה שנה. אתם „אידיוט המאה“. הפסל כבר הוזמן.'] },
        clinical: { title: '„אידיוט קליני“', lines: ['הרפואה חסרת אונים. הפרס העליון של המאורה — „אידיוט קליני“. זיקוקים לכבודכם!'] },
    },
    es: {
        year: { title: '«Idiota del año»', lines: ['¡Tres derrotas seguidas! La guarida te entrega solemnemente la medalla «Idiota del año». Llévala con orgullo.'] },
        decade: { title: '«Idiota de la década»', lines: ['Cinco derrotas seguidas. Ya no es casualidad, es talento. La copa «Idiota de la década» es tuya.'] },
        century: { title: '«Idiota del siglo»', lines: ['¡Siete derrotas seguidas! La cripta no veía algo así desde hace cien años. Eres el «Idiota del siglo».'] },
        clinical: { title: '«Idiota clínico»', lines: ['La medicina no puede hacer nada. El máximo galardón de la guarida: «Idiota clínico». ¡Fuegos artificiales en tu honor!'] },
    },
    fr: {
        year: { title: `«${NB}Idiot de l’année${NB}»`, lines: [`Trois défaites d’affilée${NB}! Le repaire vous remet solennellement la médaille «${NB}Idiot de l’année${NB}».`] },
        decade: { title: `«${NB}Idiot de la décennie${NB}»`, lines: [`Cinq défaites d’affilée. Ce n’est plus un hasard, c’est un don. La coupe «${NB}Idiot de la décennie${NB}» est à vous.`] },
        century: { title: `«${NB}Idiot du siècle${NB}»`, lines: [`Sept défaites d’affilée${NB}! La crypte n’avait rien vu de tel depuis cent ans. Vous êtes l’«${NB}Idiot du siècle${NB}».`] },
        clinical: { title: `«${NB}Idiot clinique${NB}»`, lines: [`La médecine est impuissante. Plus haute distinction du repaire${NB}: «${NB}Idiot clinique${NB}». Feu d’artifice en votre honneur${NB}!`] },
    },
});

/** [EN] The words of this end. [RU] Слова этого конца. */
export const speechOf = (language: Language, outcome: Outcome, scene: MockScene): Speech =>
    outcome === 'win' ? FINALE_WORDS[language].honour : FINALE_WORDS[language].mock[scene];

/** [EN] A scene of mockery, never the one shown last time. [RU] Сцена издёвки, никогда не та, что была в прошлый раз. */
export function pickScene(random: () => number, previous: MockScene | null = null): MockScene {
    const fresh = MOCK_SCENES.filter(scene => scene !== previous);
    return fresh[Math.min(fresh.length - 1, Math.floor(random() * fresh.length))];
}

/** [EN] A line of the speech, never the one said last time. [RU] Реплика, никогда не та, что прозвучала прошлый раз. */
export function pickLine(speech: Speech, random: () => number, previous: string | null = null): string {
    const fresh = speech.lines.filter(line => line !== previous);
    return fresh[Math.min(fresh.length - 1, Math.floor(random() * fresh.length))];
}

/** [EN] The language tag a voice of the browser must start with. [RU] С чего должен начинаться язык голоса браузера. */
export const VOICE_LANG: Readonly<Record<Language, string>> = Object.freeze({ ru: 'ru', en: 'en', he: 'he', es: 'es', fr: 'fr' });

/**
 * [EN] How the hero speaks: the winner drawls slowly and coldly, with false pity; the loser speaks calmly and with
 *      dignity. A woman's voice sits higher. [RU] Как говорит герой: победитель цедит медленно и холодно, с фальшивой
 *      жалостью; проигравший говорит спокойно и с достоинством. Женский голос выше.
 */
export function voiceOf(outcome: Outcome, female: boolean): { readonly pitch: number; readonly rate: number } {
    const base = outcome === 'lose' ? { pitch: 0.8, rate: 0.82 } : { pitch: 1, rate: 0.92 };
    return { pitch: Math.min(2, base.pitch + (female ? 0.3 : 0)), rate: base.rate };
}

/** [EN] When the hero starts to speak, after the music of the scene, ms. [RU] Когда герой начинает говорить — после музыки сцены, мс. */
export const VOICE_AT: Readonly<Record<MockScene | 'honour' | 'award', number>> = Object.freeze({
    honour: 3200, alms: 6300, condolences: 4600, headshake: 3600, medal: 4200, award: 4800,
});

/** [EN] How long the finale stays on the screen, ms. [RU] Сколько финал держится на экране, мс. */
export const FINALE_TIME = 11500;

/** [EN] The window event that shows any scene on demand (Finale.tsx). [RU] Событие окна, которое показывает любую сцену по запросу (Finale.tsx). */
export const FINALE_EVENT = 'cosmo-game-hub:finale';

/** [EN] The sound switch of the header: the key in the storage and the window event. [RU] Выключатель звука в шапке: ключ хранилища и событие окна. */
export const SOUND_KEY = 'cosmo-game-hub:sound';
export const SOUND_EVENT = 'cosmo-game-hub:sound';
/** [EN] Sound is on unless the player switched it off. [RU] Звук включён, пока игрок его не выключил. */
export const soundEnabled = (stored: string | null): boolean => stored !== 'off';

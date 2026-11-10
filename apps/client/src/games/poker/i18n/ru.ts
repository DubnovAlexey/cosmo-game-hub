// [EN] FILE: games/poker/i18n/ru.ts — the poker table in Russian (the master text), with the terms Russian players
//      use: фолд, чек, колл, бет, рейз, олл-ин, баттон, префлоп, флоп, тёрн, ривер.
// [RU] ФАЙЛ: покерный стол по-русски (основной текст), с терминами, которыми говорят русские игроки: фолд, чек,
//      колл, бет, рейз, олл-ин, баттон, префлоп, флоп, тёрн, ривер.
import type { PokerTexts, Who } from './types';

const plural = (n: number, one: string, few: string, many: string): string => {
  const tens = n % 100;
  const units = n % 10;
  if (tens >= 11 && tens <= 14) return many;
  if (units === 1) return one;
  if (units >= 2 && units <= 4) return few;
  return many;
};
const RANK_NAMES = ['двойка', 'тройка', 'четвёрка', 'пятёрка', 'шестёрка', 'семёрка', 'восьмёрка', 'девятка', 'десятка', 'валет', 'дама', 'король', 'туз'];
const SUIT_NAMES = ['пик', 'червей', 'бубен', 'треф'];
const name = (who: Who): string => (who.you ? 'Вы' : who.name);

const ru: PokerTexts = {
  language: 'ru',
  gameTitle: 'Покер',
  tagline: 'Техасский холдем · турнир на выбывание · вы против завсегдатаев склепа',
  header: {
    language: 'Язык',
    save: 'Сохранить',
    savedAt: time => `сохранено в ${time}`,
    menu: 'Меню стола',
    level: (small, big, ante, hand) => `Блайнды ${small}/${big}${ante > 0 ? ` · анте ${ante}` : ''} · раздача ${hand}`,
  },
  setup: {
    title: 'Покерный стол логова',
    intro: 'Техасский холдем без лимита, турнир на выбывание: у всех поровну фишек, блайнды растут, пока за столом не останется один. Соперники — завсегдатаи склепа, и у каждого своя манера.',
    noMoney: 'Только игровые фишки: это игра и урок вероятностей, а не ставки на деньги.',
    opponents: 'Соперников за столом',
    opponentsCount: count => `${count} ${plural(count, 'соперник', 'соперника', 'соперников')}`,
    stack: 'Фишек у каждого',
    speed: 'Блайнды растут',
    speeds: { slow: 'медленно', normal: 'обычно', fast: 'быстро' },
    speedHint: hands => `каждые ${hands} ${plural(hands, 'раздачу', 'раздачи', 'раздач')}`,
    strength: 'Сила соперников',
    strengths: { casual: 'обычные — ошибаются', strong: 'сильные — считают' },
    start: 'Сесть за стол',
    continue: 'Продолжить турнир',
    savedLine: (hand, players, when) => `Сохранён турнир: раздача ${hand}, за столом ${players}, ${when}`,
    close: 'Закрыть меню',
  },
  seat: {
    you: 'Вы',
    dealer: 'Баттон',
    smallBlind: 'МБ',
    bigBlind: 'ББ',
    folded: 'фолд',
    allIn: 'олл-ин',
    thinking: 'думает…',
    out: 'вне игры',
    stack: chips => `${chips} в стеке`,
    about: who => `Кто это: ${who}`,
  },
  actions: {
    fold: 'Фолд',
    check: 'Чек',
    call: amount => `Колл ${amount}`,
    bet: to => `Бет ${to}`,
    raise: to => `Рейз до ${to}`,
    allIn: amount => `Олл-ин ${amount}`,
    amount: 'Ставка',
    presets: { half: '½ банка', threeQuarters: '¾ банка', pot: 'Банк', max: 'Всё' },
    yourTurn: 'Ваш ход',
    waiting: who => `Ход: ${who.name}`,
  },
  streets: { preflop: 'Префлоп', flop: 'Флоп', turn: 'Тёрн', river: 'Ривер', showdown: 'Вскрытие' },
  pot: amount => `Банк ${amount}`,
  sidePot: (index, amount) => `Побочный банк ${index}: ${amount}`,
  hands: ['Старшая карта', 'Пара', 'Две пары', 'Сет', 'Стрит', 'Флеш', 'Фулл-хаус', 'Каре', 'Стрит-флеш', 'Роял-флеш'],
  log: {
    title: 'Ход раздачи',
    blinds: (small, big, ante) => `Блайнды ${small}/${big}${ante ? `, анте ${ante}` : ''}`,
    fold: who => `${name(who)}: фолд`,
    check: who => `${name(who)}: чек`,
    call: (who, to, allIn) => `${name(who)}: колл ${to}${allIn ? ', олл-ин' : ''}`,
    bet: (who, to, allIn) => `${name(who)}: бет ${to}${allIn ? ', олл-ин' : ''}`,
    raise: (who, to, allIn) => `${name(who)}: рейз до ${to}${allIn ? ', олл-ин' : ''}`,
    street: (street, cards) => `${street}: ${cards}`,
  },
  results: {
    wins: (who, amount, hand) => (who.you ? `Вы забираете ${amount} — ${hand}` : `${who.name} забирает ${amount} — ${hand}`),
    uncontested: (who, amount) => (who.you ? `Вы забираете ${amount} без вскрытия` : `${who.name} забирает ${amount} без вскрытия`),
    returned: (who, amount) => (who.you ? `Вам вернулась неуравненная ставка ${amount}` : `${who.name}: возврат неуравненной ставки ${amount}`),
    split: (names, amount, hand) => `Банк ${amount} делят ${names} — ${hand}`,
    nextHand: 'Следующая раздача',
    youWon: 'Вы выиграли турнир! Все фишки склепа — ваши.',
    youOut: (place, players) => `Вы выбыли: ${place}-е место из ${players}.`,
    botWon: who => `Турнир забирает ${who.name}.`,
    newTournament: 'Новый турнир',
  },
  cards: { name: (rank, suit) => `${RANK_NAMES[rank]} ${SUIT_NAMES[suit]}`, back: 'карта рубашкой вверх' },
  characters: {
    vlad: { name: 'Граф Влад', tagline: 'Играет мало рук, зато каждую — до последней капли.' },
    carmilla: { name: 'Кармилла', tagline: 'Улыбается одинаково и с тузами, и с пустотой. Угадайте, что у неё.' },
    koschei: { name: 'Кощей', tagline: 'Бессмертен и потому не торопится: ждёт тузов хоть сто лет.' },
    stilet: { name: 'Дон Стилет', tagline: 'Ставит так, будто банк уже его. Иногда это правда.' },
    kaznachey: { name: 'Казначей Костяшкин', tagline: 'Платит, чтобы посмотреть каждую карту: казна сама себя не проверит.' },
    lilith: { name: 'Лилит', tagline: 'Считает шансы банка быстрее, чем вы успеете моргнуть.' },
    crystal: { name: 'Хрустальный Череп', tagline: 'Насквозь прозрачен, а прочесть невозможно: внутри одна математика.' },
    galeon: { name: 'Капитан Галеон', tagline: 'Идёт олл-ин, как на абордаж: громко и без сомнений.' },
    shadow: { name: 'Леди Тень', tagline: 'Молчит над сильной рукой и ставит, когда у неё ничего.' },
    semyonych: { name: 'Енот Семёныч', tagline: 'Сорок лет кухонного покера: знает все уловки, половину придумал сам.' },
  },
};

export default ru;

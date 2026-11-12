// [EN] FILE: shared/characters/roster.ts — who lives in the lair: the same company sits down at every table of the hub
//      (preferans, poker, chess, the sea battle, draughts), so the characters belong to no single game. The lair has
//      sixty-seven dwellers (vampires, ghouls, necromancers — five of them up from the catacombs —, a masked empress,
//      a weeping queen, a plague doctor…) and seventy-nine guests from the neighbouring worlds (an alchemist, a zombie
//      from Marseille, aliens, a raccoon, a ronin from an old print, neon vampires, four dead pirates, a quartet of
//      four worlds… and since 12.11.2026 the thirty space guests of «Кровная рента», SPACE_FOLK). Here is only what does not depend on a game or a language: the name of the record, the
//      grammatical gender, dweller or guest, where the picture lies and, for a wide picture, where the face is.
//      Names and biographies — texts/*.ts; how a character plays — in each game
//      (games/preferans/characters/roster.ts, games/poker/characters.ts, games/chess/…).
//      Pictures: Alexey's own collection (Desktop «Favicon», 08–09.11.2026; some from StockCake, free to use; the
//      pirates — Desktop «Морской бой», the necromancers — Desktop «Шашки», 11.11.2026; the space guests — generated
//      on our own GPU, FLUX.1 Krea, Desktop «Кровная рента», 12.11.2026), whole, with their backgrounds, only scaled
//      down, in public/shared/characters — one copy for all the games.
//      Pure data without React, so the Node tests use it too.
// [RU] ФАЙЛ: кто живёт в логове: одна и та же компания садится за любой стол хаба (преферанс, покер, шахматы,
//      морской бой, шашки), поэтому герои не принадлежат ни одной игре. В логове шестьдесят семь обитателей
//      (вампиры, упыри, некроманты — пятеро поднялись из катакомб, — императрица в маске, плачущая королева, чумной
//      доктор…) и семьдесят девять гостей из соседних миров (алхимик, зомби из Марселя, пришельцы, енот, ронин со старой
//      гравюры, неоновые вампирши, четыре мёртвых пирата, квартет четырёх миров… и с 12.11.2026 тридцать космических
//      гостей «Кровной ренты», SPACE_FOLK). Здесь только то, что не зависит от
//      игры и языка: имя записи, грамматический род, обитатель или гость, где лежит картинка и, для широкой картинки,
//      где на ней лицо. Имена и биографии — texts/*.ts; как герой играет — в каждой
//      игре (games/preferans/characters/roster.ts, games/poker/characters.ts, games/chess/…). Картинки: собственная
//      коллекция Алексея (Рабочий стол «Favicon», 08–09.11.2026; часть со StockCake, свободная лицензия; пираты —
//      Рабочий стол «Морской бой», некроманты — Рабочий стол «Шашки», 11.11.2026; космические гости — сгенерированы на
//      нашей видеокарте, FLUX.1 Krea, Рабочий стол «Кровная рента», 12.11.2026), целиком, со своим фоном, только
//      уменьшенные, в public/shared/characters — одна копия на все игры. Чистые данные без React, поэтому их
//      используют и тесты Node.

export type CharacterId =
  | 'upyr' | 'sebastian' | 'rosalind' | 'ada' | 'vlad' | 'lucretia' | 'isolde' | 'tadeusz' | 'gunther' | 'koschei'
  | 'vurdalak' | 'mortimer' | 'abraxas' | 'netopyr' | 'greta' | 'morana' | 'snezhana' | 'carmilla' | 'balthazar' | 'lorenzo'
  | 'berta' | 'zhorzh' | 'mortus' | 'lyuska' | 'mara' | 'oktaedr' | 'helga' | 'morg'
  | 'agrippina' | 'sergeant' | 'klyuv' | 'dlan' | 'edgar' | 'lilith' | 'xenon' | 'chuzhak' | 'khitin' | 'semyonych'
  /** The second company (09.11.2026): 23 dwellers and 8 guests. */
  | 'vual' | 'beatrice' | 'morwenna' | 'irma' | 'ivy' | 'lamplighter' | 'albina' | 'lacrima' | 'sangria' | 'selena'
  | 'skuka' | 'mgla' | 'valentin' | 'pietro' | 'kenji' | 'octavian' | 'benedict' | 'akvarella' | 'skvoznyak' | 'melisande'
  | 'belladonna' | 'cassandra' | 'tobias' | 'kage' | 'florian' | 'neon' | 'glyuk' | 'astral' | 'herbarium' | 'deco'
  | 'bes'
  /** The third company (09.11.2026, evening): 10 dwellers and 12 guests. */
  | 'aurelia' | 'morrigan' | 'elza' | 'polunoch' | 'shadow' | 'gadyuka' | 'sobor' | 'crystal' | 'stilet' | 'rosa'
  | 'banshee' | 'miko' | 'tryasina' | 'agafon' | 'plakalshchitsa' | 'fantom' | 'nebula' | 'undina' | 'okun' | 'gora'
  | 'kaznachey' | 'galeon'
  /** The crew of the sea battle (11.11.2026): four pirates from the folder «Морской бой», guests from the sea. */
  | 'krasnoglaz' | 'sunduk' | 'priliv' | 'abordazh'
  /** The necromancers of the catacombs (11.11.2026): five dwellers from the folder «Шашки», who came up for draughts. */
  | 'anselm' | 'mordecai' | 'ulrich' | 'ingrid' | 'pogost'
  /** The players of the draughts scenes (11.11.2026, the same folder): nine dwellers and seven guests, each pictured at a board. */
  | 'velmira' | 'kostolom' | 'strelyany' | 'violet' | 'prokhor' | 'kvartet' | 'morok' | 'bagryana'
  | 'rogach' | 'agata' | 'serebryana' | 'scarlett' | 'letitia' | 'ogneslava' | 'celestine' | 'vivien'
  /** The space guests (12.11.2026): thirty portraits generated on our own GPU for «Кровная рента». */
  | 'markus' | 'vera' | 'grob' | 'nekro' | 'brut' | 'eva' | 'vakuum' | 'xavier' | 'ksi' | 'sporus'
  | 'torgovets' | 'vivisector' | 'globb' | 'gorizont' | 'klony' | 'kraken' | 'malakor' | 'kurtizanka' | 'skeleton' | 'vudu'
  | 'obzhorin' | 'zero' | 'drednout' | 'kollektor' | 'zazerkal' | 'zhrets' | 'sshivatel' | 'krik' | 'pozhiratel' | 'smert'
  /** The dummy of a game for two: never picked as an opponent, it sits in the third seat. */
  | 'dummy';

export interface CharacterFacts {
  /** [EN] Grammatical gender of the sentences about the character (Russian and Hebrew verbs agree with it). [RU] Грамматический род фраз о герое. */
  readonly female: boolean;
  /** [EN] A guest from a neighbouring world rather than a dweller of the lair. [RU] Гость из соседнего мира, а не обитатель логова. */
  readonly guest: boolean;
  /**
   * [EN] Where the face is in a wide picture, as a CSS object-position: a small frame that shows only a part of the
   *      picture shows this part (the picture itself is never cut). Without it the frame shows the middle, a little
   *      above the centre.
   * [RU] Где лицо на широкой картинке, как object-position в CSS: маленькая рамка, которая показывает лишь часть
   *      картинки, показывает эту часть (сама картинка никогда не обрезается). Без него рамка показывает середину,
   *      чуть выше центра.
   */
  readonly focus?: string;
}

/** [EN] Everybody who can sit at a table as an opponent, in the order they joined the lair. [RU] Все, кто может сесть за стол соперником, в порядке появления в логове. */
export const CHARACTERS: Readonly<Record<Exclude<CharacterId, 'dummy'>, CharacterFacts>> = Object.freeze({
  upyr: { female: false, guest: false },
  sebastian: { female: false, guest: false },
  rosalind: { female: true, guest: false },
  ada: { female: true, guest: false },
  vlad: { female: false, guest: false },
  lucretia: { female: true, guest: false },
  isolde: { female: true, guest: false },
  tadeusz: { female: false, guest: false },
  gunther: { female: false, guest: false },
  koschei: { female: false, guest: false },
  vurdalak: { female: false, guest: false },
  mortimer: { female: false, guest: false },
  abraxas: { female: false, guest: false },
  netopyr: { female: false, guest: false },
  greta: { female: true, guest: false },
  morana: { female: true, guest: false },
  snezhana: { female: true, guest: false },
  carmilla: { female: true, guest: false },
  balthazar: { female: false, guest: false },
  lorenzo: { female: false, guest: false },
  vual: { female: true, guest: false },
  beatrice: { female: true, guest: false },
  morwenna: { female: true, guest: false },
  irma: { female: true, guest: false },
  ivy: { female: false, guest: false },
  lamplighter: { female: false, guest: false },
  albina: { female: true, guest: false },
  lacrima: { female: true, guest: false },
  sangria: { female: true, guest: false },
  selena: { female: true, guest: false },
  skuka: { female: true, guest: false },
  mgla: { female: true, guest: false },
  valentin: { female: false, guest: false },
  pietro: { female: false, guest: false },
  kenji: { female: false, guest: false },
  octavian: { female: false, guest: false },
  benedict: { female: false, guest: false },
  akvarella: { female: true, guest: false },
  skvoznyak: { female: false, guest: false },
  melisande: { female: true, guest: false },
  belladonna: { female: true, guest: false },
  cassandra: { female: true, guest: false },
  tobias: { female: false, guest: false },
  aurelia: { female: true, guest: false },
  morrigan: { female: true, guest: false },
  elza: { female: true, guest: false },
  polunoch: { female: true, guest: false },
  shadow: { female: true, guest: false },
  gadyuka: { female: true, guest: false },
  sobor: { female: false, guest: false },
  crystal: { female: false, guest: false },
  stilet: { female: false, guest: false },
  rosa: { female: true, guest: false },
  berta: { female: true, guest: true },
  zhorzh: { female: false, guest: true },
  mortus: { female: false, guest: true },
  lyuska: { female: true, guest: true },
  mara: { female: true, guest: true },
  oktaedr: { female: false, guest: true },
  helga: { female: true, guest: true },
  morg: { female: false, guest: true },
  agrippina: { female: true, guest: true },
  sergeant: { female: false, guest: true },
  klyuv: { female: false, guest: true },
  dlan: { female: true, guest: true },
  edgar: { female: false, guest: true },
  lilith: { female: true, guest: true },
  xenon: { female: false, guest: true },
  chuzhak: { female: false, guest: true },
  khitin: { female: false, guest: true },
  semyonych: { female: false, guest: true },
  kage: { female: false, guest: true },
  florian: { female: false, guest: true },
  neon: { female: false, guest: true },
  glyuk: { female: false, guest: true },
  astral: { female: false, guest: true },
  herbarium: { female: false, guest: true },
  deco: { female: false, guest: true },
  bes: { female: false, guest: true },
  banshee: { female: true, guest: true },
  miko: { female: true, guest: true },
  tryasina: { female: true, guest: true },
  agafon: { female: false, guest: true },
  plakalshchitsa: { female: true, guest: true },
  fantom: { female: false, guest: true },
  nebula: { female: true, guest: true },
  undina: { female: true, guest: true },
  okun: { female: false, guest: true },
  gora: { female: false, guest: true },
  kaznachey: { female: false, guest: true },
  galeon: { female: false, guest: true },
  krasnoglaz: { female: false, guest: true },
  sunduk: { female: false, guest: true },
  priliv: { female: false, guest: true },
  abordazh: { female: false, guest: true },
  anselm: { female: false, guest: false },
  mordecai: { female: false, guest: false },
  ulrich: { female: false, guest: false },
  ingrid: { female: true, guest: false },
  pogost: { female: true, guest: false },
  // [EN] Wide scenes: `focus` keeps the face in a small round frame. [RU] Широкие сцены: `focus` держит лицо в маленькой круглой рамке.
  velmira: { female: true, guest: false, focus: '0% 26%' },
  kostolom: { female: false, guest: false, focus: '0% 22%' },
  strelyany: { female: false, guest: false, focus: '45% 25%' },
  violet: { female: true, guest: true, focus: '24% 29%' },
  prokhor: { female: false, guest: false, focus: '79% 18%' },
  kvartet: { female: false, guest: true, focus: '0% 25%' },
  morok: { female: false, guest: false, focus: '37% 26%' },
  bagryana: { female: true, guest: false, focus: '50% 23%' },
  rogach: { female: false, guest: false, focus: '35% 28%' },
  agata: { female: true, guest: false, focus: '80% 29%' },
  serebryana: { female: true, guest: true, focus: '86% 18%' },
  scarlett: { female: true, guest: true, focus: '0% 20%' },
  letitia: { female: true, guest: false, focus: '100% 16%' },
  ogneslava: { female: true, guest: true, focus: '70% 13%' },
  celestine: { female: true, guest: true, focus: '17% 20%' },
  vivien: { female: true, guest: true, focus: '17% 16%' },
  // [EN] The space guests of «Кровная рента», 12.11.2026. [RU] Космические гости «Кровной ренты», 12.11.2026.
  markus: { female: false, guest: true },
  vera: { female: true, guest: true },
  grob: { female: false, guest: true },
  nekro: { female: true, guest: true },
  brut: { female: false, guest: true },
  eva: { female: true, guest: true },
  vakuum: { female: false, guest: true },
  xavier: { female: false, guest: true },
  ksi: { female: true, guest: true },
  sporus: { female: false, guest: true },
  torgovets: { female: false, guest: true },
  vivisector: { female: true, guest: true },
  globb: { female: false, guest: true },
  gorizont: { female: true, guest: true },
  klony: { female: false, guest: true },
  kraken: { female: false, guest: true },
  malakor: { female: false, guest: true },
  kurtizanka: { female: true, guest: true },
  skeleton: { female: false, guest: true },
  vudu: { female: true, guest: true },
  obzhorin: { female: false, guest: true },
  zero: { female: false, guest: true },
  drednout: { female: false, guest: true },
  kollektor: { female: true, guest: true },
  zazerkal: { female: false, guest: true },
  zhrets: { female: false, guest: true },
  sshivatel: { female: false, guest: true },
  krik: { female: true, guest: true },
  pozhiratel: { female: false, guest: true },
  smert: { female: true, guest: true },
});

/** [EN] The sea folk: the guests who came by sea (Captain Galleon and the crew of the sea battle). [RU] Морской народ: гости, приплывшие морем (Капитан Галеон и команда морского боя). */
export const SEA_FOLK: readonly Exclude<CharacterId, 'dummy'>[] = Object.freeze(['galeon', 'krasnoglaz', 'sunduk', 'priliv', 'abordazh']);

/**
 * [EN] The space folk (12.11.2026): the thirty opponents of «Кровная рента» — cosmic horror with black humour, their
 *      portraits generated on our own GPU (FLUX.1 Krea) from Alexey's prompts. Guests from space.
 * [RU] Космический народ (12.11.2026): тридцать соперников «Кровной ренты» — космический хоррор с чёрным юмором,
 *      портреты сгенерированы на нашей видеокарте (FLUX.1 Krea) по промптам Алексея. Гости из космоса.
 */
export const SPACE_FOLK: readonly Exclude<CharacterId, 'dummy'>[] = Object.freeze([
  'markus', 'vera', 'grob', 'nekro', 'brut', 'eva', 'vakuum', 'xavier', 'ksi', 'sporus',
  'torgovets', 'vivisector', 'globb', 'gorizont', 'klony', 'kraken', 'malakor', 'kurtizanka', 'skeleton', 'vudu',
  'obzhorin', 'zero', 'drednout', 'kollektor', 'zazerkal', 'zhrets', 'sshivatel', 'krik', 'pozhiratel', 'smert',
]);

/**
 * [EN] The folk of the board (the folder «Шашки»): the necromancers of the catacombs, who play draughts with bones, and
 *      the players of the scenes, each pictured at a board.
 * [RU] Народ доски (папка «Шашки»): некроманты катакомб, которые играют в шашки костями, и игроки со сцен — каждый
 *      нарисован за доской.
 */
export const BOARD_FOLK: readonly Exclude<CharacterId, 'dummy'>[] = Object.freeze([
  'anselm', 'mordecai', 'ulrich', 'ingrid', 'pogost',
  'velmira', 'kostolom', 'strelyany', 'violet', 'prokhor', 'kvartet', 'morok', 'bagryana',
  'rogach', 'agata', 'serebryana', 'scarlett', 'letitia', 'ogneslava', 'celestine', 'vivien',
]);

/** [EN] The dummy of a game for two: a scarecrow skeleton drawn for the game. [RU] Болван игры вдвоём: скелет-пугало, нарисованный для игры. */
const DUMMY_FACTS: CharacterFacts = Object.freeze({ female: false, guest: true });

export const CHARACTER_IDS: readonly Exclude<CharacterId, 'dummy'>[] = Object.freeze(Object.keys(CHARACTERS) as Exclude<CharacterId, 'dummy'>[]);
export const characterFacts = (id: CharacterId): CharacterFacts => (id === 'dummy' ? DUMMY_FACTS : CHARACTERS[id]);
/** [EN] A character who can sit at a table as an opponent (the dummy is not one). [RU] Герой, который может сесть за стол соперником (болван — нет). */
export const isCharacterId = (value: unknown): value is Exclude<CharacterId, 'dummy'> => typeof value === 'string' && Object.prototype.hasOwnProperty.call(CHARACTERS, value);
/** [EN] Where the picture lies in the site (relative to the base URL). [RU] Где лежит картинка на сайте (относительно базового адреса). */
export const portraitPath = (id: CharacterId): string => (id === 'dummy' ? 'shared/characters/dummy.svg' : `shared/characters/${id}.webp`);
/** [EN] The style that keeps the face in a small frame (see `focus`); undefined — the game's own. [RU] Стиль, который держит лицо в маленькой рамке (см. `focus`); undefined — свой стиль игры. */
export const portraitFocus = (id: CharacterId): { objectPosition: string } | undefined => {
  const focus = characterFacts(id).focus;
  return focus ? { objectPosition: focus } : undefined;
};

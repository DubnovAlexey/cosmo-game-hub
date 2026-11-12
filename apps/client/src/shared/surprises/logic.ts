// [EN] FILE: shared/surprises/logic.ts — «surprises» of the hub: now and then something happens on the screen of a
//      game. Every game has its own cast and its own choreography — nothing repeats between games or with the Props
//      project (Alexey, 12.11.2026: «индивидуальные для каждого, как по организации движений, так и самих идей»).
//      Since the evening of 12.11.2026 every game is realistic and grown-up (Alexey: «мультяшные картинки не очень…
//      реалистичней, для взрослых, позлее»): photographic creatures generated on our own GPU
//      (public/shared/surprises/*.webp); only a drop of blood and a card back are still drawn (creatures.tsx).
//      Only arithmetic lives here — pure functions without the browser
//      and without React: they receive a source of randomness and the size of the screen and answer who appears,
//      after how long and along which path (CSS variables). Surprises.tsx draws and times them; tests check them all.
// [RU] ФАЙЛ: «неожиданности» хаба: время от времени на экране игры что-то происходит. У каждой игры свой состав и
//      своя хореография — ничего не повторяется ни между играми, ни с проектом Props (Алексей, 12.11.2026:
//      «индивидуальные для каждого, как по организации движений, так и самих идей»). С вечера 12.11.2026 все игры
//      реалистичные и взрослые (Алексей: «мультяшные картинки не очень… реалистичней, для взрослых, позлее»):
//      фотографичные существа, сгенерированные на нашей видеокарте (public/shared/surprises/*.webp); нарисованными
//      остались только капля крови и рубашка карты (creatures.tsx). Здесь только арифметика — чистые функции без браузера и без React: им дают источник
//      случайности и размер экрана, а они отвечают, кто появится, через сколько и по какой траектории (переменные
//      CSS). Рисует и запускает их Surprises.tsx; тесты проверяют каждую.

/**
 * [EN] Choreographies. Every one belongs to one game only.
 * [RU] Хореографии. Каждая принадлежит только одной игре.
 */
export type Motion =
    // [EN] chess (deep space: meteorites, wreckage, the dead) / [RU] шахматы (глубокий космос: метеориты, обломки, мертвецы)
    | 'fly' | 'swarm' | 'peek' | 'drift'
    // [EN] sea battle (a real, unfriendly sea) / [RU] морской бой (настоящее недоброе море)
    | 'glideGull' | 'flock' | 'cut' | 'rise' | 'bob' | 'sonar'
    // [EN] preferans (realistic vampire salon) / [RU] преферанс (реалистичный вампирский салон)
    | 'hop' | 'reach' | 'curl' | 'orbit' | 'trickle'
    // [EN] poker (realistic dead men's casino) / [RU] покер (реалистичное казино мертвецов)
    | 'prowl' | 'scurry' | 'throw' | 'roll' | 'tumble' | 'ring'
    // [EN] checkers (realistic crypt) / [RU] шашки (реалистичный склеп)
    | 'wriggle' | 'rollStop' | 'swing' | 'flash' | 'glide';

/** [EN] Drawn creatures (creatures.tsx). [RU] Нарисованные существа (creatures.tsx). */
export const DRAWN = ['bloodDrop', 'card'] as const;
export type Drawn = typeof DRAWN[number];

/** [EN] Photographic creatures: file name in public/shared/surprises (.webp). [RU] Фотографичные существа: имя файла. */
export const SPRITES = [
    'raven', 'ghost-hand', 'moth', 'smoke-skull',
    'cat-walk', 'cat-yawn', 'roach', 'chip', 'die', 'smoke-ring',
    'centipede', 'skull', 'lantern', 'hooded', 'lich',
    'meteor', 'rock', 'wreck', 'dead-astronaut', 'stalker', 'probe',
    'sea-gull', 'shark-fin', 'kraken', 'mine', 'scope',
] as const;
export type Sprite = typeof SPRITES[number];
export type Creature = Drawn | Sprite;
export const isSprite = (creature: Creature): creature is Sprite => (SPRITES as readonly string[]).includes(creature);

/** [EN] One kind of surprise: who, how it moves, how often (weight). [RU] Один вид неожиданности: кто, как, как часто. */
export interface SurpriseKind {
    readonly id: string;
    readonly creature: Creature | null; // [EN] null — no figure (eyes, sonar) / [RU] null — без фигуры (глаза, сонар)
    readonly motion: Motion;
    // [EN] A second creature of the same scene (the sitting cat, the lich among the centipedes, hot meteorites among rocks).
    // [RU] Второе существо той же сцены (сидящий кот, лич среди сколопендр, раскалённые метеориты среди камней).
    readonly extra?: Creature;
    readonly weight: number;
    readonly count?: readonly [number, number]; // [EN] how many at once / [RU] сколько сразу: от и до
}

/** [EN] Every game has its own set. [RU] У каждой игры свой набор. */
export type SurpriseSetId = 'preferans' | 'poker' | 'checkers' | 'chess' | 'battleship';

// [EN] The bigger the weight, the more often; the big frights are rare — rare frightens more.
// [RU] Чем больше вес, тем чаще; крупные пугалки редки — редкое пугает сильнее.
export const SURPRISE_SETS: Readonly<Record<SurpriseSetId, readonly SurpriseKind[]>> = {
    // [EN] A raven walks the table edge with a card in its beak; a ghost hand reaches for your cards; candle smoke
    //      curls into a skull; a death's-head moth circles a flame and burns; a drop of blood runs down the edge.
    // [RU] Ворон идёт по краю стола с картой в клюве; призрачная рука тянется к вашим картам; дым свечи сворачивается
    //      в череп; бражник «мёртвая голова» кружит у пламени и сгорает; по краю стекает капля крови.
    preferans: [
        { id: 'raven', creature: 'raven', motion: 'hop', weight: 3 },
        { id: 'ghostHand', creature: 'ghost-hand', motion: 'reach', weight: 2 },
        { id: 'smokeSkull', creature: 'smoke-skull', motion: 'curl', weight: 2 },
        { id: 'moth', creature: 'moth', motion: 'orbit', weight: 2 },
        { id: 'blood', creature: 'bloodDrop', motion: 'trickle', weight: 2 },
    ],
    // [EN] A scarred black tomcat comes snarling, sits down, hisses at you and goes back; a cockroach dashes and freezes; a card flies like
    //      a shuriken and sticks in the edge; a chip rolls on its rim and falls flat; dice fall and bounce; a smoke ring.
    // [RU] Чёрный кот-драчун со шрамами приходит, скалясь, садится, шипит на вас и уходит обратно; таракан мечется и замирает; карта летит
    //      сюрикеном и втыкается в край; фишка катится на ребре и падает; кости падают с отскоком; кольцо дыма.
    poker: [
        { id: 'cat', creature: 'cat-walk', extra: 'cat-yawn', motion: 'prowl', weight: 3 },
        { id: 'roach', creature: 'roach', motion: 'scurry', weight: 2 },
        { id: 'card', creature: 'card', motion: 'throw', weight: 2 },
        { id: 'chip', creature: 'chip', motion: 'roll', weight: 2 },
        { id: 'dice', creature: 'die', motion: 'tumble', weight: 2, count: [2, 2] },
        { id: 'smokeRing', creature: 'smoke-ring', motion: 'ring', weight: 2 },
    ],
    // [EN] Giant cave centipedes rear up from below (they replaced the grave worms on 12.11.2026 — Alexey: «черви
    //      вызывают чувства не особо приятные… заменить… сороконожками») and a crowned lich rises among them; a skull rolls in, stops and rocks; a lantern comes down on its chain and swings;
    //      lightning shows a hooded figure standing behind you — and at the second flash it is closer; eyes glide in the dark.
    // [RU] Снизу поднимаются гигантские пещерные сколопендры (12.11.2026 они заменили могильных червей — Алексей:
    //      «черви вызывают чувства не особо приятные… заменить… сороконожками»), а среди них — лич в короне; катится череп, останавливается и покачивается; на цепи спускается фонарь и
    //      качается; молния показывает фигуру в капюшоне за спиной — а при второй вспышке она ближе; в темноте плывут глаза.
    checkers: [
        { id: 'centipedes', creature: 'centipede', extra: 'lich', motion: 'wriggle', weight: 2, count: [3, 4] },
        { id: 'skull', creature: 'skull', motion: 'rollStop', weight: 3 },
        { id: 'lantern', creature: 'lantern', motion: 'swing', weight: 2 },
        { id: 'hooded', creature: 'hooded', motion: 'flash', weight: 1 },
        { id: 'eyes', creature: null, motion: 'glide', weight: 3, count: [3, 4] },
    ],
    // [EN] Deep space, real and unkind: a burning meteorite, a field of tumbling rocks, a torn piece of a ship's hull
    //      with one lamp still blinking, a dead astronaut drifting past with a skull behind the visor, a thing from the
    //      void leaning in from behind the edge, a dead probe.
    // [RU] Глубокий космос, настоящий и недобрый: горящий метеорит, поле кувыркающихся камней, оторванный кусок
    //      обшивки корабля с одной ещё мигающей лампой, мёртвый космонавт проплывает мимо с черепом за стеклом шлема,
    //      тварь из пустоты заглядывает из-за края, мёртвый зонд.
    chess: [
        { id: 'meteor', creature: 'meteor', motion: 'fly', weight: 3 },
        { id: 'meteors', creature: 'rock', extra: 'meteor', motion: 'swarm', weight: 2, count: [5, 8] },
        { id: 'wreck', creature: 'wreck', motion: 'drift', weight: 2 },
        { id: 'astronaut', creature: 'dead-astronaut', motion: 'drift', weight: 2 },
        { id: 'stalker', creature: 'stalker', motion: 'peek', weight: 2 },
        { id: 'probe', creature: 'probe', motion: 'drift', weight: 1 },
    ],
    // [EN] The sea, real and unfriendly: a screaming gull glides past with a fish in its beak, a flock passes, a
    //      scarred shark fin cuts the water, a kraken tentacle rises with a ship's wheel in its grip, a rusty horned
    //      mine bobs past, a periscope looks around, a sonar pings.
    // [RU] Море, настоящее и недоброе: орущая чайка парит с рыбой в клюве, проходит стая, акулий плавник в шрамах
    //      режет воду, щупальце кракена поднимается, сжимая штурвал, мимо качается ржавая рогатая мина, перископ
    //      осматривается, пищит сонар.
    battleship: [
        { id: 'gull', creature: 'sea-gull', motion: 'glideGull', weight: 3 },
        { id: 'gulls', creature: 'sea-gull', motion: 'flock', weight: 2, count: [4, 7] },
        { id: 'fin', creature: 'shark-fin', motion: 'cut', weight: 3 },
        { id: 'tentacle', creature: 'kraken', motion: 'rise', weight: 2 },
        { id: 'mine', creature: 'mine', motion: 'bob', weight: 2 },
        { id: 'periscope', creature: 'scope', motion: 'rise', weight: 1 },
        { id: 'sonar', creature: null, motion: 'sonar', weight: 1 },
    ],
};

/**
 * [EN] Photographs still being painted on our GPU (the evening of 12.11.2026: the cartoon casts of chess and the sea
 *      battle are being replaced by real ones). A kind whose picture is not ready is simply not shown, so the hub can
 *      be built and published at any moment; a test keeps this list honest (listed — not on disk, not listed — on
 *      disk). Empty when every picture is in place.
 * [RU] Фотографии, которые ещё рисует наша видеокарта (вечер 12.11.2026: мультяшные составы шахмат и морского боя
 *      заменяются настоящими). Вид, чья картинка не готова, просто не показывается, поэтому хаб можно собрать и
 *      выложить в любой момент; тест держит список честным (в списке — нет на диске, не в списке — есть на диске).
 *      Пуст, когда все картинки на месте.
 */
export const PAINTING: readonly Sprite[] = [
    'wreck', 'dead-astronaut', 'stalker',
];

/** [EN] The kinds of a game whose pictures are ready. [RU] Виды игры, чьи картинки готовы. */
export const readyKinds = (set: SurpriseSetId): readonly SurpriseKind[] => SURPRISE_SETS[set].filter(kind =>
    ![kind.creature, kind.extra].some(creature => creature && (PAINTING as readonly Creature[]).includes(creature)));

/** [EN] Pause before the first surprise and between the next ones, ms. [RU] Пауза перед первой и между следующими, мс. */
export const SURPRISE_DELAY = { first: [15000, 30000], next: [35000, 80000] } as const;

/** [EN] The size of the screen. [RU] Размер экрана. */
export interface View { readonly width: number; readonly height: number }

/** [EN] One moving thing on the screen: its size and its path. [RU] Одна движущаяся фигура: размер и путь. */
export interface Actor {
    readonly key: number;
    readonly size: number; // [EN] px (SIZES) / [RU] px (SIZES)
    readonly flip: boolean; // [EN] drawn facing right; true — mirrored / [RU] нарисован мордой вправо; true — зеркально
    readonly style: Readonly<Record<string, string>>;
}

/** [EN] A surprise ready to be drawn. [RU] Неожиданность, готовая к рисованию. */
export interface Surprise {
    readonly id: string;
    readonly creature: Creature | null;
    readonly extra: Creature | null;
    readonly motion: Motion;
    readonly duration: number; // [EN] ms until the last actor is gone / [RU] мс до ухода последнего
    readonly actors: readonly Actor[];
}

type Random = () => number;
const between = (random: Random, min: number, max: number): number => min + random() * (max - min);
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const px = (value: number): string => `${Math.round(value)}px`;
const ms = (value: number): string => `${Math.round(value)}ms`;
const deg = (value: number): string => `${Math.round(value * 10) / 10}deg`;

/** [EN] Milliseconds until the next surprise. [RU] Через сколько миллисекунд следующая неожиданность. */
export function nextDelay(random: Random, first = false): number {
    const [min, max] = first ? SURPRISE_DELAY.first : SURPRISE_DELAY.next;
    return Math.round(between(random, min, max));
}

/**
 * [EN] Picks the next kind by weight, never the one just shown (unless it is the only one ready); null — the game has
 *      no ready kind yet. [RU] Выбирает следующий вид по весам, не тот же, что был (если он не единственный готовый);
 *      null — у игры ещё нет ни одного готового вида.
 */
export function pickSurprise(set: SurpriseSetId, random: Random, previous: string | null = null): SurpriseKind | null {
    const ready = readyKinds(set);
    if (ready.length === 0) return null;
    const fresh = ready.filter(kind => kind.id !== previous);
    const pool = fresh.length > 0 ? fresh : ready;
    const total = pool.reduce((sum, kind) => sum + kind.weight, 0);
    let roll = random() * total;
    for (const kind of pool) {
        roll -= kind.weight;
        if (roll < 0) return kind;
    }
    return pool[pool.length - 1];
}

/**
 * [EN] Size of every figure, [phone, wide] ranges in px: the base size of a drawing (creatures.tsx), the width of a photograph.
 * [RU] Размер каждой фигуры, [телефон, широкий экран], px: базовый размер рисунка (creatures.tsx), ширина фотографии.
 */
const SIZES: Readonly<Record<Creature, readonly [readonly [number, number], readonly [number, number]]>> = {
    bloodDrop: [[18, 18], [24, 24]],
    card: [[54, 54], [72, 72]],
    raven: [[120, 140], [170, 210]],
    'ghost-hand': [[170, 190], [250, 300]],
    moth: [[56, 64], [72, 88]],
    'smoke-skull': [[120, 140], [170, 210]],
    // [EN] The cat is a big one: a heavyweight, not a kitten. [RU] Кот крупный: тяжеловес, а не котёнок.
    'cat-walk': [[220, 250], [330, 400]],
    'cat-yawn': [[150, 170], [220, 260]],
    roach: [[50, 56], [64, 76]],
    chip: [[56, 62], [72, 84]],
    die: [[44, 50], [58, 66]],
    'smoke-ring': [[130, 150], [180, 230]],
    centipede: [[96, 110], [130, 160]],
    skull: [[86, 96], [112, 128]],
    lantern: [[70, 80], [92, 104]],
    hooded: [[200, 220], [300, 360]],
    lich: [[150, 170], [220, 270]],
    meteor: [[90, 110], [130, 180]],
    rock: [[60, 80], [80, 120]],
    wreck: [[190, 220], [280, 360]],
    'dead-astronaut': [[130, 150], [180, 230]],
    stalker: [[220, 250], [320, 400]],
    probe: [[170, 190], [230, 290]],
    'sea-gull': [[120, 140], [170, 220]],
    'shark-fin': [[90, 100], [120, 150]],
    kraken: [[120, 130], [170, 200]],
    mine: [[80, 90], [104, 124]],
    scope: [[56, 64], [76, 90]],
};

/** [EN] The key of the lich among the centipedes (Surprises.tsx draws it differently). [RU] Ключ лича среди сколопендр (Surprises.tsx рисует его иначе). */
export const LICH_KEY = 100;

/** [EN] Flock members are small. [RU] Члены стаи — маленькие. */
const FLOCK_SIZES: Readonly<Partial<Record<Creature, readonly [number, number]>>> = { rock: [34, 84], 'sea-gull': [50, 84] };

/**
 * [EN] A flight across the screen, never straight: four throws up and down on the way (s1…s4).
 * [RU] Полёт через экран, никогда не по прямой: четыре броска вверх-вниз по дороге (s1…s4).
 */
function flight(random: Random, view: View, size: number, duration: number, ltr: boolean, delay = 0, y0?: number, swingRate = 0.12): Record<string, string> {
    const { width, height } = view;
    const startY = y0 ?? between(random, 0.08, 0.5) * height;
    const endY = clamp(startY + between(random, -0.2, 0.2) * height, 0.04 * height, 0.7 * height);
    const swing = between(random, swingRate * 0.6, swingRate * 1.2) * Math.min(height, 760);
    const sign = random() < 0.5 ? 1 : -1;
    return {
        '--x0': px(ltr ? -size - 30 : width + 30),
        '--x1': px(ltr ? width + 30 : -size - 30),
        '--y0': px(startY),
        '--y1': px(endY),
        '--s1': px(sign * swing),
        '--s2': px(-sign * swing * between(random, 0.4, 1)),
        '--s3': px(sign * swing * between(random, 0.5, 1.1)),
        '--s4': px(-sign * swing * between(random, 0.3, 0.8)),
        '--tilt': deg((ltr ? 1 : -1) * between(random, 4, 11)),
        '--dur': ms(duration),
        '--delay': ms(delay),
    };
}

/** [EN] Off-screen start and end on opposite sides. [RU] Начало и конец за экраном, по разные стороны. */
const across = (view: View, size: number, ltr: boolean): Record<string, string> => ({
    '--x0': px(ltr ? -size - 30 : view.width + 30),
    '--x1': px(ltr ? view.width + 30 : -size - 30),
});

/**
 * [EN] Prepares one surprise: sizes, paths (CSS variables) and the duration.
 * [RU] Готовит одну неожиданность: размеры, траектории (переменные CSS) и длительность.
 */
export function buildSurprise(kind: SurpriseKind, random: Random, view: View): Surprise {
    const { width, height } = view;
    const phone = width < 700;
    const ltr = random() < 0.5;
    const base = { id: kind.id, creature: kind.creature, extra: kind.extra ?? null, motion: kind.motion };
    const sized = (creature: Creature | null = kind.creature): number => {
        if (!creature) return 0;
        const [min, max] = SIZES[creature][phone ? 0 : 1];
        return Math.round(between(random, min, max));
    };
    const countOf = (): number => (kind.count ? kind.count[0] + Math.floor(random() * (kind.count[1] - kind.count[0] + 1)) : 1);
    const one = (duration: number, style: Record<string, string>, size = sized(), flip = !ltr): Surprise =>
        ({ ...base, duration, actors: [{ key: 0, size, flip, style: { ...style, '--dur': ms(duration) } }] });
    const spot = (from: number, to: number, size: number): number => clamp(between(random, from, to) * width - size / 2, 4, width - size - 4);

    switch (kind.motion) {
        // ---------------- [EN] chess / [RU] шахматы ----------------
        case 'fly': {
            const size = sized();
            // [EN] A burning meteorite rushes across, almost straight. [RU] Горящий метеорит несётся через экран, почти по прямой.
            const duration = clamp(2600 + width * 0.9, 3200, 7600) + between(random, -300, 400);
            return { ...base, duration, actors: [{ key: 0, size, flip: !ltr, style: flight(random, view, size, duration, ltr, 0, undefined, 0.03) }] };
        }

        case 'swarm':
        case 'flock': {
            const creature = kind.creature ?? 'rock';
            const [min, max] = FLOCK_SIZES[creature] ?? [30, 60];
            const meteors = kind.motion === 'swarm';
            const span = clamp(1600 + width * (meteors ? 0.6 : 1.1), 1900, 4200);
            const y0 = between(random, meteors ? 0.06 : 0.1, meteors ? 0.3 : 0.4) * height;
            const ends: number[] = [];
            const actors = Array.from({ length: countOf() }, (_, key): Actor => {
                const size = Math.round(between(random, min, phone ? (min + max) / 2 : max));
                // [EN] Meteors are scattered in time, a flock keeps a V. [RU] Метеоры разбросаны во времени, стая держит клин.
                const delay = meteors ? between(random, 0, 1800) : key * 140;
                const duration = span + between(random, -200, 300);
                ends.push(delay + duration);
                const rank = meteors ? between(random, -110, 110) : (key % 2 ? 1 : -1) * Math.ceil(key / 2) * 26;
                return { key, size, flip: !ltr, style: flight(random, view, size, duration, ltr, delay, y0 + rank, meteors ? 0.02 : 0.05) };
            });
            return { ...base, duration: Math.max(...ends), actors };
        }

        case 'peek': {
            // [EN] Half a head looks in from behind a side edge, watches, hides. [RU] Полголовы выглядывает из-за края, смотрит, прячется.
            const size = sized();
            return one(4600, { '--y': px(between(random, 0.25, 0.7) * height - size / 2) }, size);
        }

        case 'drift': {
            // [EN] Slowly across, turning a little. [RU] Медленно поперёк экрана, чуть поворачиваясь.
            const size = sized();
            const duration = clamp(5000 + width * 3.2, 7000, 12000);
            const y0 = between(random, 0.1, 0.55) * height;
            return one(duration, {
                ...across(view, size, ltr),
                '--y0': px(y0),
                '--y1': px(clamp(y0 + between(random, -0.12, 0.12) * height, 0.05 * height, 0.85 * height)),
                '--turn': deg(between(random, -24, 24)),
            }, size);
        }

        // ---------------- [EN] sea battle / [RU] морской бой ----------------
        case 'glideGull': {
            // [EN] Long glides with rare flaps, a dip down and a climb. [RU] Долгое парение с редкими взмахами, нырок и подъём.
            const size = sized();
            const duration = clamp(3000 + width * 2, 4200, 8000);
            const y0 = between(random, 0.08, 0.35) * height;
            return one(duration, { ...across(view, size, ltr), '--y0': px(y0), '--dip': px(between(random, 0.12, 0.25) * height) }, size);
        }

        case 'cut': {
            // [EN] A fin cuts the water along the bottom, slows, circles back once and goes on. [RU] Плавник режет воду внизу, замедляется, делает петлю и уходит.
            const size = sized();
            const duration = clamp(2600 + width * 2.6, 4200, 8400);
            return one(duration, { ...across(view, size, ltr), '--mid': px(between(random, 0.35, 0.65) * width) }, size);
        }

        case 'rise': {
            // [EN] From below the bottom edge: rises, sways, sinks back. [RU] Из-под нижнего края: поднимается, качается, уходит.
            const size = sized();
            return one(5200, { '--x': px(spot(0.08, 0.92, size)) }, size, random() < 0.5);
        }

        case 'bob': {
            // [EN] A mine drifts low on the waves, rocking. [RU] Мина плывёт низко по волнам, покачиваясь.
            const size = sized();
            const duration = clamp(6000 + width * 3.4, 8000, 13000);
            return one(duration, { ...across(view, size, ltr), '--y0': px(between(random, 0.66, 0.8) * height) }, size);
        }

        case 'sonar': {
            // [EN] Rings spread from a point; a blip of a target flashes. [RU] От точки расходятся круги; мигает отметка цели.
            const size = Math.round(phone ? 220 : 320);
            return one(4200, {
                '--x': px(between(random, 0.2, 0.8) * width),
                '--y': px(between(random, 0.2, 0.75) * height),
                '--bx': px(between(random, -0.3, 0.3) * size),
                '--by': px(between(random, -0.3, 0.3) * size),
            }, size, false);
        }

        // ---------------- [EN] preferans / [RU] преферанс ----------------
        case 'hop': {
            // [EN] Walks in along the bottom edge with little hops, stops, pecks twice, then takes off up and away.
            // [RU] Заходит по нижнему краю короткими прыжками, останавливается, дважды клюёт и взлетает вверх.
            const size = sized();
            const stop = spot(0.3, 0.6, size);
            return one(7600, {
                '--x0': px(ltr ? -size - 30 : width + 30),
                '--xm': px(stop),
                '--x1': px(ltr ? Math.min(width + 40, stop + width * 0.5) : Math.max(-size - 40, stop - width * 0.5)),
                '--y1': px(-height * 0.7),
            }, size);
        }

        case 'reach': {
            // [EN] Slides in from a side toward the bottom middle (your cards), fingers tremble, snaps back.
            // [RU] Выдвигается сбоку к середине низа (к вашим картам), пальцы дрожат, резко отдёргивается.
            const size = sized();
            return one(5200, { '--y': px(between(random, 0.5, 0.72) * height), '--reach': px(between(random, 0.32, 0.42) * width + size * 0.35) }, size);
        }

        case 'curl': {
            // [EN] Smoke rises from a candle at the bottom corner and curls into a skull, then thins out.
            // [RU] Дым поднимается от свечи у нижнего угла и сворачивается в череп, потом тает.
            const size = sized();
            const x = ltr ? between(random, 0.04, 0.22) * width : width - between(random, 0.04, 0.22) * width - size;
            return one(6800, { '--x': px(clamp(x, 4, width - size - 4)), '--y': px(height * between(random, 0.5, 0.62)), '--rise': px(height * 0.3) }, size, false);
        }

        case 'orbit': {
            // [EN] Circles faster and faster around a point (a flame), flares up and falls as ash.
            // [RU] Кружит всё быстрее вокруг точки (пламени), вспыхивает и осыпается пеплом.
            const size = sized();
            const r = phone ? 46 : 64;
            return one(6400, {
                '--x': px(between(random, 0.2, 0.8) * width),
                '--y': px(between(random, 0.25, 0.6) * height),
                '--r': px(r),
                '--fall': px(height * 0.35),
            }, size, false);
        }

        case 'trickle': {
            // [EN] A drop runs down from the top edge along a margin, leaving a trail, then the trail fades.
            // [RU] Капля бежит от верхнего края по полю, оставляя след, потом след тает.
            const size = sized();
            const margin = ltr ? between(random, 0.02, 0.12) : between(random, 0.88, 0.98);
            return one(7000, { '--x': px(clamp(margin * width, 6, width - 12)), '--len': px(height * between(random, 0.35, 0.6)) }, size, false);
        }

        // ---------------- [EN] poker / [RU] покер ----------------
        case 'prowl': {
            // [EN] Walks in, sits down facing you, yawns, turns round and walks back out the same side.
            // [RU] Заходит, садится к вам мордой, зевает, разворачивается и уходит туда же, откуда пришёл.
            const size = sized();
            const sit = sized('cat-yawn');
            return one(10000, { '--x0': px(ltr ? -size - 30 : width + 30), '--xm': px(spot(0.3, 0.62, size)), '--sit': px(sit) }, size);
        }

        case 'scurry': {
            // [EN] Five dashes with sudden freezes, turning toward each next point. [RU] Пять рывков с внезапными замираниями, поворачиваясь к следующей точке.
            const size = sized();
            const points = [
                { x: ltr ? -size - 20 : width + 20, y: between(random, 0.45, 0.85) * height },
                ...Array.from({ length: 4 }, (_, index) => ({
                    x: ltr ? (0.15 + index * 0.2) * width + between(random, -0.05, 0.05) * width : (0.85 - index * 0.2) * width + between(random, -0.05, 0.05) * width,
                    y: between(random, 0.35, 0.88) * height,
                })),
                { x: ltr ? width + 20 : -size - 20, y: between(random, 0.4, 0.9) * height },
            ];
            const style: Record<string, string> = {};
            points.forEach((point, index) => {
                style[`--p${index}x`] = px(point.x);
                style[`--p${index}y`] = px(point.y);
                const next = points[Math.min(index + 1, points.length - 1)];
                const prev = points[Math.max(index - 1, 0)];
                const to = index < points.length - 1 ? next : point;
                const from = index < points.length - 1 ? point : prev;
                style[`--a${index}`] = deg((Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI);
            });
            return one(5200, style, size, false);
        }

        case 'throw': {
            // [EN] Spins in from a side like a shuriken, sticks into the top edge, quivers, then drops and falls out.
            // [RU] Летит сбоку, крутясь как сюрикен, втыкается в верхний край, дрожит, потом падает вниз.
            const size = sized();
            const target = between(random, 0.25, 0.75) * width;
            return one(5600, {
                '--x0': px(ltr ? -size - 40 : width + 40),
                '--y0': px(between(random, 0.35, 0.6) * height),
                '--xt': px(target - size / 2),
                '--yt': px(-size * 0.42),
                '--spin': deg((ltr ? 1 : -1) * (1080 + between(random, 10, 40))),
                '--fall': px(height + size * 2),
            }, size, false);
        }

        case 'roll': {
            // [EN] Rolls across the bottom on its rim, slows, wobbles and falls flat. [RU] Катится на ребре внизу, замедляется, качается и падает плашмя.
            const size = sized();
            const stop = spot(0.3, 0.7, size);
            const from = ltr ? -size - 20 : width + 20;
            const turns = Math.abs(stop - from) / (Math.PI * size);
            return one(5400, { '--x0': px(from), '--xm': px(stop), '--rot': deg((ltr ? 1 : -1) * turns * 360) }, size, false);
        }

        case 'tumble': {
            // [EN] Dice fall from the top, bounce twice, settle and fade. [RU] Кости падают сверху, дважды отскакивают, замирают и тают.
            const ends: number[] = [];
            const startX = between(random, 0.25, 0.65) * width;
            const actors = Array.from({ length: countOf() }, (_, key): Actor => {
                const size = sized();
                const delay = key * between(random, 120, 280);
                ends.push(delay + 4400);
                return {
                    key, size, flip: false,
                    style: {
                        '--x': px(clamp(startX + key * size * 1.3, 4, width - size - 4)),
                        '--floor': px(height - size - between(random, 0.08, 0.18) * height),
                        '--spin': deg(between(random, 360, 900) * (random() < 0.5 ? -1 : 1)),
                        '--dur': '4400ms',
                        '--delay': ms(delay),
                    },
                };
            });
            return { ...base, duration: Math.max(...ends), actors };
        }

        case 'ring': {
            // [EN] A smoke ring floats up from below, widens and dissolves. [RU] Кольцо дыма всплывает снизу, расширяется и растворяется.
            const size = sized();
            return one(6200, { '--x': px(spot(0.15, 0.85, size)), '--y': px(height * between(random, 0.55, 0.7)), '--rise': px(height * 0.35), '--drift': px(between(random, -60, 60)) }, size, false);
        }

        // ---------------- [EN] checkers / [RU] шашки ----------------
        case 'wriggle': {
            // [EN] Centipedes rear up from below the bottom edge one after another, sway and sink; among them the lich
            //      rises slowly, looks at you and goes down last (the actor with the key LICH_KEY).
            // [RU] Сколопендры по очереди поднимаются из-под нижнего края, покачиваются и уходят; среди них медленно
            //      поднимается лич, смотрит на вас и уходит последним (фигура с ключом LICH_KEY).
            const ends: number[] = [];
            const crawlers = Math.max(1, countOf() - (kind.extra ? 1 : 0));
            const actors = Array.from({ length: crawlers }, (_, key): Actor => {
                const size = sized();
                const delay = key * between(random, 500, 900);
                ends.push(delay + 5200);
                return { key, size, flip: random() < 0.5, style: { '--x': px(spot(0.06, 0.94, size)), '--dur': '5200ms', '--delay': ms(delay) } };
            });
            if (kind.extra) {
                const size = sized(kind.extra);
                ends.push(400 + 7000);
                actors.push({ key: LICH_KEY, size, flip: false, style: { '--x': px(spot(0.3, 0.7, size)), '--dur': '7000ms', '--delay': '400ms' } });
            }
            return { ...base, duration: Math.max(...ends), actors };
        }

        case 'rollStop': {
            // [EN] Rolls in along the bottom, stops, rocks to and fro as if looking at you, rolls on out the other side.
            // [RU] Вкатывается по низу, останавливается, качается туда-сюда, будто разглядывает вас, и катится дальше.
            const size = sized();
            const from = ltr ? -size - 20 : width + 20;
            const stop = spot(0.35, 0.65, size);
            const to = ltr ? width + 20 : -size - 20;
            const sign = ltr ? 1 : -1;
            const turns = (distance: number) => distance / (Math.PI * size * 0.9);
            // [EN] It stops upright, whole turns only, to look at you and laugh with its jaw (rigs.ts).
            // [RU] Останавливается прямо, только целые обороты, чтобы посмотреть на вас и посмеяться челюстью (rigs.ts).
            const stopTurns = Math.max(1, Math.round(turns(Math.abs(stop - from))));
            return one(7600, {
                '--x0': px(from), '--xm': px(stop), '--x1': px(to),
                '--r1': deg(sign * stopTurns * 360),
                '--r2': deg(sign * (stopTurns + turns(Math.abs(to - stop))) * 360),
            }, size, !ltr);
        }

        case 'swing': {
            // [EN] Comes down on its chain from the top, swings with a dying swing, flickers, goes back up.
            // [RU] Спускается сверху на цепи, раскачивается с затухающим размахом, мерцает и уходит вверх.
            const size = sized();
            return one(7200, { '--x': px(spot(0.12, 0.88, size)), '--depth': px(height * between(random, 0.12, 0.28)) }, size, false);
        }

        case 'flash': {
            // [EN] Two flashes of lightning: at the first a hooded figure stands at the side, at the second it is closer
            //      and bigger — then darkness, and nobody. [RU] Две вспышки молнии: при первой у края стоит фигура в
            //      капюшоне, при второй она ближе и больше — потом темнота, и никого.
            const size = sized();
            const first = ltr ? between(random, 0.04, 0.16) * width : width - between(random, 0.04, 0.16) * width - size;
            const second = clamp(width / 2 - size * 0.75 + between(random, -0.12, 0.12) * width, 0, width - size * 1.5);
            return one(4600, {
                '--x1': px(clamp(first, 0, width - size)), '--x2': px(second),
                '--y1': px(height - size * 1.42), '--y2': px(height - size * 2.04),
            }, size, false);
        }

        case 'glide': {
            // [EN] Pairs of eyes open in the dark margins and slide slowly along, blinking, then close.
            // [RU] Пары глаз открываются в тёмных полях и медленно плывут, моргая, потом закрываются.
            const ends: number[] = [];
            const actors = Array.from({ length: countOf() }, (_, key): Actor => {
                const left = phone ? random() < 0.5 : key % 2 === 0;
                const x = left ? between(random, 0.02, phone ? 0.3 : 0.14) * width : width - between(random, 0.04, phone ? 0.3 : 0.16) * width;
                const delay = key * between(random, 300, 700);
                ends.push(delay + 6500);
                return {
                    key, size: Math.round(between(random, 10, phone ? 14 : 18)), flip: false,
                    style: {
                        '--x': px(x), '--y': px(between(random, 0.15, 0.8) * height),
                        '--dx': px((left ? 1 : -1) * between(random, 20, 70)), '--dy': px(between(random, -60, 60)),
                        '--dur': '6500ms', '--delay': ms(delay),
                    },
                };
            });
            return { ...base, duration: Math.max(...ends), actors };
        }
    }
}

/** [EN] The setting: the player may switch surprises off for the whole hub. [RU] Настройка: игрок может выключить неожиданности во всём хабе. */
export const SURPRISES_KEY = 'cosmo-game-hub:surprises';
export const SURPRISES_EVENT = 'cosmo-game-hub:surprises';

/**
 * [EN] An event that calls one surprise by hand (for checking the drawings):
 *      window.dispatchEvent(new CustomEvent('cosmo-game-hub:surprise', { detail: { id: 'raven' } })).
 * [RU] Событие, которое вызывает одну неожиданность вручную (чтобы проверить рисунки).
 */
export const SURPRISE_EVENT = 'cosmo-game-hub:surprise';

/** [EN] Reads the stored setting: on unless the player switched it off. [RU] Читает настройку: включено, пока игрок не выключил. */
export function surprisesEnabled(stored: string | null): boolean {
    return stored !== 'off';
}

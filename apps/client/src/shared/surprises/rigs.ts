// [EN] FILE: shared/surprises/rigs.ts — what makes a photographed creature look alive (Alexey, 12.11.2026: «должны
//      крутить головой, у них должны меняться глаза… колыхаться перья»). A rig cuts the same photograph into parts
//      along outlines measured on the picture (px of the .webp): a head turns round its neck, a tail sways from its
//      root, fingers curl round their knuckles, mist wafts. The body breathes; lids blink over the eyes; a glint in
//      the eye flickers. Rig.tsx draws it as one SVG; Surprises.module.css holds the moves. Pure data, tested.
// [RU] ФАЙЛ: то, что делает сфотографированное существо живым (Алексей, 12.11.2026: «должны крутить головой, у них
//      должны меняться глаза… колыхаться перья»). Оснастка режет ту же фотографию на части по контурам, снятым с
//      картинки (px файла .webp): голова поворачивается вокруг шеи, хвост качается от основания, пальцы сжимаются
//      вокруг костяшек, дымка колышется. Тело дышит; поверх глаз моргают веки; блик в глазу мерцает. Rig.tsx рисует это
//      одним SVG; движения — в Surprises.module.css. Чистые данные, есть тесты.
import type { Sprite } from './logic';

/** [EN] How a part moves (a class of Surprises.module.css). [RU] Как движется часть (класс Surprises.module.css). */
export type PartMove =
    | 'headTurn' | 'yawnTilt' | 'mothWingLeft' | 'mothWingRight' | 'tailSway' | 'tailFlick' | 'footStep' | 'footStepLate'
    | 'fingerCurl' | 'fingerCurlLate' | 'fingerCurlLast' | 'mistWaft' | 'jawChatter'
    | 'antennaTwitch' | 'legScuttle' | 'legScuttleLate' | 'neckSway' | 'jawLaugh' | 'flameFlicker'
    | 'hoodTilt' | 'pendantSwing' | 'hemSway' | 'jawGape' | 'centipedeCreep';

type Point = readonly [number, number];

/** [EN] One moving part: its outline and the joint it turns round. [RU] Одна подвижная часть: контур и сустав, вокруг которого она поворачивается. */
export interface Part {
    readonly name: string;
    readonly points: readonly Point[];
    readonly pivot: Point;
    readonly move: PartMove;
    // [EN] The part moves over the whole picture instead of out of a hole in it: for light (a flame), whose bright copy
    //      may stretch past its outline without showing a dark seam. [RU] Часть движется поверх целой картинки, а не из
    //      дырки в ней: для света (пламени), чья яркая копия может выходить за контур, не показывая тёмного шва.
    readonly overlay?: boolean;
    // [EN] What shows in the hole when the part moves away (the dark of an open mouth) instead of the page behind.
    // [RU] Что видно в дырке, когда часть отходит (темнота открытого рта), вместо страницы позади.
    readonly fill?: string;
}

/** [EN] An eye: where the lid closes and whether a glint lives in it. [RU] Глаз: где закрывается веко и живёт ли в нём блик. */
export interface Eye {
    readonly x: number;
    readonly y: number;
    readonly rx: number;
    readonly ry: number;
    readonly lid: string; // [EN] colour of the lid / [RU] цвет века
    readonly glow?: string; // [EN] now and then the eye flares with this colour / [RU] время от времени глаз вспыхивает этим цветом
    readonly part?: string; // [EN] the eye rides on this part (a head) / [RU] глаз едет вместе с этой частью (головой)
}

export interface Rig {
    readonly width: number; // [EN] px of the .webp / [RU] px файла .webp
    readonly height: number;
    readonly parts: readonly Part[];
    readonly eyes: readonly Eye[];
    readonly breathe: boolean;
    // [EN] see-through (smoke, a ghost): parts are cut exactly, an overlap would show as a brighter line.
    // [RU] просвечивает (дым, призрак): части режутся точно, нахлёст был бы виден светлой полосой.
    readonly translucent?: boolean;
}

export const RIGS: Readonly<Partial<Record<Sprite, Rig>>> = {
    // [EN] The raven: the head with the beak and the card jerks round as ravens do, the tail sways, the raised foot
    //      steps, the chest breathes, the eye blinks. [RU] Ворон: голова с клювом и картой дёргано оглядывается, как у
    //      воронов, хвост качается, поднятая лапа шагает, грудь дышит, глаз моргает.
    raven: {
        width: 512, height: 434, breathe: true,
        parts: [
            { name: 'tail', move: 'tailSway', pivot: [168, 286], points: [[150, 258], [0, 328], [0, 362], [10, 395], [64, 380], [155, 318], [182, 292]] },
            { name: 'foot', move: 'footStep', pivot: [316, 304], points: [[298, 296], [334, 292], [392, 346], [394, 398], [330, 398], [298, 342]] },
            {
                name: 'head', move: 'headTurn', pivot: [360, 108],
                points: [[316, 70], [318, 28], [346, 3], [392, 1], [424, 17], [458, 29], [470, 40], [508, 50], [506, 158], [434, 156], [436, 78], [410, 86], [396, 112], [330, 118]],
            },
        ],
        eyes: [{ x: 385, y: 31, rx: 7, ry: 7, lid: '#16121c', glow: '#ff2a2a', part: 'head' }],
    },
    // [EN] The death's-head moth seen from above: the wings fold and open from the body, fast, as in real flight.
    // [RU] Бражник «мёртвая голова» сверху: крылья быстро складываются и раскрываются от тела, как в настоящем полёте.
    moth: {
        width: 512, height: 299, breathe: false,
        parts: [
            { name: 'left', move: 'mothWingLeft', pivot: [244, 110], points: [[0, 0], [242, 0], [242, 299], [0, 299]] },
            { name: 'right', move: 'mothWingRight', pivot: [268, 110], points: [[270, 0], [512, 0], [512, 299], [270, 299]] },
        ],
        eyes: [],
    },
    // [EN] The smoking skull: the smoke wafts, the jaw chatters, a red fire flares in the sockets.
    // [RU] Дымящийся череп: дым колышется, челюсть стучит, в глазницах вспыхивает красный огонь.
    'smoke-skull': {
        width: 401, height: 512, breathe: false, translucent: true,
        parts: [
            { name: 'smoke', move: 'mistWaft', pivot: [70, 262], points: [[40, 0], [401, 0], [401, 282], [120, 282], [50, 272]] },
            { name: 'jaw', move: 'jawChatter', pivot: [150, 426], points: [[22, 438], [160, 428], [176, 470], [152, 512], [30, 512], [18, 480]] },
        ],
        eyes: [
            { x: 60, y: 347, rx: 14, ry: 16, lid: 'transparent', glow: '#ff3b1f' },
            { x: 117, y: 337, rx: 13, ry: 15, lid: 'transparent', glow: '#ff3b1f' },
        ],
    },
    // [EN] The walking black cat: the head turns, the yellow-green eyes blink, the tail sways, the front and the hind
    //      legs step out of step, the flanks breathe. [RU] Идущий чёрный кот: голова поворачивается, жёлто-зелёные глаза
    //      моргают, хвост качается, передняя и задняя лапы шагают вразнобой, бока дышат.
    'cat-walk': {
        // [EN] Since 12.11.2026 evening the cat is a street champion (Alexey: «кот должен выглядеть бойцом, драчуном со
        //      скверным характером… мощным, сильным… гибкий, должен излучать мощь… несломленный характер»): the build
        //      of a panther, a scar on the shoulder; he stalks low with the claws out, snarling.
        // [RU] С вечера 12.11.2026 кот — уличный чемпион (Алексей: «кот должен выглядеть бойцом, драчуном со скверным
        //      характером… мощным, сильным… гибкий, должен излучать мощь… несломленный характер»): сложён как
        //      пантера, шрам на плече; крадётся низко, выпустив когти, и скалится.
        // The fifth picture (12.11.2026, approved: «да, ставь»): a heavyweight black tom stalking to the right with the
        // fangs bared, no bald patches. [RU] Пятая картинка (одобрена 12.11.2026): тяжёлый чёрный кот крадётся вправо,
        // оскалившись, без проплешин.
        width: 512, height: 230, breathe: true,
        parts: [
            { name: 'tail', move: 'tailSway', pivot: [110, 90], points: [[103, 80], [117, 100], [100, 127], [73, 137], [40, 137], [17, 133], [3, 123], [3, 100], [17, 100], [40, 120], [67, 120], [90, 103], [93, 83]] },
            { name: 'hind', move: 'footStepLate', pivot: [105, 135], points: [[87, 133], [123, 133], [120, 173], [117, 203], [87, 203], [90, 167]] },
            { name: 'front', move: 'footStep', pivot: [400, 140], points: [[393, 133], [427, 143], [467, 173], [500, 200], [501, 223], [467, 223], [440, 200], [400, 167]] },
            { name: 'head', move: 'headTurn', pivot: [430, 75], points: [[413, 40], [427, 20], [447, 30], [480, 37], [503, 27], [512, 30], [512, 100], [497, 123], [467, 130], [440, 117], [420, 93]] },
        ],
        eyes: [
            { x: 471, y: 78, rx: 6.5, ry: 4.5, lid: '#141012', glow: '#ffe14a', part: 'head' },
            { x: 500, y: 75, rx: 5, ry: 4.5, lid: '#141012', part: 'head' },
        ],
    },
    // [EN] The sitting champion snarls at the table: the head tilts back slowly with the jaws open, the eyes burn, the
    //      tip of the tail twitches, the chest breathes. [RU] Сидящий чемпион скалится на стол: голова медленно
    //      запрокидывается с открытой пастью, глаза горят, кончик хвоста дёргается, грудь дышит.
    'cat-yawn': {
        width: 486, height: 512, breathe: true,
        parts: [
            { name: 'tail', move: 'tailFlick', pivot: [240, 470], points: [[233, 453], [300, 440], [373, 433], [427, 393], [467, 400], [481, 433], [467, 460], [400, 467], [320, 483], [253, 490], [230, 477]] },
            { name: 'head', move: 'yawnTilt', pivot: [120, 190], points: [[7, 40], [17, 10], [60, 37], [107, 37], [160, 10], [175, 27], [183, 80], [190, 133], [160, 180], [113, 200], [67, 193], [27, 167], [7, 120]] },
        ],
        eyes: [
            { x: 53, y: 85, rx: 10, ry: 6, lid: '#141012', glow: '#ffd23a', part: 'head' },
            { x: 120, y: 85, rx: 10, ry: 6, lid: '#141012', part: 'head' },
        ],
    },
    // [EN] The cockroach seen from above: the antennae twitch all the time — even while it freezes — and the two rows
    //      of legs scuttle out of step. [RU] Таракан сверху: усы дёргаются всё время — даже когда он замирает, — а два
    //      ряда лап семенят вразнобой.
    roach: {
        width: 512, height: 394, breathe: false,
        parts: [
            { name: 'upper', move: 'legScuttle', pivot: [220, 160], points: [[0, 56], [340, 56], [340, 150], [250, 158], [150, 168], [0, 145]] },
            { name: 'lower', move: 'legScuttleLate', pivot: [220, 272], points: [[0, 330], [70, 292], [300, 264], [420, 250], [420, 394], [0, 394]] },
            { name: 'antennae', move: 'antennaTwitch', pivot: [322, 166], points: [[318, 120], [350, 0], [512, 0], [512, 245], [332, 202], [318, 176]] },
        ],
        eyes: [],
    },
    // [EN] The ghost hand: the three fingers curl in turn as if grasping, the mist on the right wafts.
    // [RU] Призрачная рука: три пальца сжимаются по очереди, будто хватают, дымка справа колышется.
    'ghost-hand': {
        width: 512, height: 375, breathe: false, translucent: true,
        parts: [
            { name: 'mist', move: 'mistWaft', pivot: [360, 80], points: [[330, 40], [512, 40], [512, 340], [420, 340], [398, 200], [345, 120]] },
            { name: 'first', move: 'fingerCurl', pivot: [186, 152], points: [[150, 150], [216, 150], [216, 250], [206, 356], [184, 356], [160, 280], [148, 200]] },
            { name: 'middle', move: 'fingerCurlLate', pivot: [272, 136], points: [[246, 134], [300, 130], [312, 230], [302, 332], [264, 332], [250, 240]] },
            { name: 'last', move: 'fingerCurlLast', pivot: [336, 126], points: [[302, 124], [386, 124], [392, 250], [376, 370], [330, 370], [304, 250]] },
        ],
        eyes: [],
    },
    // [EN] The grave skull with moss in its socket: the jaw drops and clacks three times — a laugh without a sound —
    //      and a sickly green fire flares in both sockets. [RU] Могильный череп с мхом в глазнице: челюсть отвисает и
    //      трижды клацает — смех без звука, — а в обеих глазницах вспыхивает болезненно-зелёный огонь.
    skull: {
        width: 480, height: 512, breathe: false,
        parts: [
            {
                name: 'jaw', move: 'jawLaugh', pivot: [160, 318],
                points: [[150, 320], [200, 327], [240, 347], [280, 373], [293, 387], [373, 390], [460, 383], [480, 380], [480, 467], [400, 487], [300, 493], [220, 480], [167, 460], [133, 427], [143, 373]],
            },
        ],
        eyes: [
            { x: 293, y: 205, rx: 50, ry: 52, lid: 'transparent', glow: '#9dff3a' },
            { x: 413, y: 198, rx: 28, ry: 52, lid: 'transparent', glow: '#9dff3a' },
        ],
    },
    // [EN] The lich among the centipedes (Alexey, 12.11.2026: «к червю я бы добавил лича»; the worms became centipedes
    //      the same evening): a crowned cracked skull with fangs and a giant orange centipede on his shoulder. The jaw
    //      drops slowly as if he were about to speak, the embers in the sockets flare, the centipede creeps in jerks,
    //      the mantle heaves. [RU] Лич среди сколопендр (Алексей, 12.11.2026: «к червю я бы добавил лича»; червей в тот
    //      же вечер заменили сколопендрами): треснувший череп с клыками в короне и гигантская рыжая сколопендра на
    //      плече. Челюсть медленно отвисает, будто он собирается заговорить, угли в глазницах вспыхивают, сколопендра
    //      ползёт рывками, мантия вздымается.
    lich: {
        width: 512, height: 512, breathe: true,
        parts: [
            {
                name: 'centipede', move: 'centipedeCreep', pivot: [400, 330], fill: '#120d12',
                points: [[393, 305], [467, 300], [500, 312], [497, 362], [500, 422], [470, 430], [436, 468], [376, 502], [312, 470], [250, 430], [262, 376], [312, 347], [360, 342]],
            },
            { name: 'jaw', move: 'jawGape', pivot: [238, 252], fill: '#0b0705', points: [[177, 253], [200, 262], [240, 266], [280, 261], [301, 252], [294, 300], [274, 323], [234, 331], [200, 327], [183, 307]] },
        ],
        eyes: [
            { x: 195, y: 160, rx: 17, ry: 15, lid: 'transparent', glow: '#ff3b1f' },
            { x: 277, y: 155, rx: 17, ry: 15, lid: 'transparent', glow: '#ff3b1f' },
        ],
    },
    // [EN] The crypt lantern with cobwebs inside: the candle flame flickers in the draught, and now and then the light
    //      surges through the dirty glass. [RU] Склепный фонарь с паутиной внутри: пламя свечи дрожит на сквозняке, а
    //      время от времени свет вспыхивает сквозь грязное стекло.
    lantern: {
        width: 234, height: 512, breathe: false,
        parts: [
            { name: 'flame', move: 'flameFlicker', pivot: [120, 362], overlay: true, points: [[112, 318], [128, 318], [131, 342], [128, 360], [112, 360], [109, 342]] },
        ],
        eyes: [{ x: 120, y: 340, rx: 46, ry: 58, lid: 'transparent', glow: '#ffcf7a' }],
    },
    // [EN] The necromancer in the hood (the second picture, 12.11.2026 evening — Alexey: «тога не выразительна, надо
    //      доработать образ, взгляд»: black velvet with a crimson lining, silver thorns, a raven-skull pendant, a pale
    //      face with a contemptuous grin and ice-white eyes). He is seen only in two flashes of lightning: at the first
    //      he stands straight, at the second — closer — the hooded head is bent to one side; the pendant swings, the
    //      hem of the robe stirs, the eyes flare.
    // [RU] Некромант в капюшоне (вторая картинка, вечер 12.11.2026 — Алексей: «тога не выразительна, надо доработать
    //      образ, взгляд»: чёрный бархат с алым подбоем, серебряные шипы, кулон-череп ворона, бледное лицо с
    //      презрительной ухмылкой и льдисто-белыми глазами). Его видно только в двух вспышках молнии: в первой он стоит
    //      прямо, во второй — ближе — голова в капюшоне склонена набок; кулон качается, подол шевелится, глаза вспыхивают.
    hooded: {
        width: 329, height: 512, breathe: true,
        parts: [
            { name: 'hem', move: 'hemSway', pivot: [165, 400], points: [[40, 400], [293, 400], [329, 512], [0, 512]] },
            { name: 'pendant', move: 'pendantSwing', pivot: [167, 84], points: [[150, 84], [184, 84], [184, 144], [150, 144]] },
            { name: 'hood', move: 'hoodTilt', pivot: [165, 78], points: [[124, 68], [128, 22], [148, 0], [182, 0], [206, 26], [210, 68], [188, 84], [146, 84]] },
        ],
        eyes: [
            { x: 158, y: 37, rx: 4, ry: 3, lid: '#a39a95', glow: '#bfe6ff', part: 'hood' },
            { x: 175, y: 37, rx: 4, ry: 3, lid: '#a39a95', glow: '#bfe6ff', part: 'hood' },
        ],
    },
};

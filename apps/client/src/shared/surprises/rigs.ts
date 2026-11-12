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
    | 'hoodTilt' | 'clawCurl' | 'clawCurlMirror' | 'hemSway';

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
        width: 512, height: 342, breathe: true,
        parts: [
            { name: 'tail', move: 'tailSway', pivot: [165, 110], points: [[0, 0], [112, 0], [112, 40], [62, 46], [52, 70], [92, 92], [168, 94], [178, 126], [120, 136], [40, 126], [0, 92]] },
            { name: 'hind', move: 'footStepLate', pivot: [195, 206], points: [[168, 204], [232, 200], [266, 300], [266, 337], [224, 337], [200, 282], [168, 262]] },
            { name: 'front', move: 'footStep', pivot: [410, 206], points: [[380, 200], [442, 200], [496, 250], [496, 316], [460, 316], [430, 272], [384, 262]] },
            { name: 'head', move: 'headTurn', pivot: [420, 118], points: [[400, 100], [412, 40], [425, 28], [446, 50], [470, 46], [505, 26], [512, 32], [512, 122], [495, 136], [455, 141], [420, 136]] },
        ],
        eyes: [
            { x: 460, y: 89, rx: 7, ry: 6, lid: '#141012', part: 'head' },
            { x: 492, y: 89, rx: 7, ry: 6, lid: '#141012', part: 'head' },
        ],
    },
    // [EN] The sitting cat yawning: the head tilts back slowly, the tip of the tail twitches, the chest breathes.
    // [RU] Сидящий кот зевает: голова медленно запрокидывается, кончик хвоста дёргается, грудь дышит.
    'cat-yawn': {
        width: 342, height: 512, breathe: true,
        parts: [
            { name: 'tail', move: 'tailFlick', pivot: [222, 405], points: [[214, 380], [342, 380], [342, 452], [300, 452], [260, 432], [214, 420]] },
            { name: 'head', move: 'yawnTilt', pivot: [170, 206], points: [[78, 40], [90, 3], [130, 30], [200, 30], [236, 4], [256, 40], [256, 150], [226, 200], [170, 216], [114, 200], [84, 150]] },
        ],
        eyes: [],
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
    // [EN] The grave worm: the raised head sways as if sniffing the air and now and then darts at you, the tail flicks,
    //      the rings of the body swell and shrink, the black eye blinks and flares a sickly green.
    // [RU] Могильный червь: поднятая голова покачивается, будто принюхивается, и время от времени делает выпад к вам,
    //      хвост дёргается, кольца тела набухают и опадают, чёрный глаз моргает и вспыхивает болезненно-зелёным.
    worm: {
        width: 512, height: 386, breathe: true,
        parts: [
            { name: 'tail', move: 'tailFlick', pivot: [118, 280], points: [[0, 236], [100, 212], [118, 228], [118, 330], [0, 330]] },
            { name: 'head', move: 'neckSway', pivot: [300, 140], points: [[255, 140], [258, 50], [300, 8], [380, 0], [512, 0], [512, 110], [430, 100], [380, 115], [350, 140]] },
        ],
        eyes: [{ x: 457, y: 30, rx: 8, ry: 8, lid: '#e2c1b8', glow: '#a8ff3c', part: 'head' }],
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
    // [EN] The hooded figure is seen only in two flashes of lightning: at the first it stands straight, at the second —
    //      closer — its hood is bent to one side and its fingers are hooked, as in the worst dreams; the hem of the
    //      robe stirs, the white eyes blink. [RU] Фигуру в капюшоне видно только в двух вспышках молнии: в первой она
    //      стоит прямо, во второй — ближе — капюшон склонён набок, пальцы скрючены, как в худших снах; подол плаща
    //      шевелится, белые глаза моргают.
    hooded: {
        width: 198, height: 512, breathe: true,
        parts: [
            { name: 'hem', move: 'hemSway', pivot: [99, 400], points: [[8, 400], [190, 400], [198, 512], [0, 512]] },
            { name: 'left', move: 'clawCurl', pivot: [48, 256], points: [[34, 252], [62, 252], [64, 302], [34, 302]] },
            { name: 'right', move: 'clawCurlMirror', pivot: [160, 250], points: [[148, 246], [172, 246], [172, 296], [146, 296]] },
            { name: 'hood', move: 'hoodTilt', pivot: [99, 135], points: [[50, 0], [150, 0], [160, 110], [140, 135], [60, 135], [40, 110]] },
        ],
        eyes: [
            { x: 90, y: 40, rx: 5, ry: 4, lid: '#050505', glow: '#bfe6ff', part: 'hood' },
            { x: 108, y: 40, rx: 5, ry: 4, lid: '#050505', glow: '#bfe6ff', part: 'hood' },
        ],
    },
};

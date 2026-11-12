// [EN] FILE: shared/tests/surprises.test.ts — the «surprises» of the hub: every game has its own cast and its own
//      choreography (no creature and no motion is shared between two games — Alexey, 12.11.2026), no game is a cartoon
//      any more (only a drop of blood and a card back are drawn — the evening of 12.11.2026), every drawing and
//      every photograph is used and the photographs exist, every kind builds a sane path on a phone and on wide
//      screens, the choice follows the weights and never repeats the last kind, pauses stay in their ranges, and the
//      setting is on unless the player switched it off.
// [RU] ФАЙЛ: «неожиданности» хаба: у каждой игры свой состав и своя хореография (ни одно существо и ни одно движение
//      не повторяется в двух играх — Алексей, 12.11.2026), каждый рисунок и каждая фотография в деле, фотографии
//      существуют, каждый вид строит разумный путь на телефоне и на широких экранах, выбор следует весам и не
//      повторяет прошлый вид, паузы в своих пределах, а настройка включена, пока игрок её не выключил.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
// noinspection ES6PreferShortImport
import { RIGS } from '../surprises/rigs.ts';
// noinspection ES6PreferShortImport
import {
    buildSurprise, DRAWN, nextDelay, PAINTING, pickSurprise, readyKinds, SPRITES, SURPRISE_DELAY, SURPRISE_SETS, surprisesEnabled,
    type Surprise, type SurpriseSetId, type View,
} from '../surprises/logic.ts';

/** [EN] A repeatable source of randomness. [RU] Повторяемый источник случайности. */
function seeded(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 2 ** 32;
    };
}

const SCREENS: readonly View[] = [{ width: 375, height: 812 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }];
const SETS = Object.keys(SURPRISE_SETS) as SurpriseSetId[];
const num = (value: string | undefined): number => Number.parseFloat(value ?? 'NaN');

test('no creature and no choreography is shared between two games', () => {
    const owner = new Map<string, SurpriseSetId>();
    for (const set of SETS) {
        for (const kind of SURPRISE_SETS[set]) {
            for (const key of [`motion:${kind.motion}`, kind.creature ? `creature:${kind.creature}` : null, kind.extra ? `creature:${kind.extra}` : null]) {
                if (!key) continue;
                const first = owner.get(key);
                assert.ok(!first || first === set, `${key} is used by ${first} and ${set}`);
                owner.set(key, set);
            }
        }
    }
});

test('no game is a cartoon: only the drop of blood and the card back are drawn', () => {
    // [EN] Alexey, 12.11.2026: «мультяшные картинки не очень… реалистичней, для взрослых, позлее».
    assert.deepEqual([...DRAWN], ['bloodDrop', 'card']);
});

test('every drawing and every photograph is used, and every photograph is on disk', () => {
    // [EN] A scene may have a second creature: the sitting cat, the lich among the worms, hot meteorites among rocks.
    // [RU] У сцены бывает второе существо: сидящий кот, лич среди червей, раскалённые метеориты среди камней.
    const used = new Set<string>(SETS.flatMap(set => SURPRISE_SETS[set].flatMap(kind => [kind.creature ?? '', kind.extra ?? ''])).filter(Boolean));
    for (const creature of [...DRAWN, ...SPRITES]) assert.ok(used.has(creature), `${creature} is never shown`);
    // [EN] A picture still being painted is listed in PAINTING and is not on disk; every other one is on disk.
    // [RU] Картинка, которая ещё рисуется, записана в PAINTING и её нет на диске; все остальные — на диске.
    for (const sprite of SPRITES) {
        const onDisk = existsSync(new URL(`../../../public/shared/surprises/${sprite}.webp`, import.meta.url));
        assert.equal(onDisk, !PAINTING.includes(sprite), `public/shared/surprises/${sprite}.webp ${onDisk ? 'is ready: take it out of PAINTING' : 'is missing'}`);
    }
});

/** [EN] Width and height of a .webp from its header (VP8X, VP8L or VP8). [RU] Ширина и высота .webp по заголовку. */
function webpSize(bytes: Uint8Array): readonly [number, number] {
    const chunk = String.fromCharCode(...bytes.subarray(12, 16));
    const at = (index: number): number => bytes[index];
    if (chunk === 'VP8X') return [1 + (at(24) | (at(25) << 8) | (at(26) << 16)), 1 + (at(27) | (at(28) << 8) | (at(29) << 16))];
    if (chunk === 'VP8L') {
        const bits = at(21) | (at(22) << 8) | (at(23) << 16) | (at(24) << 24);
        return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)];
    }
    return [(at(26) | (at(27) << 8)) & 0x3fff, (at(28) | (at(29) << 8)) & 0x3fff];
}

test('every rig fits its photograph: outlines and joints inside, eyes on real parts, sizes match the file', () => {
    for (const [sprite, rig] of Object.entries(RIGS)) {
        assert.ok(rig && (SPRITES as readonly string[]).includes(sprite), sprite);
        if (!rig) continue;
        const file = new URL(`../../../public/shared/surprises/${sprite}.webp`, import.meta.url);
        if (existsSync(file)) assert.deepEqual(webpSize(readFileSync(file)), [rig.width, rig.height], `${sprite}: size in rigs.ts`);
        const inside = ([x, y]: readonly [number, number]): boolean => x >= 0 && x <= rig.width && y >= 0 && y <= rig.height;
        const names = rig.parts.map(part => part.name);
        assert.equal(new Set(names).size, names.length, `${sprite}: part names`);
        for (const part of rig.parts) {
            assert.ok(part.points.length >= 3, `${sprite}/${part.name}`);
            for (const point of [...part.points, part.pivot]) assert.ok(inside(point), `${sprite}/${part.name} ${point.join(',')}`);
        }
        for (const eye of rig.eyes) {
            assert.ok(inside([eye.x, eye.y]), `${sprite} eye`);
            if (eye.part) assert.ok(names.includes(eye.part), `${sprite} eye on ${eye.part}`);
        }
    }
});

test('kinds have unique ids inside a set and positive weights', () => {
    for (const set of SETS) {
        const ids = SURPRISE_SETS[set].map(kind => kind.id);
        assert.equal(new Set(ids).size, ids.length, set);
        for (const kind of SURPRISE_SETS[set]) assert.ok(kind.weight > 0, kind.id);
    }
});

/** [EN] Path checks per choreography. [RU] Проверки пути по хореографиям. */
function checkPaths(surprise: Surprise, view: View, label: string): void {
    for (const actor of surprise.actors) {
        const style = actor.style;
        for (const value of Object.values(style)) assert.doesNotMatch(value, /NaN|undefined|Infinity/, label);
        const x0 = num(style['--x0']);
        const x1 = num(style['--x1']);
        const offLeft = (x: number): boolean => x <= -actor.size;
        const offRight = (x: number): boolean => x >= view.width;
        switch (surprise.motion) {
            case 'fly': case 'swarm': case 'flock': case 'drift': case 'glideGull': case 'cut': case 'bob':
                // [EN] Starts and ends fully off the screen, on opposite sides, facing the way it goes.
                // [RU] Начинает и кончает целиком за экраном, по разные стороны, смотрит туда, куда движется.
                assert.ok((offLeft(x0) && offRight(x1)) || (offRight(x0) && offLeft(x1)), label);
                assert.equal(actor.flip, x0 > x1, label);
                break;
            case 'hop': case 'prowl': case 'roll':
                // [EN] Comes in from off the screen and stops inside it. [RU] Приходит из-за экрана и останавливается внутри.
                assert.ok(offLeft(x0) || offRight(x0), label);
                assert.ok(num(style['--xm']) >= 0 && num(style['--xm']) + actor.size <= view.width, label);
                break;
            case 'rollStop':
                assert.ok((offLeft(x0) && offRight(x1)) || (offRight(x0) && offLeft(x1)), label);
                assert.ok(num(style['--xm']) >= 0 && num(style['--xm']) + actor.size <= view.width, label);
                break;
            case 'scurry':
                assert.ok(offLeft(num(style['--p0x'])) || offRight(num(style['--p0x'])), label);
                assert.ok(offLeft(num(style['--p5x'])) || offRight(num(style['--p5x'])), label);
                for (let index = 1; index <= 4; index += 1) {
                    const y = num(style[`--p${index}y`]);
                    assert.ok(y >= 0 && y <= view.height, label);
                }
                break;
            case 'throw':
                assert.ok(num(style['--yt']) < 0, label); // [EN] sticks into the top edge / [RU] втыкается в верхний край
                assert.ok(num(style['--fall']) > view.height, label);
                break;
            case 'rise': case 'swing': case 'wriggle': case 'curl': case 'ring':
                assert.ok(num(style['--x']) >= 0 && num(style['--x']) + actor.size <= view.width, label);
                break;
            case 'tumble':
                assert.ok(num(style['--floor']) + actor.size <= view.height, label);
                break;
            case 'trickle':
                assert.ok(num(style['--len']) < view.height * 0.7, label);
                break;
            case 'flash':
                assert.ok(num(style['--x1']) >= 0 && num(style['--x1']) <= view.width, label);
                break;
            case 'peek': case 'reach': case 'orbit': case 'sonar': case 'glide':
                assert.ok(num(style['--y']) > -actor.size && num(style['--y']) < view.height, label);
                break;
        }
    }
}

test('every kind of every game builds a sane surprise on a phone and on wide screens', () => {
    for (const set of SETS) {
        for (const kind of SURPRISE_SETS[set]) {
            for (const view of SCREENS) {
                for (let seed = 1; seed <= 25; seed += 1) {
                    const surprise = buildSurprise(kind, seeded(seed * 97 + view.width), view);
                    const label = `${set}/${kind.id} ${view.width}×${view.height} #${seed}`;
                    assert.ok(surprise.duration > 1000 && surprise.duration < 15000, label);
                    assert.ok(surprise.actors.length >= 1, label);
                    if (kind.count) assert.ok(surprise.actors.length >= kind.count[0] && surprise.actors.length <= kind.count[1], label);
                    checkPaths(surprise, view, label);
                }
            }
        }
    }
});

test('the choice follows the weights and never repeats the kind just shown', () => {
    for (const set of SETS) {
        // [EN] A game with fewer than two ready kinds has nothing to choose from yet. [RU] Игре, у которой готово меньше двух видов, пока не из чего выбирать.
        if (readyKinds(set).length < 2) {
            assert.equal(pickSurprise(set, seeded(7)), readyKinds(set)[0] ?? null);
            continue;
        }
        const random = seeded(7);
        const counts = new Map<string, number>();
        let previous: string | null = null;
        for (let round = 0; round < 6000; round += 1) {
            const kind = pickSurprise(set, random, previous);
            assert.ok(kind);
            assert.notEqual(kind.id, previous);
            counts.set(kind.id, (counts.get(kind.id) ?? 0) + 1);
            previous = kind.id;
        }
        const kinds = readyKinds(set);
        for (const kind of kinds) assert.ok((counts.get(kind.id) ?? 0) > 0, `${set}/${kind.id}`);
        const heaviest = kinds.reduce((a, b) => (b.weight > a.weight ? b : a));
        const lightest = kinds.reduce((a, b) => (b.weight < a.weight ? b : a));
        // [EN] With exactly two kinds «never the same twice» forces them to alternate, so weights can only show from three.
        // [RU] Ровно два вида при правиле «не подряд» обязаны чередоваться — веса видны только с трёх видов.
        if (kinds.length > 2 && heaviest.weight > lightest.weight) assert.ok((counts.get(heaviest.id) ?? 0) > (counts.get(lightest.id) ?? 0), set);
    }
});

test('pauses stay inside their ranges', () => {
    const random = seeded(3);
    for (let round = 0; round < 500; round += 1) {
        const first = nextDelay(random, true);
        const next = nextDelay(random);
        assert.ok(first >= SURPRISE_DELAY.first[0] && first <= SURPRISE_DELAY.first[1]);
        assert.ok(next >= SURPRISE_DELAY.next[0] && next <= SURPRISE_DELAY.next[1]);
    }
});

test('surprises are on unless the player switched them off', () => {
    assert.equal(surprisesEnabled(null), true);
    assert.equal(surprisesEnabled('on'), true);
    assert.equal(surprisesEnabled('off'), false);
});

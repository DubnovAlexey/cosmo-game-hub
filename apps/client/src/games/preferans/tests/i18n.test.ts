// [EN] FILE: games/preferans/tests/i18n.test.ts — the five languages of the table: each one is complete and really
//      translated, sentences agree with who acts (you; the opponents of the pool — here Koschei, he, and Carmilla,
//      she), every dweller of the lair has a name and a biography in every language, French keeps its typography.
// [RU] ФАЙЛ: пять языков стола — каждый полный и действительно переведён, фразы согласуются с тем, кто действует
//      (вы; соперники пули — здесь Кощей, он, и Кармилла, она), у каждого обитателя логова есть имя и биография на
//      каждом языке, во французском соблюдена типографика.
import assert from 'node:assert/strict';
import test from 'node:test';
import { ROSTER, castForNewPool, normalizeCast, pickCast, type Cast } from '../characters/roster.ts';
import makeEn from '../i18n/en.ts';
import makeEs from '../i18n/es.ts';
import makeFr from '../i18n/fr.ts';
import makeHe from '../i18n/he.ts';
import makeRu from '../i18n/ru.ts';
import type { Dictionary } from '../i18n/types.ts';
import { createRandom } from '../engine/index.ts';

const CAST: Cast = ['koschei', 'carmilla'];
const [ru, en, he, es, fr] = [makeRu, makeEn, makeHe, makeEs, makeFr].map(make => make(CAST));
const ALL: readonly Dictionary[] = [ru, en, he, es, fr];

function strings(value: unknown, out: string[] = []): string[] {
    if (typeof value === 'string') out.push(value);
    else if (Array.isArray(value)) value.forEach(item => strings(item, out));
    else if (value && typeof value === 'object') Object.values(value).forEach(item => strings(item, out));
    return out;
}

test('every language is complete, says who it is and is not a copy of English', () => {
    for (const t of ALL) {
        assert.equal(t.seatNames.length, 3);
        for (const option of Object.values(t.explain.options)) {
            assert.ok(option.name && option.what && option.how && option.effect, `${t.language}: an option misses a text`);
        }
        for (const { id } of ROSTER) {
            assert.ok(t.characters[id].name && t.characters[id].bio.length > 40, `${t.language}: ${id} misses a name or a biography`);
        }
        if (t !== en) {
            assert.notEqual(t.setup.title, en.setup.title, `${t.language} copies English`);
            assert.notEqual(t.explain.options.stalingrad.what, en.explain.options.stalingrad.what, `${t.language} copies English`);
            assert.notEqual(t.characters.koschei.bio, en.characters.koschei.bio, `${t.language} copies an English biography`);
        }
    }
    assert.deepEqual(ALL.map(t => t.language), ['ru', 'en', 'he', 'es', 'fr']);
});

test('sentences agree with the seat: you, Koschei (he), Carmilla (she)', () => {
    assert.deepEqual(ru.seatNames, ['Вы', 'Кощей', 'Кармилла']);
    assert.equal(ru.info.takesTalon(0), 'Вы берёте прикуп');
    assert.equal(ru.info.needs(1, 6), 'Кощею нужно 6 взяток');
    assert.match(ru.actions.returnQuestion(2), /^Кармилла сказала/);
    assert.match(ru.actions.returnQuestion(1), /^Кощей сказал /);
    assert.match(ru.results.conceded(2, '6♠', 2), /ушла без двух/);
    assert.match(ru.actions.yourTurnFor(2), /за Кармиллу/);
    assert.equal(ru.results.misereCaught(0, 1), 'Вы · мизер пойман · 1 взятка');
    assert.equal(en.info.needs(0, 6), 'You need 6 tricks');
    assert.equal(en.info.needs(1, 1), 'Koschei needs 1 trick');
    assert.equal(es.info.takesTalon(0), 'Tomas el talón');
    assert.equal(fr.info.takesTalon(2), 'Carmilla prend le talon');
    assert.match(he.info.takesTalon(2), /^קרמילה לוקחת/);
    assert.match(he.info.takesTalon(1), /^קושצ׳יי לוקח /);
    // [EN] Another company, other genders: the same seat now speaks of a woman. [RU] Другая компания — другой род.
    const other = makeRu(['morana', 'vlad']);
    assert.match(other.actions.returnQuestion(1), /^Морана сказала/);
    assert.equal(other.info.needs(2, 7), 'Графу Владу нужно 7 взяток');
});

test('every pool seats a new company; a damaged save gets a valid one', () => {
    const random = createRandom(7);
    let previous: Cast = CAST;
    for (let pool = 0; pool < 40; pool += 1) {
        const next = pickCast(2, random, previous);
        assert.equal(new Set(next).size, 2, 'two different characters');
        assert.ok(next.every(id => !previous.includes(id)), 'nobody from the last pool sits down again');
        previous = next;
    }
    assert.deepEqual(normalizeCast(undefined, 2), ['vlad', 'carmilla']);
    assert.deepEqual(normalizeCast(['mara', 'nobody', 'mara'], 2), ['mara', 'vlad']);
    // [EN] The menu's choice comes first, then the champion of the last pool, then a new face. [RU] Сначала выбор меню, потом чемпион, потом новое лицо.
    assert.deepEqual(castForNewPool(['lilith', 'semyonych'], 2, random, CAST, 'koschei'), ['lilith', 'semyonych']);
    const withChampion = castForNewPool([null, null], 2, random, CAST, 'koschei');
    assert.equal(withChampion[0], 'koschei', 'the winner of the last pool keeps a seat');
    assert.ok(withChampion[1] !== 'carmilla' && withChampion[1] !== 'koschei', 'the other seat gets a new face');
    assert.deepEqual(castForNewPool(['xenon', null], 2, random, CAST, 'koschei'), ['xenon', 'koschei']);
    assert.equal(ROSTER.length, 176, 'everybody plays: 67 dwellers and 109 guests (pirates, necromancers, the players of the draughts scenes since 11.11, the thirty space guests and the thirty style guests since 12.11)');
    assert.equal(ROSTER.filter(character => character.guest).length, 109);
    // [EN] A new face speaks Russian in its own gender and case. [RU] Новое лицо говорит по-русски в своём роде и падеже.
    const company = makeRu(['vual', 'ivy']);
    assert.equal(company.info.needs(1, 6), 'Императрице Вуали нужно 6 взяток');
    assert.match(company.actions.returnQuestion(1), /^Императрица Вуаль сказала/);
    assert.match(company.actions.yourTurnFor(2), /за Короля Плюща/);
});

test('French puts a non-breaking space before : ; ? !', () => {
    const texts = strings(fr);
    const plain = texts.filter(text => / [:;?!]/.test(text));
    assert.deepEqual(plain, []);
    assert.match(fr.actions.whistQuestion(1, '7♠'), / \?$/);
});

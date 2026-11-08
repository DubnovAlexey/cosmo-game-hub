// [EN] FILE: games/preferans/tests/i18n.test.ts — the five languages of the table: each one is complete and really
//      translated, sentences agree with who acts (you, Orion — he, Vega — she), French keeps its typography.
// [RU] ФАЙЛ: пять языков стола — каждый полный и действительно переведён, фразы согласуются с тем, кто
//      действует (вы, Орион — он, Вега — она), во французском соблюдена типографика.
import assert from 'node:assert/strict';
import test from 'node:test';
import en from '../i18n/en.ts';
import es from '../i18n/es.ts';
import fr from '../i18n/fr.ts';
import he from '../i18n/he.ts';
import ru from '../i18n/ru.ts';
import type { Dictionary } from '../i18n/types.ts';

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
        if (t !== en) {
            assert.notEqual(t.setup.title, en.setup.title, `${t.language} copies English`);
            assert.notEqual(t.explain.options.stalingrad.what, en.explain.options.stalingrad.what, `${t.language} copies English`);
        }
    }
    assert.deepEqual(ALL.map(t => t.language), ['ru', 'en', 'he', 'es', 'fr']);
});

test('sentences agree with the seat: you, Orion (he), Vega (she)', () => {
    assert.equal(ru.info.takesTalon(0), 'Вы берёте прикуп');
    assert.equal(ru.info.needs(1, 6), 'Ориону нужно 6 взяток');
    assert.match(ru.actions.returnQuestion(2), /^Вега сказала/);
    assert.match(ru.results.conceded(2, '6♠', 2), /ушла без двух/);
    assert.equal(ru.results.misereCaught(0, 1), 'Вы · мизер пойман · 1 взятка');
    assert.equal(en.info.needs(0, 6), 'You need 6 tricks');
    assert.equal(en.info.needs(1, 1), 'Orion needs 1 trick');
    assert.equal(es.info.takesTalon(0), 'Tomas el talón');
    assert.equal(fr.info.takesTalon(2), 'Véga prend le talon');
    assert.match(he.info.takesTalon(2), /לוקחת/);
    assert.match(he.info.takesTalon(1), /לוקח /);
});

test('French puts a non-breaking space before : ; ? !', () => {
    const texts = strings(fr);
    const plain = texts.filter(text => / [:;?!]/.test(text));
    assert.deepEqual(plain, []);
    assert.match(fr.actions.whistQuestion(1, '7♠'), / \?$/);
});

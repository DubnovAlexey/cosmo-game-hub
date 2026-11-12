// [EN] FILE: shared/tests/finale.test.ts — the end of a game: every language has every scene of mockery and the words of
//      honour, the lines are short and typeset by the rules of their language, a scene and a line never repeat twice
//      running, the hero speaks after the music and before the scene leaves, and the sound switch works.
// [RU] ФАЙЛ: конец партии: на каждом языке есть каждая сцена издёвки и слова почёта, реплики короткие и набраны по
//      правилам своего языка, сцена и реплика не повторяются дважды подряд, герой говорит после музыки и до ухода
//      сцены, выключатель звука работает.
import assert from 'node:assert/strict';
import test from 'node:test';
// noinspection ES6PreferShortImport
import {
    AWARD_WORDS, FINALE_TIME, FINALE_WORDS, MOCK_SCENES, VOICE_AT, awardFor, nextStreak, pickLine, pickScene, soundEnabled, speechOf, voiceOf,
} from '../finale/logic.ts';
// noinspection ES6PreferShortImport
import { LANGUAGES } from '../i18n/languages.ts';

const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

test('every language has every scene of mockery and the words of honour, line for line', () => {
    for (const { code } of LANGUAGES) {
        const words = FINALE_WORDS[code];
        assert.equal(words.honour.lines.length, FINALE_WORDS.ru.honour.lines.length, `${code}: honour`);
        for (const scene of MOCK_SCENES) {
            assert.ok(words.mock[scene].title, `${code}: ${scene} title`);
            assert.equal(words.mock[scene].lines.length, FINALE_WORDS.ru.mock[scene].lines.length, `${code}: ${scene}`);
            assert.ok(words.mock[scene].lines.length >= 3, `${code}: ${scene} has a choice`);
        }
        assert.ok(words.close, code);
    }
});

test('the lines are short and typeset by the rules of their language', () => {
    for (const { code } of LANGUAGES) {
        const all = [FINALE_WORDS[code].honour, ...MOCK_SCENES.map(scene => FINALE_WORDS[code].mock[scene])].flatMap(speech => [speech.title, ...speech.lines]);
        for (const line of all) {
            assert.ok(line.length > 3 && line.length <= 120, `${code}: «${line}» ${line.length}`);
            if (code === 'fr') assert.doesNotMatch(line, / [:;?!»]|« /, `fr: no-break space in «${line}»`);
            if (code !== 'ru' && code !== 'he') assert.doesNotMatch(line, /[А-Яа-яЁё]/, `${code}: Cyrillic in «${line}»`);
            if (code === 'es' && /\?/.test(line)) assert.match(line, /¿/, `es: ¿ in «${line}»`);
        }
    }
});

test('a scene and a line never come twice running, and every scene comes up', () => {
    const random = seeded(7);
    let previous = pickScene(random);
    const seen = new Set([previous]);
    for (let round = 0; round < 200; round++) {
        const next = pickScene(random, previous);
        assert.notEqual(next, previous);
        seen.add(next);
        previous = next;
    }
    assert.equal(seen.size, MOCK_SCENES.length);
    const speech = speechOf('ru', 'lose', 'condolences');
    let line = pickLine(speech, random);
    for (let round = 0; round < 50; round++) {
        const next = pickLine(speech, random, line);
        assert.notEqual(next, line);
        assert.ok(speech.lines.includes(next));
        line = next;
    }
    assert.equal(speechOf('en', 'win', 'alms'), FINALE_WORDS.en.honour);
});

test('the hero speaks after the music and long before the scene leaves; the voice stays in range', () => {
    for (const at of Object.values(VOICE_AT)) assert.ok(at >= 3000 && at <= FINALE_TIME - 4500, String(at));
    for (const outcome of ['win', 'lose'] as const) {
        for (const female of [false, true]) {
            const { pitch, rate } = voiceOf(outcome, female);
            assert.ok(pitch > 0 && pitch <= 2 && rate >= 0.5 && rate <= 1.5);
        }
    }
    assert.ok(voiceOf('lose', false).rate < voiceOf('win', false).rate, 'the mocker drawls');
});

test('losing streaks are crowned: idiot of the year, of the decade, of the century, and the clinical one', () => {
    let streak = 0;
    const crowned: (string | null)[] = [];
    for (let game = 0; game < 20; game++) {
        streak = nextStreak(streak, 'lose');
        crowned.push(awardFor(streak));
    }
    assert.deepEqual(crowned.map((award, index) => (award ? `${index + 1}:${award}` : null)).filter(Boolean),
        ['3:year', '5:decade', '7:century', '10:clinical', '15:clinical', '20:clinical']);
    assert.equal(nextStreak(9, 'win'), 0, 'a win breaks the streak');
    assert.equal(awardFor(0), null);
    for (const { code } of LANGUAGES) {
        for (const award of ['year', 'decade', 'century', 'clinical'] as const) {
            const { title, lines } = AWARD_WORDS[code][award];
            assert.ok(title && lines.length === 1 && lines[0].length <= 150, `${code}: ${award}`);
            if (code === 'fr') assert.doesNotMatch(`${title} ${lines[0]}`, / [:;?!»]|« /, `fr: ${award}`);
            if (code === 'es' && /!/.test(lines[0])) assert.match(lines[0], /¡/, `es: ${award}`);
        }
    }
});

test('the sound is on unless the player switched it off', () => {
    assert.equal(soundEnabled(null), true);
    assert.equal(soundEnabled('on'), true);
    assert.equal(soundEnabled('off'), false);
});

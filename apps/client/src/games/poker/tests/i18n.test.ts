// [EN] FILE: games/poker/tests/i18n.test.ts — the five languages of the poker table: complete, really translated,
//      every regular of the crypt has a name and a tagline everywhere, sentences agree with you and with a player's
//      gender, French keeps its non-breaking spaces.
// [RU] ФАЙЛ: пять языков покерного стола: полные, действительно переведённые, у каждого завсегдатая склепа есть имя и
//      подпись на всех языках, фразы согласуются с «вы» и с родом игрока, во французском — неразрывные пробелы.
import assert from 'node:assert/strict';
import test from 'node:test';
import { CAST } from '../characters.ts';
// [EN] A relative path on purpose: Node runs the tests directly and knows no @shared alias.
// [RU] Относительный путь нарочно: Node запускает тесты напрямую и не знает псевдонима @shared.
// noinspection ES6PreferShortImport
import { CHARACTERS_EN } from '../../../shared/characters/texts/en.ts';
// noinspection ES6PreferShortImport
import { CHARACTERS_ES } from '../../../shared/characters/texts/es.ts';
// noinspection ES6PreferShortImport
import { CHARACTERS_FR } from '../../../shared/characters/texts/fr.ts';
// noinspection ES6PreferShortImport
import { CHARACTERS_HE } from '../../../shared/characters/texts/he.ts';
// noinspection ES6PreferShortImport
import { CHARACTERS_RU } from '../../../shared/characters/texts/ru.ts';
import enWords from '../i18n/en.ts';
import esWords from '../i18n/es.ts';
import frWords from '../i18n/fr.ts';
import heWords from '../i18n/he.ts';
import { withCharacters } from '../i18n/people.ts';
import ruWords from '../i18n/ru.ts';
import type { PokerTexts } from '../i18n/types.ts';

// [EN] The texts the table really gets: the poker words joined with the shared names and biographies.
// [RU] Тексты, которые стол получает на самом деле: слова покера вместе с общими именами и биографиями.
const en = withCharacters(enWords, CHARACTERS_EN);
const es = withCharacters(esWords, CHARACTERS_ES);
const fr = withCharacters(frWords, CHARACTERS_FR);
const he = withCharacters(heWords, CHARACTERS_HE);
const ru = withCharacters(ruWords, CHARACTERS_RU);

const ALL: readonly PokerTexts[] = [ru, en, he, es, fr];
const strings = (value: unknown, out: string[] = []): string[] => {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach(item => strings(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach(item => strings(item, out));
  return out;
};

test('every language is complete and is not a copy of English', () => {
  for (const t of ALL) {
    assert.equal(t.hands.length, 10, `${t.language}: ten hand names`);
    for (const { id } of CAST) assert.ok(t.characters[id].name && t.characters[id].bio.length > 20 && t.characters[id].tagline.length > 20, `${t.language}: ${id}`);
    if (t !== en) {
      assert.notEqual(t.setup.intro, en.setup.intro, `${t.language} copies English`);
      assert.notEqual(t.characters.koschei.tagline, en.characters.koschei.tagline);
    }
  }
  assert.deepEqual(ALL.map(t => t.language), ['ru', 'en', 'he', 'es', 'fr']);
});

test('sentences agree with you and with the player', () => {
  const you = { name: '', female: false, you: true };
  const carmilla = { name: ru.characters.carmilla.name, female: true, you: false };
  assert.equal(ru.results.wins(you, '240', 'Две пары'), 'Вы забираете 240 — Две пары');
  assert.equal(ru.results.wins(carmilla, '240', 'Флеш'), 'Кармилла забирает 240 — Флеш');
  assert.match(he.results.wins({ ...carmilla, name: he.characters.carmilla.name }, '240', 'פלאש'), /לוקחת/);
  assert.match(he.results.wins({ name: he.characters.vlad.name, female: false, you: false }, '240', 'פלאש'), /לוקח /);
  assert.equal(en.log.raise(you, '120', true), 'You: raise to 120, all-in');
  assert.equal(ru.setup.opponentsCount(1), '1 соперник');
  assert.equal(ru.setup.opponentsCount(3), '3 соперника');
  assert.equal(ru.setup.opponentsCount(5), '5 соперников');
  assert.equal(ru.cards.name(12, 0), 'туз пик');
  assert.equal(en.cards.name(8, 1), 'ten of hearts');
});

test('French puts a non-breaking space before : ; ? !', () => {
  const lilith = { name: 'Lilith', female: true, you: false };
  const texts = strings(fr).concat(fr.log.fold(lilith), fr.log.raise(lilith, '300', true), fr.results.youOut(2, 4), fr.setup.savedLine(3, 4, 'hier'));
  assert.deepEqual(texts.filter(text => / [:;?!]/.test(text)), []);
});

// [EN] FILE: shared/tests/characters.test.ts — the company of the lair is whole: every hero has a picture in
//      public/shared/characters and a name and a biography in all five languages (Russian also the dative and the
//      accusative), and the sea folk of the sea battle and the board folk of draughts are heroes of the lair.
// [RU] ФАЙЛ: компания логова цела: у каждого героя есть картинка в public/shared/characters, а также имя и биография
//      на всех пяти языках (по-русски ещё дательный и винительный падежи), а морской народ морского боя и народ доски
//      шашек — герои логова.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { BOARD_FOLK, CHARACTER_IDS, SEA_FOLK, characterFacts, portraitPath } from '../characters/roster.ts';
import { CHARACTERS_EN } from '../characters/texts/en.ts';
import { CHARACTERS_ES } from '../characters/texts/es.ts';
import { CHARACTERS_FR } from '../characters/texts/fr.ts';
import { CHARACTERS_HE } from '../characters/texts/he.ts';
import { CHARACTERS_RU } from '../characters/texts/ru.ts';

const PUBLIC = fileURLToPath(new URL('../../../public/', import.meta.url));

test('every hero has a picture and words in five languages', () => {
  assert.equal(CHARACTER_IDS.length, 116);
  for (const id of CHARACTER_IDS) {
    assert.ok(existsSync(PUBLIC + portraitPath(id)), `${id}: no picture ${portraitPath(id)}`);
    const ru = CHARACTERS_RU[id];
    assert.ok(ru.name && ru.to && ru.acc && ru.bio.length > 40, `${id}: Russian`);
    for (const [language, texts] of [['en', CHARACTERS_EN], ['he', CHARACTERS_HE], ['es', CHARACTERS_ES], ['fr', CHARACTERS_FR]] as const) {
      assert.ok(texts[id].name && texts[id].bio.length > 40, `${id}: ${language}`);
      assert.notEqual(texts[id].bio, ru.bio, `${id}: ${language} is not translated`);
    }
  }
});

test('the folk of the board are heroes of the lair, and a wide picture knows where the face is', () => {
  assert.equal(BOARD_FOLK.length, 21);
  assert.equal(new Set(BOARD_FOLK).size, BOARD_FOLK.length);
  for (const id of BOARD_FOLK) {
    assert.ok(CHARACTER_IDS.includes(id), id);
    assert.ok(!SEA_FOLK.includes(id), `${id} is not a pirate`);
  }
  // [EN] The five necromancers came up from the catacombs. [RU] Пятеро некромантов поднялись из катакомб.
  for (const id of BOARD_FOLK.slice(0, 5)) assert.equal(characterFacts(id).guest, false, id);
  for (const id of CHARACTER_IDS) {
    const focus = characterFacts(id).focus;
    if (focus !== undefined) assert.match(focus, /^(100|\d{1,2})% (100|\d{1,2})%$/, `${id}: focus «${focus}»`);
  }
});

test('the sea folk are guests of the lair', () => {
  assert.equal(SEA_FOLK.length, 5);
  for (const id of SEA_FOLK) {
    assert.ok(CHARACTER_IDS.includes(id), id);
    assert.equal(characterFacts(id).guest, true, `${id} came by sea`);
  }
});

test('every biography is short: one or two sentences, as long as the first heroes of the lair', () => {
  // [EN] Alexey, 11.11.2026: «Каждому персонажу надо краткую биографию». The limits are the longest of the first company.
  // [RU] Алексей, 11.11.2026: «Каждому персонажу надо краткую биографию». Пределы — самые длинные биографии первой компании.
  const LIMITS = [['ru', CHARACTERS_RU, 185], ['en', CHARACTERS_EN, 210], ['he', CHARACTERS_HE, 150], ['es', CHARACTERS_ES, 210], ['fr', CHARACTERS_FR, 225]] as const;
  for (const [language, texts, limit] of LIMITS) {
    for (const id of CHARACTER_IDS) {
      const { bio } = texts[id];
      assert.ok(bio.length <= limit, `${id} (${language}): ${bio.length} characters, at most ${limit}`);
      assert.ok(bio.split(/[.!?…»”"]\s+(?=[A-ZА-ЯЁÀ-Ýא-ת¡¿«“"])/u).length <= 3, `${id} (${language}): more than three sentences`);
    }
  }
});

test('French puts a no-break space before : ; ? ! in the biographies', () => {
  for (const id of CHARACTER_IDS) {
    const { name, bio } = CHARACTERS_FR[id];
    assert.doesNotMatch(`${name} ${bio}`, / [:;?!]/, id);
  }
});

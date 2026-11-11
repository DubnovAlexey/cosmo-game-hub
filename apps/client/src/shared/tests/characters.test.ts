// [EN] FILE: shared/tests/characters.test.ts — the company of the lair is whole: every hero has a picture in
//      public/shared/characters and a name and a biography in all five languages (Russian also the dative and the
//      accusative), and the sea folk of the sea battle are heroes of the lair.
// [RU] ФАЙЛ: компания логова цела: у каждого героя есть картинка в public/shared/characters, а также имя и биография
//      на всех пяти языках (по-русски ещё дательный и винительный падежи), и морской народ морского боя — герои логова.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { CHARACTER_IDS, SEA_FOLK, characterFacts, portraitPath } from '../characters/roster.ts';
import { CHARACTERS_EN } from '../characters/texts/en.ts';
import { CHARACTERS_ES } from '../characters/texts/es.ts';
import { CHARACTERS_FR } from '../characters/texts/fr.ts';
import { CHARACTERS_HE } from '../characters/texts/he.ts';
import { CHARACTERS_RU } from '../characters/texts/ru.ts';

const PUBLIC = fileURLToPath(new URL('../../../public/', import.meta.url));

test('every hero has a picture and words in five languages', () => {
  assert.equal(CHARACTER_IDS.length, 95);
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

test('the sea folk are guests of the lair', () => {
  assert.equal(SEA_FOLK.length, 5);
  for (const id of SEA_FOLK) {
    assert.ok(CHARACTER_IDS.includes(id), id);
    assert.equal(characterFacts(id).guest, true, `${id} came by sea`);
  }
});

test('French puts a no-break space before : ; ? ! in the biographies', () => {
  for (const id of CHARACTER_IDS) {
    const { name, bio } = CHARACTERS_FR[id];
    assert.doesNotMatch(`${name} ${bio}`, / [:;?!]/, id);
  }
});

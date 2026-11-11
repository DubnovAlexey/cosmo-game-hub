// [EN] FILE: games/battleship/tests/i18n.test.ts — the five languages of the sea battle: every dictionary has the same
//      keys as the Russian master and is really translated, the columns have ten different letters, every ship of
//      both fleets has a name, sentences agree with the opponent's gender, French keeps its non-breaking spaces.
// [RU] ФАЙЛ: пять языков морского боя: у каждого словаря те же ключи, что у русского (основного), и он действительно
//      переведён, у колонок десять разных букв, у каждого корабля обоих флотов есть название, фразы согласуются с
//      родом соперника, во французском — неразрывные пробелы.
import assert from 'node:assert/strict';
import test from 'node:test';
import { RULE_SETS } from '../engine/index.ts';
import en from '../i18n/en.ts';
import es from '../i18n/es.ts';
import fr from '../i18n/fr.ts';
import he from '../i18n/he.ts';
import ru from '../i18n/ru.ts';
import type { BattleTexts, Who } from '../i18n/types.ts';

const ALL: readonly BattleTexts[] = [ru, en, he, es, fr];
const LADY: Who = { name: 'Кармилла', female: true };
const CAPTAIN: Who = { name: 'Влад', female: false };

/** [EN] Every key of a dictionary as a path («setup.levels.easy») with the kind of its value. [RU] Каждый ключ словаря как путь («setup.levels.easy») с видом значения. */
function shape(value: unknown, path = '', out: string[] = []): string[] {
  if (Array.isArray(value)) out.push(`${path}: list of ${value.length}`);
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) shape(item, path ? `${path}.${key}` : key, out);
  else out.push(`${path}: ${typeof value}`);
  return out;
}
const strings = (value: unknown, out: string[] = []): string[] => {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach(item => strings(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach(item => strings(item, out));
  return out;
};
/** [EN] The sentences that are built from a name, a cell or a number. [RU] Фразы, которые собираются из имени, клетки или числа. */
const built = (t: BattleTexts): string[] => [
  t.header.savedAt('04:13'), t.setup.savedLine('10.11'), t.placing.rotate(t.placing.down), t.placing.dock(t.ships[3], 2), t.battle.theirTurn(LADY), t.battle.afloat(t.ships[4], 1),
  t.battle.miss(t.battle.you, 'B4'), t.battle.hit(LADY.name, 'B4'), t.battle.sunk(LADY.name, 'B4', t.ships[2]), t.cell.label('B4', t.cell.miss),
  t.result.lost(LADY), t.result.lost(CAPTAIN), t.result.stats(40, 17), t.hero.about(LADY.name),
];

test('every language has the keys of the Russian master and its own words', () => {
  assert.deepEqual(ALL.map(t => t.language), ['ru', 'en', 'he', 'es', 'fr']);
  for (const t of ALL) {
    assert.deepEqual(shape(t), shape(ru), `${t.language}: the keys differ from Russian`);
    for (const text of [...strings(t), ...built(t)]) assert.ok(text.trim().length > 0 || text === t.ships[0], `${t.language}: an empty text`);
    if (t !== en) {
      for (const key of ['intro', 'classicHint', 'westernHint', 'touchingHint', 'shootAgainHint'] as const) assert.notEqual(t.setup[key], en.setup[key], `${t.language} copies English: setup.${key}`);
      assert.notEqual(t.placing.hint, en.placing.hint, `${t.language} copies English: placing.hint`);
      assert.notEqual(t.result.won, en.result.won, `${t.language} copies English: result.won`);
    }
  }
});

test('the columns have ten different letters and every ship of both fleets has a name', () => {
  for (const t of ALL) {
    assert.equal(t.columns.length, 10, `${t.language}: ten columns`);
    assert.equal(new Set(t.columns).size, 10, `${t.language}: a letter is used twice`);
    for (const rules of Object.values(RULE_SETS)) {
      assert.ok(rules.size <= t.columns.length, `${t.language}: not enough letters for ${rules.id}`);
      for (const length of rules.fleet) assert.ok(t.ships[length], `${t.language}: no name for a ship of ${length} decks`);
    }
    assert.equal(new Set(t.ships.slice(1)).size, t.ships.length - 1, `${t.language}: two ships share a name`);
  }
  // [EN] The notebook letters of the Russian game: no Ё and no Й. [RU] Тетрадные буквы русской игры: без Ё и без Й.
  assert.equal(ru.columns.join(''), 'АБВГДЕЖЗИК');
  assert.equal(he.columns.join(''), 'אבגדהוזחטי');
});

test('sentences agree with the opponent', () => {
  assert.equal(ru.result.lost(LADY), 'Поражение. Кармилла потопила ваш флот.');
  assert.equal(ru.result.lost(CAPTAIN), 'Поражение. Влад потопил ваш флот.');
  assert.match(he.result.lost(LADY), /הטביעה/);
  assert.match(he.result.lost(CAPTAIN), /הטביע /);
  assert.equal(ru.battle.sunk('Вы', 'Б4', ru.ships[2]), 'Вы: Б4 — убит (эсминец)');
  assert.equal(ru.cell.label('Б4', ru.cell.miss), 'Б4, мимо');
  assert.equal(ru.placing.rotate(ru.placing.down), 'Повернуть: по вертикали');
  assert.equal(ru.result.stats(40, 17), 'Ваших выстрелов: 40, попаданий: 17 (43%).');
  // [EN] No shots yet: no division by zero on the screen. [RU] Выстрелов ещё не было: никакого деления на ноль на экране.
  for (const t of ALL) assert.doesNotMatch(t.result.stats(0, 0), /NaN|Infinity/, t.language);
});

test('French puts a non-breaking space before : ; ? ! and %', () => {
  const texts = [...strings(fr), ...built(fr)];
  assert.deepEqual(texts.filter(text => / [:;?!%]/.test(text)), []);
});

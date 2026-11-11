// [EN] FILE: games/checkers/tests/i18n.test.ts — the five languages of draughts: every dictionary has the same keys as
//      the Russian master and is really translated, sentences agree with the opponent's gender, numbers never turn
//      into NaN, French keeps its no-break spaces; every scene of the end of a game lies in public/.
// [RU] ФАЙЛ: пять языков шашек: у каждого словаря те же ключи, что у русского (основного), и он действительно
//      переведён, фразы согласуются с родом соперника, числа не превращаются в NaN, во французском — неразрывные
//      пробелы; каждая сцена конца партии лежит в public/.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ALL_SCENES, SCENE_PLAYERS, scenePath } from '../components/scenes.ts';
// noinspection ES6PreferShortImport
import { BOARD_FOLK } from '../../../shared/characters/roster.ts';
import en from '../i18n/en.ts';
import es from '../i18n/es.ts';
import fr from '../i18n/fr.ts';
import he from '../i18n/he.ts';
import ru from '../i18n/ru.ts';
import type { CheckersTexts, Who } from '../i18n/types.ts';

const ALL: readonly CheckersTexts[] = [ru, en, he, es, fr];
const LADY: Who = { name: 'Госпожа Погоста', female: true };
const LORD: Who = { name: 'Ульрих Вороний', female: false };

/** [EN] Every key of a dictionary as a path («setup.levels.easy») with the kind of its value. [RU] Каждый ключ словаря как путь с видом значения. */
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
/** [EN] The sentences that are built from a name, a square or a number. [RU] Фразы, которые собираются из имени, поля или числа. */
const built = (t: CheckersTexts): string[] => [
  t.header.savedAt('04:13'), t.setup.firstHint(true), t.setup.firstHint(false), t.setup.savedLine('11.11'), t.play.theirMove(LADY), t.play.theirMove(LORD),
  t.play.yourSide(t.play.white), t.play.yourSide(t.play.black), t.play.count(12, 0), t.square.label('c3', t.square.whiteMan),
  t.result.lost(LADY), t.result.lost(LORD), t.result.moves(41), t.hero.about(LADY.name),
];

test('every language has the keys of the Russian master and its own words', () => {
  assert.deepEqual(ALL.map(t => t.language), ['ru', 'en', 'he', 'es', 'fr']);
  for (const t of ALL) {
    assert.deepEqual(shape(t), shape(ru), `${t.language}: the keys differ from Russian`);
    for (const text of [...strings(t), ...built(t)]) assert.ok(text.trim().length > 0, `${t.language}: an empty text`);
    assert.notEqual(t.setup.firstHint(true), t.setup.firstHint(false), `${t.language}: who moves first`);
    if (t !== en) {
      for (const key of ['intro', 'russianHint', 'englishHint'] as const) assert.notEqual(t.setup[key], en.setup[key], `${t.language} copies English: setup.${key}`);
      assert.notEqual(t.play.hint, en.play.hint, `${t.language} copies English: play.hint`);
      assert.notEqual(t.result.won, en.result.won, `${t.language} copies English: result.won`);
    }
  }
});

test('sentences agree with the opponent', () => {
  assert.equal(ru.result.lost(LADY), 'Поражение. Госпожа Погоста обыграла вас.');
  assert.equal(ru.result.lost(LORD), 'Поражение. Ульрих Вороний обыграл вас.');
  assert.match(he.result.lost(LADY), /ניצחה/);
  assert.match(he.result.lost(LORD), /ניצח /);
  assert.match(he.play.theirMove(LADY), /חושבת/);
  assert.equal(ru.play.yourSide(ru.play.black), 'Вы играете: чёрные');
  assert.equal(ru.square.label('c3', ru.square.whiteKing), 'c3, белая дамка');
  for (const t of ALL) assert.doesNotMatch(`${t.result.moves(0)} ${t.play.count(0, 0)}`, /NaN|undefined/, t.language);
});

test('every scene of the end of a game is in public/, every end has one, and a player of a scene ends with it', () => {
  const PUBLIC = fileURLToPath(new URL('../../../../public/', import.meta.url));
  assert.equal(ALL_SCENES.length, 16);
  for (const path of ALL_SCENES) assert.ok(existsSync(PUBLIC + path), `no picture ${path}`);
  for (const outcome of ['won', 'lost', 'draw'] as const) {
    const seen = new Set(Array.from({ length: 40 }, (_, seed) => scenePath(outcome, seed)));
    assert.ok(seen.size > 1, `${outcome}: always the same scene`);
    assert.equal(scenePath(outcome, 7), scenePath(outcome, 7), `${outcome}: the same game shows the same scene`);
    assert.equal(scenePath(outcome, 7, 'vlad'), scenePath(outcome, 7), `${outcome}: a hero without a scene gets one of the pool`);
  }
  for (const id of SCENE_PLAYERS) {
    assert.ok(BOARD_FOLK.includes(id), `${id} plays draughts`);
    assert.equal(scenePath('won', 3, id), `games/checkers/scenes/${id}.webp`);
    assert.equal(scenePath('lost', 5, id), `games/checkers/scenes/${id}.webp`);
  }
});

test('French puts a no-break space before : ; ? !', () => {
  const texts = [...strings(fr), ...built(fr)];
  assert.deepEqual(texts.filter(text => / [:;?!]/.test(text)), []);
});

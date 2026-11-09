// [EN] FILE: games/preferans/tests/drink.test.ts — the absinthe of the lair follows the pool: a new pool opens a new
//      bottle, the bottle never fills up again while the pool is written and keeps its last drop when the pool closes;
//      your glass is poured for every deal and sipped trick by trick, the host's glass lasts two deals.
// [RU] ФАЙЛ: абсент логова идёт за пулей: новая пуля открывает новую бутылку, пока пишется пуля, бутылка не
//      наполняется снова, а когда пуля закрыта, в ней остаётся последняя капля; ваша рюмка наливается на каждую раздачу
//      и отпивается взятка за взяткой, рюмки хозяина хватает на две раздачи.
import assert from 'node:assert/strict';
import test from 'node:test';
import { EMPTY_GLASS, FRESH_BOTTLE, FULL_GLASS, LAST_DROP, drinkOf } from '../components/drink.ts';

const at = (deals: number, pool: number, phase: 'bidding' | 'play' | 'done' = 'bidding', tricks = 0) =>
  drinkOf({ phase, tricks, deals, pool, closesAt: 30 });

test('a new pool opens a new bottle with full glasses; a closed pool leaves the last drop', () => {
  assert.deepEqual(at(0, 0), { bottle: FRESH_BOTTLE, glasses: [FULL_GLASS, FULL_GLASS] });
  assert.equal(at(31, 30, 'done', 10).bottle, LAST_DROP);
  assert.equal(at(40, 45).bottle, LAST_DROP, 'a pool written past its end does not go below the last drop');
});

test('the bottle only goes down while the pool is written', () => {
  let previous = Infinity;
  for (let deal = 0; deal <= 40; deal += 1) {
    const { bottle } = at(deal, Math.min(30, Math.floor(deal * 0.8)));
    assert.ok(bottle <= previous && bottle >= LAST_DROP && bottle <= FRESH_BOTTLE, `deal ${deal}: ${bottle}`);
    previous = bottle;
  }
  // [EN] Long all-pass runs alone drain at most 60 % of it. [RU] Одни долгие распасы осушают не больше 60 %.
  assert.ok(at(500, 0).bottle > LAST_DROP + 0.3 * (FRESH_BOTTLE - LAST_DROP));
});

test('your glass is sipped trick by trick, the host keeps his glass for two deals', () => {
  const [bidding] = at(3, 6).glasses;
  const [half] = at(3, 6, 'play', 5).glasses;
  const [done] = at(4, 6, 'done', 10).glasses;
  assert.equal(bidding, FULL_GLASS);
  assert.ok(half < bidding && half > done);
  assert.equal(done, EMPTY_GLASS);
  // [EN] The host's glass: full on an even deal, half on the next one, empty after it. [RU] Рюмка хозяина: полная на чётной раздаче, половина на следующей, пустая после неё.
  assert.equal(at(2, 4).glasses[1], FULL_GLASS);
  const midway = at(3, 4).glasses[1];
  assert.ok(Math.abs(midway - (FULL_GLASS + EMPTY_GLASS) / 2) < 1e-9);
  assert.equal(at(4, 4, 'done', 10).glasses[1], EMPTY_GLASS);
});

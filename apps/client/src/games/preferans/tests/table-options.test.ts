// The table menu: plain preferans by default, options that contradict each other are never on together,
// required choices drop what no longer fits, and the engine receives exactly what was chosen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OPTIONS, chooseVariant, closedReason, isOn, isPlayable, normalizeTable, plainTable, reasonFor, toRuleOptions, toggleOption,
  type OptionSpec, type TableConfig,
} from '../engine/index.ts';

test('plain preferans: three players, Sochi, the usual conventions on, no extras, ready to play', () => {
  const plain = plainTable();
  assert.equal(plain.players, 3);
  assert.equal(plain.variant, 'sochi');
  assert.ok(isPlayable(plain));
  for (const spec of OPTIONS) assert.equal(isOn(plain, spec.id), spec.kind === 'convention', spec.id);
});

test('like a menu: «two down» and «three down» cannot be ordered together', () => {
  let table = toggleOption(plainTable(), 'concedeTwo').config;
  assert.ok(isOn(table, 'concedeTwo'));
  assert.deepEqual(closedReason(table, 'concedeThree'), { kind: 'conflict', with: 'concedeTwo' });
  assert.equal(toggleOption(table, 'concedeThree').config, table, 'the closed option does nothing');
  table = toggleOption(table, 'concedeTwo').config;
  assert.equal(closedReason(table, 'concedeThree'), null, 'free again after cancelling the first');
  table = toggleOption(table, 'concedeThree').config;
  assert.deepEqual(toRuleOptions(table).concedeTricks, 3);
});

test('options the engine does not play yet are closed as not ready', () => {
  assert.deepEqual(closedReason(plainTable(), 'bombs'), { kind: 'notReady' });
  assert.equal(toggleOption(plainTable(), 'bombs').config.options.includes('bombs'), false);
});

test('requirements, variants and player counts close an option, in a fixed order', () => {
  const specs: OptionSpec[] = [
    { id: 'halfWhist', kind: 'convention', ready: true },
    { id: 'whistPassHalf', kind: 'extra', ready: true, requires: ['halfWhist'] },
    { id: 'dealerWhists', kind: 'extra', ready: true, players: [4] },
    { id: 'americanHelp', kind: 'extra', ready: true, variants: ['sochi', 'rostov'] },
  ];
  const base: TableConfig = { ...plainTable(), options: [] };
  assert.deepEqual(reasonFor(specs[1], base, specs), { kind: 'requires', option: 'halfWhist' });
  assert.equal(reasonFor(specs[1], { ...base, options: ['halfWhist'] }, specs), null);
  assert.deepEqual(reasonFor(specs[2], base, specs), { kind: 'players', players: [4] });
  assert.equal(reasonFor(specs[2], { ...base, players: 4 }, specs), null);
  assert.deepEqual(reasonFor(specs[3], { ...base, variant: 'leningrad' }, specs), { kind: 'variant', variants: ['sochi', 'rostov'] });
});

test('a new variant brings its own conventions and drops what does not fit', () => {
  const withExtras = toggleOption(toggleOption(plainTable(), 'stalingrad').config, 'concedeTwo').config;
  const rostov = chooseVariant(withExtras, 'rostov');
  assert.equal(isOn(rostov.config, 'talonLeads'), false, 'Rostov never opens the talon on all-pass');
  assert.ok(isOn(rostov.config, 'stalingrad') && isOn(rostov.config, 'concedeTwo'), 'extras that still fit stay');
  assert.equal(isPlayable(rostov.config), false, 'the Rostov scoring is not in the engine yet');
  assert.equal(isOn(chooseVariant(withExtras, 'leningrad').config, 'tenChecked'), false, 'Leningrad whists the ten');
});

test('a saved or received table is made safe before use', () => {
  const table = normalizeTable({ players: 7 as 3, variant: 'sochi', poolTarget: 999, options: ['concedeTwo', 'concedeThree', 'nonsense' as 'teeth', 'bombs'] });
  assert.equal(table.players, 3);
  assert.equal(table.poolTarget, 10);
  assert.deepEqual(table.options, ['concedeTwo'], 'unknown, conflicting and unready options removed');
  assert.deepEqual(normalizeTable(undefined), plainTable());
});

test('the engine receives exactly the chosen rules', () => {
  const table = toggleOption(toggleOption(plainTable(), 'halfWhist').config, 'stalingrad').config;
  assert.deepEqual(toRuleOptions({ ...table, progression: 'flat' }), {
    raspasyProgression: [1], seniorHold: true, halfWhist: false, tenIsChecked: true, raspasyTalonLeads: true, stalingrad: true, concedeTricks: 0,
  });
});

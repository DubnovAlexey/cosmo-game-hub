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

test('every option is played since 09.11.2026; Classic brings dark calls and bombs', () => {
  assert.deepEqual(OPTIONS.filter(spec => !spec.ready).map(spec => spec.id), []);
  assert.deepEqual(closedReason(plainTable(), 'bombs'), { kind: 'variant', variants: ['classic'] });
  let classic = chooseVariant(plainTable(), 'classic').config;
  assert.deepEqual(closedReason(classic, 'bombs'), { kind: 'requires', option: 'darkBids' });
  classic = toggleOption(toggleOption(classic, 'darkBids').config, 'bombs').config;
  assert.ok(isOn(classic, 'bombs') && isPlayable(classic));
  assert.equal(toRuleOptions(classic).bombs, true);
  // [EN] The dealer's options need a dealer who sits out. [RU] Опциям сдающего нужен сдающий на прикупе.
  assert.deepEqual(closedReason(plainTable(), 'dealerWhists'), { kind: 'players', players: [4] });
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
  assert.equal(isPlayable(rostov.config), true, 'Rostov is played since 09.11.2026');
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
    talonTakesTricks: false, dummySeat: null,
    whistPassHalf: false, misereNoTalon: false, darkBids: false, bombs: false, paidTalon: false, americanHelp: false,
    dealerWhists: false, misereHalves: false, teeth: false,
  });
  // [EN] Four at the table: on all-pass the open talon is the dealer's hand. [RU] Вчетвером на распасах открытый прикуп — рука сдающего.
  assert.equal(toRuleOptions({ ...table, players: 4 }).talonTakesTricks, true);
  // [EN] Two at the table: the third seat is the dummy. [RU] Вдвоём третье место занимает болван.
  assert.equal(toRuleOptions({ ...table, players: 2 }).dummySeat, 2);
});

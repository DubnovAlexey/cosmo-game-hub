// =====================================================================
// FILE: apps/client/src/games/preferans/engine/tableOptions.ts
// PURPOSE: the table menu as data — ordered like a menu in a restaurant.
//   - Required choices: players, rule variant, pool length, all-pass prices. Plain preferans needs nothing else.
//   - Toggles: the conventions of the variant (on by default) and extras such as Stalingrad or bombs (off).
//   - Options that contradict each other cannot be on together. `closedReason` says why an option is closed,
//     so the setup panel can explain it; switching a required choice drops what no longer fits.
//   - Options the engine does not support yet are listed as not ready: the menu shows the whole plan.
//   Texts live in the UI (components/setupTexts.ts); here only ids, values and constraints, so the same checks
//   can validate a table on the future game server.
// SECTIONS: 1 catalog; 2 configuration; 3 availability; 4 changes; 5 rule options for the engine.
// =====================================================================
import type { RuleOptions } from './rules.ts';

// BEGIN 1. Catalog
export type PlayerCount = 2 | 3 | 4;
export type VariantId = 'sochi' | 'leningrad' | 'rostov' | 'classic';
export type ProgressionId = '1-2-3' | '1-2-4' | 'flat';
export type OptionId =
  | 'seniorHold' | 'halfWhist' | 'tenChecked' | 'talonLeads'
  | 'stalingrad' | 'concedeTwo' | 'concedeThree' | 'whistPassHalf' | 'misereNoTalon'
  | 'darkBids' | 'bombs' | 'paidTalon' | 'americanHelp' | 'dealerWhists' | 'misereHalves' | 'teeth';

/** One value of a required choice; `ready` = the engine plays it today. */
export interface Choice<T> { readonly value: T; readonly ready: boolean }

export const PLAYER_CHOICES: readonly Choice<PlayerCount>[] = [
  { value: 3, ready: true }, { value: 2, ready: false }, { value: 4, ready: false },
];
export const VARIANT_CHOICES: readonly Choice<VariantId>[] = [
  { value: 'sochi', ready: true }, { value: 'leningrad', ready: false }, { value: 'rostov', ready: false }, { value: 'classic', ready: false },
];
export const POOL_CHOICES: readonly Choice<number>[] = [{ value: 10, ready: true }, { value: 20, ready: true }, { value: 30, ready: true }];
export const PROGRESSIONS: Readonly<Record<ProgressionId, readonly number[]>> = { '1-2-3': [1, 2, 3], '1-2-4': [1, 2, 4], flat: [1] };
export const PROGRESSION_CHOICES: readonly Choice<ProgressionId>[] = [
  { value: '1-2-3', ready: true }, { value: '1-2-4', ready: true }, { value: 'flat', ready: true },
];

/** `convention`: part of the variant, on by default, may be switched off. `extra`: an add-on, off by default. */
export type OptionKind = 'convention' | 'extra';
export interface OptionSpec {
  readonly id: OptionId;
  readonly kind: OptionKind;
  readonly ready: boolean;
  /** Options that must be on first. */
  readonly requires?: readonly OptionId[];
  /** Options that cannot be on at the same time (the check works both ways). */
  readonly conflicts?: readonly OptionId[];
  /** Only in these variants. */
  readonly variants?: readonly VariantId[];
  /** Only with these player counts. */
  readonly players?: readonly PlayerCount[];
}

const OPTION_LIST: OptionSpec[] = [
  { id: 'seniorHold', kind: 'convention', ready: true },
  { id: 'halfWhist', kind: 'convention', ready: true },
  { id: 'tenChecked', kind: 'convention', ready: true },
  // Rostov never opens the talon on all-pass.
  { id: 'talonLeads', kind: 'convention', ready: true, variants: ['sochi', 'leningrad', 'classic'] },
  { id: 'stalingrad', kind: 'extra', ready: true },
  // Two values of one house rule: a table concedes two down or three down, never both.
  { id: 'concedeTwo', kind: 'extra', ready: true, conflicts: ['concedeThree'] },
  { id: 'concedeThree', kind: 'extra', ready: true, conflicts: ['concedeTwo'] },
  { id: 'whistPassHalf', kind: 'extra', ready: false, requires: ['halfWhist'] },
  { id: 'misereNoTalon', kind: 'extra', ready: false },
  { id: 'darkBids', kind: 'extra', ready: false, variants: ['classic'] },
  // Bombs are born from dark passes, so they need dark bids.
  { id: 'bombs', kind: 'extra', ready: false, requires: ['darkBids'], variants: ['classic'] },
  { id: 'paidTalon', kind: 'extra', ready: false },
  // A pool played to a common total (Leningrad) has nobody to help.
  { id: 'americanHelp', kind: 'extra', ready: false, variants: ['sochi', 'rostov'] },
  { id: 'dealerWhists', kind: 'extra', ready: false, players: [4] },
  { id: 'misereHalves', kind: 'extra', ready: false, players: [4] },
  { id: 'teeth', kind: 'extra', ready: false },
];
export const OPTIONS: readonly OptionSpec[] = Object.freeze(OPTION_LIST);
const SPECS = new Map<OptionId, OptionSpec>(OPTIONS.map(spec => [spec.id, spec]));

export function optionSpec(id: OptionId): OptionSpec {
  const spec = SPECS.get(id);
  if (!spec) throw new Error(`Unknown table option "${id}"`);
  return spec;
}

/** The conventions each variant switches on by default (sources: pref-bridge, Gambler, rulespal). */
const VARIANT_CONVENTIONS: Readonly<Record<VariantId, readonly OptionId[]>> = {
  sochi: ['seniorHold', 'halfWhist', 'tenChecked', 'talonLeads'],
  leningrad: ['seniorHold', 'halfWhist', 'talonLeads'],
  rostov: ['seniorHold', 'halfWhist', 'tenChecked'],
  classic: ['seniorHold', 'halfWhist', 'talonLeads'],
};
// END 1

// BEGIN 2. Configuration
export interface TableConfig {
  readonly players: PlayerCount;
  readonly variant: VariantId;
  readonly poolTarget: number;
  readonly progression: ProgressionId;
  /** Toggles that are on (plain data, so it can be saved and sent to a server). */
  readonly options: readonly OptionId[];
}

/** Plain preferans: three players, Sochi, a short pool, the usual conventions and no extras. */
export function plainTable(): TableConfig {
  return { players: 3, variant: 'sochi', poolTarget: 10, progression: '1-2-3', options: [...VARIANT_CONVENTIONS.sochi] };
}

export const isOn = (config: TableConfig, id: OptionId): boolean => config.options.includes(id);
// END 2

// BEGIN 3. Availability
export type ClosedReason =
  | { readonly kind: 'notReady' }
  | { readonly kind: 'conflict'; readonly with: OptionId }
  | { readonly kind: 'requires'; readonly option: OptionId }
  | { readonly kind: 'variant'; readonly variants: readonly VariantId[] }
  | { readonly kind: 'players'; readonly players: readonly PlayerCount[] };

/**
 * Why `spec` cannot be switched on in `config`; null when it can. Checked in this order: not ready yet, wrong
 * variant, wrong player count, a conflict with an option that is on, a missing required option.
 * `specs` is the catalog (a parameter so tests can check the logic on their own options).
 */
export function reasonFor(spec: OptionSpec, config: TableConfig, specs: readonly OptionSpec[] = OPTIONS): ClosedReason | null {
  if (!spec.ready) return { kind: 'notReady' };
  if (spec.variants && !spec.variants.includes(config.variant)) return { kind: 'variant', variants: spec.variants };
  if (spec.players && !spec.players.includes(config.players)) return { kind: 'players', players: spec.players };
  const on = (id: OptionId) => id !== spec.id && config.options.includes(id);
  const conflict = spec.conflicts?.find(on)
    ?? specs.find(other => on(other.id) && other.conflicts?.includes(spec.id))?.id;
  if (conflict) return { kind: 'conflict', with: conflict };
  const missing = spec.requires?.find(id => !config.options.includes(id));
  if (missing) return { kind: 'requires', option: missing };
  return null;
}

export const closedReason = (config: TableConfig, id: OptionId): ClosedReason | null => reasonFor(optionSpec(id), config);

/** Every chosen value is supported by the engine, so the table can be played now. */
export function isPlayable(config: TableConfig): boolean {
  const ready = <T>(choices: readonly Choice<T>[], value: T) => choices.some(choice => choice.value === value && choice.ready);
  return ready(PLAYER_CHOICES, config.players) && ready(VARIANT_CHOICES, config.variant)
    && ready(POOL_CHOICES, config.poolTarget) && ready(PROGRESSION_CHOICES, config.progression)
    && config.options.every(id => closedReason(config, id) === null);
}
// END 3

// BEGIN 4. Changes
export interface Change {
  readonly config: TableConfig;
  /** Options switched off because they no longer fit (shown to the player). */
  readonly dropped: readonly OptionId[];
}

/**
 * Keeps only the options that still fit, one at a time, so dependents of a dropped option go too. The newest
 * choice goes first: when two options clash, the one chosen earlier stays.
 */
function prune(config: TableConfig): Change {
  let options = [...config.options];
  const dropped: OptionId[] = [];
  for (let changed = true; changed;) {
    changed = false;
    for (const id of [...options].reverse()) {
      if (!SPECS.has(id) || closedReason({ ...config, options }, id) !== null) {
        options = options.filter(other => other !== id);
        dropped.push(id);
        changed = true;
        break;
      }
    }
  }
  return { config: { ...config, options }, dropped };
}

/** Switch a toggle: on only when nothing closes it; off always (with whatever depended on it). */
export function toggleOption(config: TableConfig, id: OptionId): Change {
  if (isOn(config, id)) return prune({ ...config, options: config.options.filter(other => other !== id) });
  if (closedReason(config, id) !== null) return { config, dropped: [] };
  return { config: { ...config, options: [...config.options, id] }, dropped: [] };
}

/** A new variant brings its own conventions; extras that still fit stay. */
export function chooseVariant(config: TableConfig, variant: VariantId): Change {
  const extras = config.options.filter(id => SPECS.get(id)?.kind === 'extra');
  return prune({ ...config, variant, options: [...VARIANT_CONVENTIONS[variant], ...extras] });
}

export const choosePlayers = (config: TableConfig, players: PlayerCount): Change => prune({ ...config, players });
export const choosePool = (config: TableConfig, poolTarget: number): Change => ({ config: { ...config, poolTarget }, dropped: [] });
export const chooseProgression = (config: TableConfig, progression: ProgressionId): Change => ({ config: { ...config, progression }, dropped: [] });

/** A saved or received configuration made safe: unknown values replaced, closed options removed. */
export function normalizeTable(input: Partial<TableConfig> | null | undefined): TableConfig {
  const plain = plainTable();
  if (!input) return plain;
  const pick = <T>(choices: readonly Choice<T>[], value: T | undefined, fallback: T) => (choices.some(choice => choice.value === value) ? value as T : fallback);
  const config: TableConfig = {
    players: pick(PLAYER_CHOICES, input.players, plain.players),
    variant: pick(VARIANT_CHOICES, input.variant, plain.variant),
    poolTarget: pick(POOL_CHOICES, input.poolTarget, plain.poolTarget),
    progression: pick(PROGRESSION_CHOICES, input.progression, plain.progression),
    options: Array.isArray(input.options) ? input.options.filter((id): id is OptionId => SPECS.has(id as OptionId)) : plain.options,
  };
  return prune(config).config;
}
// END 4

// BEGIN 5. Rule options for the engine
export function toRuleOptions(config: TableConfig): RuleOptions {
  return {
    raspasyProgression: PROGRESSIONS[config.progression],
    seniorHold: isOn(config, 'seniorHold'),
    halfWhist: isOn(config, 'halfWhist'),
    tenIsChecked: isOn(config, 'tenChecked'),
    raspasyTalonLeads: isOn(config, 'talonLeads'),
    stalingrad: isOn(config, 'stalingrad'),
    concedeTricks: isOn(config, 'concedeThree') ? 3 : isOn(config, 'concedeTwo') ? 2 : 0,
  };
}
// END 5

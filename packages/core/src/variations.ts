import { catalog } from "./knobs/catalog";
import { traits } from "./knobs/traits";
import type { Knob, KnobValue } from "./knobs/types";
import type { Seed } from "./seed";

/** Small, fast, seedable PRNG so every variation can be reproduced. */
export function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface VariationOptions {
  count?: number;
  /** Only explore knobs in these groups (e.g. ["Typography"]). Without it, traits drive the whole system. */
  groups?: string[];
  /** How many individual knobs to nudge per variation on top of traits. */
  knobNudges?: number;
}

function randomValue(knob: Knob, r: () => number): KnobValue | undefined {
  switch (knob.type) {
    case "enum":
      return knob.options[Math.floor(r() * knob.options.length)]!.value;
    case "number":
      return knob.min + Math.round((r() * (knob.max - knob.min)) / knob.step) * knob.step;
    case "boolean":
      return r() < 0.5;
    default:
      return undefined;
  }
}

/** Everything the user hasn't decided and hasn't locked. Empty means there is nothing to offer. */
export function freeKnobs(seed: Seed, groups?: string[]): Knob[] {
  return catalog.filter(
    (k) =>
      k.explorable !== false &&
      !(k.id in seed.knobs) &&
      !seed.locks.includes(k.id) &&
      (!groups || groups.includes(k.group)) &&
      randomValue(k, () => 0) !== undefined,
  );
}

export function freeTraits(seed: Seed) {
  return traits.filter((t) => !(t.id in seed.traits) && !seed.locks.includes(t.id));
}

/**
 * Proposes alternative seeds for "pick the one you like". Untouched traits are spread across
 * their range (each variation lands in a different slice, so options differ visibly), and a few
 * free knobs get nudged. Picking one simply makes its seed the current seed.
 */
export function variations(seed: Seed, opts: VariationOptions = {}): Seed[] {
  const count = opts.count ?? 4;
  const knobs = freeKnobs(seed, opts.groups);
  const tr = opts.groups ? [] : freeTraits(seed);
  if (!knobs.length && !tr.length) return [];

  const r = mulberry32(seed.random * 7919 + count);
  // Latin-hypercube slices: per trait, a shuffled assignment of variations to ranges.
  const slices = tr.map(() => {
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    return order;
  });
  const nudges = opts.groups ? knobs.length : Math.min(knobs.length, opts.knobNudges ?? 2);

  return Array.from({ length: count }, (_, v) => {
    const vr = mulberry32(seed.random * 104729 + v * 31 + 1);
    const traitsOut = { ...seed.traits };
    tr.forEach((t, i) => {
      traitsOut[t.id] = Math.round(((slices[i]![v]! + vr()) / count) * 100) / 100;
    });
    const knobsOut = { ...seed.knobs };
    const pool = [...knobs];
    for (let n = 0; n < nudges && pool.length; n++) {
      const [k] = pool.splice(Math.floor(vr() * pool.length), 1);
      const value = randomValue(k!, vr);
      if (value !== undefined) knobsOut[k!.id] = value;
    }
    return { ...seed, traits: traitsOut, knobs: knobsOut, random: seed.random * 31 + v + 1 };
  });
}

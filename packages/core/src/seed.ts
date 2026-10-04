import { isColor } from "./color";
import { catalog, knobById } from "./knobs/catalog";
import { presetById } from "./knobs/presets";
import { traitById } from "./knobs/traits";
import type { Influence, Knob, KnobValue } from "./knobs/types";

export const ENGINE_VERSION = "0.2.0";

/** Everything a user chose. Stored next to the tokens so a system can be regenerated, diffed and forked. */
export interface Seed {
  schema: 1;
  /** Engine version that generated the system. Upgrading is explicit and shows a diff. */
  engine: string;
  /** Style presets, applied in order on top of the product preset. */
  presets: string[];
  /** Trait positions, 0..1. Absent means untouched. */
  traits: Record<string, number>;
  /** Knob values the user set explicitly. */
  knobs: Record<string, KnobValue>;
  /** Knobs that variations and Shuffle must not move. */
  locks: string[];
  /** Base for any randomness, so results reproduce. */
  random: number;
}

export type Source =
  | { kind: "default" }
  | { kind: "preset"; id: string }
  | { kind: "trait"; id: string }
  | { kind: "user" };

export interface Resolved {
  values: Record<string, KnobValue>;
  sources: Record<string, Source>;
  /** Seed entries the engine ignored, e.g. knobs from a newer engine. */
  warnings: string[];
}

/** Knob renames. Old seeds are migrated before resolution, so ids can evolve safely. */
const migrations: Record<string, string> = {};

export function createSeed(knobs: Record<string, KnobValue> = {}, partial: Partial<Seed> = {}): Seed {
  return { schema: 1, engine: ENGINE_VERSION, presets: [], traits: {}, locks: [], random: 1, ...partial, knobs };
}

export function migrateSeed(seed: Seed): Seed {
  const knobs: Record<string, KnobValue> = {};
  for (const [id, v] of Object.entries(seed.knobs)) knobs[migrations[id] ?? id] = v;
  return { ...seed, knobs };
}

/** Clamps and coerces a value to what the knob accepts; returns undefined when unusable. */
export function coerce(knob: Knob, value: unknown): KnobValue | undefined {
  switch (knob.type) {
    case "number": {
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(n)) return undefined;
      const snapped = knob.min + Math.round((n - knob.min) / knob.step) * knob.step;
      return Number(Math.min(knob.max, Math.max(knob.min, snapped)).toFixed(4));
    }
    case "enum": {
      const s = String(value);
      return knob.options.some((o) => o.value === s) ? s : undefined;
    }
    case "boolean":
      return typeof value === "boolean" ? value : undefined;
    case "set":
      return Array.isArray(value) ? knob.options.map((o) => o.value).filter((v) => value.includes(v)) : undefined;
    case "colorList":
      return Array.isArray(value) ? value.filter((v) => typeof v === "string" && isColor(v)).slice(0, knob.max) : undefined;
    case "color":
      // Empty means "let the engine choose", which a required color can't do.
      if (typeof value !== "string") return undefined;
      return value === "" ? (knob.required ? undefined : "") : isColor(value) ? value : undefined;
    default:
      return typeof value === "string" ? value : undefined;
  }
}

function applyInfluence(knob: Knob, inf: Influence, t: number): KnobValue | undefined {
  if (inf.kind === "lerp") return coerce(knob, inf.from + (inf.to - inf.from) * t);
  let picked: KnobValue | undefined;
  for (const [threshold, value] of inf.steps) if (t >= threshold) picked = value;
  return picked === undefined ? undefined : coerce(knob, picked);
}

interface Layer {
  traits?: Record<string, number>;
  knobs?: Record<string, KnobValue>;
  source: Source;
}

/**
 * Resolution order, lowest first: knob defaults, the product preset, style presets in order,
 * the user's traits, the user's knobs. Within a layer, its traits apply before its knobs.
 * When several traits in one layer touch a knob, numbers average and choices go to the
 * trait positioned furthest from neutral.
 */
export function resolve(input: Seed): Resolved {
  const seed = migrateSeed(input);
  const values: Record<string, KnobValue> = {};
  const sources: Record<string, Source> = {};
  const warnings: string[] = [];

  for (const k of catalog) {
    values[k.id] = k.default;
    sources[k.id] = { kind: "default" };
  }

  const set = (id: string, raw: unknown, source: Source) => {
    const knob = knobById.get(id);
    if (!knob) {
      warnings.push(`Unknown knob "${id}" ignored`);
      return;
    }
    const v = coerce(knob, raw);
    if (v === undefined) {
      warnings.push(`Invalid value for "${id}" ignored`);
      return;
    }
    values[id] = v;
    sources[id] = source;
  };

  const layers: Layer[] = [];
  const productType = coerce(knobById.get("identity.productType")!, seed.knobs["identity.productType"]) ?? "saas";
  const product = presetById.get(`product.${productType}`);
  if (product) layers.push({ ...product, source: { kind: "preset", id: product.id } });
  for (const id of seed.presets) {
    const p = presetById.get(id);
    if (p) layers.push({ ...p, source: { kind: "preset", id } });
    else warnings.push(`Unknown preset "${id}" ignored`);
  }
  layers.push({ traits: seed.traits, knobs: seed.knobs, source: { kind: "user" } });

  for (const layer of layers) {
    applyTraits(layer.traits ?? {}, set, warnings, layer.source);
    for (const [id, v] of Object.entries(layer.knobs ?? {})) set(id, v, layer.source);
  }
  return { values, sources, warnings };
}

function applyTraits(
  positions: Record<string, number>,
  set: (id: string, v: unknown, s: Source) => void,
  warnings: string[],
  layerSource: Source,
) {
  const numeric = new Map<string, { sum: number; n: number; trait: string }>();
  const choice = new Map<string, { value: KnobValue; strength: number; trait: string }>();

  for (const [traitId, rawT] of Object.entries(positions)) {
    const trait = traitById.get(traitId);
    if (!trait) {
      warnings.push(`Unknown trait "${traitId}" ignored`);
      continue;
    }
    const t = Math.min(1, Math.max(0, rawT));
    for (const [knobId, inf] of Object.entries(trait.influences)) {
      const knob = knobById.get(knobId);
      if (!knob) continue;
      const v = applyInfluence(knob, inf, t);
      if (v === undefined) continue;
      if (typeof v === "number") {
        const acc = numeric.get(knobId) ?? { sum: 0, n: 0, trait: traitId };
        numeric.set(knobId, { sum: acc.sum + v, n: acc.n + 1, trait: acc.trait });
      } else {
        const strength = Math.abs(t - 0.5);
        const prev = choice.get(knobId);
        if (!prev || strength > prev.strength) choice.set(knobId, { value: v, strength, trait: traitId });
      }
    }
  }
  // A trait set inside a preset is credited to that preset; a user's trait to the trait itself.
  const src = (trait: string): Source => (layerSource.kind === "preset" ? layerSource : { kind: "trait", id: trait });
  for (const [id, { sum, n, trait }] of numeric) set(id, sum / n, src(trait));
  for (const [id, { value, trait }] of choice) set(id, value, src(trait));
}

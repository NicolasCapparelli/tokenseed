import { createSeed, generate, presets, resolveValue, type ColorValue, type GeneratedSystem } from "@tokenseed/core";

const base = { "identity.name": "Acme", "color.primary": "#3b5bdb" };

/** Every product and style preset in core, each on top of the same brand. */
export const PRESET_SYSTEMS: [string, GeneratedSystem][] = presets.map((p) => [
  p.id,
  generate(
    createSeed(
      p.kind === "product" ? { ...base, "identity.productType": p.id.replace("product.", "") } : base,
      p.kind === "style" ? { presets: [p.id] } : {},
    ),
  ),
]);

export const SRGB_SYSTEM = generate(createSeed(base));
export const P3_SYSTEM = generate(createSeed({ ...base, "color.primary": "#00e060", "color.gamut": "p3" }));
export const HC_SYSTEM = generate(createSeed({ ...base, "color.highContrast": true }));
export const LIGHT_ONLY_SYSTEM = generate(createSeed({ ...base, "identity.modes": "light" }));
export const DARK_ONLY_SYSTEM = generate(createSeed({ ...base, "identity.modes": "dark" }));

export const EXTRA_SYSTEMS: [string, GeneratedSystem][] = [
  ["srgb", SRGB_SYSTEM],
  ["p3", P3_SYSTEM],
  ["high-contrast", HC_SYSTEM],
  ["light-only", LIGHT_ONLY_SYSTEM],
  ["dark-only", DARK_ONLY_SYSTEM],
  ["no-inverse", generate(createSeed({ ...base, "color.inverse": false }))],
  ["springy-no-motion", generate(createSeed({ ...base, "motion.easing": "springy", "motion.level": "none", "type.fluid": true }))],
  ["tone-ramps", generate(createSeed({ ...base, "color.rampNaming": "tone" }))],
];

export const colorOf = (system: GeneratedSystem, path: string, mode: "light" | "dark") =>
  resolveValue(system, path, mode) as ColorValue;

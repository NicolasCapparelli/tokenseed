import { runEngine, type GeneratedSystem } from "./engine";
import { generators } from "./generators";
import type { Seed } from "./seed";

export * from "./knobs/types";
export { catalog, knobById, knobGroups } from "./knobs/catalog";
export { traits, traitById } from "./knobs/traits";
export { presets, productPresets, stylePresets, presetById } from "./knobs/presets";
export * from "./seed";
export * from "./tokens";
export * from "./engine";
export { generators, FONT_STYLES, OPTIONAL_RECIPES, STATUS_NAMES } from "./generators";
export * from "./repo";
export { apca, contrast, isColor, measure, type ContrastMetric } from "./color";
export * from "./variations";
export { toDtcgFiles, resolvedTree, deepResolve } from "./export/dtcg";
export { toCss, cssVarName, tokenDeclarations } from "./export/css";
export { toTailwind } from "./export/tailwind";
export { toDesignMd } from "./export/designmd";
export { catalogMarkdown } from "./export/catalogmd";

/** Seed in, complete design system out. Deterministic for a given seed and engine version. */
export function generate(seed: Seed): GeneratedSystem {
  return runEngine(seed, generators);
}

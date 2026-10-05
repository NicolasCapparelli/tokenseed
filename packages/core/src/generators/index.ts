import type { Generator } from "../engine";
import { dataviz, palette, semanticColor } from "./color";
import { elevation, layout, media, motion, shape, spacing, states } from "./foundations";
import { content, recipes } from "./recipes";
import { typography } from "./type";

/** The default pipeline. New generators register here; order comes from their `after` lists. */
export const generators: Generator[] = [
  palette, semanticColor, dataviz, typography, spacing, layout, shape, elevation, motion, states, media, recipes, content,
];

export { FONT_STYLES } from "./type";
export { OPTIONAL_RECIPES } from "./recipes";
export { STATUS_NAMES } from "./color";

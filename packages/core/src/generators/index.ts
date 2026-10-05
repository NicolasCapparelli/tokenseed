import type { Generator } from "../engine";
import { palette, semanticColor } from "./color";
import { elevation, misc, motion, shape, spacing } from "./foundations";
import { recipes } from "./recipes";
import { typography } from "./type";

/** The default pipeline. New generators register here; order comes from their `after` lists. */
export const generators: Generator[] = [palette, semanticColor, typography, spacing, shape, elevation, motion, misc, recipes];

export { FONT_STYLES } from "./type";

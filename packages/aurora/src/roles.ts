import { AuroraColor, AuroraContrast, AuroraFoundation } from "@aurora/core";
import { converter } from "culori";
import {
  isToken,
  resolveValue,
  type ColorValue,
  type GeneratedSystem,
  type ModeName,
  type TokenTree,
} from "@tokenseed/core";
import { toSrgb8, type Srgb8 } from "./srgb";

export type Appearance = "light" | "dark";

/** Every Aurora foundation colour role, in the contract's own spelling (`primary`, `onSurface`, ...). */
export type RoleName = Exclude<keyof typeof AuroraFoundation, "version" | "tokens">;
export const ROLE_NAMES = Object.keys(AuroraFoundation).filter((k) => k !== "version" && k !== "tokens") as RoleName[];

const WHITE: Srgb8 = { r: 255, g: 255, b: 255, a: 255 };
const BLACK: Srgb8 = { r: 0, g: 0, b: 0, a: 255 };

export const toAuroraColor = (c: Srgb8) => AuroraColor.rgba(c.r, c.g, c.b, c.a);
const ratio = (fg: Srgb8, bg: Srgb8) => AuroraContrast.ratio(toAuroraColor(fg), toAuroraColor(bg)) ?? 1;
const best = (bg: Srgb8, candidates: Srgb8[]) => candidates.reduce((a, b) => (ratio(b, bg) > ratio(a, bg) ? b : a));

const toOklab = converter("oklab");
const lightness = (c: Srgb8) => toOklab({ mode: "rgb", r: c.r / 255, g: c.g / 255, b: c.b / 255 })?.l ?? 0;

/**
 * A palette ramp ordered light to dark. Step names depend on the `color.rampSteps` and
 * `color.rampNaming` knobs (and integer-like keys iterate in numeric order, which is dark to light
 * for tone naming), so the order is recovered from the colours' lightness, never from the names.
 */
export function rampOf(system: GeneratedSystem, name: string): Srgb8[] | undefined {
  const palette = system.base["palette"];
  if (!palette || isToken(palette)) return undefined;
  const node = (palette as TokenTree)[name];
  if (!node || isToken(node)) return undefined;
  const steps = Object.keys(node).map((key, order) => {
    const color = toSrgb8(resolveValue(system, `palette.${name}.${key}`) as ColorValue);
    return { color, order, l: lightness(color) };
  });
  steps.sort((a, b) => b.l - a.l || a.order - b.order);
  return steps.map((s) => s.color);
}

const nearestIndex = (ramp: Srgb8[], target: number) =>
  ramp.reduce((bestI, c, i) => (Math.abs(lightness(c) - target) < Math.abs(lightness(ramp[bestI]!) - target) ? i : bestI), 0);

interface Accent {
  main: Srgb8;
  on: Srgb8;
  container: Srgb8;
  onContainer: Srgb8;
}

/** An accent family from a ramp alone, for roles TokenSeed has no semantic tokens for (tertiary). */
function deriveAccent(ramp: Srgb8[], dark: boolean, ink: Srgb8): Accent {
  const last = ramp.length - 1;
  const start = nearestIndex(ramp, dark ? 0.75 : 0.55);
  const byDistance = ramp.map((_, i) => i).sort((a, b) => Math.abs(a - start) - Math.abs(b - start) || a - b);
  const mainIndex = byDistance.find((i) => Math.max(ratio(WHITE, ramp[i]!), ratio(ink, ramp[i]!)) >= 4.5) ?? start;
  const main = ramp[mainIndex]!;
  const on = ratio(WHITE, main) >= ratio(ink, main) ? WHITE : ink;
  const container = ramp[dark ? last - 1 : 1]!;
  let onContainer: Srgb8 | undefined;
  for (let i = dark ? 2 : last - 3; i >= 0 && i <= last; i += dark ? -1 : 1) {
    if (ratio(ramp[i]!, container) >= 4.5) {
      onContainer = ramp[i]!;
      break;
    }
  }
  return { main, on, container, onContainer: onContainer ?? best(container, [ink, WHITE]) };
}

interface Fixed {
  fixed: Srgb8;
  dim: Srgb8;
  onFixed: Srgb8;
  onFixedVariant: Srgb8;
}

/** Appearance-independent fixed accents: pale ramp steps with dark ramp steps on top. */
function deriveFixed(ramp: Srgb8[]): Fixed {
  const last = ramp.length - 1;
  const fixedIndex = nearestIndex(ramp, 0.9);
  const dimIndex = Math.min(last, Math.max(fixedIndex + 1, nearestIndex(ramp, 0.8)));
  const fixed = ramp[fixedIndex]!;
  const dim = ramp[dimIndex]!;
  const passes = (c: Srgb8) => ratio(c, fixed) >= 4.5 && ratio(c, dim) >= 4.5;
  const onFixed = passes(ramp[last]!) ? ramp[last]! : best(dim, [BLACK, WHITE]);
  let onFixedVariant: Srgb8 | undefined;
  for (let i = nearestIndex(ramp, 0.35); i <= last; i++) {
    if (passes(ramp[i]!)) {
      onFixedVariant = ramp[i]!;
      break;
    }
  }
  return { fixed, dim, onFixed, onFixedVariant: onFixedVariant ?? onFixed };
}

function colorAt(system: GeneratedSystem, mode: ModeName) {
  const color = (path: string) => toSrgb8(resolveValue(system, path, mode) as ColorValue);
  const has = (path: string) => {
    try {
      resolveValue(system, path, mode);
      return true;
    } catch {
      return false;
    }
  };
  return { color, has };
}

/**
 * All 58 Aurora colour roles for one appearance, as 8-bit sRGB.
 *
 * Sourcing, by family:
 * - primary and secondary: `color.<family>.{default,on,subtle,onSubtle}`.
 * - tertiary: TokenSeed has no semantic tertiary, so it is derived from the `tertiary` palette ramp
 *   (the `secondary` ramp when the harmony produces only one extra colour), choosing steps by contrast.
 * - error, success, warning, info: `color.status.{danger,success,warning,info}.{solid,on,subtle,onSubtle}`.
 * - surface: page = surface, sunken = surfaceDim, overlay = surfaceBright; containers rise in order
 *   sunken, page, default, raised, overlay (lowest to highest). text.primary/secondary = onSurface/onSurfaceVariant.
 * - outline, outlineVariant: `color.border.strong` and `color.border.subtle`. scrim: `color.scrim`.
 * - inverse: `color.inverse.{surface,text}` when the knob is on, else neutral ramp ends.
 * - shadow: first layer colour of `shadow.1` (opaque), black when absent. surfaceTint: primary.
 * - fixed roles and inversePrimary: derived from ramps by lightness and contrast. The fixed roles
 *   come from mode-independent palette ramps, so they are identical in light and dark.
 */
export function auroraRoleColors(system: GeneratedSystem, appearance: Appearance): Record<RoleName, Srgb8> {
  if (!system.modes.includes(appearance)) throw new Error(`System has no ${appearance} mode`);
  const dark = appearance === "dark";
  const { color, has } = colorAt(system, appearance);

  const neutral = rampOf(system, "neutral")!;
  const ink = neutral[neutral.length - 1]!;

  const accent = (path: string): Accent => ({
    main: color(`${path}.default`),
    on: color(`${path}.on`),
    container: color(`${path}.subtle`),
    onContainer: color(`${path}.onSubtle`),
  });
  const status = (name: string): Accent => ({
    main: color(`color.status.${name}.solid`),
    on: color(`color.status.${name}.on`),
    container: color(`color.status.${name}.subtle`),
    onContainer: color(`color.status.${name}.onSubtle`),
  });

  const primaryRamp = rampOf(system, "primary")!;
  const secondaryRamp = rampOf(system, "secondary") ?? primaryRamp;
  const tertiaryRamp = rampOf(system, "tertiary") ?? secondaryRamp;

  const primary = accent("color.primary");
  const secondary = accent("color.secondary");
  const tertiary = deriveAccent(tertiaryRamp, dark, ink);

  const out = {} as Record<RoleName, Srgb8>;
  const family = (name: "primary" | "secondary" | "tertiary", a: Accent, ramp: Srgb8[]) => {
    const f = deriveFixed(ramp);
    const cap = name[0]!.toUpperCase() + name.slice(1);
    Object.assign(out, {
      [name]: a.main,
      [`on${cap}`]: a.on,
      [`${name}Container`]: a.container,
      [`on${cap}Container`]: a.onContainer,
      [`${name}Fixed`]: f.fixed,
      [`${name}FixedDim`]: f.dim,
      [`on${cap}Fixed`]: f.onFixed,
      [`on${cap}FixedVariant`]: f.onFixedVariant,
    });
  };
  family("primary", primary, primaryRamp);
  family("secondary", secondary, secondaryRamp);
  family("tertiary", tertiary, tertiaryRamp);

  const statusFamily = (name: "error" | "success" | "warning" | "info", from: string) => {
    const a = status(from);
    const cap = name[0]!.toUpperCase() + name.slice(1);
    Object.assign(out, { [name]: a.main, [`on${cap}`]: a.on, [`${name}Container`]: a.container, [`on${cap}Container`]: a.onContainer });
  };
  statusFamily("error", "danger");
  statusFamily("success", "success");
  statusFamily("warning", "warning");
  statusFamily("info", "info");

  const surface = (level: string) => color(`color.surface.${level}`);
  Object.assign(out, {
    surface: surface("page"),
    onSurface: color("color.text.primary"),
    surfaceDim: surface("sunken"),
    surfaceBright: surface("overlay"),
    surfaceContainerLowest: surface("sunken"),
    surfaceContainerLow: surface("page"),
    surfaceContainer: surface("default"),
    surfaceContainerHigh: surface("raised"),
    surfaceContainerHighest: surface("overlay"),
    onSurfaceVariant: color("color.text.secondary"),
    outline: color("color.border.strong"),
    outlineVariant: color("color.border.subtle"),
    scrim: color("color.scrim"),
    surfaceTint: primary.main,
  });

  out.shadow = BLACK;
  if (has("shadow.1")) {
    const layers = resolveValue(system, "shadow.1", appearance) as { color: ColorValue | string }[];
    const first = layers[0]?.color;
    if (first && typeof first === "object") out.shadow = { ...toSrgb8(first), a: 255 };
  }

  if (has("color.inverse.surface") && has("color.inverse.text")) {
    out.inverseSurface = color("color.inverse.surface");
    out.onInverseSurface = color("color.inverse.text");
  } else {
    // Same recipe TokenSeed uses for color.inverse.*, read straight off the neutral ramp.
    const last = neutral.length - 1;
    out.inverseSurface = neutral[dark ? 1 : last - 1]!;
    out.onInverseSurface = neutral[dark ? last : 0]!;
  }

  // Primary on the inverse surface: a pale step on a dark inverse surface, a deep one on a pale surface.
  const wanted = nearestIndex(primaryRamp, dark ? 0.45 : 0.8);
  const order = primaryRamp.map((_, i) => i).sort((a, b) => Math.abs(a - wanted) - Math.abs(b - wanted) || a - b);
  const passing = order.find((i) => ratio(primaryRamp[i]!, out.inverseSurface) >= 4.5);
  out.inversePrimary = passing !== undefined ? primaryRamp[passing]! : best(out.inverseSurface, primaryRamp);

  return out;
}

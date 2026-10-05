import { converter, formatHex, parse, toGamut, wcagContrast } from "culori";
import type { ColorValue } from "./tokens";

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

const toOklch = converter("oklch");
const toRgb = converter("rgb");
const clampToSrgb = toGamut("rgb", "oklch");

export function parseOklch(input: string): Oklch {
  const c = toOklch(parse(input));
  if (!c) throw new Error(`Not a color: ${input}`);
  return { l: c.l, c: c.c ?? 0, h: c.h ?? 0 };
}

export function oklchToHex({ l, c, h }: Oklch): string {
  return formatHex(clampToSrgb({ mode: "oklch", l, c, h }));
}

export function colorValue(hex: string, alpha = 1): ColorValue {
  const rgb = toRgb(parse(hex));
  if (!rgb) throw new Error(`Not a color: ${hex}`);
  const r3 = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 10000) / 10000;
  const value: ColorValue = { colorSpace: "srgb", components: [r3(rgb.r), r3(rgb.g), r3(rgb.b)], hex: formatHex(rgb) };
  if (alpha !== 1) value.alpha = alpha;
  return value;
}

export const contrast = (a: string, b: string) => wcagContrast(a, b);

/** Shortest signed angle from a to b, in degrees. */
export function hueDelta(a: number, b: number) {
  return ((((b - a) % 360) + 540) % 360) - 180;
}

export const wrapHue = (h: number) => ((h % 360) + 360) % 360;

import { converter, formatHex, parse, toGamut, wcagContrast } from "culori";
import type { ColorValue } from "./tokens";

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

const toOklch = converter("oklch");
const toRgb = converter("rgb");
const toP3 = converter("p3");
const toLch = converter("lch");
const clampToSrgb = toGamut("rgb", "oklch");
const clampToP3 = toGamut("p3", "oklch");

export const isColor = (input: string) => !!parse(input);

export function parseOklch(input: string): Oklch {
  const c = toOklch(parse(input));
  if (!c) throw new Error(`Not a color: ${input}`);
  return { l: c.l, c: c.c ?? 0, h: c.h ?? 0 };
}

export function oklchToHex({ l, c, h }: Oklch): string {
  return formatHex(clampToSrgb({ mode: "oklch", l, c, h }));
}

/** Same color in CIE LCh terms (used when a system generates ramps in LCh instead of OKLCH). */
export function lchToHex(l: number, c: number, h: number): string {
  return formatHex(clampToSrgb({ mode: "lch", l, c, h }));
}
export function parseLch(input: string) {
  const c = toLch(parse(input));
  if (!c) throw new Error(`Not a color: ${input}`);
  return { l: c.l, c: c.c ?? 0, h: c.h ?? 0 };
}

const r4 = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 10000) / 10000;

export function colorValue(hex: string, alpha = 1): ColorValue {
  const rgb = toRgb(parse(hex));
  if (!rgb) throw new Error(`Not a color: ${hex}`);
  const value: ColorValue = { colorSpace: "srgb", components: [r4(rgb.r), r4(rgb.g), r4(rgb.b)], hex: formatHex(rgb) };
  if (alpha !== 1) value.alpha = alpha;
  return value;
}

/** A wide-gamut color with an sRGB hex fallback, as DTCG allows. */
export function p3Value({ l, c, h }: Oklch): ColorValue {
  const p3 = toP3(clampToP3({ mode: "oklch", l, c, h }));
  return { colorSpace: "display-p3", components: [r4(p3.r), r4(p3.g), r4(p3.b)], hex: oklchToHex({ l, c, h }) };
}

export const contrast = (a: string, b: string) => wcagContrast(a, b);

/**
 * APCA lightness contrast (|Lc|, 0..~106) for text on a background, per SAPC-APCA 0.0.98G.
 * Polarity matters in APCA, so the arguments are ordered: text first, background second.
 */
export function apca(textHex: string, bgHex: string): number {
  const lum = (hex: string) => {
    const c = toRgb(parse(hex))!;
    const y = 0.2126729 * Math.pow(c.r, 2.4) + 0.7151522 * Math.pow(c.g, 2.4) + 0.072175 * Math.pow(c.b, 2.4);
    return y > 0.022 ? y : y + Math.pow(0.022 - y, 1.414);
  };
  const t = lum(textHex);
  const b = lum(bgHex);
  if (Math.abs(b - t) < 0.0005) return 0;
  let sapc: number;
  if (b > t) {
    sapc = (Math.pow(b, 0.56) - Math.pow(t, 0.57)) * 1.14;
    sapc = sapc < 0.1 ? 0 : sapc - 0.027;
  } else {
    sapc = (Math.pow(b, 0.65) - Math.pow(t, 0.62)) * 1.14;
    sapc = sapc > -0.1 ? 0 : sapc + 0.027;
  }
  return Math.abs(sapc * 100);
}

export type ContrastMetric = "wcag" | "apca";
export const measure = (metric: ContrastMetric, fg: string, bg: string) => (metric === "apca" ? apca(fg, bg) : contrast(fg, bg));

/** Shortest signed angle from a to b, in degrees. */
export function hueDelta(a: number, b: number) {
  return ((((b - a) % 360) + 540) % 360) - 180;
}

export const wrapHue = (h: number) => ((h % 360) + 360) % 360;

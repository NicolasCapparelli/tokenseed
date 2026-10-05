import { converter } from "culori";
import type { ColorValue } from "@tokenseed/core";

/** 8-bit sRGB with 8-bit alpha, the only colour form Aurora stores. */
export interface Srgb8 {
  r: number;
  g: number;
  b: number;
  /** 0..255; 255 is opaque. */
  a: number;
}

const toRgb = converter("rgb");
const to8 = (c: number) => Math.round(Math.min(1, Math.max(0, c)) * 255);

/**
 * Converts a TokenSeed colour to 8-bit sRGB. Always works from `components` and `colorSpace`,
 * never from `hex`: for display-p3 colours `hex` is a gamut-mapped fallback, not the same colour
 * the components describe. Out-of-gamut channels are clipped to [0, 1] before quantizing.
 */
export function toSrgb8(color: ColorValue): Srgb8 {
  const [x, y, z] = color.components;
  const rgb =
    color.colorSpace === "display-p3" ? toRgb({ mode: "p3", r: x, g: y, b: z }) : { mode: "rgb" as const, r: x, g: y, b: z };
  return { r: to8(rgb.r), g: to8(rgb.g), b: to8(rgb.b), a: to8(color.alpha ?? 1) };
}

export const srgbHex = ({ r, g, b, a }: Srgb8) =>
  `#${[r, g, b, a].map((n) => n.toString(16).padStart(2, "0")).join("")}`;

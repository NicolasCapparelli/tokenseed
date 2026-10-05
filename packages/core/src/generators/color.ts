import { colorValue, contrast, hueDelta, oklchToHex, parseOklch, wrapHue, type Oklch } from "../color";
import type { Generator, GeneratorContext } from "../engine";
import type { ModeName } from "../tokens";

const LIGHTNESS: Record<string, [string, number][]> = {
  "11": [
    ["50", 0.975], ["100", 0.94], ["200", 0.885], ["300", 0.8], ["400", 0.7], ["500", 0.61],
    ["600", 0.53], ["700", 0.45], ["800", 0.37], ["900", 0.29], ["950", 0.22],
  ],
  "13": [
    ["0", 0.995], ["50", 0.975], ["100", 0.94], ["200", 0.885], ["300", 0.8], ["400", 0.7], ["500", 0.61],
    ["600", 0.53], ["700", 0.45], ["800", 0.37], ["900", 0.29], ["950", 0.22], ["1000", 0.15],
  ],
};

const bell = (l: number) => Math.pow(Math.sin(Math.PI * Math.min(0.999, Math.max(0.001, l))), 0.9);

/** Tonal ramp from one seed color: lightness follows the step table, chroma peaks near mid-tones. */
export function ramp(seed: Oklch, steps: [string, number][], chromaScale: number, hueShift: number): [string, string][] {
  const peak = seed.c * chromaScale;
  const atSeed = bell(seed.l) || 1;
  return steps.map(([name, l]) => {
    const c = Math.min(peak * 1.1, (peak * bell(l)) / atSeed);
    const h = wrapHue(seed.h + hueShift * ((0.6 - l) / 0.4));
    return [name, oklchToHex({ l, c, h })];
  });
}

const STATUS: Record<string, { h: number; c: number }> = {
  success: { h: 150, c: 0.15 },
  warning: { h: 75, c: 0.16 },
  danger: { h: 27, c: 0.19 },
  info: { h: 245, c: 0.14 },
};

const HARMONY: Record<string, number> = { complementary: 180, analogous: 40, triadic: 120, split: 150, monochrome: 0 };

const NEUTRAL_HUE: Record<string, number | null> = { cool: 250, warm: 70, pure: null, brand: null };

export const palette: Generator = {
  id: "palette",
  after: [],
  reads: [
    "color.primary", "color.secondary", "color.harmony", "color.chroma", "color.hueShift", "color.rampSteps",
    "color.neutral.temperature", "color.neutral.tint", "color.status.harmonize",
  ],
  run(ctx) {
    const steps = LIGHTNESS[ctx.knob<string>("color.rampSteps")]!;
    const chroma = ctx.knob<number>("color.chroma");
    const shift = ctx.knob<number>("color.hueShift");
    const brand = parseOklch(ctx.knob<string>("color.primary"));

    const write = (name: string, seed: Oklch, scale: number, description: string) => {
      for (const [step, hex] of ramp(seed, steps, scale, shift)) {
        ctx.set(`palette.${name}.${step}`, "color", colorValue(hex), step === steps[0]![0] ? { description } : {});
      }
    };

    write("primary", brand, chroma, "Primary brand ramp, generated from your brand color.");

    const given = ctx.knob<string[]>("color.secondary").map(parseOklch);
    const harmony = ctx.knob<string>("color.harmony");
    const secondaries = given.length
      ? given
      : [{ l: brand.l, c: harmony === "monochrome" ? brand.c * 0.45 : brand.c * 0.85, h: wrapHue(brand.h + HARMONY[harmony]!) }];
    const names = ["secondary", "tertiary", "quaternary"];
    secondaries.forEach((s, i) => write(names[i]!, s, chroma, `${names[i]} ramp.`));

    const temp = ctx.knob<string>("color.neutral.temperature");
    const tint = ctx.knob<number>("color.neutral.tint");
    const neutralHue = NEUTRAL_HUE[temp] ?? brand.h;
    const neutralC = temp === "pure" ? 0 : 0.045 * tint;
    write("neutral", { l: 0.6, c: neutralC, h: neutralHue }, 1, "Neutral ramp for text, surfaces and borders.");

    const harmonize = ctx.knob<number>("color.status.harmonize");
    for (const [name, { h, c }] of Object.entries(STATUS)) {
      const hue = wrapHue(h + hueDelta(h, brand.h) * harmonize);
      write(name, { l: 0.6, c: c * Math.min(1.2, chroma), h: hue }, 1, `${name} status ramp.`);
    }
  },
};

/** Ramp step names in light-to-dark order, read back from the palette. */
function stepsOf(ctx: GeneratorContext): string[] {
  return LIGHTNESS[ctx.knob<string>("color.rampSteps")]!.map(([s]) => s);
}

export const semanticColor: Generator = {
  id: "semanticColor",
  after: ["palette"],
  reads: ["color.contrast", "color.dark.style", "color.surface.levels", "color.surface.brandTint", "color.primary"],
  run(ctx) {
    const steps = stepsOf(ctx);
    const target = ctx.knob<string>("color.contrast") === "AAA" ? 7 : 4.5;
    const brand = parseOklch(ctx.knob<string>("color.primary"));
    const brandTint = ctx.knob<number>("color.surface.brandTint");
    const levels = ctx.knob<number>("color.surface.levels");
    const darkStyle = ctx.knob<string>("color.dark.style");
    const p = (ramp: string, step: string) => `{palette.${ramp}.${step}}`;
    const hexOf = (ramp: string, step: string) => ctx.hex(`palette.${ramp}.${step}`);
    const idx = (s: string) => steps.indexOf(s);
    const at = (i: number) => steps[Math.max(0, Math.min(steps.length - 1, i))]!;

    /** First step, walking from `from` in `dir`, whose color reaches `ratio` against every background. */
    const firstPassing = (ramp: string, from: string, dir: 1 | -1, bgs: string[], ratio: number) => {
      for (let i = idx(from); i >= 0 && i < steps.length; i += dir) {
        if (bgs.every((bg) => contrast(hexOf(ramp, steps[i]!), bg) >= ratio)) return steps[i]!;
      }
      return dir === 1 ? steps[steps.length - 1]! : steps[0]!;
    };

    for (const mode of ["light", "dark"] as ModeName[]) {
      const light = mode === "light";
      const set = (path: string, value: unknown, description?: string) =>
        ctx.set(path, "color", value, { mode, description });

      // Surfaces
      // Every surface role always exists; with fewer levels, the extra ones collapse onto a neighbor.
      const surfaceNames = ["page", "default", "raised", "overlay", "sunken"];
      const collapse: Record<string, string> = { raised: "default", overlay: "raised", sunken: "page" };
      const surfaceHex: Record<string, string> = {};
      const darkBase = (l: number) =>
        darkStyle === "tinted" ? oklchToHex({ l, c: 0.03, h: brand.h }) : oklchToHex({ ...parseOklch(hexOf("neutral", at(steps.length - 1))), l });
      const surfaceL: Record<string, number> = light
        ? { page: 0.985, default: 1, raised: 1, overlay: 1, sunken: 0.965 }
        : darkStyle === "black"
          ? { page: 0, default: 0.17, raised: 0.21, overlay: 0.24, sunken: 0 }
          : { page: 0.17, default: 0.2, raised: 0.24, overlay: 0.27, sunken: 0.14 };
      surfaceNames.forEach((name, i) => {
        if (i >= levels) {
          surfaceHex[name] = surfaceHex[collapse[name]!]!;
          set(`color.surface.${name}`, `{color.surface.${collapse[name]}}`, `${name} surface (same as ${collapse[name]} at ${levels} levels).`);
          return;
        }
        const base = light ? parseOklch(hexOf("neutral", steps[0]!)) : parseOklch(darkBase(surfaceL[name]!));
        const l = surfaceL[name]!;
        const mixed: Oklch = {
          l,
          c: base.c * (l === 1 || l === 0 ? 0 : 1) + brand.c * brandTint * 0.15,
          h: brandTint > 0 ? brand.h : base.h,
        };
        surfaceHex[name] = oklchToHex(mixed);
        set(`color.surface.${name}`, colorValue(surfaceHex[name]!), `${name} surface.`);
      });
      const bgs = [surfaceHex.page!, surfaceHex.default!];

      // Text
      const extreme = light ? steps[steps.length - 2]! : steps[0]!;
      set("color.text.primary", p("neutral", extreme), "Default text. Headlines and body copy.");
      const mid = steps[Math.floor(steps.length / 2)]!;
      const secondary = firstPassing("neutral", mid, light ? 1 : -1, bgs, target);
      set("color.text.secondary", p("neutral", secondary), "Supporting text, captions, metadata.");
      set("color.text.disabled", p("neutral", light ? at(idx(mid) - 1) : at(idx(mid) + 1)), "Text in disabled controls. Exempt from contrast rules.");
      set("color.text.inverse", p("neutral", light ? steps[0]! : at(steps.length - 2)), "Text on inverse surfaces.");

      // Borders
      set("color.border.subtle", p("neutral", light ? at(2) : at(steps.length - 3)), "Dividers and quiet separators.");
      const strong = firstPassing("neutral", light ? at(3) : at(steps.length - 4), light ? 1 : -1, bgs, 3);
      set("color.border.strong", p("neutral", strong), "Borders on inputs and controls. Meets 3:1 for UI components.");

      // Brand roles: primary and secondary share the same rules.
      for (const role of ["primary", "secondary"]) {
        const ramp = role;
        const near = (l: number) =>
          steps.reduce((best, s) => (Math.abs(parseOklch(hexOf(ramp, s)).l - l) < Math.abs(parseOklch(hexOf(ramp, best)).l - l) ? s : best));
        let main = light ? near(Math.min(0.62, Math.max(0.45, brand.l))) : near(0.75);
        const white = "#ffffff";
        const darkText = hexOf("neutral", at(steps.length - 1));
        const onFor = (s: string) => {
          const hex = hexOf(ramp, s);
          return contrast(white, hex) >= contrast(darkText, hex) ? "white" : "dark";
        };
        // Walk darker (light mode) or lighter (dark mode) until text on the color is readable.
        for (let guard = 0; guard < steps.length; guard++) {
          const hex = hexOf(ramp, main);
          const best = Math.max(contrast(white, hex), contrast(darkText, hex));
          if (best >= 4.5) break;
          main = at(idx(main) + (light ? 1 : -1));
        }
        const on = onFor(main) === "white" ? colorValue(white) : p("neutral", at(steps.length - 1));
        set(`color.${role}.default`, p(ramp, main), `Main ${role} color: buttons, active states, key accents.`);
        set(`color.${role}.hover`, p(ramp, at(idx(main) + (light ? 1 : -1))), `${role} on hover.`);
        set(`color.${role}.pressed`, p(ramp, at(idx(main) + (light ? 2 : -2))), `${role} while pressed.`);
        set(`color.${role}.on`, on, `Text and icons on ${role}.default.`);
        set(`color.${role}.subtle`, p(ramp, light ? at(1) : at(steps.length - 2)), `Low-emphasis ${role} backgrounds: tonal buttons, selected rows.`);
        set(`color.${role}.onSubtle`, p(ramp, light ? at(steps.length - 3) : at(1)), `Text on ${role}.subtle.`);
      }
      set("color.focus", p("primary", light ? at(5) : at(4)), "Keyboard focus ring.");
      const link = firstPassing("primary", light ? at(6) : at(4), light ? 1 : -1, bgs, target);
      set("color.link", p("primary", link), "Inline links.");

      // Status
      for (const s of Object.keys(STATUS)) {
        const solid = light ? at(6) : at(4);
        const solidHex = hexOf(s, solid);
        const onSolid = contrast("#ffffff", solidHex) >= contrast(hexOf("neutral", at(steps.length - 1)), solidHex)
          ? colorValue("#ffffff")
          : p("neutral", at(steps.length - 1));
        set(`color.status.${s}.solid`, p(s, solid), `Strong ${s} fill: banners, badges.`);
        set(`color.status.${s}.on`, onSolid, `Text on ${s} solid.`);
        set(`color.status.${s}.subtle`, p(s, light ? at(1) : at(steps.length - 2)), `Quiet ${s} background.`);
        set(`color.status.${s}.text`, p(s, firstPassing(s, light ? at(7) : at(3), light ? 1 : -1, bgs, target)), `${s} text on surfaces.`);
        set(`color.status.${s}.onSubtle`, p(s, light ? at(steps.length - 3) : at(1)), `Text on ${s} subtle.`);
      }

      set("color.scrim", colorValue("#000000", light ? 0.4 : 0.6), "Backdrop behind dialogs and sheets.");
      set("color.inverse.surface", p("neutral", light ? at(steps.length - 2) : at(1)), "Inverse surface: tooltips, snackbars.");
    }

    for (const mode of ctx.modes) {
      ctx.check(mode, "color.text.primary", "color.surface.page", target);
      ctx.check(mode, "color.text.secondary", "color.surface.default", target);
      ctx.check(mode, "color.primary.on", "color.primary.default", 4.5);
      ctx.check(mode, "color.link", "color.surface.page", target);
      ctx.check(mode, "color.border.strong", "color.surface.default", 3);
      for (const s of Object.keys(STATUS)) ctx.check(mode, `color.status.${s}.on`, `color.status.${s}.solid`, 4.5);
    }

    ctx.guideline({ topic: "Color", kind: "do", text: "Use color.primary.default for the single most important action on a screen." });
    ctx.guideline({ topic: "Color", kind: "dont", text: "Don't use palette.* tokens directly in UI; use the semantic color.* roles so light and dark modes keep working." });
    ctx.guideline({ topic: "Color", kind: "do", text: "Pair status colors with an icon or label; never rely on color alone." });
  },
};

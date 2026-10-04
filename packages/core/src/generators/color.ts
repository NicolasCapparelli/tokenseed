import {
  colorValue,
  hueDelta,
  lchToHex,
  measure,
  oklchToHex,
  p3Value,
  parseLch,
  parseOklch,
  wrapHue,
  type ContrastMetric,
  type Oklch,
} from "../color";
import type { Generator, GeneratorContext } from "../engine";
import { isDarkMode, isHighContrast, type ColorValue, type ModeName } from "../tokens";

const BASE_L: Record<string, number[]> = {
  "11": [0.975, 0.94, 0.885, 0.8, 0.7, 0.61, 0.53, 0.45, 0.37, 0.29, 0.22],
  "13": [0.995, 0.975, 0.94, 0.885, 0.8, 0.7, 0.61, 0.53, 0.45, 0.37, 0.29, 0.22, 0.15],
};
const SCALE_NAMES: Record<string, string[]> = {
  "11": ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"],
  "13": ["0", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950", "1000"],
};
const CURVE: Record<string, number> = { balanced: 1, airy: 0.85, deep: 1.2 };

/** Step names (light to dark) and their target lightness, from the ramp knobs. */
export function rampSteps(ctx: Pick<GeneratorContext, "knob">): [string, number][] {
  const count = ctx.knob<string>("color.rampSteps");
  const gamma = CURVE[ctx.knob<string>("color.lightnessCurve")]!;
  const naming = ctx.knob<string>("color.rampNaming");
  const ls = BASE_L[count]!.map((l) => Math.round(Math.pow(l, gamma) * 1000) / 1000);
  return ls.map((l, i) => {
    const name = naming === "tone" ? String(Math.round(l * 100)) : naming === "index" ? String(i + 1) : SCALE_NAMES[count]![i]!;
    return [name, l];
  });
}

const CHROMA_CURVE: Record<string, number> = { peaked: 0.9, even: 0.35, mutedEnds: 1.6 };
const bell = (l: number, k: number) => Math.pow(Math.sin(Math.PI * Math.min(0.999, Math.max(0.001, l))), k);

export interface RampOptions {
  chroma: number;
  hueShift: number;
  curve: string;
  space: string;
}

/** Tonal ramp from one seed color: lightness follows the step table, chroma peaks near mid-tones. */
export function ramp(seed: Oklch, steps: [string, number][], o: RampOptions): [string, Oklch, string][] {
  const k = CHROMA_CURVE[o.curve] ?? 0.9;
  const peak = seed.c * o.chroma;
  const atSeed = bell(seed.l, k) || 1;
  return steps.map(([name, l]) => {
    const c = Math.min(peak * 1.1, (peak * bell(l, k)) / atSeed);
    const h = wrapHue(seed.h + o.hueShift * ((0.6 - l) / 0.4));
    if (o.space === "lch") {
      // CIE LCh: same lightness targets, chroma scaled from the seed's LCh chroma.
      const lchSeed = parseLch(oklchToHex(seed));
      const lc = (lchSeed.c * o.chroma * bell(l, k)) / atSeed;
      const hex = lchToHex(l * 100, Math.min(lc, lchSeed.c * o.chroma * 1.1), wrapHue(lchSeed.h + (h - seed.h)));
      return [name, parseOklch(hex), hex];
    }
    return [name, { l, c, h }, oklchToHex({ l, c, h })];
  });
}

const STATUS: Record<string, { h: number; c: number }> = {
  success: { h: 150, c: 0.15 },
  warning: { h: 75, c: 0.16 },
  danger: { h: 27, c: 0.19 },
  info: { h: 245, c: 0.14 },
};
export const STATUS_NAMES = Object.keys(STATUS);

const HARMONY: Record<string, number[]> = {
  complementary: [180],
  analogous: [40],
  triadic: [120, 240],
  split: [150, 210],
  tetradic: [90, 180],
  monochrome: [0],
};
const NEUTRAL_HUE: Record<string, number | null> = { cool: 250, warm: 70, pure: null, brand: null };

export const palette: Generator = {
  id: "palette",
  after: [],
  reads: [
    "color.primary", "color.secondary", "color.harmony", "color.chroma", "color.hueShift", "color.rampSteps",
    "color.rampNaming", "color.lightnessCurve", "color.chromaCurve", "color.gamut", "color.space",
    "color.neutral.temperature", "color.neutral.tint", "color.status.harmonize",
    "color.status.success", "color.status.warning", "color.status.danger", "color.status.info",
  ],
  run(ctx) {
    const steps = rampSteps(ctx);
    const opts: RampOptions = {
      chroma: ctx.knob<number>("color.chroma"),
      hueShift: ctx.knob<number>("color.hueShift"),
      curve: ctx.knob<string>("color.chromaCurve"),
      space: ctx.knob<string>("color.space"),
    };
    const p3 = ctx.knob<string>("color.gamut") === "p3";
    const brand = parseOklch(ctx.knob<string>("color.primary"));

    const write = (name: string, seed: Oklch, o: RampOptions, description: string) => {
      ramp(seed, steps, o).forEach(([step, lch, hex], i) => {
        ctx.set(`palette.${name}.${step}`, "color", p3 ? p3Value(lch) : colorValue(hex), i === 0 ? { description } : {});
      });
    };

    write("primary", brand, opts, "Primary brand ramp, generated from your brand color.");

    const given = ctx.knob<string[]>("color.secondary").map(parseOklch);
    const harmony = ctx.knob<string>("color.harmony");
    const derived = (HARMONY[harmony] ?? [40]).map((offset) => ({
      l: brand.l,
      c: harmony === "monochrome" ? brand.c * 0.45 : brand.c * 0.85,
      h: wrapHue(brand.h + offset),
    }));
    const names = ["secondary", "tertiary", "quaternary"];
    (given.length ? given : derived).slice(0, 3).forEach((s, i) => write(names[i]!, s, opts, `${names[i]} ramp.`));
    ctx.meta("secondaryRamps", (given.length ? given : derived).slice(0, 3).length);

    const temp = ctx.knob<string>("color.neutral.temperature");
    const tint = ctx.knob<number>("color.neutral.tint");
    const neutralHue = NEUTRAL_HUE[temp] ?? brand.h;
    const neutralC = temp === "pure" ? 0 : 0.045 * tint;
    write("neutral", { l: 0.6, c: neutralC, h: neutralHue }, { ...opts, chroma: 1, hueShift: 0 }, "Neutral ramp for text, surfaces and borders.");

    const harmonize = ctx.knob<number>("color.status.harmonize");
    for (const [name, { h, c }] of Object.entries(STATUS)) {
      const explicit = ctx.knob<string>(`color.status.${name}`);
      const seed = explicit ? parseOklch(explicit) : { l: 0.6, c: c * Math.min(1.2, opts.chroma), h: wrapHue(h + hueDelta(h, brand.h) * harmonize) };
      write(name, seed, { ...opts, chroma: 1 }, `${name} status ramp.`);
    }
  },
};

interface Targets {
  metric: ContrastMetric;
  /** Body text against surfaces. */
  text: number;
  /** Non-text UI: borders of controls, focus rings. */
  ui: number;
  /** Text on filled brand and status colors. */
  onFill: number;
}

export function contrastTargets(target: string, hc: boolean, audience: string): Targets {
  const older = audience === "older";
  if (target.startsWith("APCA")) {
    const text = Number(target.slice(4)) + (older ? 15 : 0);
    return hc ? { metric: "apca", text: Math.min(85, text + 15), ui: 60, onFill: 75 } : { metric: "apca", text: Math.min(90, text), ui: 45, onFill: Math.min(75, text) };
  }
  const text = target === "AAA" || older ? 7 : 4.5;
  return hc ? { metric: "wcag", text: 7, ui: 4.5, onFill: 7 } : { metric: "wcag", text, ui: 3, onFill: text };
}

export const semanticColor: Generator = {
  id: "semanticColor",
  after: ["palette"],
  reads: [
    "color.contrast", "color.highContrast", "identity.audience", "color.dark.style", "color.dark.elevation",
    "color.dark.chromaReduction", "color.surface.levels", "color.surface.brandTint", "color.surface.strategy",
    "color.surface.contrast", "color.border.strength", "color.scrim.opacity", "color.scrim.blur", "color.primary",
    "color.brand.usage", "color.onBrand", "color.selection", "color.focus", "color.inverse", "color.gradient",
    "color.gradient.angle", "state.hover", "state.pressed",
  ],
  run(ctx) {
    const steps = rampSteps(ctx).map(([s]) => s);
    const brand = parseOklch(ctx.knob<string>("color.primary"));
    const brandTint = ctx.knob<number>("color.surface.brandTint");
    const levels = ctx.knob<number>("color.surface.levels");
    const strategy = ctx.knob<string>("color.surface.strategy");
    const surfaceContrast = ctx.knob<number>("color.surface.contrast");
    const borderStrength = ctx.knob<number>("color.border.strength");
    const darkStyle = ctx.knob<string>("color.dark.style");
    const darkElevation = ctx.knob<string>("color.dark.elevation");
    const chromaReduction = ctx.knob<number>("color.dark.chromaReduction");
    const usage = ctx.knob<string>("color.brand.usage");
    const onBrand = ctx.knob<string>("color.onBrand");
    const hover = ctx.knob<string>("state.hover");
    const pressed = ctx.knob<string>("state.pressed");
    const focusKnob = ctx.knob<string>("color.focus");
    const p = (r: string, step: string) => `{palette.${r}.${step}}`;
    const hexOf = (r: string, step: string) => ctx.hex(`palette.${r}.${step}`);
    const idx = (s: string) => steps.indexOf(s);
    const at = (i: number) => steps[Math.max(0, Math.min(steps.length - 1, i))]!;
    const last = steps.length - 1;
    ctx.set("blur.scrim", "dimension", { value: ctx.knob<number>("color.scrim.blur"), unit: "px" }, { description: "Backdrop blur behind dialogs." });

    for (const mode of ctx.modes) {
      const dark = isDarkMode(mode);
      const hc = isHighContrast(mode);
      const t = contrastTargets(ctx.knob<string>("color.contrast"), hc, ctx.knob<string>("identity.audience"));
      const m = (fg: string, bg: string) => measure(t.metric, fg, bg);
      const set = (path: string, value: unknown, description?: string) => ctx.set(path, "color", value, { mode, description });
      const towardText = dark ? -1 : 1;

      /** First step, walking from `from` toward stronger contrast, that reaches `ratio` against every background. */
      const firstPassing = (r: string, from: string, bgs: string[], ratio: number) => {
        for (let i = idx(from); i >= 0 && i <= last; i += towardText) {
          if (bgs.every((bg) => m(hexOf(r, steps[i]!), bg) >= ratio)) return steps[i]!;
        }
        return dark ? steps[0]! : steps[last]!;
      };

      // Surfaces
      const names = ["page", "default", "raised", "overlay", "sunken"];
      const collapse: Record<string, string> = { raised: "default", overlay: "raised", sunken: "page" };
      const flatAbove = strategy === "flat" || (dark && darkElevation !== "lighter");
      const darkL = darkStyle === "black" ? 0 : hc ? 0.1 : 0.17;
      const sc = surfaceContrast;
      const surfaceL: Record<string, number> = !dark
        ? { page: hc ? 1 : 1 - 0.03 * sc, default: 1, raised: 1, overlay: 1, sunken: 1 - 0.07 * sc }
        : {
            page: darkL,
            default: darkL + (darkStyle === "black" ? 0.17 : 0.06 * sc),
            raised: darkL + (darkStyle === "black" ? 0.21 : 0.06 * sc + 0.04),
            overlay: darkL + (darkStyle === "black" ? 0.24 : 0.06 * sc + 0.07),
            sunken: Math.max(0, darkL - 0.03),
          };
      const neutralBase = parseOklch(hexOf("neutral", dark ? at(last) : steps[0]!));
      const surfaceHex: Record<string, string> = {};
      names.forEach((name, i) => {
        const alias = i >= levels ? collapse[name] : flatAbove && (name === "raised" || name === "overlay") ? (name === "raised" ? "default" : "raised") : undefined;
        if (alias) {
          surfaceHex[name] = surfaceHex[alias]!;
          set(`color.surface.${name}`, `{color.surface.${alias}}`, `${name} surface (same as ${alias}).`);
          return;
        }
        const l = surfaceL[name]!;
        const hue = dark && darkStyle === "tinted" ? brand.h : brandTint > 0 ? brand.h : neutralBase.h;
        const baseC = dark && darkStyle === "tinted" ? 0.03 : l >= 1 || l <= 0 ? 0 : neutralBase.c;
        surfaceHex[name] = oklchToHex({ l, c: hc ? 0 : baseC + brand.c * brandTint * 0.15, h: hue });
        set(`color.surface.${name}`, colorValue(surfaceHex[name]!), `${name} surface.`);
      });
      const bgs = [surfaceHex.page!, surfaceHex.default!];

      // Text
      const mid = steps[Math.floor(steps.length / 2)]!;
      set("color.text.primary", p("neutral", hc ? (dark ? steps[0]! : at(last)) : dark ? steps[0]! : at(last - 1)), "Default text. Headlines and body copy.");
      set("color.text.secondary", p("neutral", firstPassing("neutral", hc ? at(idx(mid) + towardText * 2) : mid, bgs, t.text)), "Supporting text, captions, metadata.");
      set("color.text.disabled", p("neutral", at(idx(mid) - towardText)), "Text in disabled controls. Exempt from contrast rules.");

      // Borders
      const subtleOffset = Math.round(borderStrength * 2);
      set("color.border.subtle", p("neutral", dark ? at(last - 2 - subtleOffset) : at(1 + subtleOffset)), "Dividers and quiet separators.");
      const strongStart = dark ? at(last - 3 - subtleOffset) : at(2 + subtleOffset);
      set("color.border.strong", p("neutral", firstPassing("neutral", strongStart, bgs, t.ui)), "Borders on inputs and controls; meets the non-text contrast target.");
      set("color.border.elevated", dark && darkElevation === "outlines" ? "{color.border.subtle}" : colorValue("#000000", 0), "Outline on raised surfaces where shadows don't read (dark mode).");

      // Brand roles
      const roleHex = (r: string, s: string) => {
        const hex = hexOf(r, s);
        if (!dark || chromaReduction === 0) return { hex, value: p(r, s) as unknown };
        const c = parseOklch(hex);
        const reduced = oklchToHex({ ...c, c: c.c * (1 - chromaReduction) });
        return { hex: reduced, value: colorValue(reduced) as unknown };
      };
      const white = "#ffffff";
      const darkText = hexOf("neutral", at(last));
      for (const r of ["primary", "secondary"]) {
        const nearL = (l: number) =>
          steps.reduce((best, s) => (Math.abs(parseOklch(hexOf(r, s)).l - l) < Math.abs(parseOklch(hexOf(r, best)).l - l) ? s : best));
        const start = dark ? nearL(0.75) : nearL(Math.min(0.62, Math.max(0.45, brand.l)));
        const wants = onBrand === "light" ? [white] : onBrand === "dark" ? [darkText] : [white, darkText];
        const byDistance = [...steps].sort((a, b) => Math.abs(idx(a) - idx(start)) - Math.abs(idx(b) - idx(start)));
        let main = start;
        let on = white;
        found: for (const s of byDistance) {
          for (const w of wants) {
            if (m(w, roleHex(r, s).hex) >= t.onFill) {
              main = s;
              on = w;
              break found;
            }
          }
        }
        if (onBrand === "auto") {
          // Prefer whichever text color reads better on the chosen fill.
          on = m(white, roleHex(r, main).hex) >= m(darkText, roleHex(r, main).hex) ? white : darkText;
        }
        const shift = (n: number) => roleHex(r, at(idx(main) + towardText * n)).value;
        set(`color.${r}.default`, roleHex(r, main).value, `Main ${r} color: buttons, active states, key accents.`);
        set(`color.${r}.hover`, hover === "shift" ? shift(1) : roleHex(r, main).value, `${r} on hover.`);
        set(`color.${r}.pressed`, pressed === "shift" ? shift(2) : hover === "shift" ? shift(1) : roleHex(r, main).value, `${r} while pressed.`);
        set(`color.${r}.on`, on === white ? colorValue(white) : p("neutral", at(last)), `Text and icons on ${r}.default.`);
        set(`color.${r}.subtle`, p(r, dark ? at(last - 1) : at(1)), `Low-emphasis ${r} backgrounds: tonal buttons, selected rows.`);
        const onSubtle = firstPassing(r, dark ? at(2) : at(last - 3), [hexOf(r, dark ? at(last - 1) : at(1))], t.text);
        set(`color.${r}.onSubtle`, p(r, onSubtle), `Text on ${r}.subtle.`);
      }

      // Emphasis surface: how much brand color large areas carry.
      const emphasis = { accents: ["{color.surface.default}", "{color.text.primary}"], balanced: ["{color.primary.subtle}", "{color.primary.onSubtle}"], immersive: ["{color.primary.default}", "{color.primary.on}"] }[usage]!;
      set("color.emphasis.surface", emphasis[0], "Hero and feature areas.");
      set("color.emphasis.on", emphasis[1], "Text on the emphasis surface.");

      // Focus, links, selection
      if (focusKnob) {
        const f = parseOklch(focusKnob);
        const candidates = [0.45, 0.55, 0.65, 0.75, 0.85].map((l) => oklchToHex({ ...f, l }));
        const pick = (dark ? [...candidates].reverse() : candidates).find((hex) => bgs.every((bg) => m(hex, bg) >= t.ui)) ?? (dark ? white : "#000000");
        set("color.focus", colorValue(pick), "Keyboard focus ring.");
      } else {
        set("color.focus", p("primary", firstPassing("primary", dark ? at(4) : at(5), bgs, t.ui)), "Keyboard focus ring.");
      }
      set("color.link", p("primary", firstPassing("primary", dark ? at(4) : at(6), bgs, t.text)), "Inline links.");
      set("color.selection", ctx.knob<string>("color.selection") === "brand" ? p("primary", dark ? at(last - 2) : at(2)) : p("neutral", dark ? at(last - 2) : at(2)), "Text selection highlight.");

      // Status
      for (const s of STATUS_NAMES) {
        const solid = firstPassing(s, dark ? at(4) : at(6), [], 0);
        const onWhite = m(white, hexOf(s, solid));
        const onDark = m(darkText, hexOf(s, solid));
        let solidStep = solid;
        let onSolid = onWhite >= onDark ? white : darkText;
        if (Math.max(onWhite, onDark) < t.onFill) {
          // Walk toward darker fills (or lighter in dark mode) until white or dark text reads.
          for (let i = 0; i <= last; i++) {
            const st = at(idx(solid) + (dark ? -i : i));
            if (m(white, hexOf(s, st)) >= t.onFill) { solidStep = st; onSolid = white; break; }
            if (m(darkText, hexOf(s, st)) >= t.onFill) { solidStep = st; onSolid = darkText; break; }
          }
        }
        const subtle = dark ? at(last - 1) : at(1);
        set(`color.status.${s}.solid`, p(s, solidStep), `Strong ${s} fill: banners, badges.`);
        set(`color.status.${s}.on`, onSolid === white ? colorValue(white) : p("neutral", at(last)), `Text on ${s} solid.`);
        set(`color.status.${s}.subtle`, p(s, subtle), `Quiet ${s} background.`);
        set(`color.status.${s}.text`, p(s, firstPassing(s, dark ? at(3) : at(7), bgs, t.text)), `${s} text on surfaces.`);
        set(`color.status.${s}.onSubtle`, p(s, firstPassing(s, dark ? at(2) : at(last - 3), [hexOf(s, subtle)], t.text)), `Text on ${s} subtle.`);
        set(`color.status.${s}.border`, p(s, dark ? at(last - 3) : at(3)), `Border for ${s} alerts.`);
      }

      const scrimA = Math.min(0.9, ctx.knob<number>("color.scrim.opacity") + (dark ? 0.2 : 0));
      set("color.scrim", colorValue("#000000", Math.round(scrimA * 100) / 100), "Backdrop behind dialogs and sheets.");
      if (ctx.knob<boolean>("color.inverse")) {
        set("color.inverse.surface", p("neutral", dark ? at(1) : at(last - 1)), "Inverse surface: tooltips, snackbars.");
        set("color.inverse.text", p("neutral", dark ? at(last) : steps[0]!), "Text on inverse surfaces.");
      }

      const gradient = ctx.knob<string>("color.gradient");
      if (gradient !== "none") {
        const angle = ctx.knob<number>("color.gradient.angle");
        const stops = gradient === "bold"
          ? [{ color: "{color.primary.default}", position: 0 }, { color: p("secondary", dark ? at(4) : at(5)), position: 1 }]
          : [{ color: "{color.primary.subtle}", position: 0 }, { color: p("secondary", dark ? at(last - 1) : at(1)), position: 1 }];
        ctx.set("gradient.brand", "gradient", stops, { mode, description: "Brand gradient for hero areas.", ext: { angle } });
      }

      // Checks
      const c = (fg: string, bg: string, req: number) => ctx.check(mode, fg, bg, req, t.metric);
      c("color.text.primary", "color.surface.page", t.text);
      c("color.text.secondary", "color.surface.default", t.text);
      c("color.primary.on", "color.primary.default", t.onFill);
      c("color.secondary.on", "color.secondary.default", t.onFill);
      c("color.primary.onSubtle", "color.primary.subtle", t.text);
      c("color.link", "color.surface.page", t.text);
      c("color.border.strong", "color.surface.default", t.ui);
      c("color.focus", "color.surface.page", t.ui);
      for (const s of STATUS_NAMES) {
        c(`color.status.${s}.on`, `color.status.${s}.solid`, t.onFill);
        c(`color.status.${s}.text`, "color.surface.default", t.text);
        c(`color.status.${s}.onSubtle`, `color.status.${s}.subtle`, t.text);
      }
    }

    ctx.guideline({ topic: "Color", kind: "do", text: "Use color.primary.default for the single most important action on a screen." });
    ctx.guideline({ topic: "Color", kind: "dont", text: "Don't use palette.* tokens directly in UI; use the semantic color.* roles so every mode keeps working." });
    if (ctx.modes.some(isHighContrast)) ctx.guideline({ topic: "Color", kind: "note", text: "High-contrast modes (light-hc, dark-hc) apply with prefers-contrast: more or data-theme." });
  },
};

const OKABE_ITO = ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#999999"];

export const dataviz: Generator = {
  id: "dataviz",
  after: ["palette"],
  reads: ["dataviz.enabled", "dataviz.count", "dataviz.colorblindSafe", "dataviz.harmony", "color.primary", "color.chroma"],
  run(ctx) {
    if (!ctx.knob<boolean>("dataviz.enabled")) return;
    const count = ctx.knob<number>("dataviz.count");
    const brand = parseOklch(ctx.knob<string>("color.primary"));
    const start = ctx.knob<string>("dataviz.harmony") === "brand" ? brand.h : 250;
    const chroma = 0.14 * Math.min(1.2, ctx.knob<number>("color.chroma"));
    const cb = ctx.knob<boolean>("dataviz.colorblindSafe");
    const ls = [0.62, 0.74, 0.52];
    for (let i = 0; i < count; i++) {
      const hex = cb && i < OKABE_ITO.length ? OKABE_ITO[i]! : oklchToHex({ l: ls[i % 3]!, c: chroma, h: wrapHue(start + i * 137.508) });
      ctx.set(`dataviz.categorical.${i + 1}`, "color", colorValue(hex), i === 0 ? { description: "Categorical series colors, in order of use." } : {});
    }
    const steps = rampSteps(ctx).map(([s]) => s);
    const pick = (n: number) => Array.from({ length: n }, (_, i) => steps[Math.round((i * (steps.length - 1)) / (n - 1))]!);
    pick(7).forEach((s, i) => ctx.set(`dataviz.sequential.${i + 1}`, "color", `{palette.primary.${s}}`, i === 0 ? { description: "Sequential scale, low to high." } : {}));
    const f = (x: number) => steps[Math.round(x * (steps.length - 1))]!;
    const diverging = [
      `{palette.danger.${f(0.75)}}`, `{palette.danger.${f(0.5)}}`, `{palette.danger.${f(0.2)}}`,
      `{palette.neutral.${f(0.1)}}`,
      `{palette.primary.${f(0.2)}}`, `{palette.primary.${f(0.5)}}`, `{palette.primary.${f(0.75)}}`,
    ];
    diverging.forEach((v, i) => ctx.set(`dataviz.diverging.${i + 1}`, "color", v, i === 0 ? { description: "Diverging scale: negative, neutral, positive." } : {}));
    ctx.guideline({ topic: "Data viz", kind: "do", text: `Assign dataviz.categorical.* in order; past ${count} series, group the rest as "Other".` });
    if (!cb) ctx.guideline({ topic: "Data viz", kind: "note", text: "Categorical colors aren't constrained for color-blind safety; label series directly or turn on dataviz.colorblindSafe." });
  },
};

export type { ColorValue, ModeName };

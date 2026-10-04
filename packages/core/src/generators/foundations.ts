import { colorValue, oklchToHex, parseOklch } from "../color";
import type { Generator } from "../engine";
import { ms, px, type ShadowValue } from "../tokens";

const DENSITY: Record<string, number> = { compact: 0.75, comfortable: 1, spacious: 1.25 };

export const spacing: Generator = {
  id: "spacing",
  after: [],
  reads: ["space.base", "space.density", "size.touchTarget"],
  run(ctx) {
    const unit = Number(ctx.knob<string>("space.base"));
    const density = DENSITY[ctx.knob<string>("space.density")]!;
    const scale = unit === 8
      ? [0, 4, 8, 16, 24, 32, 40, 48, 64, 80, 96, 128, 160]
      : [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128];
    scale.forEach((v, i) => ctx.set(`space.${i}`, "dimension", px(v)));
    const nearest = (target: number) => {
      let best = 0;
      scale.forEach((v, i) => {
        if (Math.abs(v - target) < Math.abs(scale[best]! - target)) best = i;
      });
      return `{space.${best}}`;
    };
    const semantic: Record<string, [Record<string, number>, string]> = {
      inset: [{ xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }, "Padding inside components and containers."],
      gap: [{ xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }, "Space between sibling elements."],
      section: [{ sm: 32, md: 48, lg: 64 }, "Space between page sections."],
    };
    for (const [group, [sizes, description]] of Object.entries(semantic)) {
      for (const [size, target] of Object.entries(sizes)) {
        ctx.set(`space.${group}.${size}`, "dimension", nearest(target * density), size === "md" ? { description } : {});
      }
    }

    const snap = (v: number) => Math.round(v / 4) * 4;
    const heights = { sm: 32, md: 40, lg: 48 };
    for (const [k, h] of Object.entries(heights)) ctx.set(`size.control.${k}`, "dimension", px(snap(h * (0.6 + 0.4 * density))));
    ctx.set("size.touchTarget", "dimension", px(Number(ctx.knob<string>("size.touchTarget"))), {
      description: "Minimum hit area for anything tappable, even when it looks smaller.",
    });
    for (const [k, v] of Object.entries({ sm: 16, md: 20, lg: 24, xl: 32 })) ctx.set(`size.icon.${k}`, "dimension", px(v));

    ctx.guideline({ topic: "Spacing", kind: "do", text: "Space with space.inset.*, space.gap.* and space.section.*; reach for raw space.N only when building new patterns." });
  },
};

export const shape: Generator = {
  id: "shape",
  after: [],
  reads: ["shape.style", "shape.radius", "border.width"],
  run(ctx) {
    const style = ctx.knob<string>("shape.style");
    const r = style === "sharp" ? Math.min(2, ctx.knob<number>("shape.radius")) : ctx.knob<number>("shape.radius");
    const mult = style === "round" || style === "pill" ? { xs: 0.25, sm: 0.5, md: 1, lg: 2, xl: 3 } : { xs: 0.25, sm: 0.5, md: 1, lg: 1.5, xl: 2 };
    ctx.set("radius.none", "dimension", px(0));
    for (const [k, m] of Object.entries(mult)) ctx.set(`radius.${k}`, "dimension", px(Math.round(r * m)));
    ctx.set("radius.full", "dimension", px(9999));
    ctx.set("radius.control", "dimension", style === "pill" ? "{radius.full}" : "{radius.md}", { description: "Buttons, inputs, selects." });
    ctx.set("radius.card", "dimension", "{radius.lg}", { description: "Cards and panels." });
    ctx.set("radius.sheet", "dimension", "{radius.xl}", { description: "Dialogs, sheets, large containers." });
    ctx.set("radius.chip", "dimension", style === "sharp" ? "{radius.sm}" : "{radius.full}", { description: "Chips, badges, tags." });

    const w = ctx.knob<number>("border.width");
    ctx.set("border.width.default", "dimension", px(w));
    ctx.set("border.width.strong", "dimension", px(w * 2));
    ctx.set("border.width.focus", "dimension", px(Math.max(2, w)));

    if (style !== "sharp") ctx.guideline({ topic: "Shape", kind: "do", text: "Nested corners: inner radius = outer radius minus the padding between them." });
  },
};

const SHADOWS: Record<string, { y: number; blur: number; spread: number; a: number }[][]> = {
  flat: [[], [], [], []],
  soft: [
    [{ y: 1, blur: 3, spread: 0, a: 0.06 }],
    [{ y: 4, blur: 12, spread: -2, a: 0.08 }],
    [{ y: 8, blur: 24, spread: -4, a: 0.1 }],
    [{ y: 16, blur: 40, spread: -8, a: 0.14 }],
  ],
  crisp: [
    [{ y: 1, blur: 1, spread: 0, a: 0.12 }],
    [{ y: 2, blur: 4, spread: 0, a: 0.14 }],
    [{ y: 4, blur: 8, spread: 0, a: 0.16 }],
    [{ y: 8, blur: 16, spread: 0, a: 0.18 }],
  ],
  layered: [
    [{ y: 1, blur: 2, spread: 0, a: 0.06 }, { y: 1, blur: 3, spread: 0, a: 0.04 }],
    [{ y: 1, blur: 2, spread: 0, a: 0.06 }, { y: 4, blur: 10, spread: -2, a: 0.08 }],
    [{ y: 2, blur: 4, spread: 0, a: 0.06 }, { y: 12, blur: 24, spread: -4, a: 0.1 }],
    [{ y: 4, blur: 8, spread: 0, a: 0.06 }, { y: 24, blur: 48, spread: -8, a: 0.16 }],
  ],
};

export const elevation: Generator = {
  id: "elevation",
  after: [],
  reads: ["elevation.style", "elevation.tint", "color.primary"],
  run(ctx) {
    const style = ctx.knob<string>("elevation.style");
    const brand = parseOklch(ctx.knob<string>("color.primary"));
    const shadowHex = ctx.knob<boolean>("elevation.tint") ? oklchToHex({ l: 0.25, c: Math.min(0.08, brand.c), h: brand.h }) : "#000000";
    for (const mode of ["light", "dark"] as const) {
      const boost = mode === "dark" ? 2.5 : 1;
      SHADOWS[style]!.forEach((layers, i) => {
        const value: ShadowValue[] = layers.length
          ? layers.map((s) => ({
              color: colorValue(shadowHex, Math.min(0.6, Math.round(s.a * boost * 100) / 100)),
              offsetX: px(0), offsetY: px(s.y), blur: px(s.blur), spread: px(s.spread),
            }))
          : [{ color: colorValue("#000000", 0), offsetX: px(0), offsetY: px(0), blur: px(0), spread: px(0) }];
        ctx.set(`shadow.${i + 1}`, "shadow", value, {
          mode,
          description: ["Resting cards.", "Raised cards, dropdowns.", "Popovers, menus.", "Dialogs and sheets."][i],
        });
      });
    }
    const layers = { base: 0, dropdown: 1000, sticky: 1100, overlay: 1200, modal: 1300, toast: 1400, tooltip: 1500 };
    for (const [k, v] of Object.entries(layers)) ctx.set(`z.${k}`, "number", v);
    if (style === "flat") ctx.guideline({ topic: "Elevation", kind: "note", text: "This system is flat: separate layers with borders and surface colors, not shadows." });
  },
};

const EASING: Record<string, Record<string, [number, number, number, number]>> = {
  standard: { standard: [0.2, 0, 0, 1], enter: [0, 0, 0.2, 1], exit: [0.4, 0, 1, 1] },
  snappy: { standard: [0.5, 0, 0.1, 1], enter: [0.1, 0.9, 0.2, 1], exit: [0.7, 0, 0.84, 0] },
  smooth: { standard: [0.45, 0, 0.55, 1], enter: [0.25, 0.1, 0.25, 1], exit: [0.42, 0, 1, 1] },
  springy: { standard: [0.34, 1.56, 0.64, 1], enter: [0.34, 1.56, 0.64, 1], exit: [0.36, 0, 0.66, -0.56] },
};
const LEVEL: Record<string, number> = { none: 0, subtle: 0.75, standard: 1, expressive: 1.3 };

export const motion: Generator = {
  id: "motion",
  after: [],
  reads: ["motion.level", "motion.speed", "motion.easing"],
  run(ctx) {
    const level = LEVEL[ctx.knob<string>("motion.level")]!;
    const speed = ctx.knob<number>("motion.speed");
    const base = { fast: 100, normal: 200, slow: 300, slower: 500 };
    for (const [k, v] of Object.entries(base)) ctx.set(`motion.duration.${k}`, "duration", ms(v * speed * level));
    const easing = EASING[ctx.knob<string>("motion.easing")]!;
    for (const [k, v] of Object.entries(easing)) ctx.set(`motion.easing.${k}`, "cubicBezier", v);
    const transitions: Record<string, [string, string, string]> = {
      standard: ["normal", "standard", "Most UI changes: hover, color, size."],
      enter: ["normal", "enter", "Elements appearing: menus, toasts."],
      exit: ["fast", "exit", "Elements leaving. Exits are quicker than entrances."],
      emphasized: ["slow", "standard", "Large surfaces: sheets, page transitions."],
    };
    for (const [k, [d, e, description]] of Object.entries(transitions)) {
      ctx.set(`transition.${k}`, "transition", { duration: `{motion.duration.${d}}`, delay: ms(0), timingFunction: `{motion.easing.${e}}` }, { description });
    }
    ctx.guideline({ topic: "Motion", kind: "do", text: "Respect prefers-reduced-motion: replace movement with a short fade or nothing." });
  },
};

export const misc: Generator = {
  id: "misc",
  after: [],
  reads: [],
  run(ctx) {
    const opacity = { disabled: 0.38, hover: 0.08, focus: 0.12, pressed: 0.12 };
    for (const [k, v] of Object.entries(opacity)) ctx.set(`opacity.${k}`, "number", v);
    const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 };
    for (const [k, v] of Object.entries(breakpoints)) ctx.set(`breakpoint.${k}`, "dimension", px(v));
    ctx.set("layout.maxWidth.prose", "dimension", px(680), { description: "Comfortable reading width." });
    ctx.set("layout.maxWidth.content", "dimension", px(1200));
    ctx.set("layout.columns", "number", 12);
  },
};

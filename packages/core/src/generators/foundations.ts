import { colorValue, oklchToHex, parseOklch } from "../color";
import type { Generator } from "../engine";
import { isDarkMode, ms, px, type ShadowValue } from "../tokens";

const DENSITY: Record<string, number> = { compact: 0.75, comfortable: 1, spacious: 1.25 };

/** Spacing scale in px for a base unit and progression. */
export function spaceScale(unit: number, progression: string, count: number): number[] {
  const out = [0];
  if (progression === "linear") {
    for (let i = 1; out.length < count; i++) out.push(unit * i);
  } else if (progression === "geometric") {
    let v = unit / 2;
    while (out.length < count) {
      out.push(Math.round(v));
      v *= 1.5;
      v = Math.round(v / 2) * 2;
    }
  } else {
    // Hybrid (Tailwind-like): fine steps while small, then bigger jumps.
    const mults = [0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64];
    for (const m of unit === 8 ? mults.filter((x) => x !== 3 && x !== 5) : mults) {
      if (out.length >= count) break;
      out.push((unit === 2 ? 4 : unit === 8 ? 8 : 4) * m);
    }
  }
  return [...new Set(out)].sort((a, b) => a - b);
}

export const spacing: Generator = {
  id: "spacing",
  after: [],
  reads: [
    "space.base", "space.density", "space.dataDensity", "space.progression", "space.steps", "size.control.default",
    "size.touchTarget", "size.icon.base", "size.avatar.base", "identity.platform", "a11y.minTarget",
  ],
  run(ctx) {
    const unit = Number(ctx.knob<string>("space.base"));
    const density = DENSITY[ctx.knob<string>("space.density")]!;
    const dataDensityKnob = ctx.knob<string>("space.dataDensity");
    const dataDensity = dataDensityKnob === "auto" ? density : DENSITY[dataDensityKnob]!;
    const scale = spaceScale(unit, ctx.knob<string>("space.progression"), ctx.knob<number>("space.steps"));
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

    const snap4 = (v: number) => Math.round(v / 4) * 4;
    const heights = { sm: 32, md: 40, lg: 48 };
    for (const [k, h] of Object.entries(heights)) ctx.set(`size.control.${k}`, "dimension", px(snap4(h * (0.6 + 0.4 * density))));
    ctx.set("size.control.default", "dimension", `{size.control.${ctx.knob<string>("size.control.default")}}`, { description: "Default height for buttons and inputs." });
    ctx.set("size.row.table", "dimension", px(snap4(40 * (0.6 + 0.4 * dataDensity))), { description: "Table and dense list row height." });
    const platform = ctx.knob<string>("identity.platform");
    const touch = Math.max(Number(ctx.knob<string>("size.touchTarget")), platform === "android" ? 48 : platform === "ios" ? 44 : 0, ctx.knob<number>("a11y.minTarget"));
    ctx.set("size.touchTarget", "dimension", px(touch), { description: "Minimum hit area for anything tappable, even when it looks smaller." });
    const icon = ctx.knob<number>("size.icon.base");
    for (const [k, m] of Object.entries({ sm: 0.8, md: 1, lg: 1.2, xl: 1.6 })) ctx.set(`size.icon.${k}`, "dimension", px(Math.round(icon * m)));
    const avatar = ctx.knob<number>("size.avatar.base");
    for (const [k, m] of Object.entries({ sm: 0.75, md: 1, lg: 1.5, xl: 2 })) ctx.set(`size.avatar.${k}`, "dimension", px(snap4(avatar * m)));

    ctx.guideline({ topic: "Spacing", kind: "do", text: "Space with space.inset.*, space.gap.* and space.section.*; reach for raw space.N only when building new patterns." });
  },
};

const BREAKPOINTS: Record<string, Record<string, number>> = {
  tailwind: { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 },
  bootstrap: { sm: 576, md: 768, lg: 992, xl: 1200, "2xl": 1400 },
  material: { sm: 600, md: 840, lg: 1200, xl: 1600 },
};

export const layout: Generator = {
  id: "layout",
  after: [],
  reads: ["layout.breakpoints", "layout.columns", "layout.gutter", "layout.margin", "layout.sidebar", "layout.header", "layout.maxWidth", "identity.direction"],
  run(ctx) {
    for (const [k, v] of Object.entries(BREAKPOINTS[ctx.knob<string>("layout.breakpoints")]!)) ctx.set(`breakpoint.${k}`, "dimension", px(v));
    ctx.set("layout.columns", "number", Number(ctx.knob<string>("layout.columns")));
    ctx.set("layout.gutter", "dimension", px(ctx.knob<number>("layout.gutter")), { description: "Gap between grid columns." });
    ctx.set("layout.margin", "dimension", px(ctx.knob<number>("layout.margin")), { description: "Page edge margin." });
    ctx.set("layout.sidebar", "dimension", px(ctx.knob<number>("layout.sidebar")), { description: "Sidebar width." });
    ctx.set("layout.header", "dimension", px(ctx.knob<number>("layout.header")), { description: "App bar / header height." });
    ctx.set("layout.maxWidth.content", "dimension", px(ctx.knob<number>("layout.maxWidth")), { description: "Maximum content width." });
    const dir = ctx.knob<string>("identity.direction");
    ctx.meta("direction", dir);
    ctx.extra("direction", dir);
    if (dir === "rtl") ctx.guideline({ topic: "Layout", kind: "do", text: "Use logical properties (margin-inline-start, inset-inline-end) so layouts mirror correctly in RTL." });
  },
};

export const shape: Generator = {
  id: "shape",
  after: [],
  reads: ["shape.style", "shape.radius", "shape.card.scale", "shape.chip", "shape.nested", "shape.corner", "border.width", "border.style", "avatar.shape", "image.radius"],
  run(ctx) {
    const style = ctx.knob<string>("shape.style");
    const r = style === "sharp" ? Math.min(2, ctx.knob<number>("shape.radius")) : ctx.knob<number>("shape.radius");
    const mult = style === "round" || style === "pill" ? { xs: 0.25, sm: 0.5, md: 1, lg: 2, xl: 3 } : { xs: 0.25, sm: 0.5, md: 1, lg: 1.5, xl: 2 };
    ctx.set("radius.none", "dimension", px(0));
    for (const [k, m] of Object.entries(mult)) ctx.set(`radius.${k}`, "dimension", px(Math.round(r * m)));
    ctx.set("radius.full", "dimension", px(9999));
    ctx.set("radius.control", "dimension", style === "pill" ? "{radius.full}" : "{radius.md}", { description: "Buttons, inputs, selects." });
    ctx.set("radius.card", "dimension", px(Math.round(r * ctx.knob<number>("shape.card.scale"))), { description: "Cards and panels." });
    ctx.set("radius.sheet", "dimension", "{radius.xl}", { description: "Dialogs, sheets, large containers." });
    ctx.set("radius.chip", "dimension", ctx.knob<string>("shape.chip") === "full" && style !== "sharp" ? "{radius.full}" : "{radius.sm}", { description: "Chips, badges, tags." });
    ctx.set("radius.avatar", "dimension", { circle: "{radius.full}", rounded: "{radius.md}", square: "{radius.none}" }[ctx.knob<string>("avatar.shape")]!, { description: "Avatars." });
    ctx.set("radius.image", "dimension", { match: "{radius.card}", none: "{radius.none}", full: "{radius.full}" }[ctx.knob<string>("image.radius")]!, { description: "Images and media." });

    const corner = ctx.knob<string>("shape.corner");
    ctx.extra("corner-shape", { round: "round", squircle: "superellipse(1.6)", bevel: "bevel" }[corner]!, { description: "Corner geometry (CSS corner-shape; browsers without support show round corners)." });

    const w = ctx.knob<number>("border.width");
    ctx.set("border.width.default", "dimension", px(w));
    ctx.set("border.width.strong", "dimension", px(w * 2));
    ctx.set("border.width.focus", "dimension", px(Math.max(2, w)));
    ctx.set("border.style.default", "strokeStyle", ctx.knob<string>("border.style"));

    if (ctx.knob<boolean>("shape.nested") && style !== "sharp") ctx.guideline({ topic: "Shape", kind: "do", text: "Nested corners: inner radius = outer radius minus the padding between them." });
    if (corner !== "round") ctx.guideline({ topic: "Shape", kind: "note", text: `Corners use ${corner} geometry where the browser supports corner-shape.` });
  },
};

type Layer = { y: number; blur: number; spread: number; a: number };
const SHADOWS: Record<string, Layer[][]> = {
  flat: [[], [], [], [], [], []],
  soft: [
    [{ y: 1, blur: 3, spread: 0, a: 0.06 }],
    [{ y: 4, blur: 12, spread: -2, a: 0.08 }],
    [{ y: 8, blur: 24, spread: -4, a: 0.1 }],
    [{ y: 16, blur: 40, spread: -8, a: 0.14 }],
    [{ y: 24, blur: 56, spread: -12, a: 0.16 }],
    [{ y: 32, blur: 72, spread: -16, a: 0.18 }],
  ],
  crisp: [
    [{ y: 1, blur: 1, spread: 0, a: 0.12 }],
    [{ y: 2, blur: 4, spread: 0, a: 0.14 }],
    [{ y: 4, blur: 8, spread: 0, a: 0.16 }],
    [{ y: 8, blur: 16, spread: 0, a: 0.18 }],
    [{ y: 12, blur: 24, spread: 0, a: 0.2 }],
    [{ y: 16, blur: 32, spread: 0, a: 0.22 }],
  ],
  layered: [
    [{ y: 1, blur: 2, spread: 0, a: 0.06 }, { y: 1, blur: 3, spread: 0, a: 0.04 }],
    [{ y: 1, blur: 2, spread: 0, a: 0.06 }, { y: 4, blur: 10, spread: -2, a: 0.08 }],
    [{ y: 2, blur: 4, spread: 0, a: 0.06 }, { y: 12, blur: 24, spread: -4, a: 0.1 }],
    [{ y: 4, blur: 8, spread: 0, a: 0.06 }, { y: 24, blur: 48, spread: -8, a: 0.16 }],
    [{ y: 6, blur: 12, spread: 0, a: 0.06 }, { y: 32, blur: 64, spread: -12, a: 0.18 }],
    [{ y: 8, blur: 16, spread: 0, a: 0.08 }, { y: 40, blur: 80, spread: -16, a: 0.2 }],
  ],
};
const LEVEL_USE = ["Resting cards.", "Raised cards, dropdowns.", "Popovers, menus.", "Dialogs and sheets.", "Toasts and floating actions.", "Highest overlays."];

export const elevation: Generator = {
  id: "elevation",
  after: [],
  reads: [
    "elevation.style", "elevation.tint", "elevation.light", "elevation.spread", "elevation.levels", "elevation.inner",
    "elevation.glass", "elevation.texture", "color.dark.elevation", "a11y.reduceTransparency", "color.primary",
  ],
  run(ctx) {
    const style = ctx.knob<string>("elevation.style");
    const brand = parseOklch(ctx.knob<string>("color.primary"));
    const shadowHex = ctx.knob<boolean>("elevation.tint") ? oklchToHex({ l: 0.25, c: Math.min(0.08, brand.c), h: brand.h }) : "#000000";
    const xDir = { top: 0, "top-left": 0.5, "top-right": -0.5 }[ctx.knob<string>("elevation.light")]!;
    const spread = ctx.knob<number>("elevation.spread");
    const levels = ctx.knob<number>("elevation.levels");
    const darkElevation = ctx.knob<string>("color.dark.elevation");
    for (const mode of ctx.modes) {
      const dark = isDarkMode(mode);
      const boost = dark ? (darkElevation === "shadows" ? 3 : darkElevation === "outlines" ? 1.5 : 2.5) : 1;
      for (let i = 0; i < levels; i++) {
        const layers = SHADOWS[style]![i]!;
        const value: ShadowValue[] = layers.length
          ? layers.map((s) => ({
              color: colorValue(shadowHex, Math.min(0.6, Math.round(s.a * boost * 100) / 100)),
              offsetX: px(Math.round(s.y * xDir)), offsetY: px(s.y), blur: px(Math.round(s.blur * spread)), spread: px(s.spread),
            }))
          : [{ color: colorValue("#000000", 0), offsetX: px(0), offsetY: px(0), blur: px(0), spread: px(0) }];
        ctx.set(`shadow.${i + 1}`, "shadow", value, { mode, description: LEVEL_USE[i] });
      }
      if (ctx.knob<boolean>("elevation.inner")) {
        ctx.set("shadow.inset", "shadow", [{ color: colorValue("#000000", dark ? 0.4 : 0.08), offsetX: px(0), offsetY: px(1), blur: px(2), spread: px(0), inset: true }], { mode, description: "Pressed wells and inputs." });
      }
    }
    const glass = ctx.knob<number>("elevation.glass");
    ctx.set("blur.glass", "dimension", px(glass), { description: glass ? "Backdrop blur for translucent surfaces." : "Glass surfaces are off (0)." });
    ctx.extra("surface-glass-opacity", glass && !ctx.knob<boolean>("a11y.reduceTransparency") ? "0.72" : "1", { description: "Opacity of translucent surfaces; 1 means opaque." });
    ctx.extra("texture-noise", ctx.knob<boolean>("elevation.texture")
      ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.06'/%3E%3C/svg%3E")`
      : "none", { description: "Subtle grain to layer over surfaces." });

    const z = { base: 0, dropdown: 1000, sticky: 1100, overlay: 1200, modal: 1300, toast: 1400, tooltip: 1500 };
    for (const [k, v] of Object.entries(z)) ctx.set(`z.${k}`, "number", v);
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
  reads: ["motion.level", "motion.speed", "motion.easing", "motion.spring.stiffness", "motion.spring.damping", "motion.exitRatio", "motion.stagger", "motion.distance", "motion.reduced"],
  run(ctx) {
    const level = LEVEL[ctx.knob<string>("motion.level")]!;
    const speed = ctx.knob<number>("motion.speed");
    const base = { fast: 100, normal: 200, slow: 300, slower: 500 };
    for (const [k, v] of Object.entries(base)) ctx.set(`motion.duration.${k}`, "duration", ms(v * speed * level));
    ctx.set("motion.duration.exit", "duration", ms(200 * speed * level * ctx.knob<number>("motion.exitRatio")), { description: "Exits are quicker than entrances." });
    ctx.set("motion.stagger", "duration", ms(ctx.knob<number>("motion.stagger") * level), { description: "Delay between items animating in a list." });
    const easingName = ctx.knob<string>("motion.easing");
    for (const [k, v] of Object.entries(EASING[easingName]!)) ctx.set(`motion.easing.${k}`, "cubicBezier", v);
    if (easingName === "springy") {
      ctx.set("motion.spring.stiffness", "number", ctx.knob<number>("motion.spring.stiffness"), { description: "Spring stiffness for physics-based animation libraries." });
      ctx.set("motion.spring.damping", "number", ctx.knob<number>("motion.spring.damping"));
    }
    const dist = ctx.knob<number>("motion.distance");
    for (const [k, v] of Object.entries({ sm: 4, md: 8, lg: 16 })) ctx.set(`motion.distance.${k}`, "dimension", px(Math.round(v * dist)), k === "md" ? { description: "How far elements travel when entering." } : {});
    const transitions: Record<string, [string, string, string]> = {
      standard: ["normal", "standard", "Most UI changes: hover, color, size."],
      enter: ["normal", "enter", "Elements appearing: menus, toasts."],
      exit: ["exit", "exit", "Elements leaving."],
      emphasized: ["slow", "standard", "Large surfaces: sheets, page transitions."],
    };
    for (const [k, [d, e, description]] of Object.entries(transitions)) {
      ctx.set(`transition.${k}`, "transition", { duration: `{motion.duration.${d}}`, delay: ms(0), timingFunction: `{motion.easing.${e}}` }, { description });
    }
    const reduced = ctx.knob<string>("motion.reduced");
    ctx.extra("reduced-motion", reduced, { description: "What replaces movement under prefers-reduced-motion: a fade or nothing." });
    ctx.guideline({ topic: "Motion", kind: "do", text: reduced === "fade" ? "Under prefers-reduced-motion, replace movement with a short fade." : "Under prefers-reduced-motion, remove animation entirely." });
  },
};

export const states: Generator = {
  id: "states",
  after: [],
  reads: ["state.hoverOpacity", "state.focusOpacity", "state.pressedOpacity", "state.disabled", "state.disabledOpacity", "state.pressed"],
  run(ctx) {
    ctx.set("opacity.hover", "number", ctx.knob<number>("state.hoverOpacity"), { description: "State layer over a surface on hover." });
    ctx.set("opacity.focus", "number", ctx.knob<number>("state.focusOpacity"));
    ctx.set("opacity.pressed", "number", ctx.knob<number>("state.pressedOpacity"));
    const disabled = ctx.knob<string>("state.disabled");
    ctx.set("opacity.disabled", "number", disabled === "opacity" ? ctx.knob<number>("state.disabledOpacity") : 1, { description: disabled === "opacity" ? "Disabled controls fade." : "Disabled controls use muted colors instead of fading." });
    ctx.set("scale.pressed", "number", ctx.knob<string>("state.pressed") === "scale" ? 0.97 : 1, { description: "Scale while pressed." });
    ctx.meta("disabledStrategy", disabled);
  },
};

const ASPECT: Record<string, [string, number][]> = {
  widescreen: [["wide", 16 / 9], ["standard", 4 / 3], ["square", 1]],
  photo: [["wide", 3 / 2], ["standard", 4 / 5], ["square", 1]],
  cinematic: [["wide", 21 / 9], ["standard", 16 / 9], ["square", 1]],
};

export const media: Generator = {
  id: "media",
  after: [],
  reads: ["icon.style", "icon.stroke", "icon.set", "image.ratio", "image.overlay"],
  run(ctx) {
    ctx.set("icon.stroke", "dimension", px(ctx.knob<number>("icon.stroke")), { description: "Stroke width for outline icons." });
    ctx.meta("iconSet", ctx.knob<string>("icon.set"));
    ctx.meta("iconStyle", ctx.knob<string>("icon.style"));
    for (const [k, v] of ASPECT[ctx.knob<string>("image.ratio")]!) ctx.set(`aspect.${k}`, "number", Math.round(v * 1000) / 1000);
    const overlay = ctx.knob<string>("image.overlay");
    ctx.extra("image-overlay", overlay === "gradient" ? "linear-gradient(180deg, transparent 40%, rgb(0 0 0 / 0.6))" : overlay === "scrim" ? "rgb(0 0 0 / 0.35)" : "none", { description: "Overlay for text on images." });
    ctx.guideline({ topic: "Icons", kind: "do", text: `Use ${ctx.knob<string>("icon.set")} icons in the ${ctx.knob<string>("icon.style")} style at size.icon.* sizes.` });
  },
};

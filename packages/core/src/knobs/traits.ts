import type { Influence, Trait } from "./types";

const V = "0.1";
const V2 = "0.2";
const lerp = (from: number, to: number): Influence => ({ kind: "lerp", from, to });
const steps = (...s: [number, string | number | boolean][]): Influence => ({ kind: "steps", steps: s });

/** Traits only apply once the user (or a preset) has positioned them. Untouched traits do nothing. */
export const traits: Trait[] = [
  {
    id: "trait.bold", label: ["Calm", "Bold"], since: V,
    help: "Bold systems use stronger color, heavier headings and a more dramatic type scale.",
    influences: {
      "color.chroma": lerp(0.7, 1.25),
      "type.heading.weight": lerp(450, 800),
      "type.ratio": lerp(1.125, 1.414),
      "color.surface.brandTint": lerp(0, 0.2),
    },
  },
  {
    id: "trait.sharp", label: ["Rounded", "Sharp"], since: V,
    help: "Controls how rounded corners and controls feel.",
    influences: {
      "shape.radius": lerp(16, 0),
      "shape.style": steps([0, "pill"], [0.25, "round"], [0.5, "soft"], [0.8, "sharp"]),
    },
  },
  {
    id: "trait.dense", label: ["Airy", "Dense"], since: V,
    help: "Dense systems fit more on screen; airy ones breathe.",
    influences: {
      "space.density": steps([0, "spacious"], [0.35, "comfortable"], [0.7, "compact"]),
      "type.base": lerp(17, 14),
      "type.lineHeight": lerp(1.65, 1.4),
    },
  },
  {
    id: "trait.serious", label: ["Playful", "Serious"], since: V,
    help: "Playful systems bounce and round off; serious ones stay restrained.",
    influences: {
      "motion.easing": steps([0, "springy"], [0.35, "smooth"], [0.6, "standard"], [0.85, "snappy"]),
      "motion.level": steps([0, "expressive"], [0.4, "standard"], [0.8, "subtle"]),
      "color.harmony": steps([0, "triadic"], [0.3, "complementary"], [0.6, "analogous"], [0.85, "monochrome"]),
      "type.style": steps([0, "rounded"], [0.3, "geometric"], [0.6, "neutral"], [0.85, "grotesque"]),
    },
  },
  {
    id: "trait.rich", label: ["Minimal", "Rich"], since: V,
    help: "Rich systems layer shadows, surfaces and tints; minimal ones rely on space.",
    influences: {
      "elevation.style": steps([0, "flat"], [0.3, "crisp"], [0.55, "soft"], [0.8, "layered"]),
      "border.separation": steps([0, "borders"], [0.5, "fills"], [0.75, "shadows"]),
      "color.surface.levels": lerp(2, 5),
    },
  },
  {
    id: "trait.warm", label: ["Cool", "Warm"], since: V,
    help: "The temperature of greys and overall mood.",
    influences: {
      "color.neutral.temperature": steps([0, "cool"], [0.4, "pure"], [0.6, "warm"]),
      "color.hueShift": lerp(-12, 12),
    },
  },
  {
    id: "trait.modern", label: ["Classic", "Modern"], since: V,
    help: "Classic leans on serifs and traditional spacing; modern on clean sans and tight headings.",
    influences: {
      "type.style": steps([0, "serif"], [0.3, "editorial"], [0.55, "humanist"], [0.8, "geometric"]),
      "type.heading.tracking": lerp(0, -0.03),
    },
  },
  {
    id: "trait.crisp", label: ["Soft", "Crisp"], since: V2,
    help: "Crisp systems draw hard edges: stronger borders, tighter shadows, snappier states.",
    influences: {
      "color.border.strength": lerp(0.25, 0.85),
      "elevation.spread": lerp(1.4, 0.7),
      "color.surface.contrast": lerp(0.35, 0.75),
      "state.hover": steps([0, "overlay"], [0.5, "shift"], [0.85, "outline"]),
    },
  },
  {
    id: "trait.loud", label: ["Quiet", "Loud"], since: V2,
    help: "Loud systems put brand color everywhere; quiet ones save it for actions.",
    influences: {
      "color.brand.usage": steps([0, "accents"], [0.4, "balanced"], [0.75, "immersive"]),
      "color.gradient": steps([0, "none"], [0.65, "subtle"], [0.9, "bold"]),
      "color.status.style": steps([0, "subtle"], [0.7, "solid"]),
      "recipe.chip.fill": steps([0, "outline"], [0.35, "subtle"], [0.75, "solid"]),
    },
  },
  {
    id: "trait.geometric", label: ["Organic", "Geometric"], since: V2,
    help: "Geometric systems use strict grids and pure shapes; organic ones feel hand-made.",
    influences: {
      "shape.corner": steps([0, "squircle"], [0.5, "round"], [0.9, "bevel"]),
      "space.progression": steps([0, "geometric"], [0.4, "hybrid"], [0.75, "linear"]),
      "icon.style": steps([0, "rounded"], [0.4, "outline"], [0.85, "sharp"]),
      "color.lightnessCurve": steps([0, "airy"], [0.35, "balanced"]),
    },
  },
  {
    id: "trait.heavy", label: ["Light", "Heavy"], since: V2,
    help: "Heavy systems use thicker strokes, weightier type and solid fills.",
    influences: {
      "type.body.weight": lerp(350, 450),
      "border.width": lerp(1, 2),
      "icon.stroke": lerp(1.25, 2.25),
      "recipe.focus.width": lerp(1.5, 3),
      "type.weights": steps([0, "minimal"], [0.35, "standard"], [0.75, "full"]),
    },
  },
  {
    id: "trait.dimensional", label: ["Flat", "Dimensional"], since: V2,
    help: "Dimensional systems stack layers with shadows, depth and glass; flat ones stay on one plane.",
    influences: {
      "elevation.levels": lerp(3, 6),
      "elevation.glass": lerp(0, 16),
      "state.hover": steps([0, "shift"], [0.6, "lift"]),
      "state.pressed": steps([0, "shift"], [0.6, "scale"]),
      "color.dark.elevation": steps([0, "outlines"], [0.4, "lighter"], [0.8, "shadows"]),
    },
  },
];

export const traitById = new Map(traits.map((t) => [t.id, t]));

import type { Influence, Trait } from "./types";

const V = "0.1";
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
];

export const traitById = new Map(traits.map((t) => [t.id, t]));

import type { Preset } from "./types";

/** Applied automatically from identity.productType, before any style preset. */
export const productPresets: Preset[] = [
  { id: "product.saas", kind: "product", label: "SaaS / dashboard", description: "Information-dense, calm, efficient.",
    knobs: { "space.density": "comfortable", "type.base": 14, "type.ratio": 1.2, "motion.level": "subtle", "border.separation": "borders",
      "space.dataDensity": "compact", "recipe.nav.pattern": "sidebar", "type.numerals": "tabular", "content.tone": "neutral" } },
  { id: "product.marketing", kind: "product", label: "Marketing site", description: "Big type, generous space, expressive.",
    knobs: { "space.density": "spacious", "type.base": 17, "type.ratio": 1.333, "motion.level": "expressive", "elevation.style": "layered",
      "type.fluid": true, "recipe.nav.pattern": "top", "color.brand.usage": "immersive", "content.tone": "friendly", "size.control.default": "lg" } },
  { id: "product.mobile", kind: "product", label: "Mobile consumer app", description: "Touch-first, friendly, clear.",
    knobs: { "space.density": "comfortable", "type.base": 16, "size.touchTarget": "48", "shape.style": "round", "shape.radius": 12,
      "identity.platform": "multi", "recipe.nav.pattern": "bottom", "recipe.toast.position": "top", "recipe.dialog.motion": "slide", "content.tone": "friendly" } },
  { id: "product.editorial", kind: "product", label: "Content / editorial", description: "Reading comfort first.",
    knobs: { "type.style": "editorial", "type.base": 18, "type.lineHeight": 1.65, "type.ratio": 1.25, "space.density": "spacious",
      "type.numerals": "oldstyle", "type.measure": 66, "image.ratio": "photo", "recipe.nav.pattern": "top", "type.link.underline": "always" } },
  { id: "product.commerce", kind: "product", label: "E-commerce", description: "Clear hierarchy, strong calls to action.",
    knobs: { "type.ratio": 1.25, "recipe.button.style": "filled", "elevation.style": "soft",
      "image.ratio": "photo", "recipe.button.emphasis": 4, "color.status.style": "solid", "recipe.nav.pattern": "top" } },
  { id: "product.devtool", kind: "product", label: "Developer tool", description: "Dense, precise, dark-friendly.",
    knobs: { "space.density": "compact", "type.base": 14, "type.style": "grotesque", "shape.radius": 6, "motion.level": "subtle", "color.dark.style": "dim",
      "identity.audience": "developers", "type.numerals": "tabular", "type.slashedZero": true, "recipe.nav.pattern": "rail", "content.tone": "neutral", "type.link.underline": "hover" } },
  { id: "product.internal", kind: "product", label: "Internal tool", description: "Plain, dense and predictable.",
    knobs: { "space.density": "compact", "type.base": 14, "motion.level": "subtle", "elevation.style": "flat",
      "identity.audience": "professional", "recipe.table.zebra": true, "space.dataDensity": "compact", "content.tone": "neutral" } },
];

/** Style presets stack on top of the product preset, in the order chosen. */
export const stylePresets: Preset[] = [
  {
    id: "style.boldhero", kind: "style", label: "BoldHero",
    description: "Google Wallet style hero screens: huge type, saturated color blocks, round shapes. The most important information is the biggest thing on screen.",
    traits: { "trait.bold": 0.95, "trait.sharp": 0.2, "trait.rich": 0.45 },
    knobs: {
      "type.ratio": 1.5, "type.heading.weight": 700, "type.heading.tracking": -0.025, "type.style": "geometric",
      "color.surface.brandTint": 0.25, "shape.style": "round", "shape.radius": 16, "recipe.button.style": "filled",
      "border.separation": "fills", "color.brand.usage": "immersive", "recipe.button.shape": "pill", "shape.chip": "full",
      "type.heading.lineHeight": 1.05, "color.gradient": "subtle", "recipe.chip.fill": "solid", "shape.card.scale": 1.75,
      "elevation.light": "top",
    },
  },
  {
    id: "style.editorial", kind: "style", label: "Editorial",
    description: "Magazine feel: serif headlines, warm paper neutrals, restrained color.",
    traits: { "trait.modern": 0.25, "trait.warm": 0.75, "trait.bold": 0.3 },
    knobs: { "type.style": "editorial", "type.ratio": 1.333, "shape.style": "sharp", "shape.radius": 2, "elevation.style": "flat",
      "type.numerals": "oldstyle", "type.ligatures": true, "border.divider": "inset", "recipe.tabs.indicator": "underline",
      "type.heading.case": "sentence", "content.tone": "formal" },
  },
  {
    id: "style.brutalist", kind: "style", label: "Brutalist",
    description: "Raw and loud: hard edges, thick borders, no shadows, monochrome harmony.",
    traits: { "trait.sharp": 1, "trait.rich": 0 },
    knobs: {
      "shape.style": "sharp", "shape.radius": 0, "border.width": 3, "border.separation": "borders", "elevation.style": "flat",
      "type.style": "grotesque", "type.heading.weight": 800, "color.harmony": "monochrome", "color.neutral.temperature": "pure",
      "color.neutral.tint": 0, "motion.level": "none", "shape.corner": "bevel", "type.heading.case": "upper",
      "recipe.button.case": "upper", "color.border.strength": 1, "recipe.tabs.indicator": "block", "recipe.alert.accent": "filled",
      "color.status.style": "solid", "state.hover": "outline", "state.pressed": "inset", "type.labels.uppercase": true,
    },
  },
  {
    id: "style.soft", kind: "style", label: "Soft & friendly",
    description: "Rounded everything, pastel-leaning color, gentle springy motion.",
    traits: { "trait.sharp": 0.05, "trait.serious": 0.15, "trait.bold": 0.3 },
    knobs: { "type.style": "rounded", "color.chroma": 0.8, "elevation.style": "soft", "recipe.button.style": "tonal", "recipe.input.style": "filled",
      "shape.corner": "squircle", "motion.easing": "springy", "icon.style": "rounded", "recipe.tabs.indicator": "pill",
      "content.tone": "friendly", "avatar.shape": "circle", "state.pressed": "scale", "color.border.strength": 0.3 },
  },
  {
    id: "style.precise", kind: "style", label: "Precise",
    description: "Engineered and neutral: tight grid, crisp shadows, small radii.",
    traits: { "trait.serious": 0.9, "trait.dense": 0.7, "trait.warm": 0.2 },
    knobs: { "type.style": "grotesque", "shape.radius": 4, "elevation.style": "crisp", "color.neutral.tint": 0.1,
      "type.numerals": "tabular", "type.slashedZero": true, "space.base": "4", "space.progression": "linear", "icon.stroke": 1.5,
      "icon.style": "sharp", "shape.chip": "match", "recipe.focus.style": "outline", "motion.easing": "snappy" },
  },
];

export const presets = [...productPresets, ...stylePresets];
export const presetById = new Map(presets.map((p) => [p.id, p]));

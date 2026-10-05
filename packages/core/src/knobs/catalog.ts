import type { Knob } from "./types";

/**
 * Engine v0.1 knob catalog. Only knobs a generator actually reads live here;
 * the full v1 catalog (research-04) lands group by group as generators grow.
 */
const V = "0.1";

const enumOpts = (...pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));

export const catalog: Knob[] = [
  // Identity
  {
    id: "identity.name", type: "text", label: "System name", group: "Identity",
    help: "Used for the repository and every export.", default: "Untitled system",
    levels: ["sprout", "grow", "craft"], control: "text", required: true, since: V, explorable: false,
  },
  {
    id: "identity.productType", type: "enum", label: "What are you building?", group: "Identity",
    help: "Sets sensible defaults for density, type size and motion.",
    options: enumOpts(
      ["saas", "SaaS / dashboard"], ["marketing", "Marketing site"], ["mobile", "Mobile consumer app"],
      ["editorial", "Content / editorial"], ["commerce", "E-commerce"], ["devtool", "Developer tool"],
      ["internal", "Internal tool"],
    ),
    default: "saas", levels: ["sprout", "grow", "craft"], control: "select", required: true, since: V, explorable: false,
  },
  {
    id: "identity.modes", type: "enum", label: "Light and dark", group: "Identity",
    help: "Which color modes to generate.",
    options: enumOpts(["light", "Light only"], ["dark", "Dark only"], ["both", "Both"]),
    default: "both", levels: ["sprout", "grow", "craft"], control: "segmented", required: true, since: V, explorable: false,
  },

  // Color: palette
  {
    id: "color.primary", type: "color", label: "Primary brand color", group: "Color",
    help: "Every color ramp and role is derived from this.", default: "#3b5bdb",
    levels: ["sprout", "grow", "craft"], control: "color", required: true, since: V, explorable: false,
  },
  {
    id: "color.secondary", type: "colorList", label: "Secondary colors", group: "Color", max: 3,
    help: "Optional. Left empty, they are derived using the harmony below.", default: [],
    levels: ["grow", "craft"], control: "colorList", since: V, explorable: false,
  },
  {
    id: "color.harmony", type: "enum", label: "Accent harmony", group: "Color",
    help: "How an accent color is derived when you don't give one.",
    options: enumOpts(
      ["complementary", "Complementary"], ["analogous", "Analogous"], ["triadic", "Triadic"],
      ["split", "Split complementary"], ["monochrome", "Monochrome"],
    ),
    default: "analogous", levels: ["grow", "craft"], control: "visualChoice", since: V,
  },
  {
    id: "color.chroma", type: "number", label: "Vibrance", group: "Color",
    help: "How saturated the generated ramps are relative to your brand color.",
    min: 0.4, max: 1.4, step: 0.05, default: 1, levels: ["grow", "craft"], control: "slider", since: V,
  },
  {
    id: "color.hueShift", type: "number", label: "Hue shift across ramps", group: "Color",
    help: "Rotates hue toward dark steps. Small shifts make ramps feel natural.",
    min: -30, max: 30, step: 1, unit: "°", default: 0, levels: ["craft"], control: "slider", since: V,
  },
  {
    id: "color.rampSteps", type: "enum", label: "Ramp steps", group: "Color",
    help: "How many shades each color ramp has.",
    options: enumOpts(["11", "11 (50–950)"], ["13", "13 (0–1000)"]),
    default: "11", levels: ["craft"], control: "segmented", since: V, explorable: false,
  },

  // Color: neutrals & surfaces
  {
    id: "color.neutral.temperature", type: "enum", label: "Neutral temperature", group: "Neutrals",
    help: "The undertone of greys.",
    options: enumOpts(["cool", "Cool"], ["pure", "Pure"], ["warm", "Warm"], ["brand", "Brand-tinted"]),
    default: "brand", levels: ["grow", "craft"], control: "segmented", since: V,
  },
  {
    id: "color.neutral.tint", type: "number", label: "Neutral tint", group: "Neutrals",
    help: "How much color the greys carry.", min: 0, max: 1, step: 0.05, default: 0.3,
    levels: ["grow", "craft"], control: "slider", since: V,
  },
  {
    id: "color.surface.levels", type: "number", label: "Surface levels", group: "Neutrals",
    help: "How many layers of surfaces (page, card, raised, overlay).", min: 2, max: 5, step: 1, default: 3,
    levels: ["craft"], control: "slider", since: V,
  },
  {
    id: "color.surface.brandTint", type: "number", label: "Brand tint on surfaces", group: "Neutrals",
    help: "Mixes a little brand color into surfaces.", min: 0, max: 0.5, step: 0.05, default: 0,
    levels: ["grow", "craft"], control: "slider", since: V,
  },

  // Color: semantics, contrast, dark mode
  {
    id: "color.contrast", type: "enum", label: "Contrast target", group: "Accessibility",
    help: "Minimum contrast for body text. AA is the common legal baseline.",
    options: enumOpts(["AA", "WCAG AA (4.5:1)"], ["AAA", "WCAG AAA (7:1)"]),
    default: "AA", levels: ["grow", "craft"], control: "segmented", since: V, explorable: false,
  },
  {
    id: "color.dark.style", type: "enum", label: "Dark mode style", group: "Dark mode",
    help: "The base of dark mode.",
    options: enumOpts(["black", "True black"], ["dim", "Dim grey"], ["tinted", "Brand-tinted"]),
    default: "dim", levels: ["grow", "craft"], control: "visualChoice", since: V,
    visibleWhen: { "identity.modes": ["dark", "both"] },
  },
  {
    id: "color.status.harmonize", type: "number", label: "Harmonize status colors", group: "Color",
    help: "Nudges success, warning, danger and info hues toward your brand.", min: 0, max: 0.5, step: 0.05,
    default: 0.15, levels: ["craft"], control: "slider", since: V,
  },

  // Typography
  {
    id: "type.heading.font", type: "font", label: "Heading font", group: "Typography",
    help: "Leave empty and we'll choose one from the style below.", default: "",
    levels: ["sprout", "grow", "craft"], control: "font", since: V, explorable: false,
  },
  {
    id: "type.body.font", type: "font", label: "Body font", group: "Typography",
    help: "Leave empty and we'll choose one from the style below.", default: "",
    levels: ["sprout", "grow", "craft"], control: "font", since: V, explorable: false,
  },
  {
    id: "type.mono.font", type: "font", label: "Code font", group: "Typography",
    help: "Used for code and tabular data.", default: "",
    levels: ["craft"], control: "font", since: V, explorable: false,
  },
  {
    id: "type.style", type: "enum", label: "Type style", group: "Typography",
    help: "The feel of fonts we choose when you don't pick them.",
    options: enumOpts(
      ["neutral", "Neutral sans"], ["geometric", "Geometric"], ["humanist", "Humanist"],
      ["grotesque", "Grotesque"], ["rounded", "Rounded"], ["serif", "Serif"], ["editorial", "Serif headings, sans body"],
    ),
    default: "neutral", levels: ["grow", "craft"], control: "visualChoice", since: V,
  },
  {
    id: "type.base", type: "number", label: "Base text size", group: "Typography",
    help: "Body text size in px.", min: 13, max: 20, step: 1, unit: "px", default: 16,
    levels: ["grow", "craft"], control: "slider", since: V,
  },
  {
    id: "type.ratio", type: "number", label: "Type scale ratio", group: "Typography",
    help: "How quickly sizes grow from body to display. Bigger is more dramatic.",
    min: 1.067, max: 1.618, step: 0.001, default: 1.2, levels: ["grow", "craft"], control: "slider", since: V,
  },
  {
    id: "type.heading.weight", type: "number", label: "Heading weight", group: "Typography",
    help: "Weight of headlines and titles.", min: 300, max: 900, step: 50, default: 600,
    levels: ["grow", "craft"], control: "slider", since: V,
  },
  {
    id: "type.lineHeight", type: "number", label: "Line height", group: "Typography",
    help: "Body line height. Headings get tighter automatically.", min: 1.3, max: 1.8, step: 0.05, default: 1.5,
    levels: ["craft"], control: "slider", since: V,
  },
  {
    id: "type.heading.tracking", type: "number", label: "Heading letter-spacing", group: "Typography",
    help: "Negative values tighten large headlines.", min: -0.04, max: 0.02, step: 0.005, unit: "em", default: -0.01,
    levels: ["craft"], control: "slider", since: V,
  },
  {
    id: "type.labels.uppercase", type: "boolean", label: "Uppercase small labels", group: "Typography",
    help: "Overlines and small labels in caps with wider spacing.", default: false,
    levels: ["grow", "craft"], control: "toggle", since: V,
  },

  // Spacing & sizing
  {
    id: "space.base", type: "enum", label: "Base unit", group: "Spacing",
    help: "Every spacing value is a multiple of this.",
    options: enumOpts(["4", "4px"], ["8", "8px"]), default: "4", levels: ["craft"], control: "segmented", since: V,
  },
  {
    id: "space.density", type: "enum", label: "Density", group: "Spacing",
    help: "How much room UI elements get.",
    options: enumOpts(["compact", "Compact"], ["comfortable", "Comfortable"], ["spacious", "Spacious"]),
    default: "comfortable", levels: ["grow", "craft"], control: "visualChoice", since: V,
  },
  {
    id: "size.touchTarget", type: "enum", label: "Minimum touch target", group: "Accessibility",
    help: "Smallest tappable size.", options: enumOpts(["44", "44px (Apple)"], ["48", "48px (Material)"]),
    default: "44", levels: ["craft"], control: "segmented", since: V, explorable: false,
  },

  // Shape
  {
    id: "shape.style", type: "enum", label: "Corner style", group: "Shape",
    help: "How rounded corners are across the system.",
    options: enumOpts(["sharp", "Sharp"], ["soft", "Soft"], ["round", "Round"], ["pill", "Pill"]),
    default: "soft", levels: ["grow", "craft"], control: "visualChoice", since: V,
  },
  {
    id: "shape.radius", type: "number", label: "Base radius", group: "Shape",
    help: "Radius of a medium control in px.", min: 0, max: 24, step: 1, unit: "px", default: 8,
    levels: ["craft"], control: "slider", since: V,
  },

  // Border
  {
    id: "border.separation", type: "enum", label: "How things are separated", group: "Border",
    help: "What visually divides cards and sections.",
    options: enumOpts(["borders", "Borders"], ["shadows", "Shadows"], ["fills", "Tinted fills"]),
    default: "borders", levels: ["grow", "craft"], control: "visualChoice", since: V,
  },
  {
    id: "border.width", type: "number", label: "Border width", group: "Border",
    help: "Default border width in px.", min: 1, max: 3, step: 0.5, unit: "px", default: 1,
    levels: ["craft"], control: "slider", since: V,
  },

  // Elevation
  {
    id: "elevation.style", type: "enum", label: "Shadow style", group: "Elevation",
    help: "The character of shadows.",
    options: enumOpts(["flat", "None / flat"], ["soft", "Soft"], ["crisp", "Crisp"], ["layered", "Layered"]),
    default: "soft", levels: ["grow", "craft"], control: "visualChoice", since: V,
  },
  {
    id: "elevation.tint", type: "boolean", label: "Brand-tinted shadows", group: "Elevation",
    help: "Shadows pick up a hint of your brand hue.", default: false,
    levels: ["craft"], control: "toggle", since: V,
  },

  // Motion
  {
    id: "motion.level", type: "enum", label: "Motion", group: "Motion",
    help: "How much things move.",
    options: enumOpts(["none", "None"], ["subtle", "Subtle"], ["standard", "Standard"], ["expressive", "Expressive"]),
    default: "standard", levels: ["grow", "craft"], control: "segmented", since: V,
  },
  {
    id: "motion.speed", type: "number", label: "Speed", group: "Motion",
    help: "Multiplier on all durations. Lower is faster.", min: 0.6, max: 1.6, step: 0.05, default: 1,
    levels: ["craft"], control: "slider", since: V,
  },
  {
    id: "motion.easing", type: "enum", label: "Easing personality", group: "Motion",
    help: "The feel of acceleration.",
    options: enumOpts(["standard", "Standard"], ["snappy", "Snappy"], ["smooth", "Smooth"], ["springy", "Springy"]),
    default: "standard", levels: ["grow", "craft"], control: "segmented", since: V,
  },

  // Component recipes
  {
    id: "recipe.button.style", type: "enum", label: "Primary button style", group: "Components",
    help: "How the main call to action looks.",
    options: enumOpts(["filled", "Filled"], ["tonal", "Tonal"], ["outline", "Outline"]),
    default: "filled", levels: ["grow", "craft"], control: "visualChoice", since: V,
  },
  {
    id: "recipe.input.style", type: "enum", label: "Input style", group: "Components",
    help: "How text fields look.",
    options: enumOpts(["outlined", "Outlined"], ["filled", "Filled"], ["underlined", "Underlined"]),
    default: "outlined", levels: ["grow", "craft"], control: "visualChoice", since: V,
  },
  {
    id: "recipe.focus.style", type: "enum", label: "Focus ring", group: "Components",
    help: "How keyboard focus is shown.",
    options: enumOpts(["outline", "Outline"], ["offset", "Offset outline"], ["glow", "Glow"]),
    default: "offset", levels: ["craft"], control: "segmented", since: V,
  },
];

export const knobById = new Map(catalog.map((k) => [k.id, k]));

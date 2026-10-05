import type { BooleanKnob, Control, EnumKnob, Knob, KnobBase, KnobValue, Level, NumberKnob, SetKnob } from "./types";

/**
 * The knob catalog: every input a generator reads. Ids are permanent; new knobs carry the
 * engine version that introduced them, so old seeds keep generating the same output.
 */
const V1 = "0.1";
const V2 = "0.2";

const ALL: Level[] = ["sprout", "grow", "craft"];
const GROW: Level[] = ["grow", "craft"];
const CRAFT: Level[] = ["craft"];

type Opts = Partial<Pick<KnobBase, "levels" | "control" | "since" | "explorable" | "required" | "visibleWhen">> & {
  unit?: string;
};

const opts = (...pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));

function choice(
  id: string, group: string, label: string, help: string, options: [string, string][], def: string, o: Opts = {},
): EnumKnob {
  return {
    id, type: "enum", group, label, help, options: opts(...options), default: def,
    levels: o.levels ?? CRAFT, control: o.control ?? (options.length <= 4 ? "segmented" : "select"), since: o.since ?? V2,
    ...pick(o),
  };
}

function num(
  id: string, group: string, label: string, help: string, [min, max, step]: [number, number, number], def: number, o: Opts = {},
): NumberKnob {
  return {
    id, type: "number", group, label, help, min, max, step, default: def, unit: o.unit,
    levels: o.levels ?? CRAFT, control: "slider", since: o.since ?? V2, ...pick(o),
  };
}

function flag(id: string, group: string, label: string, help: string, def: boolean, o: Opts = {}): BooleanKnob {
  return { id, type: "boolean", group, label, help, default: def, levels: o.levels ?? CRAFT, control: "toggle", since: o.since ?? V2, ...pick(o) };
}

function pick(o: Opts) {
  const out: Partial<KnobBase> = {};
  if (o.explorable !== undefined) out.explorable = o.explorable;
  if (o.required !== undefined) out.required = o.required;
  if (o.visibleWhen) out.visibleWhen = o.visibleWhen;
  return out;
}

const fixed = (o: Opts = {}): Opts => ({ ...o, explorable: false });
const visual = (o: Opts = {}): Opts => ({ ...o, control: "visualChoice" as Control });
const whenDark: Record<string, KnobValue[]> = { "identity.modes": ["dark", "both"] };

const RECIPE_OPTIONS: [string, string][] = [
  ["badge", "Badges & chips"], ["link", "Links"], ["tabs", "Tabs"], ["nav", "Navigation"], ["dialog", "Dialogs"],
  ["table", "Tables"], ["toast", "Toasts"], ["alert", "Alerts"], ["avatar", "Avatars"],
];

export const catalog: Knob[] = [
  // ── Identity ──────────────────────────────────────────────────────────────
  { id: "identity.name", type: "text", label: "System name", group: "Identity",
    help: "Used for the repository and every export.", default: "Untitled system",
    levels: ALL, control: "text", required: true, since: V1, explorable: false },
  choice("identity.productType", "Identity", "What are you building?", "Sets sensible defaults for density, type size and motion.", [
    ["saas", "SaaS / dashboard"], ["marketing", "Marketing site"], ["mobile", "Mobile consumer app"],
    ["editorial", "Content / editorial"], ["commerce", "E-commerce"], ["devtool", "Developer tool"], ["internal", "Internal tool"],
  ], "saas", { levels: ALL, control: "select", required: true, since: V1, explorable: false }),
  choice("identity.modes", "Identity", "Light and dark", "Which color modes to generate.",
    [["light", "Light only"], ["dark", "Dark only"], ["both", "Both"]], "both", { levels: ALL, required: true, since: V1, explorable: false }),
  choice("identity.platform", "Identity", "Platform", "Where it runs. Native platforms bring their own touch target and type conventions.",
    [["web", "Web"], ["ios", "iOS"], ["android", "Android"], ["multi", "Several"]], "web", fixed({ levels: GROW })),
  choice("identity.audience", "Identity", "Audience", "Who uses it. Kids and older adults get larger text, targets and contrast.", [
    ["general", "General public"], ["professional", "Professionals"], ["developers", "Developers"], ["kids", "Kids"], ["older", "Older adults"],
  ], "general", fixed({ levels: GROW })),
  choice("identity.script", "Identity", "Main writing system", "Picks fallback fonts and line height that suit the script.", [
    ["latin", "Latin"], ["cyrillic", "Cyrillic"], ["greek", "Greek"], ["cjk", "Chinese / Japanese / Korean"],
    ["arabic", "Arabic"], ["hebrew", "Hebrew"], ["devanagari", "Devanagari"], ["thai", "Thai"],
  ], "latin", fixed()),
  choice("identity.direction", "Identity", "Text direction", "Right-to-left mirrors layout and icon guidance.",
    [["ltr", "Left to right"], ["rtl", "Right to left"]], "ltr", fixed()),

  // ── Color: palette ────────────────────────────────────────────────────────
  { id: "color.primary", type: "color", label: "Primary brand color", group: "Color",
    help: "Every color ramp and role is derived from this.", default: "#3b5bdb",
    levels: ALL, control: "color", required: true, since: V1, explorable: false },
  { id: "color.secondary", type: "colorList", label: "Secondary colors", group: "Color", max: 3,
    help: "Optional. Left empty, they are derived using the harmony below.", default: [],
    levels: GROW, control: "colorList", since: V1, explorable: false },
  choice("color.harmony", "Color", "Accent harmony", "How accent colors are derived when you don't give them.", [
    ["complementary", "Complementary"], ["analogous", "Analogous"], ["triadic", "Triadic"],
    ["split", "Split complementary"], ["tetradic", "Tetradic"], ["monochrome", "Monochrome"],
  ], "analogous", visual({ levels: GROW, since: V1 })),
  num("color.chroma", "Color", "Vibrance", "How saturated the generated ramps are relative to your brand color.",
    [0.4, 1.4, 0.05], 1, { levels: GROW, since: V1 }),
  num("color.hueShift", "Color", "Hue shift across ramps", "Rotates hue toward dark steps. Small shifts make ramps feel natural.",
    [-30, 30, 1], 0, { since: V1, unit: "°" }),
  choice("color.rampSteps", "Color", "Ramp steps", "How many shades each color ramp has.",
    [["11", "11 (50–950)"], ["13", "13 (0–1000)"]], "11", fixed({ since: V1 })),
  choice("color.rampNaming", "Color", "Shade names", "How ramp steps are named in tokens.",
    [["scale", "50–950"], ["tone", "Lightness (0–100)"], ["index", "1–11"]], "scale", fixed()),
  choice("color.lightnessCurve", "Color", "Lightness curve", "Airy spends more steps on light tints, deep on dark shades.",
    [["balanced", "Balanced"], ["airy", "Airy"], ["deep", "Deep"]], "balanced"),
  choice("color.chromaCurve", "Color", "Saturation curve", "Where along a ramp color is strongest.",
    [["peaked", "Peaks in the middle"], ["even", "Even"], ["mutedEnds", "Muted ends"]], "peaked"),
  choice("color.gamut", "Color", "Color gamut", "Wide gamut (Display P3) is more vivid on modern screens, with an sRGB fallback.",
    [["srgb", "sRGB"], ["p3", "Display P3"]], "srgb", fixed()),
  choice("color.space", "Color", "Ramp color space", "OKLCH keeps perceived lightness even across hues.",
    [["oklch", "OKLCH"], ["lch", "CIE LCh"]], "oklch", fixed()),

  // ── Neutrals & surfaces ───────────────────────────────────────────────────
  choice("color.neutral.temperature", "Neutrals", "Neutral temperature", "The undertone of greys.",
    [["cool", "Cool"], ["pure", "Pure"], ["warm", "Warm"], ["brand", "Brand-tinted"]], "brand", { levels: GROW, since: V1 }),
  num("color.neutral.tint", "Neutrals", "Neutral tint", "How much color the greys carry.", [0, 1, 0.05], 0.3, { levels: GROW, since: V1 }),
  num("color.surface.levels", "Neutrals", "Surface levels", "How many layers of surfaces (page, card, raised, overlay).",
    [2, 5, 1], 3, { since: V1 }),
  num("color.surface.brandTint", "Neutrals", "Brand tint on surfaces", "Mixes a little brand color into surfaces.",
    [0, 0.5, 0.05], 0, { levels: GROW, since: V1 }),
  choice("color.surface.strategy", "Neutrals", "Surface layering", "Tonal surfaces step in lightness; flat ones stay the same and rely on borders or shadows.",
    [["tonal", "Tonal steps"], ["flat", "Flat"]], "tonal"),
  num("color.surface.contrast", "Neutrals", "Surface contrast", "How different neighbouring surfaces look.", [0, 1, 0.05], 0.5),
  num("color.border.strength", "Neutrals", "Border strength", "How visible borders and dividers are.", [0, 1, 0.05], 0.5, { levels: GROW }),
  num("color.scrim.opacity", "Neutrals", "Scrim opacity", "How much the backdrop behind dialogs darkens.", [0.2, 0.8, 0.05], 0.4),
  num("color.scrim.blur", "Neutrals", "Scrim blur", "Blur behind dialogs, in px. 0 is off.", [0, 16, 1], 0, { unit: "px" }),

  // ── Semantic color ────────────────────────────────────────────────────────
  num("color.status.harmonize", "Semantic color", "Harmonize status colors", "Nudges success, warning, danger and info hues toward your brand.",
    [0, 0.5, 0.05], 0.15, { since: V1 }),
  { id: "color.status.success", type: "color", label: "Success color", group: "Semantic color", help: "Leave empty for a generated green.",
    default: "", levels: CRAFT, control: "color", since: V2, explorable: false },
  { id: "color.status.warning", type: "color", label: "Warning color", group: "Semantic color", help: "Leave empty for a generated amber.",
    default: "", levels: CRAFT, control: "color", since: V2, explorable: false },
  { id: "color.status.danger", type: "color", label: "Danger color", group: "Semantic color", help: "Leave empty for a generated red.",
    default: "", levels: CRAFT, control: "color", since: V2, explorable: false },
  { id: "color.status.info", type: "color", label: "Info color", group: "Semantic color", help: "Leave empty for a generated blue.",
    default: "", levels: CRAFT, control: "color", since: V2, explorable: false },
  choice("color.status.style", "Semantic color", "Status style", "Whether badges and alerts use soft tints or solid fills.",
    [["subtle", "Subtle tints"], ["solid", "Solid fills"]], "subtle", { levels: GROW }),
  choice("color.brand.usage", "Semantic color", "How much brand color", "Accents keeps brand for actions; immersive puts it on large surfaces too.",
    [["accents", "Accents"], ["balanced", "Balanced"], ["immersive", "Immersive"]], "balanced", visual({ levels: GROW })),
  choice("color.onBrand", "Semantic color", "Text on brand color", "Auto picks whichever passes contrast.",
    [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]], "auto"),
  choice("color.selection", "Semantic color", "Selection color", "The highlight behind selected text and rows.",
    [["brand", "Brand"], ["neutral", "Neutral"]], "brand"),
  { id: "color.focus", type: "color", label: "Focus ring color", group: "Semantic color", help: "Leave empty to derive it from the brand.",
    default: "", levels: CRAFT, control: "color", since: V2, explorable: false },
  flag("color.inverse", "Semantic color", "Inverse colors", "Dark-on-light tokens for toasts and tooltips.", true),
  choice("color.gradient", "Semantic color", "Brand gradient", "An optional gradient built from your brand colors.",
    [["none", "None"], ["subtle", "Subtle"], ["bold", "Bold"]], "none", { levels: GROW }),
  num("color.gradient.angle", "Semantic color", "Gradient angle", "Direction of the brand gradient.", [0, 360, 5], 135,
    { unit: "°", visibleWhen: { "color.gradient": ["subtle", "bold"] } }),

  // ── Accessibility ─────────────────────────────────────────────────────────
  choice("color.contrast", "Accessibility", "Contrast target", "Minimum contrast for body text. WCAG AA is the common legal baseline; APCA is the newer perceptual model.", [
    ["AA", "WCAG AA (4.5:1)"], ["AAA", "WCAG AAA (7:1)"], ["APCA60", "APCA Lc 60"], ["APCA75", "APCA Lc 75"],
  ], "AA", fixed({ levels: GROW, since: V1 })),
  flag("color.highContrast", "Accessibility", "High-contrast modes", "Adds high-contrast light and dark modes for users who ask for more contrast.", false, fixed({ levels: GROW })),
  choice("size.touchTarget", "Accessibility", "Minimum touch target", "Smallest tappable size.",
    [["44", "44px (Apple)"], ["48", "48px (Material)"]], "44", fixed({ since: V1 })),
  num("a11y.minTarget", "Accessibility", "Minimum target size", "Hard floor for any interactive element, in px. WCAG 2.2 asks for 24.",
    [24, 48, 4], 24, fixed({ unit: "px" })),
  num("a11y.minFontSize", "Accessibility", "Smallest text size", "No text token goes below this.", [10, 16, 1], 11, fixed({ unit: "px" })),
  flag("a11y.colorblindStatus", "Accessibility", "Never color alone", "Status colors always come with an icon or label.", true, fixed()),
  choice("a11y.focusVisibility", "Accessibility", "Focus visibility", "Enhanced makes keyboard focus thicker and higher contrast.",
    [["standard", "Standard"], ["enhanced", "Enhanced"]], "standard", fixed({ levels: GROW })),
  flag("a11y.reduceTransparency", "Accessibility", "Reduce transparency", "Translucent glass surfaces become solid.", true, fixed()),

  // ── Dark mode ─────────────────────────────────────────────────────────────
  choice("color.dark.style", "Dark mode", "Dark mode style", "The base of dark mode.",
    [["black", "True black"], ["dim", "Dim grey"], ["tinted", "Brand-tinted"]], "dim",
    visual({ levels: GROW, since: V1, visibleWhen: whenDark })),
  choice("color.dark.elevation", "Dark mode", "Elevation in dark mode", "How raised surfaces stand out in the dark.",
    [["lighter", "Lighter surfaces"], ["shadows", "Shadows"], ["outlines", "Outlines"]], "lighter", { visibleWhen: whenDark }),
  num("color.dark.chromaReduction", "Dark mode", "Desaturate in dark mode", "Bright colors glare on dark backgrounds; this calms them.",
    [0, 0.6, 0.05], 0.15, { visibleWhen: whenDark }),

  // ── Data visualization ────────────────────────────────────────────────────
  flag("dataviz.enabled", "Data viz", "Chart colors", "Generate categorical, sequential and diverging palettes for charts.", true, fixed({ levels: GROW })),
  num("dataviz.count", "Data viz", "Categorical colors", "How many distinct series colors.", [4, 12, 1], 8,
    fixed({ visibleWhen: { "dataviz.enabled": [true] } })),
  flag("dataviz.colorblindSafe", "Data viz", "Color-blind safe", "Uses a palette distinguishable with common color blindness.", true,
    fixed({ visibleWhen: { "dataviz.enabled": [true] } })),
  choice("dataviz.harmony", "Data viz", "Chart palette source", "Start from the brand color, or use an independent palette.",
    [["brand", "From brand"], ["independent", "Independent"]], "brand", { visibleWhen: { "dataviz.enabled": [true] } }),

  // ── Typography: faces ─────────────────────────────────────────────────────
  { id: "type.heading.font", type: "font", label: "Heading font", group: "Typography",
    help: "Leave empty and we'll choose one from the style below.", default: "", levels: ALL, control: "font", since: V1, explorable: false },
  { id: "type.body.font", type: "font", label: "Body font", group: "Typography",
    help: "Leave empty and we'll choose one from the style below.", default: "", levels: ALL, control: "font", since: V1, explorable: false },
  { id: "type.display.font", type: "font", label: "Display font", group: "Typography",
    help: "For the very largest text. Leave empty to use the heading font.", default: "", levels: CRAFT, control: "font", since: V2, explorable: false },
  { id: "type.mono.font", type: "font", label: "Code font", group: "Typography",
    help: "Used for code and tabular data.", default: "", levels: CRAFT, control: "font", since: V1, explorable: false },
  choice("type.style", "Typography", "Type style", "The feel of fonts we choose when you don't pick them.", [
    ["neutral", "Neutral sans"], ["geometric", "Geometric"], ["humanist", "Humanist"], ["grotesque", "Grotesque"],
    ["rounded", "Rounded"], ["serif", "Serif"], ["editorial", "Serif headings, sans body"], ["slab", "Slab serif"], ["mono", "Monospace"],
  ], "neutral", visual({ levels: GROW, since: V1 })),
  choice("type.pairing", "Typography", "Font pairing", "One family, two contrasting families, or a superfamily with matching sans, serif and mono.",
    [["auto", "Auto"], ["single", "One family"], ["contrast", "Contrasting"], ["superfamily", "Superfamily"]], "auto", { levels: GROW }),
  choice("type.fallback", "Typography", "Fallback fonts", "System stacks are generic; native ones name each platform's UI font.",
    [["system", "System stack"], ["native", "Native per platform"]], "system", fixed()),
  flag("type.variable", "Typography", "Prefer variable fonts", "Loads one variable file and allows any weight.", true, fixed()),

  // ── Typography: scale ─────────────────────────────────────────────────────
  num("type.base", "Typography", "Base text size", "Body text size in px.", [13, 20, 1], 16, { levels: GROW, since: V1, unit: "px" }),
  num("type.ratio", "Typography", "Type scale ratio", "How quickly sizes grow from body to display. Bigger is more dramatic.",
    [1.067, 1.618, 0.001], 1.2, { levels: GROW, since: V1 }),
  num("type.steps", "Typography", "Scale steps", "How many sizes the type scale has.", [6, 12, 1], 10),
  choice("type.roles", "Typography", "Type roles", "Compact merges similar roles; expanded adds overline, caption, quote and numeric.",
    [["compact", "Compact"], ["standard", "Standard"], ["expanded", "Expanded"]], "standard", fixed({ levels: GROW })),
  flag("type.roleSizes", "Typography", "Small, medium and large per role", "Each role (headline, title, body…) gets three sizes.", true, fixed()),
  flag("type.fluid", "Typography", "Fluid type", "Large sizes scale smoothly with the viewport using clamp().", false, { levels: GROW }),
  num("type.fluid.minViewport", "Typography", "Fluid from width", "Viewport width where fluid sizes are smallest.", [320, 768, 1], 375,
    fixed({ unit: "px", visibleWhen: { "type.fluid": [true] } })),
  num("type.fluid.maxViewport", "Typography", "Fluid to width", "Viewport width where fluid sizes are largest.", [1024, 1920, 1], 1440,
    fixed({ unit: "px", visibleWhen: { "type.fluid": [true] } })),
  flag("type.opticalSizing", "Typography", "Optical sizing", "Lets variable fonts adjust their design for each size.", true, fixed()),

  // ── Typography: details ───────────────────────────────────────────────────
  num("type.heading.weight", "Typography", "Heading weight", "Weight of headlines and titles.", [300, 900, 50], 600, { levels: GROW, since: V1 }),
  num("type.body.weight", "Typography", "Body weight", "Weight of running text.", [300, 500, 50], 400),
  choice("type.weights", "Typography", "Weight set", "How many weights the system uses.",
    [["minimal", "Two"], ["standard", "Three"], ["full", "Full range"]], "standard"),
  num("type.lineHeight", "Typography", "Line height", "Body line height.", [1.3, 1.8, 0.05], 1.5, { since: V1 }),
  num("type.heading.lineHeight", "Typography", "Heading line height", "Line height of the largest headings.", [1, 1.4, 0.05], 1.2),
  num("type.heading.tracking", "Typography", "Heading letter-spacing", "Negative values tighten large headlines.",
    [-0.04, 0.02, 0.005], -0.01, { since: V1, unit: "em" }),
  num("type.label.tracking", "Typography", "Label letter-spacing", "Extra spacing for small labels.", [0, 0.12, 0.01], 0.02, { unit: "em" }),
  flag("type.labels.uppercase", "Typography", "Uppercase small labels", "Overlines and small labels in caps with wider spacing.", false, { levels: GROW, since: V1 }),
  choice("type.heading.case", "Typography", "Heading case", "How headings are capitalized.",
    [["sentence", "Sentence case"], ["title", "Title Case"], ["upper", "UPPERCASE"]], "sentence"),
  num("type.paragraphSpacing", "Typography", "Paragraph spacing", "Space between paragraphs, in em.", [0, 1.5, 0.05], 0.75, { unit: "em" }),
  num("type.measure", "Typography", "Line length", "Maximum characters per line of prose.", [45, 90, 1], 68, { unit: "ch" }),
  choice("type.numerals", "Typography", "Numerals", "Tabular numbers line up in tables; oldstyle blend into prose.",
    [["proportional", "Proportional"], ["tabular", "Tabular"], ["oldstyle", "Oldstyle"]], "proportional"),
  flag("type.ligatures", "Typography", "Ligatures", "Common ligatures such as fi and fl.", true),
  flag("type.slashedZero", "Typography", "Slashed zero", "Distinguishes 0 from O.", false),
  choice("type.link.underline", "Typography", "Link underline", "When links are underlined.",
    [["always", "Always"], ["hover", "On hover"], ["never", "Never"]], "always", { levels: GROW }),
  num("type.link.offset", "Typography", "Underline offset", "Gap between text and underline.", [1, 6, 1], 3, { unit: "px" }),
  num("type.link.thickness", "Typography", "Underline thickness", "Thickness of link underlines.", [1, 3, 1], 1, { unit: "px" }),

  // ── Spacing & sizing ──────────────────────────────────────────────────────
  choice("space.base", "Spacing", "Base unit", "Every spacing value is a multiple of this.",
    [["2", "2px"], ["4", "4px"], ["8", "8px"]], "4", { since: V1 }),
  choice("space.density", "Spacing", "Density", "How much room UI elements get.",
    [["compact", "Compact"], ["comfortable", "Comfortable"], ["spacious", "Spacious"]], "comfortable", visual({ levels: GROW, since: V1 })),
  choice("space.dataDensity", "Spacing", "Table density", "Tables and lists can be denser than the rest.",
    [["auto", "Same as above"], ["compact", "Compact"], ["comfortable", "Comfortable"], ["spacious", "Spacious"]], "auto"),
  choice("space.progression", "Spacing", "Spacing progression", "Linear steps evenly; geometric grows faster; hybrid does both.",
    [["linear", "Linear"], ["geometric", "Geometric"], ["hybrid", "Hybrid"]], "hybrid"),
  num("space.steps", "Spacing", "Spacing steps", "How many spacing values the scale has.", [8, 18, 1], 15),
  choice("size.control.default", "Spacing", "Default control size", "Height of buttons and inputs.",
    [["sm", "Small"], ["md", "Medium"], ["lg", "Large"]], "md", { levels: GROW }),
  num("size.icon.base", "Spacing", "Icon size", "Default icon size.", [16, 24, 2], 20, { unit: "px" }),
  num("size.avatar.base", "Spacing", "Avatar size", "Default avatar size.", [24, 48, 4], 32, { unit: "px" }),

  // ── Layout ────────────────────────────────────────────────────────────────
  choice("layout.breakpoints", "Layout", "Breakpoints", "Screen widths where layouts change.",
    [["tailwind", "Tailwind"], ["bootstrap", "Bootstrap"], ["material", "Material"]], "tailwind", fixed({ levels: GROW })),
  choice("layout.columns", "Layout", "Grid columns", "Columns on wide screens.",
    [["4", "4"], ["8", "8"], ["12", "12"], ["16", "16"]], "12", fixed()),
  num("layout.gutter", "Layout", "Gutter", "Space between grid columns.", [8, 48, 4], 24, { unit: "px" }),
  num("layout.margin", "Layout", "Page margin", "Space between content and the screen edge.", [8, 64, 4], 24, { unit: "px" }),
  num("layout.sidebar", "Layout", "Sidebar width", "Width of side navigation.", [200, 360, 8], 264, fixed({ unit: "px" })),
  num("layout.header", "Layout", "Header height", "Height of the top bar.", [48, 96, 4], 64, { unit: "px" }),
  num("layout.maxWidth", "Layout", "Content max width", "Widest content gets.", [960, 1600, 40], 1200, fixed({ unit: "px" })),

  // ── Shape ─────────────────────────────────────────────────────────────────
  choice("shape.style", "Shape", "Corner style", "How rounded corners are across the system.",
    [["sharp", "Sharp"], ["soft", "Soft"], ["round", "Round"], ["pill", "Pill"]], "soft", visual({ levels: GROW, since: V1 })),
  num("shape.radius", "Shape", "Base radius", "Radius of a medium control in px.", [0, 24, 1], 8, { since: V1, unit: "px" }),
  num("shape.card.scale", "Shape", "Card rounding", "Card radius relative to controls.", [0.5, 3, 0.25], 1.5, { unit: "×" }),
  choice("shape.chip", "Shape", "Chip shape", "Chips and badges as pills or matching controls.",
    [["full", "Pill"], ["match", "Match controls"]], "full"),
  flag("shape.nested", "Shape", "Nested radius rule", "Inner corners shrink by the padding so nested shapes stay concentric.", true),
  choice("shape.corner", "Shape", "Corner shape", "Squircle and bevel use CSS corner-shape where supported.",
    [["round", "Round"], ["squircle", "Squircle"], ["bevel", "Bevel"]], "round", visual()),
  choice("avatar.shape", "Shape", "Avatar shape", "Shape of profile pictures.",
    [["circle", "Circle"], ["rounded", "Rounded"], ["square", "Square"]], "circle"),
  choice("image.radius", "Shape", "Image corners", "Corners of images and media.",
    [["match", "Match cards"], ["none", "Square"], ["full", "Fully round"]], "match"),

  // ── Border ────────────────────────────────────────────────────────────────
  choice("border.separation", "Border", "How things are separated", "What visually divides cards and sections.",
    [["borders", "Borders"], ["shadows", "Shadows"], ["fills", "Tinted fills"]], "borders", visual({ levels: GROW, since: V1 })),
  num("border.width", "Border", "Border width", "Default border width in px.", [1, 3, 0.5], 1, { since: V1, unit: "px" }),
  choice("border.divider", "Border", "Dividers", "How list and table dividers run.",
    [["full", "Full width"], ["inset", "Inset"], ["none", "None"]], "full"),
  choice("border.style", "Border", "Border style", "Line style of default borders.", [["solid", "Solid"], ["dashed", "Dashed"]], "solid"),

  // ── Elevation ─────────────────────────────────────────────────────────────
  choice("elevation.style", "Elevation", "Shadow style", "The character of shadows.",
    [["flat", "None / flat"], ["soft", "Soft"], ["crisp", "Crisp"], ["layered", "Layered"]], "soft", visual({ levels: GROW, since: V1 })),
  flag("elevation.tint", "Elevation", "Brand-tinted shadows", "Shadows pick up a hint of your brand hue.", false, { since: V1 }),
  choice("elevation.light", "Elevation", "Light direction", "Where light comes from; shadows fall the other way.",
    [["top", "Top"], ["top-left", "Top left"], ["top-right", "Top right"]], "top"),
  num("elevation.spread", "Elevation", "Shadow size", "Scales every shadow's blur and offset.", [0.5, 2, 0.1], 1, { unit: "×" }),
  num("elevation.levels", "Elevation", "Elevation levels", "How many shadow levels.", [3, 6, 1], 4),
  flag("elevation.inner", "Elevation", "Inset shadow", "Adds an inset shadow for wells and pressed states.", false),
  num("elevation.glass", "Elevation", "Glass blur", "Blur behind translucent surfaces, in px. 0 is off.", [0, 32, 2], 0, { unit: "px" }),
  flag("elevation.texture", "Elevation", "Noise texture", "A subtle grain on surfaces.", false),

  // ── States ────────────────────────────────────────────────────────────────
  choice("state.hover", "States", "Hover effect", "What happens when the pointer is over something.",
    [["shift", "Color shift"], ["overlay", "Overlay"], ["lift", "Lift"], ["outline", "Outline"]], "shift", { levels: GROW }),
  choice("state.pressed", "States", "Pressed effect", "What happens on press.",
    [["shift", "Color shift"], ["scale", "Shrink"], ["inset", "Inset"]], "shift"),
  num("state.hoverOpacity", "States", "Hover overlay", "Opacity of hover overlays.", [0.04, 0.16, 0.01], 0.08),
  num("state.focusOpacity", "States", "Focus overlay", "Opacity of focus overlays.", [0.06, 0.2, 0.01], 0.12),
  num("state.pressedOpacity", "States", "Pressed overlay", "Opacity of pressed overlays.", [0.06, 0.24, 0.01], 0.12),
  choice("state.disabled", "States", "Disabled look", "Faded keeps colors at low opacity; muted swaps to greys.",
    [["opacity", "Faded"], ["muted", "Muted"]], "opacity"),
  num("state.disabledOpacity", "States", "Disabled opacity", "Opacity of disabled elements.", [0.3, 0.6, 0.02], 0.38,
    { visibleWhen: { "state.disabled": ["opacity"] } }),
  choice("state.selected", "States", "Selected look", "How selected items stand out.",
    [["fill", "Fill"], ["outline", "Outline"], ["bar", "Side bar"]], "fill"),
  num("recipe.focus.width", "States", "Focus ring width", "Thickness of keyboard focus.", [1, 4, 0.5], 2, { unit: "px" }),
  num("recipe.focus.offset", "States", "Focus ring offset", "Gap between element and focus ring.", [0, 4, 1], 2, { unit: "px" }),

  // ── Motion ────────────────────────────────────────────────────────────────
  choice("motion.level", "Motion", "Motion", "How much things move.",
    [["none", "None"], ["subtle", "Subtle"], ["standard", "Standard"], ["expressive", "Expressive"]], "standard", { levels: GROW, since: V1 }),
  num("motion.speed", "Motion", "Speed", "Multiplier on all durations. Lower is faster.", [0.6, 1.6, 0.05], 1, { since: V1, unit: "×" }),
  choice("motion.easing", "Motion", "Easing personality", "The feel of acceleration.",
    [["standard", "Standard"], ["snappy", "Snappy"], ["smooth", "Smooth"], ["springy", "Springy"]], "standard", { levels: GROW, since: V1 }),
  num("motion.spring.stiffness", "Motion", "Spring stiffness", "Higher springs settle faster.", [100, 600, 10], 300,
    { visibleWhen: { "motion.easing": ["springy"] } }),
  num("motion.spring.damping", "Motion", "Spring damping", "Lower damping bounces more.", [8, 40, 1], 20,
    { visibleWhen: { "motion.easing": ["springy"] } }),
  num("motion.exitRatio", "Motion", "Exit speed", "Exits as a fraction of entrance duration.", [0.5, 1, 0.05], 0.75, { unit: "×" }),
  num("motion.stagger", "Motion", "Stagger", "Delay between items animating in a list.", [0, 80, 5], 30, { unit: "ms" }),
  num("motion.distance", "Motion", "Travel distance", "How far things slide when they move.", [0.5, 2, 0.1], 1, { unit: "×" }),
  choice("motion.reduced", "Motion", "Reduced motion", "What replaces movement when users ask for less motion.",
    [["fade", "Fade only"], ["none", "No animation"]], "fade", fixed()),

  // ── Icons & imagery ───────────────────────────────────────────────────────
  choice("icon.set", "Icons & imagery", "Icon set", "Recommended icon library.", [
    ["lucide", "Lucide"], ["phosphor", "Phosphor"], ["material", "Material Symbols"], ["tabler", "Tabler"], ["heroicons", "Heroicons"],
  ], "lucide", { levels: GROW }),
  choice("icon.style", "Icons & imagery", "Icon style", "The look of icons.", [
    ["outline", "Outline"], ["filled", "Filled"], ["duotone", "Duotone"], ["rounded", "Rounded"], ["sharp", "Sharp"],
  ], "outline", visual()),
  num("icon.stroke", "Icons & imagery", "Icon stroke", "Line width of outline icons.", [1, 2.5, 0.25], 1.75, { unit: "px" }),
  choice("image.ratio", "Icons & imagery", "Image ratio", "Default aspect ratio of media.",
    [["widescreen", "16:9"], ["photo", "3:2"], ["cinematic", "21:9"]], "widescreen"),
  choice("image.overlay", "Icons & imagery", "Text on images", "How text stays readable on top of images.",
    [["none", "None"], ["scrim", "Scrim"], ["gradient", "Gradient"]], "scrim"),

  // ── Components ────────────────────────────────────────────────────────────
  { id: "recipe.include", type: "set", label: "Component recipes", group: "Components",
    help: "Buttons, inputs, cards and focus rings are always included. Pick the rest.",
    options: opts(...RECIPE_OPTIONS), default: RECIPE_OPTIONS.map(([v]) => v),
    levels: GROW, control: "multiSelect", since: V2, explorable: false } satisfies SetKnob,
  choice("recipe.button.style", "Components", "Primary button style", "How the main call to action looks.",
    [["filled", "Filled"], ["tonal", "Tonal"], ["outline", "Outline"]], "filled", visual({ levels: GROW, since: V1 })),
  choice("recipe.button.shape", "Components", "Button shape", "Buttons can follow the corner style or override it.",
    [["match", "Match corners"], ["pill", "Pill"], ["square", "Square"]], "match", { levels: GROW }),
  num("recipe.button.emphasis", "Components", "Button variants", "How many button variants: primary and secondary, plus ghost, plus danger.",
    [2, 4, 1], 3),
  choice("recipe.button.iconPosition", "Components", "Button icon side", "Where icons sit in buttons.",
    [["leading", "Before text"], ["trailing", "After text"]], "leading"),
  choice("recipe.button.case", "Components", "Button text case", "How button labels are capitalized.",
    [["sentence", "Sentence case"], ["title", "Title Case"], ["upper", "UPPERCASE"]], "sentence"),
  choice("recipe.input.style", "Components", "Input style", "How text fields look.",
    [["outlined", "Outlined"], ["filled", "Filled"], ["underlined", "Underlined"]], "outlined", visual({ levels: GROW, since: V1 })),
  choice("recipe.input.label", "Components", "Input label", "Where field labels sit.",
    [["top", "Above"], ["floating", "Floating"], ["inline", "Inline"]], "top"),
  choice("recipe.input.required", "Components", "Required fields", "How required fields are marked.",
    [["asterisk", "Asterisk"], ["text", "\"Required\""], ["none", "Mark optional instead"]], "asterisk", fixed()),
  choice("recipe.input.feedback", "Components", "Validation feedback", "How errors are shown.",
    [["text", "Message"], ["icon", "Icon and message"]], "text"),
  choice("recipe.card.padding", "Components", "Card padding", "Space inside cards.",
    [["sm", "Small"], ["md", "Medium"], ["lg", "Large"]], "md"),
  choice("recipe.card.header", "Components", "Card header", "How card headers are set apart.",
    [["plain", "Plain"], ["divided", "Divider"], ["tinted", "Tinted"]], "plain"),
  choice("recipe.chip.fill", "Components", "Chip fill", "How chips and badges are filled.",
    [["subtle", "Subtle"], ["outline", "Outline"], ["solid", "Solid"]], "subtle"),
  choice("recipe.tabs.indicator", "Components", "Tab indicator", "How the active tab is marked.",
    [["underline", "Underline"], ["pill", "Pill"], ["block", "Block"]], "underline", visual()),
  choice("recipe.nav.pattern", "Components", "Navigation pattern", "Main navigation layout.",
    [["sidebar", "Sidebar"], ["rail", "Rail"], ["top", "Top bar"], ["bottom", "Bottom bar"]], "sidebar", visual({ levels: GROW })),
  choice("recipe.dialog.motion", "Components", "Dialog entrance", "How dialogs appear.",
    [["fade", "Fade"], ["scale", "Scale"], ["slide", "Slide up"]], "scale"),
  flag("recipe.table.zebra", "Components", "Zebra rows", "Alternate row tints in tables.", false),
  choice("recipe.toast.position", "Components", "Toast position", "Where notifications appear.",
    [["top", "Top"], ["bottom", "Bottom"], ["top-right", "Top right"], ["bottom-right", "Bottom right"]], "bottom-right", fixed()),
  choice("recipe.alert.accent", "Components", "Alert accent", "How alerts show their status.",
    [["bar", "Side bar"], ["icon", "Icon"], ["filled", "Filled"]], "icon"),
  choice("recipe.focus.style", "Components", "Focus ring", "How keyboard focus is shown.",
    [["outline", "Outline"], ["offset", "Offset outline"], ["glow", "Glow"]], "offset", { since: V1 }),

  // ── Content ───────────────────────────────────────────────────────────────
  choice("content.tone", "Content", "Voice", "How the product speaks.",
    [["friendly", "Friendly"], ["neutral", "Neutral"], ["formal", "Formal"], ["playful", "Playful"]], "neutral", { levels: GROW }),
  choice("content.case", "Content", "UI text case", "Capitalization of buttons, menus and titles.",
    [["sentence", "Sentence case"], ["title", "Title Case"]], "sentence"),
  flag("content.emoji", "Content", "Emoji in UI", "Whether emoji may appear in product copy.", false),
  { id: "content.locale", type: "text", label: "Primary locale", group: "Content",
    help: "BCP 47 tag used for number, date and currency formatting guidance.", default: "en-US",
    levels: CRAFT, control: "text", since: V2, explorable: false },
];

export const knobById = new Map(catalog.map((k) => [k.id, k]));

/** Groups in display order. */
export const knobGroups = [...new Set(catalog.map((k) => k.group))];

import type { Generator } from "../engine";
import { px } from "../tokens";

const SANS = ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"];
const SERIF = ["Georgia", "Times New Roman", "serif"];
const MONO = ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"];
const NATIVE: Record<string, string[]> = {
  ios: ["-apple-system", "SF Pro Text", "system-ui", "sans-serif"],
  android: ["Roboto", "system-ui", "sans-serif"],
};
const SCRIPT_FALLBACK: Record<string, string[]> = {
  cjk: ["Noto Sans SC", "Noto Sans JP", "PingFang SC", "Hiragino Sans", "Microsoft YaHei"],
  arabic: ["Noto Sans Arabic", "Tahoma"],
  hebrew: ["Noto Sans Hebrew", "Arial Hebrew"],
  devanagari: ["Noto Sans Devanagari", "Mangal"],
  thai: ["Noto Sans Thai", "Tahoma"],
};
/** Scripts with tall glyphs or stacked marks need more line height. */
const SCRIPT_LEADING: Record<string, number> = { cjk: 0.1, arabic: 0.1, devanagari: 0.15, thai: 0.15 };

/** Curated, freely licensed (Google Fonts) picks for "choose for me". */
export const FONT_STYLES: Record<string, { heading: string; body: string; headingSerif?: boolean; bodySerif?: boolean }> = {
  neutral: { heading: "Inter", body: "Inter" },
  geometric: { heading: "Plus Jakarta Sans", body: "Plus Jakarta Sans" },
  humanist: { heading: "Source Sans 3", body: "Source Sans 3" },
  grotesque: { heading: "Space Grotesk", body: "Inter" },
  rounded: { heading: "Nunito", body: "Nunito" },
  serif: { heading: "Source Serif 4", body: "Source Serif 4", headingSerif: true, bodySerif: true },
  editorial: { heading: "Fraunces", body: "Source Sans 3", headingSerif: true },
  slab: { heading: "Roboto Slab", body: "Roboto", headingSerif: true },
  mono: { heading: "Space Mono", body: "IBM Plex Sans" },
};

const WEIGHT_NAMES: [string, number][] = [
  ["thin", 100], ["extralight", 200], ["light", 300], ["regular", 400], ["medium", 500],
  ["semibold", 600], ["bold", 700], ["extrabold", 800], ["black", 900],
];

export const typography: Generator = {
  id: "typography",
  after: [],
  reads: [
    "type.heading.font", "type.body.font", "type.mono.font", "type.display.font", "type.style", "type.pairing",
    "type.fallback", "type.variable", "type.base", "type.ratio", "type.steps", "type.roles", "type.roleSizes",
    "type.fluid", "type.fluid.minViewport", "type.fluid.maxViewport", "type.opticalSizing", "type.lineHeight",
    "type.heading.lineHeight", "type.heading.weight", "type.body.weight", "type.weights", "type.heading.tracking",
    "type.label.tracking", "type.labels.uppercase", "type.heading.case", "type.paragraphSpacing", "type.measure",
    "type.numerals", "type.ligatures", "type.slashedZero", "a11y.minFontSize", "identity.script", "identity.audience",
    "identity.platform",
  ],
  run(ctx) {
    // Families
    const style = FONT_STYLES[ctx.knob<string>("type.style")]!;
    const pairing = ctx.knob<string>("type.pairing");
    let heading = style.heading;
    let body = style.body;
    let headingSerif = !!style.headingSerif;
    let bodySerif = !!style.bodySerif;
    let mono = "JetBrains Mono";
    if (pairing === "single") {
      body = heading;
      bodySerif = headingSerif;
    } else if (pairing === "contrast") {
      if (!headingSerif) [heading, headingSerif] = ["Fraunces", true];
      if (bodySerif) [body, bodySerif] = ["Source Sans 3", false];
    } else if (pairing === "superfamily") {
      heading = headingSerif ? "IBM Plex Serif" : "IBM Plex Sans";
      body = "IBM Plex Sans";
      bodySerif = false;
      mono = "IBM Plex Mono";
    }
    const pick = (knob: string, auto: string) => ctx.knob<string>(knob) || auto;
    heading = pick("type.heading.font", heading);
    body = pick("type.body.font", body);
    mono = pick("type.mono.font", mono);
    const display = pick("type.display.font", heading);
    if (ctx.knob<string>("type.heading.font")) headingSerif = false;
    if (ctx.knob<string>("type.body.font")) bodySerif = false;

    const platform = ctx.knob<string>("identity.platform");
    const sans = ctx.knob<string>("type.fallback") === "native" && NATIVE[platform] ? NATIVE[platform]! : SANS;
    const script = ctx.knob<string>("identity.script");
    const extra = SCRIPT_FALLBACK[script] ?? [];
    const stack = (font: string, serif: boolean) => [font, ...extra, ...(serif ? SERIF : sans)];
    ctx.set("font.family.display", "fontFamily", stack(display, headingSerif && display === heading), { description: "Display sizes." });
    ctx.set("font.family.heading", "fontFamily", stack(heading, headingSerif), { description: "Headlines and titles." });
    ctx.set("font.family.body", "fontFamily", stack(body, bodySerif), { description: "Body copy and UI text." });
    ctx.set("font.family.mono", "fontFamily", [mono, ...MONO], { description: "Code and tabular data." });
    ctx.meta("fonts", [display, heading, body, mono].filter((f, i, a) => a.indexOf(f) === i).join("|"));

    // Weights
    const variable = ctx.knob<boolean>("type.variable");
    const snap = (w: number) => (variable ? w : Math.round(w / 100) * 100);
    const set = ctx.knob<string>("type.weights");
    const names = set === "full" ? WEIGHT_NAMES : set === "minimal" ? WEIGHT_NAMES.filter(([n]) => n === "regular" || n === "bold") : WEIGHT_NAMES.filter(([, w]) => w >= 400 && w <= 700);
    for (const [n, w] of names) ctx.set(`font.weight.${n}`, "fontWeight", w);
    const headingWeight = snap(ctx.knob<number>("type.heading.weight"));
    const bodyWeight = snap(ctx.knob<number>("type.body.weight"));
    ctx.set("font.weight.heading", "fontWeight", headingWeight, { description: "Headlines and titles." });
    ctx.set("font.weight.body", "fontWeight", bodyWeight, { description: "Body copy." });
    ctx.set("font.weight.strong", "fontWeight", snap(Math.min(900, Math.max(bodyWeight + 200, 600))), { description: "Labels, emphasis and buttons." });

    // Sizes
    const audience = ctx.knob<string>("identity.audience");
    const base = ctx.knob<number>("type.base") + (audience === "kids" || audience === "older" ? 2 : 0);
    const ratio = ctx.knob<number>("type.ratio");
    const minFont = ctx.knob<number>("a11y.minFontSize");
    const count = ctx.knob<number>("type.steps");
    const steps = Array.from({ length: count }, (_, i) => (i + 1) * 100);
    const maxStep = steps[steps.length - 1]!;
    const fluid = ctx.knob<boolean>("type.fluid");
    const minVw = ctx.knob<number>("type.fluid.minViewport");
    const maxVw = ctx.knob<number>("type.fluid.maxViewport");
    const sizes: Record<number, number> = {};
    const round = (raw: number) => (raw > 32 ? Math.round(raw / 4) * 4 : Math.round(raw));
    for (const step of steps) {
      const n = (step - 300) / 100;
      // Below body size, a dramatic ratio would make labels unreadable, so small steps use a gentle one.
      sizes[step] = round(Math.max(minFont, base * Math.pow(n < 0 ? Math.min(ratio, 1.125) : ratio, n)));
      const fl = fluid && n >= 3 ? { min: round(Math.max(minFont, base * Math.pow(Math.min(ratio, 1.15), n))), max: sizes[step]!, minViewport: minVw, maxViewport: maxVw } : undefined;
      ctx.set(`font.size.${step}`, "dimension", px(sizes[step]!), { ...(step === 300 ? { description: "Base body size." } : {}), ...(fl && fl.min < fl.max ? { ext: { fluid: fl } } : {}) });
    }
    const sizeAt = (step: number) => sizes[Math.min(step, maxStep)]!;
    const stepRef = (step: number) => `{font.size.${Math.min(step, maxStep)}}`;

    // Line height slides from the body value at base size to the heading value at the largest size.
    const leading = SCRIPT_LEADING[script] ?? 0;
    const bodyLh = ctx.knob<number>("type.lineHeight") + leading;
    const headLh = ctx.knob<number>("type.heading.lineHeight") + leading;
    const lineHeight = (size: number) => {
      const t = Math.min(1, Math.max(0, (size / base - 1) / (sizeAt(maxStep) / base - 1 || 1)));
      const target = bodyLh + (headLh - bodyLh) * t;
      return Math.round(((Math.round((size * target) / 4) * 4) / size) * 1000) / 1000;
    };

    const tracking = ctx.knob<number>("type.heading.tracking");
    const labelTracking = ctx.knob<number>("type.label.tracking");
    const upper = ctx.knob<boolean>("type.labels.uppercase");
    const roleSet = ctx.knob<string>("type.roles");
    const roleSizes = ctx.knob<boolean>("type.roleSizes");

    type Role = [name: string, step: number, family: string, weight: string, trackEm: number];
    const roles: Role[] = [
      ["display.lg", 1000, "display", "heading", tracking],
      ["display.md", 900, "display", "heading", tracking],
      ["display.sm", 800, "display", "heading", tracking],
      ["headline.lg", 700, "heading", "heading", tracking * 0.7],
      ["headline.md", 600, "heading", "heading", tracking * 0.6],
      ["headline.sm", 500, "heading", "heading", tracking * 0.5],
      ["title.lg", 400, "heading", "heading", 0],
      ["title.md", 300, "body", "strong", 0],
      ["title.sm", 200, "body", "strong", 0],
      ["body.lg", 400, "body", "body", 0],
      ["body.md", 300, "body", "body", 0],
      ["body.sm", 200, "body", "body", 0],
      ["label.lg", 300, "body", "strong", labelTracking * 0.5],
      ["label.md", 200, "body", "strong", labelTracking * 0.5],
      ["label.sm", 100, "body", "strong", labelTracking + (upper ? 0.04 : 0)],
      ["code.md", 200, "mono", "body", 0],
    ];
    if (roleSet === "expanded") {
      roles.push(
        ["overline.md", 100, "body", "strong", labelTracking + 0.06],
        ["caption.md", 100, "body", "body", 0],
        ["quote.md", 500, "heading", "body", 0],
        ["numeric.md", 300, "mono", "body", 0],
      );
    }
    // Compact role sets fold display and title into the headline/label styles they resemble.
    const compactAlias: Record<string, string> = {
      "display.lg": "headline.lg", "display.md": "headline.lg", "display.sm": "headline.lg",
      "title.lg": "headline.sm", "title.md": "label.lg", "title.sm": "label.md",
    };
    for (const [name, step, family, weight, trackEm] of roles) {
      const [group, size] = name.split(".") as [string, string];
      if (roleSet === "compact" && compactAlias[name]) {
        ctx.set(`typography.${name}`, "typography", `{typography.${compactAlias[name]}}`);
        continue;
      }
      if (!roleSizes && size !== "md" && roles.some(([n]) => n === `${group}.md`)) {
        ctx.set(`typography.${name}`, "typography", `{typography.${group}.md}`);
        continue;
      }
      const px_ = sizeAt(step);
      ctx.set(`typography.${name}`, "typography", {
        fontFamily: `{font.family.${family}}`,
        fontSize: stepRef(step),
        fontWeight: `{font.weight.${weight}}`,
        lineHeight: group === "body" ? Math.round(Math.max(lineHeight(px_), bodyLh - 0.05) * 1000) / 1000 : lineHeight(px_),
        letterSpacing: px(px_ * trackEm),
      });
    }

    // Prose rhythm
    ctx.set("space.paragraph", "dimension", px(base * ctx.knob<number>("type.paragraphSpacing")), { description: "Space between paragraphs." });
    const measure = ctx.knob<number>("type.measure");
    ctx.set("layout.maxWidth.prose", "dimension", px(Math.round(measure * base * 0.5)), { description: `Comfortable reading width (about ${measure} characters).` });

    // Values with no DTCG type travel as extras.
    const headingCase = ctx.knob<string>("type.heading.case");
    ctx.extra("text-transform-heading", { sentence: "none", title: "capitalize", upper: "uppercase" }[headingCase]!, { description: "Case for headlines." });
    ctx.extra("text-transform-label", upper ? "uppercase" : "none", { description: "Case for small labels and overlines." });
    ctx.extra("font-variant-numeric", { proportional: "normal", tabular: "tabular-nums", oldstyle: "oldstyle-nums" }[ctx.knob<string>("type.numerals")]!, { description: "Numerals for body text." });
    ctx.extra("font-variant-ligatures", ctx.knob<boolean>("type.ligatures") ? "common-ligatures" : "none");
    ctx.extra("font-feature-settings", ctx.knob<boolean>("type.slashedZero") ? '"zero" 1' : "normal", { description: "Slashed zero for code and IDs." });
    ctx.extra("font-optical-sizing", ctx.knob<boolean>("type.opticalSizing") ? "auto" : "none");

    ctx.guideline({ topic: "Typography", kind: "do", text: "Use one display or headline style per screen region; let size, not color, carry hierarchy." });
    ctx.guideline({ topic: "Typography", kind: "dont", text: "Don't set font sizes by hand; pick the nearest typography.* role." });
    if (headingCase !== "sentence") ctx.guideline({ topic: "Typography", kind: "note", text: `Headlines use ${headingCase} case (see --ts-text-transform-heading).` });
    if (upper) ctx.guideline({ topic: "Typography", kind: "note", text: "label.sm is uppercase with wide tracking; keep those labels to one or two words." });
    if (fluid) ctx.guideline({ topic: "Typography", kind: "note", text: `Display and headline sizes scale fluidly between ${minVw}px and ${maxVw}px viewports.` });
  },
};

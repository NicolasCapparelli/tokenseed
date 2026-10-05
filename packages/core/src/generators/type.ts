import type { Generator } from "../engine";
import { px } from "../tokens";

const SANS = ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"];
const SERIF = ["Georgia", "Times New Roman", "serif"];
const MONO = ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"];

/** Curated, freely licensed (Google Fonts) picks for "choose for me". */
export const FONT_STYLES: Record<string, { heading: string; body: string; headingSerif?: boolean; bodySerif?: boolean }> = {
  neutral: { heading: "Inter", body: "Inter" },
  geometric: { heading: "Plus Jakarta Sans", body: "Plus Jakarta Sans" },
  humanist: { heading: "Source Sans 3", body: "Source Sans 3" },
  grotesque: { heading: "Space Grotesk", body: "Inter" },
  rounded: { heading: "Nunito", body: "Nunito" },
  serif: { heading: "Source Serif 4", body: "Source Serif 4", headingSerif: true, bodySerif: true },
  editorial: { heading: "Fraunces", body: "Source Sans 3", headingSerif: true },
};

/** Size steps relative to the base size: 300 is body. */
const SIZE_STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

export const typography: Generator = {
  id: "typography",
  after: [],
  reads: [
    "type.heading.font", "type.body.font", "type.mono.font", "type.style", "type.base", "type.ratio",
    "type.heading.weight", "type.lineHeight", "type.heading.tracking", "type.labels.uppercase",
  ],
  run(ctx) {
    const style = FONT_STYLES[ctx.knob<string>("type.style")]!;
    const headingFont = ctx.knob<string>("type.heading.font") || style.heading;
    const bodyFont = ctx.knob<string>("type.body.font") || style.body;
    const monoFont = ctx.knob<string>("type.mono.font") || "JetBrains Mono";
    const headingSerif = !ctx.knob<string>("type.heading.font") && style.headingSerif;
    const bodySerif = !ctx.knob<string>("type.body.font") && style.bodySerif;

    ctx.set("font.family.heading", "fontFamily", [headingFont, ...(headingSerif ? SERIF : SANS)], { description: "Headlines, titles and display text." });
    ctx.set("font.family.body", "fontFamily", [bodyFont, ...(bodySerif ? SERIF : SANS)], { description: "Body copy and UI text." });
    ctx.set("font.family.mono", "fontFamily", [monoFont, ...MONO], { description: "Code and tabular data." });

    const headingWeight = ctx.knob<number>("type.heading.weight");
    ctx.set("font.weight.regular", "fontWeight", 400);
    ctx.set("font.weight.medium", "fontWeight", 500);
    ctx.set("font.weight.semibold", "fontWeight", 600);
    ctx.set("font.weight.heading", "fontWeight", headingWeight, { description: "Weight for headlines and titles." });

    const base = ctx.knob<number>("type.base");
    const ratio = ctx.knob<number>("type.ratio");
    const sizes: Record<number, number> = {};
    for (const step of SIZE_STEPS) {
      const n = (step - 300) / 100;
      // Below body size, a dramatic ratio would make labels unreadable, so small steps use a gentle one.
      const raw = Math.max(11, base * Math.pow(n < 0 ? Math.min(ratio, 1.125) : ratio, n));
      // Small sizes round to whole px; large ones to a 4px grid so they align with spacing.
      sizes[step] = raw > 32 ? Math.round(raw / 4) * 4 : Math.round(raw);
      ctx.set(`font.size.${step}`, "dimension", px(sizes[step]!), step === 300 ? { description: "Base body size." } : {});
    }

    const bodyLh = ctx.knob<number>("type.lineHeight");
    const lineHeight = (size: number) => {
      const target = Math.max(1.1, bodyLh - (size / base - 1) * 0.3);
      return Math.round(((Math.round((size * target) / 4) * 4) / size) * 1000) / 1000;
    };
    const tracking = ctx.knob<number>("type.heading.tracking");
    const upper = ctx.knob<boolean>("type.labels.uppercase");

    type Role = [name: string, step: number, family: string, weight: string, trackEm: number];
    const roles: Role[] = [
      ["display.lg", 1000, "heading", "heading", tracking],
      ["display.md", 900, "heading", "heading", tracking],
      ["display.sm", 800, "heading", "heading", tracking],
      ["headline.lg", 700, "heading", "heading", tracking * 0.7],
      ["headline.md", 600, "heading", "heading", tracking * 0.6],
      ["headline.sm", 500, "heading", "heading", tracking * 0.5],
      ["title.lg", 400, "heading", "heading", 0],
      ["title.md", 300, "body", "semibold", 0],
      ["title.sm", 200, "body", "semibold", 0],
      ["body.lg", 400, "body", "regular", 0],
      ["body.md", 300, "body", "regular", 0],
      ["body.sm", 200, "body", "regular", 0],
      ["label.lg", 300, "body", "medium", 0.01],
      ["label.md", 200, "body", "medium", 0.01],
      ["label.sm", 100, "body", "medium", upper ? 0.06 : 0.02],
      ["code.md", 200, "mono", "regular", 0],
    ];
    for (const [name, step, family, weight, trackEm] of roles) {
      const size = sizes[step]!;
      ctx.set(`typography.${name}`, "typography", {
        fontFamily: `{font.family.${family}}`,
        fontSize: `{font.size.${step}}`,
        fontWeight: `{font.weight.${weight}}`,
        lineHeight: name.startsWith("body") ? Math.round(Math.max(lineHeight(size), bodyLh - 0.05) * 1000) / 1000 : lineHeight(size),
        letterSpacing: px(size * trackEm),
      });
    }

    ctx.guideline({ topic: "Typography", kind: "do", text: "Use one display or headline style per screen region; let size, not color, carry hierarchy." });
    ctx.guideline({ topic: "Typography", kind: "dont", text: "Don't set font sizes by hand; pick the nearest typography.* role." });
    if (upper) ctx.guideline({ topic: "Typography", kind: "note", text: "label.sm is shown uppercase with wide tracking; keep those labels to one or two words." });
  },
};

import { colorValue } from "../color";
import type { Generator } from "../engine";
import { px } from "../tokens";

const TRANSPARENT = colorValue("#000000", 0);
const CASE: Record<string, string> = { sentence: "none", title: "capitalize", upper: "uppercase" };

export const OPTIONAL_RECIPES = ["badge", "link", "tabs", "nav", "dialog", "table", "toast", "alert", "avatar"];

/** Component tier: aliases into semantic tokens, so recipes follow every mode automatically. */
export const recipes: Generator = {
  id: "recipes",
  after: ["semanticColor", "typography", "spacing", "shape", "elevation", "motion", "states", "layout"],
  reads: [
    "recipe.include", "recipe.button.style", "recipe.button.shape", "recipe.button.emphasis", "recipe.button.iconPosition",
    "recipe.button.case", "recipe.input.style", "recipe.input.label", "recipe.input.required", "recipe.input.feedback",
    "recipe.card.padding", "recipe.card.header", "border.separation", "border.divider", "recipe.chip.fill",
    "color.status.style", "recipe.tabs.indicator", "state.selected", "recipe.nav.pattern", "recipe.dialog.motion",
    "recipe.table.zebra", "recipe.toast.position", "recipe.alert.accent", "recipe.focus.style", "recipe.focus.width",
    "recipe.focus.offset", "a11y.focusVisibility", "type.link.underline", "type.link.offset", "type.link.thickness",
    "state.hover", "a11y.colorblindStatus", "color.inverse",
  ],
  run(ctx) {
    const c = "component";
    const include = new Set(ctx.knob<string[]>("recipe.include"));
    const set = (path: string, type: Parameters<typeof ctx.set>[1], value: unknown, description?: string) =>
      ctx.set(`${c}.${path}`, type, value, description ? { description } : {});
    const hover = ctx.knob<string>("state.hover");

    // Button
    const btn = ctx.knob<string>("recipe.button.style");
    const emphasis = ctx.knob<number>("recipe.button.emphasis");
    const primary = {
      filled: { bg: "{color.primary.default}", hover: "{color.primary.hover}", fg: "{color.primary.on}", border: TRANSPARENT },
      tonal: { bg: "{color.primary.subtle}", hover: "{color.primary.subtle}", fg: "{color.primary.onSubtle}", border: TRANSPARENT },
      outline: { bg: TRANSPARENT, hover: "{color.primary.subtle}", fg: "{color.link}", border: "{color.primary.default}" },
    }[btn]!;
    const variants: Record<string, { bg: unknown; hover: unknown; fg: unknown; border: unknown }> = {
      primary,
      secondary: { bg: TRANSPARENT, hover: "{color.primary.subtle}", fg: "{color.text.primary}", border: "{color.border.strong}" },
    };
    if (emphasis >= 3) variants.ghost = { bg: TRANSPARENT, hover: "{color.primary.subtle}", fg: "{color.link}", border: TRANSPARENT };
    if (emphasis >= 4) variants.danger = { bg: "{color.status.danger.solid}", hover: "{color.status.danger.solid}", fg: "{color.status.danger.on}", border: TRANSPARENT };
    for (const [v, s] of Object.entries(variants)) {
      set(`button.${v}.background`, "color", s.bg);
      set(`button.${v}.backgroundHover`, "color", s.hover);
      set(`button.${v}.text`, "color", s.fg);
      set(`button.${v}.border`, "color", s.border);
    }
    const shape = ctx.knob<string>("recipe.button.shape");
    set("button.radius", "dimension", shape === "pill" ? "{radius.full}" : shape === "square" ? "{radius.none}" : "{radius.control}");
    set("button.height", "dimension", "{size.control.default}");
    set("button.paddingX", "dimension", "{space.inset.lg}");
    set("button.gap", "dimension", "{space.gap.xs}", "Space between icon and label.");
    set("button.typography", "typography", "{typography.label.lg}");
    set("button.transition", "transition", "{transition.standard}");
    set("button.hoverShadow", "shadow", hover === "lift" ? "{shadow.2}" : "{shadow.1}");
    ctx.extra("button-text-transform", CASE[ctx.knob<string>("recipe.button.case")]!);
    ctx.recipe({
      id: "button", name: "Button", tokens: `${c}.button`,
      description: `Triggers an action. ${Object.keys(variants).length} emphasis levels: ${Object.keys(variants).join(", ")}. One primary button per view.`,
      anatomy: ["container", "label", `${ctx.knob<string>("recipe.button.iconPosition")} icon (optional)`],
      variants: Object.keys(variants), states: ["default", "hover", "pressed", "focus", "disabled", "loading"],
      rules: [
        `Labels are verbs in ${ctx.knob<string>("recipe.button.case")} case.`,
        `Hover: ${hover === "shift" ? "the fill shifts one step" : hover === "overlay" ? "a state layer at opacity.hover covers the fill" : hover === "lift" ? "the button lifts with component.button.hoverShadow" : "an outline appears"}.`,
        "Hit area is at least size.touchTarget even when the button looks smaller.",
      ],
    });

    // Input
    const input = ctx.knob<string>("recipe.input.style");
    set("input.background", "color", input === "filled" ? "{color.surface.sunken}" : input === "underlined" ? TRANSPARENT : "{color.surface.default}");
    set("input.border", "color", input === "filled" ? TRANSPARENT : "{color.border.strong}");
    set("input.borderFocus", "color", "{color.focus}");
    set("input.borderError", "color", "{color.status.danger.text}");
    set("input.text", "color", "{color.text.primary}");
    set("input.placeholder", "color", "{color.text.secondary}");
    set("input.radius", "dimension", input === "underlined" ? "{radius.none}" : "{radius.control}");
    set("input.height", "dimension", "{size.control.default}");
    set("input.paddingX", "dimension", "{space.inset.md}");
    set("input.labelGap", "dimension", "{space.gap.xs}");
    set("input.typography", "typography", "{typography.body.md}");
    const label = ctx.knob<string>("recipe.input.label");
    const required = ctx.knob<string>("recipe.input.required");
    ctx.recipe({
      id: "input", name: "Text input", tokens: `${c}.input`,
      description: `Single-line text entry, ${input} style, label ${label === "top" ? "above the field" : label === "floating" ? "floating inside the field" : "inline to the left"}.`,
      anatomy: ["label", "container", "value / placeholder", "helper or error text"],
      variants: ["default"], states: ["default", "hover", "focus", "error", "disabled", "read-only"],
      rules: [
        "Always show a visible label; placeholder text is not a label.",
        required === "asterisk" ? "Mark required fields with an asterisk (*) and explain it once per form." : required === "text" ? 'Mark required fields with "(required)".' : 'Mark optional fields with "(optional)" instead of marking required ones.',
        ctx.knob<string>("recipe.input.feedback") === "icon" ? "Errors show an icon plus text that says how to fix the problem." : "Errors show text that says how to fix the problem.",
      ],
    });

    // Card
    const sep = ctx.knob<string>("border.separation");
    const pad = ctx.knob<string>("recipe.card.padding");
    set("card.background", "color", sep === "fills" ? "{color.surface.sunken}" : "{color.surface.default}");
    set("card.border", "color", sep === "borders" ? "{color.border.subtle}" : "{color.border.elevated}");
    set("card.shadow", "shadow", sep === "shadows" ? "{shadow.2}" : "{shadow.1}");
    set("card.radius", "dimension", "{radius.card}");
    set("card.padding", "dimension", { sm: "{space.inset.md}", md: "{space.inset.lg}", lg: "{space.inset.xl}" }[pad]!);
    const header = ctx.knob<string>("recipe.card.header");
    set("card.headerBackground", "color", header === "tinted" ? "{color.primary.subtle}" : TRANSPARENT);
    set("card.headerDivider", "color", header === "divided" ? "{color.border.subtle}" : TRANSPARENT);
    ctx.recipe({
      id: "card", name: "Card", tokens: `${c}.card`,
      description: `Groups related content. Separated from the page by ${sep}; ${header} header.`,
      anatomy: ["container", "media (optional)", "header", "body", "actions (optional)"],
      variants: ["default", "interactive"], states: ["default", "hover (interactive)", "focus (interactive)"],
      rules: ["Don't nest cards inside cards.", "An interactive card has one primary target."],
    });

    // Focus ring
    const focus = ctx.knob<string>("recipe.focus.style");
    const enhanced = ctx.knob<string>("a11y.focusVisibility") === "enhanced";
    set("focusRing.color", "color", "{color.focus}");
    set("focusRing.width", "dimension", px(ctx.knob<number>("recipe.focus.width") + (enhanced ? 1 : 0)));
    set("focusRing.offset", "dimension", px(focus === "offset" ? ctx.knob<number>("recipe.focus.offset") : 0));
    ctx.extra("focus-ring-style", focus, { description: "outline, offset outline, or glow (box-shadow)." });
    ctx.recipe({
      id: "focusRing", name: "Focus ring", tokens: `${c}.focusRing`,
      description: `Keyboard focus indicator, ${focus} style${enhanced ? ", enhanced visibility" : ""}. Shown for :focus-visible only.`,
      anatomy: ["ring"], variants: [focus], states: ["focus-visible"],
      rules: ["Never remove focus styles without a visible replacement."],
    });

    // Optional recipes
    const colorblind = ctx.knob<boolean>("a11y.colorblindStatus");
    const statusStyle = ctx.knob<string>("color.status.style");
    if (include.has("badge")) {
      const fill = ctx.knob<string>("recipe.chip.fill");
      set("badge.radius", "dimension", "{radius.chip}");
      set("badge.paddingX", "dimension", "{space.inset.sm}");
      set("badge.typography", "typography", "{typography.label.sm}");
      set("badge.fill", "number", { subtle: 0, outline: 1, solid: 2 }[fill]!, "0 subtle fill, 1 outline, 2 solid fill.");
      ctx.recipe({
        id: "badge", name: "Badge / chip", tokens: `${c}.badge`,
        description: `Short status or category label with a ${fill} style. Status badges use color.status.*.${fill === "solid" ? "solid with .on" : "subtle with .onSubtle"}.`,
        anatomy: ["container", "label", "icon (optional)"], variants: ["neutral", "success", "warning", "danger", "info"], states: ["default"],
        rules: ["One or two words.", ...(colorblind ? ["Status badges include an icon so meaning doesn't depend on color."] : [])],
      });
    }
    if (include.has("link")) {
      const underline = ctx.knob<string>("type.link.underline");
      set("link.color", "color", "{color.link}");
      set("link.underlineOffset", "dimension", px(ctx.knob<number>("type.link.offset")));
      set("link.underlineThickness", "dimension", px(ctx.knob<number>("type.link.thickness")));
      ctx.extra("link-decoration", underline === "never" ? "none" : "underline");
      ctx.extra("link-decoration-hover", underline === "always" ? "underline" : underline === "hover" ? "underline" : "none");
      ctx.extra("link-decoration-rest", underline === "always" ? "underline" : "none");
      ctx.recipe({
        id: "link", name: "Link", tokens: `${c}.link`, description: `Inline link, underlined ${underline}.`,
        anatomy: ["text"], variants: ["inline", "standalone"], states: ["default", "hover", "visited", "focus"],
        rules: [underline === "never" ? "Links without underlines must differ from body text by 3:1 or more, or carry an icon." : "Keep the underline; it's what makes a link findable."],
      });
    }
    if (include.has("tabs")) {
      const indicator = ctx.knob<string>("recipe.tabs.indicator");
      set("tabs.indicator", "color", "{color.primary.default}");
      set("tabs.indicatorWidth", "dimension", px(indicator === "underline" ? 2 : 0));
      set("tabs.selectedBackground", "color", indicator === "underline" ? TRANSPARENT : indicator === "pill" ? "{color.primary.subtle}" : "{color.surface.raised}");
      set("tabs.selectedText", "color", indicator === "pill" ? "{color.primary.onSubtle}" : "{color.text.primary}");
      set("tabs.text", "color", "{color.text.secondary}");
      set("tabs.radius", "dimension", indicator === "pill" ? "{radius.full}" : indicator === "block" ? "{radius.sm}" : "{radius.none}");
      ctx.recipe({
        id: "tabs", name: "Tabs", tokens: `${c}.tabs`, description: `Switches views within a page; ${indicator} indicator.`,
        anatomy: ["tab list", "tab", "indicator", "panel"], variants: [indicator], states: ["default", "hover", "selected", "focus", "disabled"],
        rules: ["Two to seven tabs. Labels are nouns, one or two words."],
      });
    }
    if (include.has("nav")) {
      const pattern = ctx.knob<string>("recipe.nav.pattern");
      const selected = ctx.knob<string>("state.selected");
      set("nav.background", "color", "{color.surface.default}");
      set("nav.itemSelectedBackground", "color", selected === "fill" ? "{color.primary.subtle}" : TRANSPARENT);
      set("nav.itemSelectedText", "color", selected === "fill" ? "{color.primary.onSubtle}" : "{color.link}");
      set("nav.itemSelectedBorder", "color", selected === "fill" ? TRANSPARENT : "{color.primary.default}");
      set("nav.itemRadius", "dimension", "{radius.control}");
      set("nav.width", "dimension", pattern === "rail" ? px(80) : "{layout.sidebar}");
      set("nav.height", "dimension", "{layout.header}");
      ctx.recipe({
        id: "nav", name: "Navigation", tokens: `${c}.nav`, description: `Primary navigation as a ${pattern}; selected items use a ${selected}.`,
        anatomy: ["container", "items", "selected indicator"], variants: [pattern], states: ["default", "hover", "selected", "focus"],
        rules: [pattern === "bottom" ? "Three to five destinations, icon plus short label." : "Group destinations; keep the current one visibly selected."],
      });
    }
    if (include.has("dialog")) {
      const dm = ctx.knob<string>("recipe.dialog.motion");
      set("dialog.background", "color", "{color.surface.overlay}");
      set("dialog.scrim", "color", "{color.scrim}");
      set("dialog.radius", "dimension", "{radius.sheet}");
      set("dialog.shadow", "shadow", ctx.has("shadow.4", ctx.modes[0]) ? "{shadow.4}" : "{shadow.3}");
      set("dialog.padding", "dimension", "{space.inset.xl}");
      set("dialog.transition", "transition", "{transition.emphasized}");
      ctx.recipe({
        id: "dialog", name: "Dialog", tokens: `${c}.dialog`, description: `Modal dialog that enters with a ${dm}.`,
        anatomy: ["scrim", "container", "title", "body", "actions"], variants: ["default", "destructive"], states: ["open", "closing"],
        rules: ["Title states the decision. Buttons name the outcome.", "Focus moves into the dialog and returns on close."],
      });
    }
    if (include.has("table")) {
      const zebra = ctx.knob<boolean>("recipe.table.zebra");
      const divider = ctx.knob<string>("border.divider");
      set("table.rowHeight", "dimension", "{size.row.table}");
      set("table.headerBackground", "color", "{color.surface.sunken}");
      set("table.rowAlt", "color", zebra ? "{color.surface.sunken}" : TRANSPARENT);
      set("table.divider", "color", divider === "none" ? TRANSPARENT : "{color.border.subtle}");
      set("table.dividerInset", "dimension", divider === "inset" ? "{space.inset.lg}" : px(0));
      set("table.typography", "typography", "{typography.body.sm}");
      ctx.recipe({
        id: "table", name: "Table / list", tokens: `${c}.table`, description: `Rows of data${zebra ? " with zebra striping" : ""}; ${divider} dividers.`,
        anatomy: ["header", "rows", "cells"], variants: ["default", "dense"], states: ["default", "hover", "selected"],
        rules: ["Right-align numbers and use tabular numerals.", "Left-align text."],
      });
    }
    if (include.has("toast")) {
      const pos = ctx.knob<string>("recipe.toast.position");
      set("toast.background", "color", ctx.knob<boolean>("color.inverse") ? "{color.inverse.surface}" : "{color.surface.overlay}");
      set("toast.text", "color", ctx.knob<boolean>("color.inverse") ? "{color.inverse.text}" : "{color.text.primary}");
      set("toast.radius", "dimension", "{radius.md}");
      set("toast.shadow", "shadow", "{shadow.3}");
      ctx.extra("toast-position", pos);
      ctx.recipe({
        id: "toast", name: "Toast", tokens: `${c}.toast`, description: `Brief confirmation shown at ${pos}.`,
        anatomy: ["container", "message", "action (optional)"], variants: ["default"], states: ["entering", "visible", "leaving"],
        rules: ["One line. Disappears on its own after ~5s unless it has an action."],
      });
    }
    if (include.has("alert")) {
      const accent = ctx.knob<string>("recipe.alert.accent");
      set("alert.radius", "dimension", "{radius.md}");
      set("alert.padding", "dimension", "{space.inset.md}");
      set("alert.accentWidth", "dimension", px(accent === "bar" ? 4 : 0));
      set("alert.fill", "number", statusStyle === "solid" || accent === "filled" ? 2 : 0, "0 subtle fill, 2 solid fill.");
      ctx.recipe({
        id: "alert", name: "Alert", tokens: `${c}.alert`,
        description: `Inline message with a ${accent} accent on ${statusStyle === "solid" || accent === "filled" ? "solid" : "subtle"} status color.`,
        anatomy: ["container", "icon", "title", "message", "action (optional)"], variants: ["success", "warning", "danger", "info"], states: ["default", "dismissible"],
        rules: ["Lead with what happened, then what to do.", ...(colorblind ? ["Always include the status icon."] : [])],
      });
    }
    if (include.has("avatar")) {
      set("avatar.radius", "dimension", "{radius.avatar}");
      set("avatar.size", "dimension", "{size.avatar.md}");
      set("avatar.background", "color", "{color.primary.subtle}");
      set("avatar.text", "color", "{color.primary.onSubtle}");
      ctx.recipe({
        id: "avatar", name: "Avatar", tokens: `${c}.avatar`, description: "Person or entity image with initials fallback.",
        anatomy: ["image or initials", "status dot (optional)"], variants: ["image", "initials"], states: ["default"],
        rules: ["Always provide alt text with the person's name."],
      });
    }
  },
};

export const content: Generator = {
  id: "content",
  after: [],
  reads: ["content.tone", "content.case", "content.emoji", "content.locale", "a11y.colorblindStatus", "identity.audience", "identity.productType"],
  run(ctx) {
    const tone = ctx.knob<string>("content.tone");
    const locale = ctx.knob<string>("content.locale");
    ctx.meta("tone", tone);
    ctx.meta("locale", locale);
    ctx.meta("audience", ctx.knob<string>("identity.audience"));
    const toneLine: Record<string, string> = {
      friendly: "Write like a helpful person: warm, plain words, contractions are fine.",
      neutral: "Write plainly and directly. Say what happened and what to do.",
      formal: "Write precisely and politely. Avoid slang and contractions.",
      playful: "Be light and witty where it helps, never in errors or anything involving money or data loss.",
    };
    ctx.guideline({ topic: "Content", kind: "do", text: toneLine[tone]! });
    ctx.guideline({ topic: "Content", kind: "do", text: `Use ${ctx.knob<string>("content.case")} case for headings, buttons and labels.` });
    ctx.guideline({ topic: "Content", kind: ctx.knob<boolean>("content.emoji") ? "note" : "dont", text: ctx.knob<boolean>("content.emoji") ? "Emoji are allowed in casual, non-critical copy." : "Don't use emoji in UI copy." });
    ctx.guideline({ topic: "Content", kind: "do", text: `Format numbers, dates and currency for ${locale} with Intl APIs; never hand-format.` });
    if (ctx.knob<boolean>("a11y.colorblindStatus")) ctx.guideline({ topic: "Accessibility", kind: "do", text: "Pair every status color with an icon or label; never rely on color alone." });
    if (ctx.knob<string>("identity.audience") === "older") ctx.guideline({ topic: "Accessibility", kind: "note", text: "Tuned for older adults: larger base text and stronger contrast." });
    if (ctx.knob<string>("identity.audience") === "kids") ctx.guideline({ topic: "Accessibility", kind: "note", text: "Tuned for kids: larger text and targets; keep copy short and concrete." });
  },
};

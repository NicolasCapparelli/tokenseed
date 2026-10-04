import { colorValue } from "../color";
import type { Generator } from "../engine";
import { px } from "../tokens";

const TRANSPARENT = colorValue("#000000", 0);

/** Component tier: aliases into semantic tokens, so recipes follow light/dark automatically. */
export const recipes: Generator = {
  id: "recipes",
  after: ["semanticColor", "typography", "spacing", "shape", "elevation", "motion"],
  reads: ["recipe.button.style", "recipe.input.style", "recipe.focus.style", "border.separation"],
  run(ctx) {
    const c = "component";

    // Button
    const btn = ctx.knob<string>("recipe.button.style");
    const primary = {
      filled: { bg: "{color.primary.default}", hover: "{color.primary.hover}", fg: "{color.primary.on}", border: TRANSPARENT },
      tonal: { bg: "{color.primary.subtle}", hover: "{color.primary.subtle}", fg: "{color.primary.onSubtle}", border: TRANSPARENT },
      outline: { bg: TRANSPARENT, hover: "{color.primary.subtle}", fg: "{color.link}", border: "{color.primary.default}" },
    }[btn]!;
    ctx.set(`${c}.button.primary.background`, "color", primary.bg);
    ctx.set(`${c}.button.primary.backgroundHover`, "color", primary.hover);
    ctx.set(`${c}.button.primary.text`, "color", primary.fg);
    ctx.set(`${c}.button.primary.border`, "color", primary.border);
    ctx.set(`${c}.button.secondary.background`, "color", TRANSPARENT);
    ctx.set(`${c}.button.secondary.backgroundHover`, "color", "{color.primary.subtle}");
    ctx.set(`${c}.button.secondary.text`, "color", "{color.text.primary}");
    ctx.set(`${c}.button.secondary.border`, "color", "{color.border.strong}");
    ctx.set(`${c}.button.radius`, "dimension", "{radius.control}");
    ctx.set(`${c}.button.height`, "dimension", "{size.control.md}");
    ctx.set(`${c}.button.paddingX`, "dimension", "{space.inset.lg}");
    ctx.set(`${c}.button.typography`, "typography", "{typography.label.lg}");
    ctx.set(`${c}.button.transition`, "transition", "{transition.standard}");
    ctx.recipe({
      id: "button", name: "Button", tokens: `${c}.button`,
      description: "Triggers an action. One primary button per view; everything else is secondary.",
      anatomy: ["container", "label", "leading icon (optional)", "trailing icon (optional)"],
      variants: ["primary", "secondary"], states: ["default", "hover", "pressed", "focus", "disabled", "loading"],
      rules: [
        "Labels are verbs in sentence case: \"Save changes\", not \"OK\".",
        "Disabled buttons use opacity.disabled; keep them focusable only if you explain why they're disabled.",
        "Hit area is at least size.touchTarget even when the button looks smaller.",
      ],
    });

    // Input
    const input = ctx.knob<string>("recipe.input.style");
    ctx.set(`${c}.input.background`, "color", input === "filled" ? "{color.surface.sunken}" : input === "underlined" ? TRANSPARENT : "{color.surface.default}");
    ctx.set(`${c}.input.border`, "color", input === "filled" ? TRANSPARENT : "{color.border.strong}");
    ctx.set(`${c}.input.borderFocus`, "color", "{color.focus}");
    ctx.set(`${c}.input.borderError`, "color", "{color.status.danger.text}");
    ctx.set(`${c}.input.text`, "color", "{color.text.primary}");
    ctx.set(`${c}.input.placeholder`, "color", "{color.text.secondary}");
    ctx.set(`${c}.input.radius`, "dimension", input === "underlined" ? "{radius.none}" : "{radius.control}");
    ctx.set(`${c}.input.height`, "dimension", "{size.control.md}");
    ctx.set(`${c}.input.paddingX`, "dimension", "{space.inset.md}");
    ctx.set(`${c}.input.typography`, "typography", "{typography.body.md}");
    ctx.recipe({
      id: "input", name: "Text input", tokens: `${c}.input`,
      description: `Single-line text entry, ${input} style.`,
      anatomy: ["label", "container", "value / placeholder", "helper or error text"],
      variants: ["default"], states: ["default", "hover", "focus", "error", "disabled", "read-only"],
      rules: ["Always show a visible label; placeholder text is not a label.", "Error text says how to fix the problem."],
    });

    // Card
    const sep = ctx.knob<string>("border.separation");
    ctx.set(`${c}.card.background`, "color", sep === "fills" ? "{color.surface.sunken}" : "{color.surface.default}");
    ctx.set(`${c}.card.border`, "color", sep === "borders" ? "{color.border.subtle}" : TRANSPARENT);
    ctx.set(`${c}.card.shadow`, "shadow", sep === "shadows" ? "{shadow.2}" : "{shadow.1}");
    ctx.set(`${c}.card.radius`, "dimension", "{radius.card}");
    ctx.set(`${c}.card.padding`, "dimension", "{space.inset.lg}");
    ctx.recipe({
      id: "card", name: "Card", tokens: `${c}.card`,
      description: `Groups related content. Separated from the page by ${sep}.`,
      anatomy: ["container", "media (optional)", "header", "body", "actions (optional)"],
      variants: ["default", "interactive"], states: ["default", "hover (interactive)", "focus (interactive)"],
      rules: ["Don't nest cards inside cards.", "An interactive card has one primary target; avoid multiple competing links."],
    });

    // Badge
    ctx.set(`${c}.badge.radius`, "dimension", "{radius.chip}");
    ctx.set(`${c}.badge.paddingX`, "dimension", "{space.inset.sm}");
    ctx.set(`${c}.badge.typography`, "typography", "{typography.label.sm}");
    ctx.recipe({
      id: "badge", name: "Badge", tokens: `${c}.badge`,
      description: "Short status or category label. Uses color.status.*.subtle with its onSubtle text.",
      anatomy: ["container", "label", "icon (optional)"],
      variants: ["neutral", "success", "warning", "danger", "info"], states: ["default"],
      rules: ["One or two words.", "Status badges include an icon or wording that carries meaning without color."],
    });

    // Focus ring
    const focus = ctx.knob<string>("recipe.focus.style");
    ctx.set(`${c}.focusRing.color`, "color", "{color.focus}");
    ctx.set(`${c}.focusRing.width`, "dimension", "{border.width.focus}");
    ctx.set(`${c}.focusRing.offset`, "dimension", px(focus === "offset" ? 2 : 0));
    ctx.recipe({
      id: "focusRing", name: "Focus ring", tokens: `${c}.focusRing`,
      description: `Keyboard focus indicator, ${focus} style. Shown only for keyboard focus (:focus-visible).`,
      anatomy: ["ring"], variants: [focus], states: ["focus-visible"],
      rules: ["Never remove focus styles without a visible replacement."],
    });
  },
};

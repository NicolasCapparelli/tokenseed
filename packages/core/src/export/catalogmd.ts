import { catalog, knobGroups } from "../knobs/catalog";
import { presets } from "../knobs/presets";
import { traits } from "../knobs/traits";
import type { Knob } from "../knobs/types";

const range = (k: Knob): string => {
  switch (k.type) {
    case "enum":
    case "set":
      return k.options.map((o) => (o.value === o.label ? o.value : `${o.label} (\`${o.value}\`)`)).join(", ");
    case "number":
      return `${k.min} to ${k.max}${k.unit ? ` ${k.unit}` : ""}, step ${k.step}`;
    case "boolean":
      return "on / off";
    case "color":
      return k.required ? "color" : "color, or empty to let the engine choose";
    case "colorList":
      return `up to ${k.max} colors`;
    case "font":
      return "font family, or empty to choose from the type style";
    default:
      return "text";
  }
};

const show = (v: unknown) => (Array.isArray(v) ? (v.length ? v.join(", ") : "none") : v === "" ? "auto" : String(v));
const cell = (s: string) => s.replace(/\|/g, "\\|");

/** The whole knob catalog, traits and presets as Markdown. docs/knobs.md is generated from this. */
export function catalogMarkdown(): string {
  const out = [
    "# Knob catalog",
    "",
    "<!-- Generated from packages/core/src/knobs by catalogMarkdown(). Run `UPDATE_DOCS=1 pnpm -r test` after changing knobs. -->",
    "",
    `${catalog.length} knobs in ${knobGroups.length} groups, ${traits.length} personality traits and ${presets.length} presets. ` +
      "Levels say where a knob is shown: Sprout shows the essentials, Grow the common choices, Craft everything.",
    "",
  ];
  for (const g of knobGroups) {
    const ks = catalog.filter((k) => k.group === g);
    out.push(`## ${g} (${ks.length})`, "", "| Knob | Id | Values | Default | Levels | What it does |", "| --- | --- | --- | --- | --- | --- |");
    for (const k of ks) {
      const label = k.required ? `${k.label} (required)` : k.label;
      out.push(`| ${cell(label)} | \`${k.id}\` | ${cell(range(k))} | ${cell(show(k.default))} | ${k.levels.join(", ")} | ${cell(k.help)} |`);
    }
    out.push("");
  }
  out.push("## Personality traits", "", "Each trait is a slider between two words. Moving it sets several knobs at once.", "");
  out.push("| Trait | Low end | High end | Moves |", "| --- | --- | --- | --- |");
  for (const t of traits) out.push(`| \`${t.id}\` | ${t.label[0]} | ${t.label[1]} | ${Object.keys(t.influences).map((id) => `\`${id}\``).join(", ")} |`);
  out.push("", "## Presets", "", "| Preset | Kind | Description |", "| --- | --- | --- |");
  for (const p of presets) out.push(`| ${p.label} (\`${p.id}\`) | ${p.kind} | ${cell(p.description)} |`);
  out.push("");
  return out.join("\n");
}

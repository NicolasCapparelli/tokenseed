import { describe, expect, it } from "vitest";
import {
  catalog,
  coerce,
  createSeed,
  generate,
  generators,
  knobById,
  presets,
  toCss,
  toDesignMd,
  toDtcgFiles,
  toTailwind,
  traits,
  type Knob,
  type KnobValue,
} from "../src";

const brand = { "identity.name": "Acme", "color.primary": "#3b5bdb" };

/** The values worth testing for a knob: every option, both ends of a range, both booleans. */
function extremes(k: Knob): KnobValue[] {
  switch (k.type) {
    case "enum": return k.options.map((o) => o.value);
    case "number": return [k.min, k.max];
    case "boolean": return [true, false];
    case "set": return [[], k.options.map((o) => o.value)];
    case "color": return ["", "#ff00aa"];
    case "colorList": return [[], ["#12b886", "#fab005", "#e64980"]];
    case "font": return ["", "Inter"];
    default: return [k.default];
  }
}

function danglingVars(css: string): string[] {
  const declared = new Set([...css.matchAll(/(--ts-[\w-]+):/g)].map((m) => m[1]));
  return [...css.matchAll(/var\((--ts-[\w-]+)/g)].map((m) => m[1]!).filter((v) => !declared.has(v));
}

describe("catalog", () => {
  it("has unique ids and valid defaults", () => {
    expect(new Set(catalog.map((k) => k.id)).size).toBe(catalog.length);
    for (const k of catalog) expect(coerce(k, k.default), k.id).toEqual(k.default);
  });

  it("only has knobs the engine reads", () => {
    const read = new Set(generators.flatMap((g) => g.reads));
    const structural = ["identity.name", "identity.modes"];
    expect(catalog.filter((k) => !read.has(k.id) && !structural.includes(k.id)).map((k) => k.id)).toEqual([]);
  });

  it("has traits and presets that only point at real knobs and values", () => {
    for (const t of traits) for (const id of Object.keys(t.influences)) expect(knobById.has(id), `${t.id} → ${id}`).toBe(true);
    for (const p of presets) {
      for (const [id, v] of Object.entries(p.knobs ?? {})) {
        const k = knobById.get(id);
        expect(k, `${p.id} → ${id}`).toBeDefined();
        expect(coerce(k!, v), `${p.id} → ${id}=${String(v)}`).toBeDefined();
      }
    }
  });
});

describe("every knob value", () => {
  it("generates, passes contrast and exports cleanly at every extreme", () => {
    for (const k of catalog) {
      for (const value of extremes(k)) {
        const label = `${k.id}=${JSON.stringify(value)}`;
        const sys = generate(createSeed({ ...brand, [k.id]: value }));
        expect(sys.checks.filter((c) => !c.pass), label).toEqual([]);
        const css = toCss(sys);
        expect(danglingVars(css), label).toEqual([]);
        expect(() => toDtcgFiles(sys), label).not.toThrow();
        expect(() => toDesignMd(sys), label).not.toThrow();
        expect(() => toTailwind(sys), label).not.toThrow();
      }
    }
  }, 60_000);
});

describe("contrast targets", () => {
  const colors = ["#3b5bdb", "#ffd43b", "#2b8a3e", "#e8590c", "#000000", "#f8f9fa", "#9c36b5", "#0ca678"];
  it("passes WCAG and APCA targets, with and without high-contrast modes", () => {
    for (const color of colors) {
      for (const contrast of ["AA", "AAA", "APCA60", "APCA75"]) {
        for (const hc of [false, true]) {
          for (const preset of [[], ["style.boldhero"], ["style.brutalist"]]) {
            const sys = generate(createSeed({ ...brand, "color.primary": color, "color.contrast": contrast, "color.highContrast": hc }, { presets: preset }));
            const failing = sys.checks.filter((c) => !c.pass);
            expect(failing, `${color} ${contrast} hc=${hc} ${preset}: ${JSON.stringify(failing.slice(0, 3))}`).toEqual([]);
          }
        }
      }
    }
  }, 30_000);

  it("uses the APCA metric for APCA targets", () => {
    const sys = generate(createSeed({ ...brand, "color.contrast": "APCA75" }));
    expect(sys.checks.some((c) => c.metric === "apca")).toBe(true);
  });
});

describe("modes and CSS features", () => {
  it("adds high-contrast modes that follow prefers-contrast", () => {
    const sys = generate(createSeed({ ...brand, "color.highContrast": true }));
    expect(sys.modes).toEqual(["light", "dark", "light-hc", "dark-hc"]);
    const css = toCss(sys);
    expect(css).toContain('[data-theme="dark-hc"]');
    expect(css).toContain("@media (prefers-contrast: more)");
    expect(css).toContain("@media (prefers-contrast: more) and (prefers-color-scheme: dark)");
  });

  it("writes Display P3 overrides with an sRGB fallback", () => {
    const css = toCss(generate(createSeed({ ...brand, "color.gamut": "p3" })));
    expect(css).toContain("@media (color-gamut: p3)");
    expect(css).toMatch(/--ts-palette-primary-500: #[0-9a-f]{6};/);
    expect(css).toMatch(/--ts-palette-primary-500: color\(display-p3 /);
  });

  it("writes fluid sizes, gradients, stroke styles and extras", () => {
    const sys = generate(createSeed({ ...brand, "type.fluid": true, "color.gradient": "bold", "border.style": "dashed" }));
    const css = toCss(sys, { classes: true });
    expect(css).toMatch(/--ts-font-size-\d+: clamp\(/);
    expect(css).toMatch(/--ts-gradient-brand: linear-gradient\(135deg, /);
    expect(css).toContain("--ts-border-style-default: dashed;");
    expect(css).toContain("--ts-text-transform-heading:");
    expect(css).toMatch(/\.ts-text-[\w-]+ \{/);
    expect(toTailwind(sys)).toContain("@utility bg-gradient-brand");
  });

  it("drops optional recipes that are not included", () => {
    const sys = generate(createSeed({ ...brand, "recipe.include": ["tabs"] }));
    const ids = sys.recipes.map((r) => r.id);
    expect(ids).toContain("tabs");
    expect(ids).not.toContain("toast");
    expect(ids).toContain("button");
  });
});

import { describe, expect, it } from "vitest";
import {
  catalog,
  createSeed,
  freeKnobs,
  generate,
  presets,
  resolve,
  resolveValue,
  toCss,
  toDesignMd,
  toDtcgFiles,
  toTailwind,
  traits,
  variations,
  type ColorValue,
} from "../src";

const brand = { "identity.name": "Acme", "color.primary": "#3b5bdb" };

describe("resolve", () => {
  it("fills every knob with its default", () => {
    const r = resolve(createSeed(brand));
    expect(Object.keys(r.values)).toHaveLength(catalog.length);
    expect(r.sources["shape.style"]).toEqual({ kind: "default" });
  });

  it("applies presets, then traits, then explicit knobs", () => {
    const seed = createSeed(
      { ...brand, "identity.productType": "marketing", "shape.radius": 3 },
      { presets: ["style.brutalist"], traits: { "trait.dense": 1 } },
    );
    const r = resolve(seed);
    expect(r.sources["type.ratio"]).toEqual({ kind: "preset", id: "product.marketing" });
    expect(r.values["elevation.style"]).toBe("flat");
    expect(r.sources["elevation.style"]).toEqual({ kind: "preset", id: "style.brutalist" });
    expect(r.values["space.density"]).toBe("compact");
    expect(r.sources["space.density"]).toEqual({ kind: "trait", id: "trait.dense" });
    expect(r.values["shape.radius"]).toBe(3);
    expect(r.sources["shape.radius"]).toEqual({ kind: "user" });
  });

  it("ignores unknown knobs instead of failing, so seeds from newer engines still load", () => {
    const r = resolve(createSeed({ ...brand, "future.knob": 1 }));
    expect(r.warnings).toContain('Unknown knob "future.knob" ignored');
  });

  it("clamps and snaps numbers to the knob's range and step", () => {
    const r = resolve(createSeed({ ...brand, "type.heading.weight": 1234, "type.base": 15.4 }));
    expect(r.values["type.heading.weight"]).toBe(900);
    expect(r.values["type.base"]).toBe(15);
  });
});

describe("generate", () => {
  it("is deterministic", () => {
    const seed = createSeed(brand, { presets: ["style.boldhero"] });
    expect(JSON.stringify(generate(seed).base)).toBe(JSON.stringify(generate(seed).base));
  });

  it("passes its own contrast checks for a range of brand colors and presets", () => {
    const colors = ["#3b5bdb", "#ffd43b", "#2b8a3e", "#e8590c", "#000000", "#f8f9fa", "#9c36b5", "#0ca678"];
    for (const color of colors) {
      for (const preset of [[], ["style.boldhero"], ["style.brutalist"], ["style.editorial"]]) {
        for (const contrast of ["AA", "AAA"]) {
          const sys = generate(createSeed({ ...brand, "color.primary": color, "color.contrast": contrast }, { presets: preset }));
          const failing = sys.checks.filter((c) => !c.pass);
          expect(failing, `${color} ${preset} ${contrast}: ${JSON.stringify(failing)}`).toEqual([]);
        }
      }
    }
  });

  it("only generates the requested modes", () => {
    const sys = generate(createSeed({ ...brand, "identity.modes": "dark" }));
    expect(sys.modes).toEqual(["dark"]);
    expect(Object.keys(sys.themes)).toEqual(["dark"]);
  });

  it("resolves component tokens differently per mode", () => {
    const sys = generate(createSeed(brand));
    const light = resolveValue(sys, "component.button.primary.background", "light") as ColorValue;
    const dark = resolveValue(sys, "component.button.primary.background", "dark") as ColorValue;
    expect(light.hex).not.toBe(dark.hex);
  });

  it("records provenance on every token", () => {
    const sys = generate(createSeed(brand));
    const token = (sys.base.radius as Record<string, { $extensions: Record<string, unknown> }>).md!;
    expect(token.$extensions["com.tokenseed"]).toMatchObject({ generator: "shape" });
  });

  it("generates with every preset and every extreme trait position", () => {
    for (const p of presets) {
      for (const t of traits) {
        for (const pos of [0, 1]) {
          expect(() => generate(createSeed(brand, { presets: [p.id], traits: { [t.id]: pos } }))).not.toThrow();
        }
      }
    }
  });
});

describe("variations", () => {
  it("returns distinct, reproducible options", () => {
    const seed = createSeed(brand, { random: 42 });
    const a = variations(seed);
    expect(a).toHaveLength(4);
    expect(new Set(a.map((s) => JSON.stringify(s.traits))).size).toBe(4);
    expect(variations(seed)).toEqual(a);
  });

  it("never moves knobs the user set or locked", () => {
    const seed = createSeed({ ...brand, "shape.style": "sharp" }, { locks: ["motion.level"] });
    for (const v of variations(seed, { knobNudges: 50 })) {
      expect(v.knobs["shape.style"]).toBe("sharp");
      expect(v.knobs["motion.level"]).toBeUndefined();
    }
  });

  it("offers nothing when everything is decided", () => {
    const all = Object.fromEntries(catalog.map((k) => [k.id, k.default]));
    const seed = createSeed(all, { traits: Object.fromEntries(traits.map((t) => [t.id, 0.5])) });
    expect(freeKnobs(seed)).toEqual([]);
    expect(variations(seed)).toEqual([]);
  });

  it("can explore a single group", () => {
    const seed = createSeed(brand);
    for (const v of variations(seed, { groups: ["Typography"] })) {
      expect(v.traits).toEqual({});
      for (const id of Object.keys(v.knobs)) if (!(id in brand)) expect(id.startsWith("type.")).toBe(true);
    }
  });
});

describe("exports", () => {
  const sys = generate(createSeed(brand, { presets: ["style.boldhero"] }));

  it("writes a DTCG folder with a resolver", () => {
    const files = toDtcgFiles(sys);
    expect(Object.keys(files).sort()).toEqual([
      "resolved/dark.tokens.json", "resolved/light.tokens.json", "resolver.json", "seed.json",
      "tokens/base.tokens.json", "tokens/dark.tokens.json", "tokens/light.tokens.json", "tokenseed.json",
    ]);
    const resolved = JSON.parse(files["resolved/light.tokens.json"]!);
    expect(JSON.stringify(resolved)).not.toMatch(/"\{[a-z]/);
  });

  it("writes CSS with dark mode overrides and no unresolved references", () => {
    const css = toCss(sys);
    expect(css).toContain(":root {");
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain("prefers-color-scheme: dark");
    expect(css).toContain("--ts-component-button-primary-background: var(--ts-color-primary-default);");
    const declared = new Set([...css.matchAll(/(--ts-[\w-]+):/g)].map((m) => m[1]));
    for (const [, used] of css.matchAll(/var\((--ts-[\w-]+)\)/g)) expect(declared.has(used!), used).toBe(true);
  });

  it("writes a Tailwind theme pointing at declared variables", () => {
    const css = toCss(sys);
    const tw = toTailwind(sys);
    expect(tw).toContain("@theme inline {");
    for (const [, used] of tw.matchAll(/var\((--ts-[\w-]+)\)/g)) expect(css.includes(`${used}:`), used).toBe(true);
  });

  it("writes DESIGN.md", () => {
    const md = toDesignMd(sys);
    expect(md).toContain("# Acme design system");
    expect(md).toContain("## Color roles");
    expect(md).toContain("### Button");
    expect(md).toContain("BoldHero");
  });
});

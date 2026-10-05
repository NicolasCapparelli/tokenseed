import { AuroraBundle, AuroraContrast } from "@aurora/core";
import { createSeed, generate } from "@tokenseed/core";
import { converter } from "culori";
import { describe, expect, it } from "vitest";
import corePackage from "../../core/package.json";
import {
  AURORA_GENERATOR,
  AURORA_ID,
  auroraBundleFileName,
  auroraId,
  auroraTextureFor,
  auroraVariantFor,
  exportAuroraBundle,
  srgbHex,
  toAuroraTexture,
  toAuroraTheme,
  toAuroraVariant,
  toSrgb8,
} from "../src";
import { EXTRA_SYSTEMS, HC_SYSTEM, LIGHT_ONLY_SYSTEM, P3_SYSTEM, PRESET_SYSTEMS, SRGB_SYSTEM, colorOf } from "./helpers";

const CREATED = "2026-01-01T00:00:00.000Z";
const ALL = [...PRESET_SYSTEMS, ...EXTRA_SYSTEMS];
const toRgb = converter("rgb");

describe("export validity", () => {
  it.each(ALL)("%s: validates with zero issues and round-trips", (_name, system) => {
    const bundle = exportAuroraBundle(system, { createdAt: CREATED });
    const report = AuroraBundle.validate(bundle);
    expect(report.issues.map((i) => `${i.file}: ${i.message}`)).toEqual([]);
    expect(report.valid).toBe(true);

    const loaded = AuroraBundle.load(bundle);
    const theme = toAuroraTheme(system);
    expect(loaded.theme.id).toBe(theme.id);
    expect([...loaded.theme.variants.keys()]).toEqual([...theme.variants.keys()]);
    for (const [appearance, v] of loaded.theme.variants) {
      const source = auroraVariantFor(system, appearance);
      expect(v.values.size).toBe(source.values.size);
      for (const [token, value] of source.values) expect(v.values.get(token)).toEqual(value);
    }
    const texture = auroraTextureFor(system);
    expect(loaded.texture?.id).toBe(theme.id);
    expect(texture.contract.tokens.size).toBe(29);
    for (const token of texture.contract.tokens.values()) expect(loaded.texture?.read(token), token.path).toEqual(texture.read(token));
    expect(loaded.pairing).toEqual({ themeId: theme.id, textureId: theme.id });
    expect(bundle.manifest.provenance.generator).toBe(AURORA_GENERATOR);
    expect(bundle.manifest.provenance.sourceHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(auroraBundleFileName(bundle)).toBe(`${theme.id}.aurora.json`);
  });

  it("generator string matches @tokenseed/core's package version", () => {
    expect(AURORA_GENERATOR).toBe(`tokenseed@${corePackage.version}`);
  });

  it("light-only systems export a single light variant", () => {
    const theme = toAuroraTheme(LIGHT_ONLY_SYSTEM);
    expect([...theme.variants.keys()]).toEqual(["light"]);
    expect(theme.preferredAppearance).toBe("light");
    expect(() => toAuroraVariant(LIGHT_ONLY_SYSTEM, "dark")).toThrow();
  });
});

describe("high contrast", () => {
  it("drops the -hc modes", () => {
    expect(HC_SYSTEM.modes).toEqual(expect.arrayContaining(["light-hc", "dark-hc"]));
    const bundle = exportAuroraBundle(HC_SYSTEM, { createdAt: CREATED });
    expect([...bundle.manifest.theme.variants].sort()).toEqual(["dark", "light"]);
    expect(Object.keys(bundle.files).sort()).toEqual(["dark.tokens.json", "light.tokens.json", "texture.tokens.json"]);
  });
});

describe("quantization", () => {
  const pairs: [string, string][] = [
    ["primary", "color.primary.default"],
    ["onPrimary", "color.primary.on"],
    ["surface", "color.surface.page"],
    ["onSurface", "color.text.primary"],
    ["error", "color.status.danger.solid"],
  ];
  for (const [label, system] of [
    ["srgb", SRGB_SYSTEM],
    ["p3", P3_SYSTEM],
  ] as const) {
    it(`${label}: Aurora hex equals toSrgb8 of the source token`, () => {
      for (const appearance of ["light", "dark"] as const) {
        const variant = auroraVariantFor(system, appearance);
        const byName = new Map([...variant.values].map(([t, v]) => [t.path, v as { hex: string }]));
        for (const [role, path] of pairs) {
          const expected = srgbHex(toSrgb8(colorOf(system, path, appearance)));
          expect(byName.get(`colors.${role}`)?.hex, `${appearance} ${role}`).toBe(expected);
        }
      }
    });
  }

  it("p3: the vivid primary is wide-gamut and gets clipped", () => {
    const c = colorOf(P3_SYSTEM, "color.primary.default", "light");
    expect(c.colorSpace).toBe("display-p3");
    let clipped = false;
    for (const mode of ["light", "dark"] as const) {
      for (const path of ["color.primary.default", "color.primary.subtle", "color.status.success.solid"]) {
        const v = colorOf(P3_SYSTEM, path, mode);
        const rgb = toRgb({ mode: "p3", r: v.components[0]!, g: v.components[1]!, b: v.components[2]! })!;
        if ([rgb.r, rgb.g, rgb.b].some((n) => n < 0 || n > 1)) clipped = true;
      }
    }
    expect(clipped).toBe(true);
  });
});

describe("auroraId", () => {
  it.each([
    ["123 Ocean", /^ts-123-ocean$/],
    ["Café Noir", /^cafe-noir$/],
    ["", /^tokenseed$/],
    ["🚀🚀", /^tokenseed$/],
    ["--Hello__World--", /^hello-world$/],
    ["x".repeat(200), /^x{80}$/],
  ])("%j", (input, expected) => {
    const id = auroraId(input);
    expect(id).toMatch(AURORA_ID);
    expect(id).toMatch(expected);
  });
});

describe("determinism and caching", () => {
  it("same seed and createdAt give identical JSON", () => {
    const make = () => generate(createSeed({ "identity.name": "Acme", "color.primary": "#3b5bdb" }));
    expect(JSON.stringify(exportAuroraBundle(make(), { createdAt: CREATED }))).toBe(
      JSON.stringify(exportAuroraBundle(make(), { createdAt: CREATED })),
    );
  });

  it("sourceHash changes with the seed", () => {
    const a = exportAuroraBundle(SRGB_SYSTEM, { createdAt: CREATED });
    const b = exportAuroraBundle(P3_SYSTEM, { createdAt: CREATED });
    expect(a.manifest.provenance.sourceHash).not.toBe(b.manifest.provenance.sourceHash);
  });

  it("variants and textures are cached per system object", () => {
    expect(auroraVariantFor(SRGB_SYSTEM, "light")).toBe(auroraVariantFor(SRGB_SYSTEM, "light"));
    expect(auroraVariantFor(SRGB_SYSTEM, "light")).not.toBe(auroraVariantFor(SRGB_SYSTEM, "dark"));
    expect(auroraTextureFor(SRGB_SYSTEM)).toBe(auroraTextureFor(SRGB_SYSTEM));
    expect(toAuroraTexture(SRGB_SYSTEM)).not.toBe(auroraTextureFor(SRGB_SYSTEM));
  });
});

describe("contrast report", () => {
  it("summarizes failing pairs per system (informational, never fails)", () => {
    const lines: string[] = [];
    for (const [name, system] of ALL) {
      const failing: string[] = [];
      for (const appearance of ["light", "dark"] as const) {
        if (!system.modes.includes(appearance)) continue;
        for (const check of AuroraContrast.check(auroraVariantFor(system, appearance))) {
          if (check.status !== "fail") continue;
          const fg = check.pair.foreground.path.replace("colors.", "");
          const bg = check.pair.background.path.replace("colors.", "");
          failing.push(`${appearance[0]}:${fg}/${bg}=${check.ratio?.toFixed(2)}`);
        }
      }
      lines.push(`${name}: ${failing.length} failing${failing.length ? ` [${failing.join(", ")}]` : ""}`);
    }
    console.info(`Aurora contrast report\n${lines.join("\n")}`);
    expect(lines).toHaveLength(ALL.length);
  });
});

describe("texture font families", () => {
  it("aliases display and headline styles to brand and the rest to plain, even with one typeface", () => {
    const bundle = exportAuroraBundle(SRGB_SYSTEM, { createdAt: CREATED }) as unknown as {
      files: Record<string, { type: Record<string, { $value: { fontFamily?: unknown } }> }>;
    };
    const type = bundle.files["texture.tokens.json"]!.type;
    expect(type.displayLarge!.$value.fontFamily).toBe("{type.family.brand}");
    expect(type.headlineSmall!.$value.fontFamily).toBe("{type.family.brand}");
    expect(type.titleLarge!.$value.fontFamily).toBe("{type.family.plain}");
    expect(type.bodyMedium!.$value.fontFamily).toBe("{type.family.plain}");
    expect(type.labelSmall!.$value.fontFamily).toBe("{type.family.plain}");
  });
});

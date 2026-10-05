import {
  AuroraAlias,
  AuroraBundle,
  AuroraCubicBezier,
  AuroraDimension,
  AuroraDuration,
  AuroraFontFamily,
  AuroraFontWeight,
  AuroraLiteral,
  AuroraTexture,
  AuroraTextureFoundation as F,
  AuroraTextureStarter,
  AuroraTypography,
  type AuroraToken,
} from "@aurora/core";
import { deepResolve, resolveValue, type GeneratedSystem } from "@tokenseed/core";

/** TokenSeed `rem` is relative to a 16px root; Aurora `dp` is a logical pixel. */
const REM_PX = 16;
const round = (n: number) => Math.round(n * 10000) / 10000;

interface Dim {
  value: number;
  unit: "px" | "rem";
}
const dp = (d: Dim) => AuroraDimension.dp(round(d.unit === "rem" ? d.value * REM_PX : d.value));
const names = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : [String(v)]);
const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((n, i) => n === b[i]);

const material = (token: AuroraToken<unknown>) => AuroraTextureStarter.material.get(token);

/** TokenSeed role (`display.lg`) for each Aurora type style. */
const TYPE_STYLES = [
  [F.displayLarge, "display.lg"],
  [F.displayMedium, "display.md"],
  [F.displaySmall, "display.sm"],
  [F.headlineLarge, "headline.lg"],
  [F.headlineMedium, "headline.md"],
  [F.headlineSmall, "headline.sm"],
  [F.titleLarge, "title.lg"],
  [F.titleMedium, "title.md"],
  [F.titleSmall, "title.sm"],
  [F.bodyLarge, "body.lg"],
  [F.bodyMedium, "body.md"],
  [F.bodySmall, "body.sm"],
  [F.labelLarge, "label.lg"],
  [F.labelMedium, "label.md"],
  [F.labelSmall, "label.sm"],
] as const;

const SHAPES = [
  [F.extraSmallShape, "radius.xs"],
  [F.smallShape, "radius.sm"],
  [F.mediumShape, "radius.md"],
  [F.largeShape, "radius.lg"],
  [F.extraLargeShape, "radius.xl"],
] as const;

// TokenSeed durations are fast/normal/slow/slower; Aurora's are short/medium/long/extraLong.
const DURATIONS = [
  [F.shortDuration, "motion.duration.fast"],
  [F.mediumDuration, "motion.duration.normal"],
  [F.longDuration, "motion.duration.slow"],
  [F.extraLongDuration, "motion.duration.slower"],
] as const;

// standard = standard, entering elements decelerate, leaving elements accelerate.
const EASINGS = [
  [F.easingStandard, "motion.easing.standard"],
  [F.easingEmphasizedDecelerate, "motion.easing.enter"],
  [F.easingEmphasizedAccelerate, "motion.easing.exit"],
] as const;

/** The texture values TokenSeed defines, falling back to Aurora's Material starter for anything it lacks. */
export function auroraTextureValues(system: GeneratedSystem): [AuroraToken<unknown>, unknown][] {
  const value = (path: string) => deepResolve(system, `{${path}}`);
  const values: [AuroraToken<unknown>, unknown][] = [];
  const add = (token: AuroraToken<unknown>, make: () => unknown) => {
    let v: unknown;
    try {
      v = make();
    } catch {
      v = material(token);
    }
    values.push([token, v]);
  };

  const brand = names(value("font.family.display"));
  const plain = names(value("font.family.body"));
  add(F.brandFamily, () => new AuroraFontFamily(brand));
  add(F.plainFamily, () => new AuroraFontFamily(plain));

  // Display and headline styles prefer the brand family; the rest prefer plain, so a system that
  // uses one typeface for both still aliases each style to the family Aurora means for it.
  const family = (resolved: unknown, preferBrand: boolean) => {
    const list = names(resolved);
    if (preferBrand && same(list, brand)) return new AuroraAlias(F.brandFamily);
    if (same(list, plain)) return new AuroraAlias(F.plainFamily);
    if (same(list, brand)) return new AuroraAlias(F.brandFamily);
    return new AuroraFontFamily(list);
  };
  for (const [token, role] of TYPE_STYLES) {
    add(token, () => {
      const t = value(`typography.${role}`) as {
        fontFamily: unknown;
        fontSize: Dim;
        fontWeight: number;
        letterSpacing: Dim;
        lineHeight: number;
      };
      // Fluid sizes are exported at their largest value (the token value is the max; the min
      // only lives in provenance), so Aurora gets the desktop size.
      return new AuroraTypography({
        fontFamily: family(t.fontFamily, /^(display|headline)/.test(role)),
        fontSize: dp(t.fontSize),
        fontWeight: new AuroraFontWeight(Math.min(1000, Math.max(1, Math.round(t.fontWeight)))),
        letterSpacing: dp(t.letterSpacing),
        lineHeight: new AuroraLiteral(round(t.lineHeight)),
      });
    });
  }
  for (const [token, path] of SHAPES) add(token, () => dp(value(path) as Dim));
  for (const [token, path] of DURATIONS) {
    add(token, () => {
      const d = value(path) as { value: number; unit: "ms" | "s" };
      return AuroraDuration.ms(d.unit === "s" ? d.value * 1000 : d.value);
    });
  }
  for (const [token, path] of EASINGS) {
    add(token, () => {
      const [x1, y1, x2, y2] = resolveValue(system, path) as [number, number, number, number];
      return new AuroraCubicBezier(x1, y1, x2, y2);
    });
  }
  return values;
}

export function buildTexture(system: GeneratedSystem, id: string, name: string): AuroraTexture {
  return new AuroraTexture({ contract: AuroraBundle.textureFoundationContract, id, name, values: auroraTextureValues(system) });
}

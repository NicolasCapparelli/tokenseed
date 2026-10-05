import type { Extra, GeneratedSystem } from "../engine";
import {
  EXT,
  aliasPath,
  flatten,
  getToken,
  isAlias,
  type ColorValue,
  type DimensionValue,
  type DurationValue,
  type ModeName,
  type ShadowValue,
  type Token,
  type TokenTree,
} from "../tokens";

export interface CssOptions {
  /** Variable prefix: --{prefix}-color-text-primary. */
  prefix?: string;
  /** Element the variables live on. Defaults to :root; a class scopes a system to part of a page. */
  selector?: string;
  /** Also emit .{prefix}-text-{role} classes for every typography role. */
  classes?: boolean;
}

export const cssVarName = (path: string, prefix = "ts") => `--${prefix}-${path.replace(/\./g, "-")}`;

function color(v: ColorValue | string, ref: (s: string) => string, wide = false): string {
  if (typeof v === "string") return isAlias(v) ? ref(v) : v;
  const a = v.alpha === undefined || v.alpha === 1 ? "" : ` / ${v.alpha}`;
  if (wide && v.colorSpace === "display-p3") return `color(display-p3 ${v.components.join(" ")}${a})`;
  if (!a) return v.hex;
  if (v.colorSpace === "display-p3") {
    const n = parseInt(v.hex.slice(1), 16);
    return `rgb(${n >> 16} ${(n >> 8) & 255} ${n & 255}${a})`;
  }
  const [r, g, b] = v.components.map((n) => Math.round(n * 255));
  return `rgb(${r} ${g} ${b}${a})`;
}

/** A px size that grows linearly with the viewport between two widths, as rem + vw so zoom still works. */
function clampSize(f: { min: number; max: number; minViewport: number; maxViewport: number }): string {
  const slope = (f.max - f.min) / (f.maxViewport - f.minViewport);
  const intercept = f.min - slope * f.minViewport;
  const rem = (n: number) => `${Math.round((n / 16) * 1000) / 1000}rem`;
  return `clamp(${rem(f.min)}, ${rem(intercept)} + ${Math.round(slope * 10000) / 100}vw, ${rem(f.max)})`;
}

const dim = (v: DimensionValue | string, ref: (s: string) => string) =>
  typeof v === "string" ? ref(v) : `${v.value}${v.unit}`;
const dur = (v: DurationValue | string, ref: (s: string) => string) =>
  typeof v === "string" ? ref(v) : `${v.value}${v.unit}`;

const TYPO_PARTS = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing"] as const;
const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/**
 * CSS declarations for one token. Typography expands into one variable per property.
 * With `wide`, only tokens holding Display P3 colors are returned, written as color(display-p3 …).
 */
export function tokenDeclarations(path: string, token: Token, prefix = "ts", wide = false): [string, string][] {
  const name = cssVarName(path, prefix);
  const ref = (alias: string) => `var(${cssVarName(aliasPath(alias), prefix)})`;
  const v = token.$value;

  if (token.$type === "typography") {
    return TYPO_PARTS.map((part) => {
      const varName = `${name}-${kebab(part)}`;
      if (isAlias(v)) return [varName, `var(${cssVarName(aliasPath(v), prefix)}-${kebab(part)})`];
      const pv = (v as Record<string, unknown>)[part];
      if (isAlias(pv)) return [varName, ref(pv)];
      if (part === "letterSpacing") return [varName, dim(pv as DimensionValue, ref)];
      return [varName, String(pv)];
    });
  }
  if (isAlias(v)) return [[name, ref(v)]];
  if (wide) {
    const p3 = (c: unknown) => !!c && typeof c === "object" && (c as ColorValue).colorSpace === "display-p3";
    const hasP3 = token.$type === "color" ? p3(v) : token.$type === "gradient" ? (v as { color: unknown }[]).some((s) => p3(s.color)) : false;
    if (!hasP3) return [];
  }
  const ext = token.$extensions?.[EXT];

  switch (token.$type) {
    case "color":
      return [[name, color(v as ColorValue, ref, wide)]];
    case "dimension":
      if (ext?.fluid) return [[name, clampSize(ext.fluid)]];
      return [[name, dim(v as DimensionValue, ref)]];
    case "gradient": {
      const stops = (v as { color: ColorValue | string; position: number }[])
        .map((s) => `${color(s.color, ref, wide)} ${Math.round(s.position * 100)}%`);
      return [[name, `linear-gradient(${ext?.angle ?? 180}deg, ${stops.join(", ")})`]];
    }
    case "strokeStyle":
      return [[name, typeof v === "string" ? v : "dashed"]];
    case "duration":
      return [[name, dur(v as DurationValue, ref)]];
    case "cubicBezier":
      return [[name, `cubic-bezier(${(v as number[]).join(", ")})`]];
    case "fontFamily":
      return [[name, (Array.isArray(v) ? v : [v]).map((f) => (/[\s\d]/.test(String(f)) && !String(f).includes("-") ? `"${f}"` : f)).join(", ")]];
    case "shadow":
      return [[name, (Array.isArray(v) ? v : [v]).map((s: ShadowValue) =>
        `${s.inset ? "inset " : ""}${dim(s.offsetX, ref)} ${dim(s.offsetY, ref)} ${dim(s.blur, ref)} ${dim(s.spread, ref)} ${color(s.color, ref)}`).join(", ")]];
    case "transition": {
      const t = v as { duration: DurationValue | string; delay: DurationValue | string; timingFunction: number[] | string };
      const tf = typeof t.timingFunction === "string" ? ref(t.timingFunction) : `cubic-bezier(${t.timingFunction.join(", ")})`;
      return [[name, `${dur(t.duration, ref)} ${tf} ${dur(t.delay, ref)}`]];
    }
    default:
      return [[name, String(v)]];
  }
}

/** Base tokens whose alias chain reaches a themed token must be re-declared in each theme block. */
function themeDependent(system: GeneratedSystem): Set<string> {
  const themed = new Set(system.modes.flatMap((m) => flatten(system.themes[m] ?? {}).map(([p]) => p)));
  const memo = new Map<string, boolean>();
  const refsOf = (v: unknown): string[] =>
    isAlias(v) ? [aliasPath(v)] : v && typeof v === "object" ? Object.values(v).flatMap(refsOf) : [];
  const depends = (path: string): boolean => {
    if (themed.has(path)) return true;
    if (memo.has(path)) return memo.get(path)!;
    memo.set(path, false);
    const token = getToken(system.base, path);
    const result = !!token && refsOf(token.$value).some(depends);
    memo.set(path, result);
    return result;
  };
  return new Set(flatten(system.base).map(([p]) => p).filter(depends));
}

const extraDecls = (extras: Extra[], prefix: string): [string, string][] => extras.map((e) => [`--${prefix}-${e.name}`, e.value]);

/** A rule for the selector, plus a Display P3 override when any of its colors are wide gamut. */
function rules(selector: string, entries: [string, Token][], extras: Extra[], prefix: string, indent = ""): string[] {
  const body = (decls: [string, string][], ind: string) => decls.map(([k, v]) => `${ind}  ${k}: ${v};`).join("\n");
  const decls = [...entries.flatMap(([p, t]) => tokenDeclarations(p, t, prefix)), ...extraDecls(extras, prefix)];
  const out = [`${indent}${selector} {\n${body(decls, indent)}\n${indent}}`];
  const wide = entries.flatMap(([p, t]) => tokenDeclarations(p, t, prefix, true));
  if (wide.length) {
    out.push(`${indent}@media (color-gamut: p3) {\n${indent}  ${selector} {\n${body(wide, indent + "  ")}\n${indent}  }\n${indent}}`);
  }
  return out;
}

const media = (query: string, inner: string[]) => `@media ${query} {\n${inner.join("\n")}\n}`;

/**
 * Custom properties for every token. The first mode is the default on :root; other modes apply
 * with [data-theme="…"], and follow prefers-color-scheme and prefers-contrast when no data-theme is set.
 */
export function toCss(system: GeneratedSystem, opts: CssOptions = {}): string {
  const prefix = opts.prefix ?? "ts";
  const root = opts.selector ?? ":root";
  // On :root, a data-theme attribute anywhere below switches modes; when scoped, it sits on the scope element.
  const themed = (mode: string) => (root === ":root" ? `[data-theme="${mode}"]` : `${root}[data-theme="${mode}"]`);
  const auto = `${root}:not([data-theme])`;
  const dependent = themeDependent(system);
  const base = flatten(system.base);
  const forMode = (mode: ModeName) => [...flatten(system.themes[mode] as TokenTree), ...base.filter(([p]) => dependent.has(p))];
  const extrasFor = (mode?: ModeName) => system.extras.filter((e) => e.mode === mode);
  const [first, ...rest] = system.modes as [ModeName, ...ModeName[]];

  const parts = [
    `/* ${system.name}: generated by TokenSeed (engine ${system.seed.engine}). */`,
    ...rules(root, [...base.filter(([p]) => !dependent.has(p)), ...forMode(first)], [...extrasFor(), ...extrasFor(first)], prefix),
  ];
  for (const mode of rest) parts.push(...rules(themed(mode), forMode(mode), extrasFor(mode), prefix));

  const auto_ = (mode: ModeName) => rules(auto, forMode(mode), extrasFor(mode), prefix, "  ");
  const has = (m: ModeName) => system.modes.includes(m);
  if (first === "light" && has("dark")) parts.push(media("(prefers-color-scheme: dark)", auto_("dark")));
  if (has(`${first}-hc` as ModeName)) parts.push(media("(prefers-contrast: more)", auto_(`${first}-hc` as ModeName)));
  if (first === "light" && has("dark-hc")) parts.push(media("(prefers-contrast: more) and (prefers-color-scheme: dark)", auto_("dark-hc")));
  if (rest.length) parts.push(...rules(themed(first), forMode(first), extrasFor(first), prefix));

  if (opts.classes) {
    const scope = root === ":root" ? "" : `${root} `;
    for (const [p, t] of base.filter(([, t]) => t.$type === "typography")) {
      const v = cssVarName(p, prefix);
      const role = p.replace(/^typography\./, "").replace(/\./g, "-");
      parts.push(
        `${scope}.${prefix}-text-${role} {\n  font-family: var(${v}-font-family);\n  font-size: var(${v}-font-size);\n` +
          `  font-weight: var(${v}-font-weight);\n  line-height: var(${v}-line-height);\n  letter-spacing: var(${v}-letter-spacing);\n}`,
      );
    }
  }
  return parts.join("\n\n") + "\n";
}

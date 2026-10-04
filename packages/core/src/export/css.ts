import type { GeneratedSystem } from "../engine";
import {
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
}

export const cssVarName = (path: string, prefix = "ts") => `--${prefix}-${path.replace(/\./g, "-")}`;

function color(v: ColorValue | string, ref: (s: string) => string): string {
  if (typeof v === "string") return isAlias(v) ? ref(v) : v;
  if (v.alpha === undefined || v.alpha === 1) return v.hex;
  const [r, g, b] = v.components.map((n) => Math.round(n * 255));
  return `rgb(${r} ${g} ${b} / ${v.alpha})`;
}

const dim = (v: DimensionValue | string, ref: (s: string) => string) =>
  typeof v === "string" ? ref(v) : `${v.value}${v.unit}`;
const dur = (v: DurationValue | string, ref: (s: string) => string) =>
  typeof v === "string" ? ref(v) : `${v.value}${v.unit}`;

const TYPO_PARTS = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing"] as const;
const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** CSS declarations for one token. Typography expands into one variable per property. */
export function tokenDeclarations(path: string, token: Token, prefix = "ts"): [string, string][] {
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

  switch (token.$type) {
    case "color":
      return [[name, color(v as ColorValue, ref)]];
    case "dimension":
      return [[name, dim(v as DimensionValue, ref)]];
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

const block = (selector: string, entries: [string, Token][], prefix: string, indent = "") =>
  `${indent}${selector} {\n${entries
    .flatMap(([p, t]) => tokenDeclarations(p, t, prefix))
    .map(([k, v]) => `${indent}  ${k}: ${v};`)
    .join("\n")}\n${indent}}`;

/**
 * Custom properties for every token. The first mode is the default on :root; other modes apply
 * with [data-theme="…"] and, for dark, with prefers-color-scheme unless data-theme="light" is set.
 */
export function toCss(system: GeneratedSystem, opts: CssOptions = {}): string {
  const prefix = opts.prefix ?? "ts";
  const root = opts.selector ?? ":root";
  // On :root, a data-theme attribute anywhere below switches modes; when scoped, it sits on the scope element.
  const themed = (mode: string) => (root === ":root" ? `[data-theme="${mode}"]` : `${root}[data-theme="${mode}"]`);
  const dependent = themeDependent(system);
  const base = flatten(system.base);
  const forMode = (mode: ModeName) => [...flatten(system.themes[mode] as TokenTree), ...base.filter(([p]) => dependent.has(p))];
  const [first, ...rest] = system.modes as [ModeName, ...ModeName[]];

  const parts = [
    `/* ${system.name}: generated by TokenSeed (engine ${system.seed.engine}). */`,
    block(root, [...base.filter(([p]) => !dependent.has(p)), ...forMode(first)], prefix),
  ];
  for (const mode of rest) {
    parts.push(block(themed(mode), forMode(mode), prefix));
    if (mode === "dark") {
      parts.push(`@media (prefers-color-scheme: dark) {\n${block(`${root}:not([data-theme="light"])`, forMode(mode), prefix, "  ")}\n}`);
    }
  }
  if (rest.length || first !== "light") parts.push(block(themed(first), forMode(first), prefix));
  return parts.join("\n\n") + "\n";
}

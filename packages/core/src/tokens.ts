/** DTCG 2025.10 token shapes, kept to what the engine emits. */

export type TokenType =
  | "color"
  | "dimension"
  | "fontFamily"
  | "fontWeight"
  | "duration"
  | "cubicBezier"
  | "number"
  | "shadow"
  | "typography"
  | "border"
  | "transition"
  | "strokeStyle"
  | "gradient";

export interface ColorValue {
  colorSpace: "srgb" | "display-p3";
  components: [number, number, number];
  alpha?: number;
  hex: string;
}
export interface DimensionValue {
  value: number;
  unit: "px" | "rem";
}
export interface DurationValue {
  value: number;
  unit: "ms" | "s";
}
export interface ShadowValue {
  color: ColorValue | string;
  offsetX: DimensionValue;
  offsetY: DimensionValue;
  blur: DimensionValue;
  spread: DimensionValue;
  inset?: boolean;
}

export const EXT = "com.tokenseed";

export interface Provenance {
  generator: string;
  knobs: string[];
  /** Gradient angle in degrees; DTCG gradients have no direction of their own. */
  angle?: number;
  /** Fluid size range, exported to CSS as clamp(). */
  fluid?: { min: number; max: number; minViewport: number; maxViewport: number };
}

export interface Token {
  $type: TokenType;
  /** A literal value, or an alias like "{color.primary.600}". Composite values may contain aliases. */
  $value: unknown;
  $description?: string;
  $extensions?: { [EXT]?: Provenance };
}

export interface TokenTree {
  [key: string]: TokenTree | Token;
}

/** "light", "dark", and their high-contrast variants "light-hc" and "dark-hc". */
export type ModeName = "light" | "dark" | "light-hc" | "dark-hc";
export const isDarkMode = (m: ModeName) => m.startsWith("dark");
export const isHighContrast = (m: ModeName) => m.endsWith("-hc");

export const isToken = (n: TokenTree | Token | undefined): n is Token => !!n && typeof n === "object" && "$value" in n;
export const isAlias = (v: unknown): v is string => typeof v === "string" && /^\{[^{}]+\}$/.test(v);
export const aliasPath = (v: string) => v.slice(1, -1);

export function getToken(tree: TokenTree, path: string): Token | undefined {
  let node: TokenTree | Token | undefined = tree;
  for (const part of path.split(".")) {
    if (!node || isToken(node)) return undefined;
    node = node[part];
  }
  return isToken(node) ? node : undefined;
}

export function setToken(tree: TokenTree, path: string, token: Token) {
  const parts = path.split(".");
  let node = tree;
  for (const part of parts.slice(0, -1)) {
    const next = node[part];
    if (!next || isToken(next)) node[part] = {};
    node = node[part] as TokenTree;
  }
  node[parts[parts.length - 1]!] = token;
}

/** Depth-first list of [path, token]. */
export function flatten(tree: TokenTree, prefix = ""): [string, Token][] {
  const out: [string, Token][] = [];
  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith("$")) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (isToken(node)) out.push([path, node]);
    else out.push(...flatten(node, path));
  }
  return out;
}

export const px = (value: number): DimensionValue => ({ value: Math.round(value * 100) / 100, unit: "px" });
export const ms = (value: number): DurationValue => ({ value: Math.round(value), unit: "ms" });

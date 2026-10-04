import { contrast } from "./color";
import type { KnobValue } from "./knobs/types";
import { resolve, type Resolved, type Seed } from "./seed";
import {
  EXT,
  aliasPath,
  getToken,
  isAlias,
  setToken,
  type ColorValue,
  type ModeName,
  type Token,
  type TokenTree,
  type TokenType,
} from "./tokens";

export interface Recipe {
  id: string;
  name: string;
  description: string;
  anatomy: string[];
  variants: string[];
  states: string[];
  /** Component token group this recipe owns, e.g. "component.button". */
  tokens: string;
  rules: string[];
}

export interface Guideline {
  topic: string;
  kind: "do" | "dont" | "note";
  text: string;
}

export interface ContrastCheck {
  mode: ModeName;
  foreground: string;
  background: string;
  ratio: number;
  required: number;
  pass: boolean;
}

export interface GeneratedSystem {
  name: string;
  seed: Seed;
  resolved: Resolved;
  modes: ModeName[];
  /** Mode-independent tokens: primitives, scales, component aliases. */
  base: TokenTree;
  /** Semantic tokens that change per mode. */
  themes: Partial<Record<ModeName, TokenTree>>;
  recipes: Recipe[];
  guidelines: Guideline[];
  checks: ContrastCheck[];
}

export interface SetOptions {
  mode?: ModeName;
  description?: string;
}

export interface GeneratorContext {
  knob<T extends KnobValue>(id: string): T;
  modes: ModeName[];
  set(path: string, type: TokenType, value: unknown, opts?: SetOptions): void;
  /** Final literal value of a token in a mode, following aliases. */
  value<T = unknown>(path: string, mode?: ModeName): T;
  hex(path: string, mode?: ModeName): string;
  recipe(r: Recipe): void;
  guideline(g: Guideline): void;
  check(mode: ModeName, foreground: string, background: string, required: number): void;
}

export interface Generator {
  id: string;
  /** Generators that must run first. */
  after: string[];
  /** Knobs this generator reads; recorded as provenance on every token it writes. */
  reads: string[];
  run(ctx: GeneratorContext): void;
}

export function resolveValue(system: Pick<GeneratedSystem, "base" | "themes">, path: string, mode?: ModeName): unknown {
  const seen = new Set<string>();
  let current = path;
  for (;;) {
    if (seen.has(current)) throw new Error(`Alias cycle at ${current}`);
    seen.add(current);
    const token = (mode && system.themes[mode] && getToken(system.themes[mode]!, current)) || getToken(system.base, current);
    if (!token) throw new Error(`Unknown token ${current}${mode ? ` (${mode})` : ""}`);
    if (!isAlias(token.$value)) return token.$value;
    current = aliasPath(token.$value);
  }
}

/** Orders generators so every one runs after its dependencies. */
export function orderGenerators(gens: Generator[]): Generator[] {
  const byId = new Map(gens.map((g) => [g.id, g]));
  const out: Generator[] = [];
  const state = new Map<string, "visiting" | "done">();
  const visit = (g: Generator) => {
    const s = state.get(g.id);
    if (s === "done") return;
    if (s === "visiting") throw new Error(`Generator cycle at ${g.id}`);
    state.set(g.id, "visiting");
    for (const dep of g.after) {
      const d = byId.get(dep);
      if (!d) throw new Error(`${g.id} depends on missing generator ${dep}`);
      visit(d);
    }
    state.set(g.id, "done");
    out.push(g);
  };
  gens.forEach(visit);
  return out;
}

export function runEngine(seed: Seed, generators: Generator[]): GeneratedSystem {
  const resolved = resolve(seed);
  const modesKnob = resolved.values["identity.modes"];
  const modes: ModeName[] = modesKnob === "both" ? ["light", "dark"] : [modesKnob as ModeName];
  const system: GeneratedSystem = {
    name: String(resolved.values["identity.name"]),
    seed,
    resolved,
    modes,
    base: {},
    themes: Object.fromEntries(modes.map((m) => [m, {}])),
    recipes: [],
    guidelines: [],
    checks: [],
  };

  for (const gen of orderGenerators(generators)) {
    const ctx: GeneratorContext = {
      knob: <T extends KnobValue>(id: string) => {
        if (!(id in resolved.values)) throw new Error(`${gen.id} reads unknown knob ${id}`);
        return resolved.values[id] as T;
      },
      modes,
      set(path, type, value, opts = {}) {
        const token: Token = { $type: type, $value: value };
        if (opts.description) token.$description = opts.description;
        token.$extensions = { [EXT]: { generator: gen.id, knobs: gen.reads } };
        if (opts.mode) {
          // Generators may write every mode; ones the user didn't ask for are dropped.
          const tree = system.themes[opts.mode];
          if (tree) setToken(tree, path, token);
        } else setToken(system.base, path, token);
      },
      value: <T>(path: string, mode?: ModeName) => resolveValue(system, path, mode) as T,
      hex: (path, mode) => (resolveValue(system, path, mode) as ColorValue).hex,
      recipe: (r) => system.recipes.push(r),
      guideline: (g) => system.guidelines.push(g),
      check(mode, foreground, background, required) {
        const fg = (resolveValue(system, foreground, mode) as ColorValue).hex;
        const bg = (resolveValue(system, background, mode) as ColorValue).hex;
        const ratio = Math.round(contrast(fg, bg) * 100) / 100;
        system.checks.push({ mode, foreground, background, ratio, required, pass: ratio >= required });
      },
    };
    gen.run(ctx);
  }
  return system;
}

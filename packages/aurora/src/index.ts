import {
  AuroraBundle,
  AuroraTheme,
  AuroraThemeVariant,
  type AuroraBundleJson,
  type AuroraTexture,
} from "@aurora/core";
import { canonical, type GeneratedSystem } from "@tokenseed/core";
import corePackage from "../../core/package.json";
import { ROLE_NAMES, auroraRoleColors, toAuroraColor, type Appearance } from "./roles";
import { sha256Hex } from "./sha256";
import { buildTexture } from "./texture";
import { AuroraFoundation } from "@aurora/core";

export { toSrgb8, srgbHex, type Srgb8 } from "./srgb";
export { auroraRoleColors, rampOf, ROLE_NAMES, type Appearance, type RoleName } from "./roles";
export { auroraTextureValues } from "./texture";
export { sha256Hex } from "./sha256";

export interface AuroraNameOptions {
  /** Theme or texture id; defaults to `auroraId(system.name)`. */
  id?: string;
  /** Display name; defaults to the system's name. */
  name?: string;
}

export interface AuroraBundleOptions extends AuroraNameOptions {
  /** RFC 3339 timestamp for provenance; defaults to now. Inject it for reproducible bundles. */
  createdAt?: string;
}

/** The installer's id rule: `^[a-z][a-z0-9_-]{0,79}$`. */
export const AURORA_ID = /^[a-z][a-z0-9_-]{0,79}$/;

/** A lowercase slug that satisfies the installer's id rule, whatever the display name. */
export function auroraId(name: string): string {
  let slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) return "tokenseed";
  if (!/^[a-z]/.test(slug)) slug = `ts-${slug}`;
  return slug.slice(0, 80).replace(/-+$/, "");
}

/** Foundation colour roles for one appearance, as an Aurora variant. Throws if the system lacks that mode. */
export function toAuroraVariant(system: GeneratedSystem, appearance: Appearance): AuroraThemeVariant {
  const colors = auroraRoleColors(system, appearance);
  return new AuroraThemeVariant({
    contract: AuroraBundle.foundationContract,
    appearance,
    values: ROLE_NAMES.map((role) => [AuroraFoundation[role], toAuroraColor(colors[role])] as const),
  });
}

const variantCache = new WeakMap<GeneratedSystem, Partial<Record<Appearance, AuroraThemeVariant>>>();

/** `toAuroraVariant`, memoized per system object, so repeated calls return the identical variant. */
export function auroraVariantFor(system: GeneratedSystem, appearance: Appearance): AuroraThemeVariant {
  let byAppearance = variantCache.get(system);
  if (!byAppearance) variantCache.set(system, (byAppearance = {}));
  return (byAppearance[appearance] ??= toAuroraVariant(system, appearance));
}

/** The appearances a system can export: its light and dark modes (high-contrast modes are dropped). */
export function auroraAppearances(system: GeneratedSystem): Appearance[] {
  return (["light", "dark"] as const).filter((a) => system.modes.includes(a));
}

export function toAuroraTheme(system: GeneratedSystem, opts: AuroraNameOptions = {}): AuroraTheme {
  const appearances = auroraAppearances(system);
  return new AuroraTheme({
    id: opts.id ?? auroraId(system.name),
    name: opts.name ?? system.name,
    variants: appearances.map((a) => auroraVariantFor(system, a)),
    preferredAppearance: appearances.includes("light") ? "light" : "dark",
  });
}

/** Type scale, corner shapes and motion, as an Aurora texture on the foundation contract. */
export function toAuroraTexture(system: GeneratedSystem, opts: AuroraNameOptions = {}): AuroraTexture {
  return buildTexture(system, opts.id ?? auroraId(system.name), opts.name ?? system.name);
}

const textureCache = new WeakMap<GeneratedSystem, AuroraTexture>();

/** `toAuroraTexture` with default id and name, memoized per system object. */
export function auroraTextureFor(system: GeneratedSystem): AuroraTexture {
  let texture = textureCache.get(system);
  if (!texture) textureCache.set(system, (texture = toAuroraTexture(system)));
  return texture;
}

/** What the bundle's provenance names as its generator, e.g. `tokenseed@0.2.0`. */
export const AURORA_GENERATOR = `tokenseed@${corePackage.version}`;

/** `sha256:<hex>` of the seed's canonical (sorted-key) JSON: the source design the bundle came from. */
export const auroraSourceHash = (system: GeneratedSystem) => `sha256:${sha256Hex(canonical(system.seed))}`;

/** The single-file Aurora bundle: theme variants, texture, suggested pairing and provenance. */
export function exportAuroraBundle(system: GeneratedSystem, opts: AuroraBundleOptions = {}): AuroraBundleJson {
  return AuroraBundle.encode({
    theme: toAuroraTheme(system, opts),
    texture: opts.id === undefined && opts.name === undefined ? auroraTextureFor(system) : toAuroraTexture(system, opts),
    pair: true,
    provenance: {
      generator: AURORA_GENERATOR,
      sourceHash: auroraSourceHash(system),
      createdAt: opts.createdAt ?? new Date().toISOString(),
    },
  });
}

/** The bundle as pretty-printed JSON text, ready to write to a `.aurora.json` file. */
export const stringifyAuroraBundle = (bundle: AuroraBundleJson) => `${JSON.stringify(bundle, null, 2)}\n`;

export const auroraBundleFileName = (bundle: AuroraBundleJson) => `${bundle.manifest.theme.id}.aurora.json`;

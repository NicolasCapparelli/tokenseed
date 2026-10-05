import type { AuroraTexture, AuroraThemeVariant } from "@aurora/core";
import type { GeneratedSystem } from "@tokenseed/core";
import { auroraTextureFor, auroraVariantFor } from "@tokenseed/aurora";

export type Appearance = "light" | "dark";

/**
 * The Aurora variant and texture that style the app chrome for a system. High contrast is not an
 * Aurora concept, so the chrome stays on the plain light/dark variant; if the system lacks the
 * requested appearance (a light-only or dark-only system), it shows the one it has.
 */
export function chromeFor(system: GeneratedSystem, appearance: Appearance): { variant: AuroraThemeVariant; texture: AuroraTexture } {
  const shown: Appearance = system.modes.includes(appearance) ? appearance : appearance === "light" ? "dark" : "light";
  return { variant: auroraVariantFor(system, shown), texture: auroraTextureFor(system) };
}

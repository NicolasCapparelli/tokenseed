# Handoff: new studio UI on top of Aurora

Written 2026-10-04 at the end of a long session, so the next one can start cold. Nico approved the concept UI ("let's just move forward with this, there's no need for another pass with a design agent"). The next phase is to **implement that UI, built on his Aurora library**, which first needs a TypeScript port.

## 1. Where things are

| What | Where |
| --- | --- |
| TokenSeed repo | `github.com/NicolasCapparelli/tokenseed`, working copy on Nico's PC at `C:\Users\cappa\Desktop\Projects\tokenseed` |
| Aurora repo | `github.com/NicolasCapparelli/aurora`, working copy at `C:\Users\cappa\Desktop\Projects\aurora` |
| PR #1 | `feat/core-engine` into `main`: core engine and the first editor. CI green. |
| PR #2 | `feat/full-catalog-snapshots` into `feat/core-engine`: 172 knobs, git-like repositories, library and versions in the web app, the design brief, this handoff. CI green, mergeable. Merge #1 first. |
| Approved UI concept | `docs/concept/tokenseed-concept.html` (open it in a browser; it is self-contained) and the published copy at https://claude.ai/artifact/6uZLtN4ZWqFKmgG1kUMsHc |
| Design brief | `docs/design-brief.md`. Section 0 is the design direction; it is now the spec for the UI, not a brief for a designer. |
| Knob catalog | `docs/knobs.md`, generated from code by a test |
| Aurora findings | `docs/aurora-investigation.md` |
| Research | `docs/research/research-01..04.md` |

Running it: `pnpm install && pnpm dev` (web on :5173), `pnpm -r test`, `pnpm -r typecheck`. On Nico's PC pnpm isn't on PATH: use `corepack pnpm …`. pnpm also asks to approve esbuild's build script; that warning is harmless.

## 2. What exists today

- **`packages/core`** is framework-free TypeScript, with 39 tests.
  - **Knobs, traits and presets.** `knobs/` holds 172 knobs in 18 groups, 12 traits and 12 presets, all registered as data. A test fails if a knob is not read by any generator.
  - **Seeds.** A seed holds all the user's inputs. Resolution layers them, lowest first: defaults, product preset, style presets, traits, user knobs. Provenance is kept per value.
  - **Generators**, run in dependency order:
    - palette, semantic color, data viz
    - typography
    - spacing, layout, shape
    - elevation, motion, states, media
    - recipes, content
  - **Engine output.** It writes W3C DTCG tokens for light, dark and optional high-contrast modes. It also runs WCAG and APCA contrast checks.
  - **Exporters:**
    - CSS variables, with P3, `clamp()`, `prefers-contrast` and `[data-theme]`
    - Tailwind v4
    - a DTCG folder with a resolver
    - `DESIGN.md` for AI agents
  - **Repositories.** `repo.ts` has pure functions for commit, branch, tag, checkout, restore and fork, plus seed and token diffs and `.tokenseed` bundles. Snapshot ids are content hashes.
  - **Variations.** `variations.ts` is "pick one you like": a Latin-hypercube spread over the untouched traits, plus nudges to the free knobs.
- **`apps/web`** is React 19 with Vite 8. It is functional but plain:
  - Sprout, Grow and Craft levels, and an options grid
  - the live specimen, styled only by the generated CSS variables
  - export
  - an IndexedDB library of repositories
  - a history panel with compare
  
  The new UI replaces its look and layout, but its state and storage code (`state.ts`, `storage.ts`) and the core APIs carry over.

## 3. The new UI (approved)

**The concept is the spec.** Rebuild `apps/web` to match it, using real engine data instead of the concept's toy token function. The principles are in `docs/design-brief.md` §0:
- bold and modern
- the live system is the hero
- simple first, with depth on demand
- no more than about 12 controls on screen in Sprout or Grow
- no engine jargon outside Craft and Export

### Screens

| Screen | Contents |
| --- | --- |
| Start | "Grow a whole design system from one color": color orbs plus "any color", 6 "What are you making?" tiles, an optional vibe field (AI, ask first), and one primary button. The right side shows a ramp wall with a live preview card over it. |
| Studio | **Top bar:** logo, a system pill (name, branch, unsaved dot; opens the Library), the Sprout · Grow · Craft depth switch in the center, theme, Versions, and Export as the primary action. **Left:** a glass controls panel. **Center:** the live preview with App · Landing · Mobile · Tokens templates, Light/Dark, and a contrast pill. **Over the preview:** a floating "Pick one you like" strip. |
| Versions drawer | Branch pills, a "Save version" card with changes in plain words, and a timeline with thumbnails rendered from each version's tokens. Tapping a version splits the preview into a draggable before/after. |
| Export drawer | "Take it with you": four format cards, a code preview, Download, Copy, and the whole system as `.tokenseed`. |
| Library | A poster gallery. Each poster is rendered in that system's own tokens: hero color, display font, ramp strip. Fork, Export and Delete go in an overflow menu. |

### The three depths

| Depth | Panel content |
| --- | --- |
| Sprout | "Shape the vibe": 5 big two-ended trait sliders, with "3 more" folded away, and the style presets as chips. An untouched trait is shown as "open". |
| Grow | "Make it yours": 8 area cards with a live one-line summary. An open area shows 2 to 4 visual tiles, at most 2 sliders, and "Fine-tune all N settings →". |
| Craft | "Every detail": the same areas, listing every knob with a provenance tag. A token table is also reachable here. |

### Mapping engine data to the UI

The concept has **8 areas**; the catalog has **18 groups**. Add an `area` field to the knob definitions, or keep a group-to-area map in core so the UI stays data-driven.

| Area | Catalog groups |
| --- | --- |
| Color | Color, Neutrals, Semantic color, Dark mode, Data viz |
| Typography | Typography |
| Shape | Shape, Border |
| Space & layout | Spacing, Layout |
| Depth | Elevation |
| Motion & states | Motion, States |
| Components | Components, Icons & imagery |
| Voice & access | Content, Accessibility |

Identity knobs live on the Start screen and in a small "system settings" sheet, not in the areas.

Other parts of the concept also need engine support:

- **Visual tiles in Grow.** Mark the 1 to 3 hero knobs per area, either with `featured: true` or by using `control: "visualChoice"` together with `levels` including grow. Render their options as tiles that preview the real effect (corner shapes, "Aa" in each font, shadow depth, density bars). Expose the remaining grow-level knobs only under "Fine-tune".
- **Area summaries** ("Grotesk · 750 headings", "12px corners") are a small per-area function over the resolved values. Keep them in the web app.
- **Specimen templates.** Templates (App, Landing, Mobile, Tokens) replace today's single `Specimen.tsx`. All styling stays through `--ts-*` variables only.
- **Thumbnails** for picks, versions and posters render the compact specimen from `generate(seed)`. Memoize per seed and keep them cheap. One generation takes about 5 ms.
- **Before/after compare** is two specimen layers with `clip-path` driven by a range input. `diffTokens` and `diffSeeds` stay available for the Craft details view.
- **The chrome wears the system** (neutrals tinted to the system's hue, accent = the system's primary). This is where Aurora comes in; see §4.

## 4. Aurora

### Current state

The full findings are in `docs/aurora-investigation.md`. In short:
- Aurora is a strict runtime theming engine: one contract, many themes with light and dark variants, and a separately selectable style layer.
- It has a Material Color Utilities generator, a DTCG subset and recipes.
- **Only the Dart and Flutter implementations exist.** They are about 4.1k lines of core and 730 of adapter, and all tests pass (118 and 29).
- The specs and conformance fixtures in `spec/` were written for ports.

### The plan

1. **Nico commits and pushes Aurora's `feat/styles`** (decision 1 below). Today the whole style layer is uncommitted on his PC.
2. **Port the Aurora core to `@aurora/core` in TypeScript**, in the Aurora repo as `packages/aurora_ts`. Make the existing `spec/` fixtures pass unchanged.
   - Add a TS emitter to `tools/generate_foundation.py`.
   - Port these modules: values and tokens, the contract and validation, themes, styles, runtime, contrast, the DTCG, style and recipe codecs, and the generator.
   - Skip the CLI.
   - The risky part is generator parity with npm `@material/material-color-utilities`. Check `generation-v1.json` and `generation-schemes-v1.json` byte for byte. If schemes diverge, vendor or patch MCU's TS, or ship tonal-spot first.
   - Estimate: about 3 to 5 focused agent days for the core, test-driven from the fixtures.
3. **Build `@aurora/react`** in `packages/aurora_react`. Estimate: 1 to 2 days.
   - `AuroraProvider`, using `useSyncExternalStore` over the runtime
   - hooks: `useTokens`, `useStyle`, `useAuroraController`
   - system appearance through `matchMedia`
   - a fixed scope for galleries and thumbnails
   - a CSS custom-property emitter in place of the Flutter Material bridge
4. **Put the TokenSeed web chrome on Aurora.** Define TokenSeed's app contract: Aurora's foundation plus TokenSeed extensions for glass, panel radius and the like. Ship a default theme, and a live theme derived from the system being edited, so the chrome takes on the user's colors. Consume the packages as a pnpm workspace link or vendored copy until the npm decision is made.
5. **Optional, and cheap:** add an "Aurora theme" export to TokenSeed. It would map TokenSeed's semantic roles onto Aurora's 58 color roles and 29 style tokens, so Flutter apps can use a TokenSeed system directly.

### Do not

Do not replace TokenSeed's generator with Aurora's unless Nico explicitly chooses that (decision 2, option ii). Aurora is sRGB-only, light/dark-only, has no transition or gradient types, and has a fixed contract. TokenSeed depends on OKLCH ramps, P3, high-contrast modes and an open 172-knob token tree. Bridging that gap means growing Aurora's foundation, which `AGENTS.md` treats as an explicit versioning decision.

## 5. Suggested order of PRs

1. **Aurora:** push `feat/styles`, which Nico does or authorizes.
2. **Aurora:** `packages/aurora_ts` core and fixtures, in several PRs. Suggested split: values, contract and themes; runtime; codecs and recipes; generator.
3. **Aurora:** `packages/aurora_react`.
4. **TokenSeed:** core additions for the new UI: the area map, featured knobs and area summaries. Small and test-covered.
5. **TokenSeed:** the new web shell: Start, Studio frame and depth switch, using Aurora for chrome theming. The existing state and storage carry over.
6. **TokenSeed:** Grow and Craft panels, specimen templates, the pick strip.
7. **TokenSeed:** the Versions drawer with split compare, the Export drawer, the Library posters.
8. **TokenSeed (optional):** an Aurora theme exporter.

Steps 4 to 7 can start before the port lands: theme the chrome with plain CSS variables derived from the system, then swap in Aurora in step 5 or at the end.

## 6. Decisions needed from Nico

1. **Push Aurora `feat/styles`, and confirm the name "style".** The port should start from that work, and cloud sessions can't see it until it's pushed.
2. **What "built on Aurora" means.**
   - (i) Aurora themes TokenSeed's own UI, including taking on the user's system.
   - (ii) Aurora's generator replaces TokenSeed's.
   - (iii) TokenSeed exports Aurora themes for Flutter apps.
   
   The recommendation is (i) plus (iii), which the plan above assumes.
3. **Where the TS port lives.** The recommendation is the Aurora repo (`packages/aurora_ts`, `packages/aurora_react`), consumed by TokenSeed as a workspace link or vendored copy.
4. **Publish to npm, or keep it private.**

## 7. Working conventions

- Commits end with the Co-Authored-By and Claude-Session lines. PR bodies start with Before/After paragraphs.
- Each PR is driven to green CI. Nico is assigned; he can't be requested as reviewer on his own PRs.
- Generated docs: after changing knobs, run `UPDATE_DOCS=1 pnpm -r test`. On PowerShell, set `$env:UPDATE_DOCS=1` first.
- Personal data in the BoldHero reference screenshots must never appear in published output. Use placeholder data.
- Nico prefers short, plain replies and decides quickly. Bias to action on reversible work.

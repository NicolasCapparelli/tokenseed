# Aurora: current state and what TokenSeed needs from it

> **Update:** the uncommitted `feat/styles` work described below was later renamed textures and merged into Aurora `main`. The decisions at the end are answered in `docs/handoff.md` §6, and the work is briefed in `docs/aurora-port-prompt.md`.

Investigated on 2026-10-04 by reading `C:\Users\cappa\Desktop\Projects\aurora` and running its test suites. Nothing in it was changed.

## What Aurora is

Aurora is a runtime theme engine. An app declares one complete **contract** (Aurora's foundation plus its own extensions). The engine then holds many named **themes**, each with explicit light and dark variants, and an optional **style** layer that is selected independently of the theme. The selection is theme + appearance + style.

**Foundations**
- Color foundation: 58 tokens. These are the 46 Material 3 roles plus success, warning and info families, under the reserved `colors` namespace.
- Style foundation: 29 Material 3 baseline tokens:
  - `type.family.brand` and `type.family.plain`
  - a 15-role type scale
  - shapes from extraSmall to extraLarge
  - motion durations and easings
- `type`, `shape` and `motion` are reserved namespaces.
- Every variant must supply every contract token. Incomplete input is rejected with every issue listed.

**What ships with it**
- A seed-based generator built on Material Color Utilities HCT, with 9 pinned schemes and contrast diagnostics.
- DTCG import and export, limited to the color and style subset.
- Portable JSON "recipes".
- A CLI.
- A small local HTML generator UI.

Sources: `README.md`, `AGENTS.md`, `continuity/README.md`, `continuity/decisions/design-notes.md`.

## State of the repo

- **Remote and branches.** The remote is `github.com/NicolasCapparelli/aurora`. `main` has 3 commits: initial, integration APIs and Continuity docs, and vendoring.
- **The styles layer is not committed.** The checkout on Nico's PC is on `feat/styles`, which has no commits of its own. The whole styles layer exists only on that machine, as 19 modified files and about 22 new ones (`style*.dart`, `token.dart`, `ref.dart`, `values.dart`, `spec/style-*.json`, fixtures, examples, tests). `continuity/status.md` says it is waiting on the owner to confirm the name and authorize a commit. **Until it is pushed, no cloud session can see it.**
- **Only Dart and Flutter exist.**
  - `packages/aurora` is the pure Dart core: about 4.1k lines, of which about 400 are CLI and IO.
  - `packages/aurora_flutter` is the adapter: about 730 lines.
  - Nothing is written in TypeScript or JavaScript. The one exception is the inline JS of the CLI's HTML tool, which can't be reused.
  - A TypeScript/React Native port is a stated goal: "planned, not implemented".
- **Tests pass.** `dart test` passes all 118 core tests and `flutter test` passes all 29 adapter tests. That matches `continuity/status.md`.
- **Dependencies.** The core depends only on `material_color_utilities`, pinned to 0.11.1.

## Ready for a port

The cross-language boundary is unusually well prepared:
- **Port rules** in `spec/README.md` cover boundaries and selection semantics, and note that "a React adapter can use context/subscriptions".
- **Normative specs**: `spec/generation-v1.md`, `spec/recipe-v1.md` and `spec/style-recipe-v1.md`.
- **Machine-readable foundations**: `spec/foundation-v1.json` and `spec/style-foundation-v1.json`.
- **Conformance fixtures**, which a port must pass unchanged: `light.tokens.json`, `variant-cases.json`, `generation-v1.json` and `generation-schemes-v1.json`. The style fixtures are not committed yet.
- **Generated accessors.** `tools/generate_foundation.py` generates the Dart accessors from one table. It needs a TypeScript output target.

**Portable pure logic**, about 2.5 to 3k lines of TypeScript once ported:
- values, tokens and refs
- the contract and its validation
- themes and styles
- the runtime: registry, selection, fallback, transactional changes and the change stream
- the generator
- contrast
- the DTCG, style and recipe codecs

**Flutter-only code, to be replaced by a web adapter:**
- the controller (a ChangeNotifier)
- `AuroraScope` (an InheritedWidget)
- the MaterialApp integration
- the Material bridge
- conversions to TextStyle, BorderRadius and Curve

Aurora has no components, layout or animation library. It is a theming runtime only.

## How it compares with TokenSeed

| | Aurora | TokenSeed |
| --- | --- | --- |
| Color engine | MCU HCT tonal palettes mapped to fixed M3 roles | OKLCH/LCh ramps (culori), configurable steps and names |
| Color format | 8-bit sRGB only; display-p3 explicitly unsupported | sRGB plus display-p3 with fallback |
| Modes | light, dark | light, dark, light-hc, dark-hc |
| Token types | color plus style values; no transition, gradient or composite references | full DTCG set used by the generators, including transition and gradient |
| Token tree | fixed contract; every path declared; reserved M3 namespaces | open, data-driven tree from 172 knobs (palette, semantic roles, component tokens) |

## TypeScript port plan

These estimates come from the investigation.

| Package / module | Size | Notes |
| --- | --- | --- |
| `@aurora/core`: values, tokens, contract, validation | about 1 day | straight port, fixture-driven |
| Generated foundations | small | add a TS emitter to `generate_foundation.py` |
| Themes and styles with alias resolution | medium | |
| Runtime and selection | small | |
| DTCG, style and recipe codecs | medium | `style_codec` is the fiddliest |
| Generator | medium to hard | parity between Dart MCU 0.11.1 and npm `@material/material-color-utilities` is the risk; scheme variants may differ, so check `generation-v1.json` and `generation-schemes-v1.json` for byte-exact matches; fallback is to vendor or patch MCU TS, or ship tonal-spot first |
| Contrast | trivial | |
| CLI, server, installer | skip | |
| `@aurora/react` | 1 to 2 days, 300 to 600 lines | `AuroraProvider` on `useSyncExternalStore`; `useTokens`, `useStyle` and `useAuroraController`; `matchMedia` for system appearance; a fixed scope for thumbnails; a CSS custom-property emitter in place of the Material bridge |

The total is about 3 to 5 focused agent days.

## Decisions needed from Nico

1. **Commit and push `feat/styles`, and confirm the name "style".** The port should start from that work.
2. **Decide what "TokenSeed built on Aurora" means.** There are three possible readings:
   - **(i)** TokenSeed's own UI is themed at runtime by Aurora, including the chrome taking on the system being edited.
   - **(ii)** TokenSeed's generator is replaced by Aurora's, or rebuilt on top of it.
   - **(iii)** TokenSeed exports Aurora themes and styles, so Flutter apps can use a TokenSeed system directly.

   (i) fits naturally and (iii) is cheap. (ii) conflicts with OKLCH, P3, high-contrast modes and the larger open token tree unless Aurora grows to cover them. Per `AGENTS.md`, each of those additions is a foundation or profile versioning decision.
3. **Decide where the port lives.** The recommendation is new `packages/aurora_ts` and `packages/aurora_react` in the Aurora repo, reading `spec/` directly. The alternative is vendoring them into TokenSeed.
4. **Decide whether to publish to npm** or keep the packages in a workspace or vendored, mirroring Dart's `publish_to: none`.

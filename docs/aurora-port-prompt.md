# Prompt for the Aurora agent: TypeScript port and the TokenSeed pipeline

Paste everything below the line into a Claude Code session opened in the Aurora repo (`C:\Users\cappa\Desktop\Projects\aurora`). It is written for an agent that has never heard of TokenSeed.

---

You are working in the Aurora repository. Before anything else, follow `AGENTS.md` and the Continuity contract: read `continuity/agent/instructions.md`, `continuity/status.md` and the full `continuity/agent/map.md`, then `README.md`, `continuity/decisions/design-notes.md`, `continuity/data/dtcg-profile.md` and `spec/README.md`.

## Why this work exists

Aurora is Dart/Flutter only. Its `spec/` folder and conformance fixtures were written so a TypeScript port could follow; this task is that port.

The first consumer is **TokenSeed**, a web app (React 19 + Vite + TypeScript, pnpm monorepo) where people generate, fork and export design systems. TokenSeed is at `C:\Users\cappa\Desktop\Projects\tokenseed`. It will use Aurora in two ways, and both have been decided by the owner:

1. **Aurora themes TokenSeed's own UI at runtime.** The app chrome takes on the colors of the design system being edited. Gallery thumbnails also need fixed scopes, each rendering a different system side by side.
2. **TokenSeed exports Aurora themes and textures**, so a Flutter app can drop in a system made in TokenSeed. The owner wants this TokenSeed → Aurora pipeline to be solid, because the two tools are meant to work together.

TokenSeed keeps its own generator; Aurora's generator does not replace it. TokenSeed generates OKLCH ramps, display-p3, high-contrast modes and an open token tree, and maps them onto Aurora's contract when exporting. Do not grow Aurora's foundation to fit TokenSeed. If you think the pipeline needs a foundation or profile change, stop and ask the owner, because `AGENTS.md` treats that as a versioning decision.

The packages stay **private**: no npm publishing. Mirror Dart's `publish_to: none` with `"private": true`.

## What to build

Work on a branch named `feat/typescript-port`. Commit in logical steps, with Continuity docs updated at each commit as the agent contract requires, and push the branch. You are authorized to commit and push that branch. Merging into `main` is the owner's call.

### 1. `packages/aurora_ts`: the portable core (`@aurora/core`)

Port everything under `packages/aurora/lib/src` except `tooling/` (the CLI, server, installer and browser UI stay Dart-only). That covers:
- color, token, ref and values (all 13 texture value types)
- the contract, the foundation and the texture foundation
- theme and texture, including alias resolution and cycle rejection
- the runtime: registry, selection with `themeId`, `appearance` and `textureId`, theme-to-texture pairings, fallback policy, transactional changes, an async change stream, and strict and forgiving selection JSON
- contrast
- the generator, with all 9 pinned schemes
- the DTCG codec and the texture DTCG codec
- the recipe and the texture recipe

Rules for the port:
- **The spec fixtures are the acceptance test.** TypeScript tests must consume every file in `spec/fixtures/` unchanged, the same way the Dart tests do (`portable_test.dart`, `generation_portable_test.dart`, `scheme_portable_test.dart`, `texture_portable_test.dart`). Never edit or regenerate an expected fixture to make TypeScript pass. A mismatch is a port bug, or a finding to report.
- **Generated accessors** come from `tools/generate_foundation.py`. Add a TypeScript output target next to the Dart one, so one table still owns the foundation. Do not hand-write foundation accessors.
- **Generator parity is the main risk.** `spec/generation-v1.md` pins `aurora-*-v1-mcu-0.11.1`. First check whether npm `@material/material-color-utilities` reproduces `generation-v1.json` and `generation-schemes-v1.json` byte for byte at 8 bits; its version numbers do not correspond to Dart's. If any scheme diverges, port the needed parts of Dart MCU 0.11.1 into the package. It is Apache-2.0, so keep the notice. Do not ship a generator that fails the fixtures.
- **Keep the core framework-free and side-effect-free**: no DOM, React or Node APIs. Use idiomatic TypeScript naming but keep token paths, values, validation results and selection behavior as `spec/README.md` defines them. Error messages may differ from Dart; error categories may not.
- **Tooling:**
  - a pnpm workspace at the repo root
  - TypeScript strict mode
  - ESM
  - Vitest
  - a Node LTS
  
  Extend `tools/check.ps1` so it also installs, typechecks and tests the TypeScript packages. `check.ps1` must still exit 0 overall.

  On the owner's PC, pnpm is only reachable as `corepack pnpm`; a bare `pnpm` fails, and `corepack enable` hits EPERM. So `check.ps1` must invoke `corepack pnpm`, and package scripts must not shell out to bare `pnpm`.

### 2. `packages/aurora_react`: the React adapter (`@aurora/react`)

This is the web counterpart of `aurora_flutter`'s controller, scope and engine. It does not include the Material bridge. It needs:
- **A controller** that owns or borrows an `AuroraRuntime`, matching the ownership rules in `AGENTS.md`.
- **`AuroraProvider`**, built on `useSyncExternalStore`, which re-renders on accepted changes only. System appearance comes from `matchMedia('(prefers-color-scheme: dark)')` and follows live changes.
- **Hooks:** `useAuroraTokens()`, `useAuroraTexture()`, `useAuroraController()`, and a typed read for app-extension tokens.
- **A controller-free fixed scope** that renders a subtree with a given theme, appearance and texture. TokenSeed nests dozens of these for thumbnails, so they must be cheap.
- **A CSS custom-property emitter.** This is the web stand-in for the Material bridge.
  - It turns a resolved variant plus texture into CSS variables on an element or a `:root`/selector string.
  - The naming must be documented and stable, for example `--aurora-colors-primary`.
  - It needs a prefix option, and a pure function that returns the declarations as a string or object, so it can also run outside React.
  - Texture value types map to CSS: dimensions keep their units; durations, cubic-bezier easing, font families and weights, borders and shadows all become CSS values. Theme color references inside textures resolve against the active variant.
- **Live theming without thrash.** TokenSeed's chrome follows a system the user is editing, so a provider or fixed scope can get a new variant on every slider frame. That path must write CSS variables to its element imperatively. It must not re-render the subtree, and it must not rewrite variables whose values didn't change. Add a test that proves both.
- **`react` ^19 as a peer dependency**, not a dependency.
- **Tests** with Vitest and Testing Library on jsdom. Cover selection changes, system appearance changes, rejected selections leaving the UI unchanged, nested fixed scopes, and emitter output for both appearances and every texture type.

### 3. A TypeScript target for app-owned vendoring

Aurora's distribution decision (2026-10-01) is that unpublished packages ship as committed, app-owned snapshots created by `tools/vendor.py`. TokenSeed will consume `@aurora/core` and `@aurora/react` the same way, so CI works without a sibling checkout and nothing goes to npm.
- Extend `vendor.py` with a TypeScript mode. It should export both packages, either as built ESM plus `.d.ts` or as source that TokenSeed builds; pick one and document why. The default destination is `<app>/vendor/aurora/`.
- It must record the same provenance and safety guarantees as the Dart mode: revision, dirty state, versions and SHA-256, plus refusing to overwrite modified snapshots.
- The packages must resolve through a pnpm `file:` or `link:` dependency from the app.
- Test it against a scratch pnpm app outside the Aurora checkout. Do not edit the TokenSeed repo. The TokenSeed side will run the export.

### 4. The TokenSeed → Aurora pipeline: a portable bundle

Today, Flutter apps receive themes through `aurora generate --project`, which installs `lib/aurora_themes/<theme-id>/` containing `theme.dart`, `theme.json`, `recipe.json` and the variant token files. TokenSeed needs an equivalent that an outside tool can produce, carrying a theme **and** its texture. Make that a specified, tested interchange format:
- **Specify it.** Write `spec/bundle-v1.md` for a portable Aurora bundle. It is a folder or single JSON file holding:
  - a manifest: bundle version, theme id and name, which variants are included, the texture id, the suggested theme-to-texture pairing, and provenance (`generator` such as `tokenseed@x.y`, a source hash, created-at)
  - `light.tokens.json` and/or `dark.tokens.json`, under the existing DTCG color profile
  - `texture.tokens.json`, under the texture profile
  
  Reuse the existing profiles and keep the bundle foundation-only by default. App extensions remain the receiving app's job, and missing required extensions must still fail validation. Write down how a producer should handle what Aurora cannot hold, without changing Aurora:
  - wide-gamut colors are converted to sRGB and quantized to 8 bits
  - extra modes such as high contrast are dropped
  - extra tokens are ignored
- **Validate in both languages.** Add bundle decode and validate functions to `@aurora/core` and to the Dart core. Both must report every issue, as contract validation already does. TokenSeed will run the TypeScript validator in its own tests on every export, so the two languages must agree on what is valid.
- **Fixtures.** Add a valid bundle fixture and a cases file in the `variant-cases.json` style under `spec/fixtures/`. Both test suites consume them.
- **Installing in Flutter.** Add a way to install an externally produced bundle into a Flutter project, for example `aurora install --bundle <path> --project <app>`. It reuses the existing safe installer: no overwrites, prepared folders, and a registration snippet. It must also register the texture and pairing. A TokenSeed export should be one command away from a running Flutter app.
- **Write a mapping guide** in Continuity for producers: which of the 58 color roles and 29 texture tokens a producer must supply, what each means, and which contrast pairs are diagnosed. TokenSeed's exporter will be written from this guide. Aurora's side ends at the spec, the validators, the fixtures and the installer.

## Done means

- `tools/check.ps1` exits 0. It covers the Dart tests (all existing ones still passing unchanged), Flutter tests, and the TypeScript typecheck and tests.
- Every `spec/fixtures` file passes in TypeScript unchanged, including the generator and scheme fixtures.
- The React adapter tests pass, and the vendor TypeScript mode has been checked against a scratch app.
- The bundle spec, fixtures, validators in both languages and the Flutter install path exist and are tested.
- Continuity is up to date (status, map, architecture, setup and usage). That includes a short "consuming from TypeScript" guide next to `AGENT_ONBOARDING.md`, or inside it, which is what TokenSeed's agent will read.
- The branch is pushed.

When you finish, or if you get blocked, report what passed, what didn't, and anything that needs the owner's decision. Stop and ask before any foundation or profile change, before editing an existing expected fixture, and before merging into `main`.

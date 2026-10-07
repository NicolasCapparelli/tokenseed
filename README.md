# TokenSeed

Grow complete, portable design systems from a few inputs.

Current project status and remaining work: [continuity/README.md](continuity/README.md).

TokenSeed generates design systems (tokens, guidelines and component recipes) from a **seed**: a small
file of inputs you can edit, regenerate, diff and fork. Systems are stored in the
[W3C Design Tokens (DTCG) 2025.10](https://www.designtokens.org/) format and export to CSS variables,
Tailwind v4, a `DESIGN.md` written for AI agents, and Aurora bundles that a Flutter app installs with one command.

Three ways in, switchable at any time:

- **Sprout**: give it a color and a vibe, get a full system, then pick from generated options.
- **Grow**: step through each part with suggestions and options per group.
- **Craft**: every knob and token, by hand.

## Layout

```
packages/core   framework-free TypeScript engine: knobs, traits, presets, seed resolution,
                generators, variations, exporters
packages/aurora bridge to Aurora (@tokenseed/aurora): maps a generated system onto Aurora's
                foundation contracts and exports Aurora bundles
apps/web        React + Vite editor; its chrome is themed by Aurora from the system being edited
vendor/aurora   vendored snapshot of @aurora/core and @aurora/react (do not edit)
docs/research   the design research behind the product
docs/knobs.md   every knob, trait and preset (generated from the catalog)
docs/design-brief.md   what the app is and does, written for UI mockups
```

## Develop

```sh
pnpm install
pnpm dev         # web app on http://localhost:5173
pnpm test        # core, aurora bridge and web tests
pnpm typecheck
```

## How generation works

1. A **seed** holds the user's choices: knob values, trait positions (personality sliders), style presets,
   locks and a random seed.
2. **Resolution** layers values, lowest first: knob defaults, the product-type preset, style presets,
   traits, explicit knobs. Every value remembers where it came from.
3. **Generators** (palette, semantic color, data viz, typography, spacing, layout, shape, elevation,
   motion, states, media, recipes, content) run
   in dependency order and write DTCG tokens, each tagged with the generator and knobs that produced it.
4. **Exporters** turn the result into files.

Knobs, traits, presets and generators are all registered data in `packages/core/src/knobs` and
`packages/core/src/generators`. The editor builds its controls from the knob definitions, so adding
a knob means adding one definition.

After changing knobs, traits or presets, regenerate the catalog doc with `UPDATE_DOCS=1 pnpm -r test`
(PowerShell: `$env:UPDATE_DOCS=1; pnpm -r test`).

## Systems are repositories

Each system is a repository of snapshots, like git (`packages/core/src/repo.ts`): save a snapshot of the
current seed, branch to experiment, tag releases, compare any snapshot with the current state (inputs and
resulting tokens), restore old versions, and fork a whole system with its history. Snapshot ids are content
hashes. The web app keeps a library of repositories in IndexedDB and moves them between browsers as
`.tokenseed` files.

## Aurora

[Aurora](https://github.com/NicolasCapparelli/aurora) is the owner's private theming library. TokenSeed
uses it two ways and keeps its own generator:

- **The app wears the system.** The editor chrome sits in an `AuroraFixedScope` whose `update()` handle
  receives the edited system's Aurora variant on every change, so only the changed `--aurora-*` CSS
  variables are rewritten and the chrome does not re-render. Library cards each have their own fixed scope.
  The specimen keeps using the system's own `--ts-*` variables.
- **Aurora (Flutter) export.** `exportAuroraBundle(system)` writes a single-file bundle
  (`<id>.aurora.json`). In a Flutter app with a vendored `aurora_flutter`:
  `dart run aurora install --bundle <file> --project .`

The mapping (`packages/aurora/src/roles.ts`, `texture.ts`) follows Aurora's producer guide: TokenSeed's
semantic colours fill Aurora's 58 colour roles, and roles TokenSeed has no token for (fixed accents,
tertiary, inverse primary) are derived from its ramps. Display-p3 colours are converted to sRGB and clipped
to 8 bits. High-contrast modes and extra tokens are left out, because Aurora holds light and dark only
and its profiles reject undeclared tokens. The texture carries type, corner shapes and motion. Tests validate
every preset's bundle with `AuroraBundle.validate`. `@tokenseed/core` stays framework-free and does not
import Aurora.

To update the snapshot, run this from a clean Aurora checkout, then reinstall:

```sh
python <aurora>/tools/vendor.py --typescript --project <tokenseed> --replace
```

Only one `@aurora/core` may resolve in the workspace, because Aurora checks token membership by identity.

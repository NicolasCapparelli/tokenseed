# TokenSeed

Grow complete, portable design systems from a few inputs.

TokenSeed generates design systems (tokens, guidelines and component recipes) from a **seed**: a small
file of inputs you can edit, regenerate, diff and fork. Systems are stored in the
[W3C Design Tokens (DTCG) 2025.10](https://www.designtokens.org/) format and export to CSS variables,
Tailwind v4, and a `DESIGN.md` written for AI agents.

Three ways in, switchable at any time:

- **Sprout**: give it a color and a vibe, get a full system, then pick from generated options.
- **Grow**: step through each part with suggestions and options per group.
- **Craft**: every knob and token, by hand.

## Layout

```
packages/core   framework-free TypeScript engine: knobs, traits, presets, seed resolution,
                generators, variations, exporters
apps/web        React + Vite editor
docs/research   the design research behind the product
docs/knobs.md   every knob, trait and preset (generated from the catalog)
docs/design-brief.md   what the app is and does, written for UI mockups
```

## Develop

```sh
pnpm install
pnpm dev         # web app on http://localhost:5173
pnpm test        # core tests
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

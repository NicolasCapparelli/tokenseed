# TokenSeed research, round 1

Working notes for the back-and-forth. Nothing here is decided; my leanings are marked **Lean:** and open questions are marked **Q:**.

---

## 1. What a design system actually is

A design system is the single source of truth for how a product looks and behaves, made of layers that build on each other:

| Layer | What it is | Example |
|---|---|---|
| **Foundations / principles** | The intent: brand voice, accessibility targets, density, motion personality | "Bold, confident, one hero per screen" |
| **Design tokens** | Named, typed values for every visual decision | `color.surface.hero = oklch(...)` |
| **Components** | Reusable UI pieces built only from tokens, with variants and states | Button: primary/secondary × default/hover/disabled |
| **Patterns** | Compositions of components that solve a recurring problem | Hero card, empty state, onboarding flow |
| **Guidelines / docs** | Do/don't rules, usage notes, content style | "Never put two primary buttons in one hero" |
| **Governance** | Versioning, changelog, who can change what, how forks flow back | semver, release notes |

Tokens are the part everyone agrees is machine-readable and standardizable. Components and guidelines are where systems differ wildly. **Lean:** TokenSeed v1 owns tokens + foundations + guidelines fully, and describes components as *token recipes + rules* (anatomy, variants, states, which tokens each part uses), not as framework code.

## 2. The professional standard

### The spec: W3C Design Tokens Community Group (DTCG), 2025.10
The first stable version shipped 28 Oct 2025 and is now the format Figma, Style Dictionary, Tokens Studio, Terrazzo, Penpot etc. converge on. It is two modules:

- **Format Module**: the JSON shape of tokens. Each token is `{ "$value", "$type", "$description", "$extensions", "$deprecated" }`, grouped in nested objects, with aliases written as `"{color.blue.500}"`. Groups can inherit `$type`.
- **Resolver Module**: how token *sets* combine with *modifiers* (light/dark, brand, density, platform) into a final resolved set. This is exactly the "variants within a system" requirement.

**Lean:** make DTCG 2025.10 our native storage format, not just an export. Portability, forking and AI-friendliness then come mostly for free, and every other format is a projection of it.

### Token types the spec defines (the tool must support all of these)
Primitive types: `color` (with explicit color space, e.g. sRGB, Display P3, OKLCH), `dimension` (px/rem), `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number`.
Composite types: `typography`, `shadow` (incl. layered), `border`, `strokeStyle`, `transition`, `gradient`.

### The three-tier token architecture (industry consensus: Material 3, Salesforce, Adobe Spectrum, Atlassian)
1. **Primitive / reference**: the raw palette and scales. `blue.500`, `space.4`, `font.size.300`. No meaning, just options.
2. **Semantic / system**: meaning, aliased to primitives. `color.text.primary`, `color.surface.raised`, `space.inset.md`. **Themes and modes swap here.**
3. **Component**: per-component decisions aliased to semantics. `button.primary.background`. Optional; lots of systems skip or limit this tier.

### Full inventory of what a complete system keeps
Grouped by category so we can check coverage in the tool:

- **Color**: brand palettes (tonal ramps, ~10–13 steps each), neutrals, status (success/warning/danger/info), semantic roles (background, surface levels, on-surface text, border, focus ring, overlay/scrim, disabled, inverse), interaction states (hover/pressed/selected as overlays or shifts), data-viz palettes (categorical, sequential, diverging). Light + dark at minimum. Contrast pairs are part of the contract.
- **Typography**: font families (+ fallbacks), weights, a type scale (size/line-height/letter-spacing), and composite *roles* (display, headline, title, body, label, code) in L/M/S. Responsive steps optional.
- **Spacing**: a base unit (4 or 8) and scale; semantic insets/gaps/stack spacing.
- **Sizing**: icon sizes, touch-target minimum, control heights, container/max widths.
- **Shape**: radius scale and semantic radius (control, card, sheet, pill).
- **Elevation**: shadow levels, plus z-index layers (base, dropdown, sticky, modal, toast, tooltip).
- **Border**: widths, styles, semantic borders.
- **Motion**: durations, easing curves, composite transitions, reduced-motion behavior.
- **Opacity**: disabled, scrim, state layers.
- **Layout**: breakpoints, grid columns, gutters, margins.
- **Iconography**: set/style, stroke width, sizes (assets themselves are out of scope for tokens).
- **Metadata**: name, version, author, license, description, origin (fork-of), changelog.
- **Guidelines** (prose, but structured): principles, do/don't per token group and component, accessibility targets (e.g. WCAG AA 4.5:1 body text).

**Q:** Do we want data-viz palettes and layout grids in v1, or start with color/type/space/shape/elevation/motion and add the rest?

## 3. Variants, forking, portability

- **Variants inside a system** map onto the DTCG Resolver: one base token set + modifiers. Typical modifier axes: *theme* (light/dark/high-contrast), *brand* (sub-brands), *density* (comfortable/compact), *platform* (web/iOS/Android). A user picks a value per axis and gets a resolved system.
- **Copy / fork / modify in place**: if a system is a folder (or zip) of DTCG JSON + a manifest, then copy is trivial. A fork records `forkedFrom: { id, version }`. The neat extra: a fork can store only **overrides** on top of its parent, so it can pull upstream updates later (like git rebase for tokens). **Q:** do you want "live" forks that can pull upstream changes, or simple snapshot copies? Snapshot is far simpler; live forks are the differentiator.
- **History**: every edit is a change to JSON, so versioning can be as simple as snapshots with semver, or as rich as storing systems in git. **Lean:** content-addressed snapshots in our own store first; git sync as an export later.

## 4. Exports (and what "AI-friendly" means)

| Export | For |
|---|---|
| DTCG JSON (resolved per mode, and unresolved with aliases) | Any tool, Style Dictionary, Figma import |
| CSS custom properties (+ `[data-theme]` / `prefers-color-scheme` blocks) | Web, any framework |
| Tailwind v4 `@theme` block | Tailwind users |
| SCSS / JS-TS constants | Older stacks, typed access |
| Swift / Kotlin / Compose (via Style Dictionary) | Native apps, later |
| Figma Variables JSON | Designers |
| **DESIGN.md** (structured markdown: principles, tokens table, component rules, do/don't) | Dropping into an AI agent's context. Atlassian and others are already shipping this convention |
| **llms.txt-style index + per-section files** | Agents fetching only what they need |
| **MCP server** (tools like `get_tokens`, `get_component_rules`, `check_contrast`, `lint_css`) | Agents querying the system live instead of reading a dump |

What makes an export AI-friendly, in practice: semantic names over raw values, every token carries a `$description` saying *when to use it*, explicit do/don't rules, small resolved files per mode (agents get confused by alias chains), and a stable URL per version.

**Lean:** v1 exports = DTCG JSON, CSS vars, Tailwind, DESIGN.md. MCP server comes once sharing exists, since it needs a hosted URL.

## 5. Framework

Requirements that drive it: a heavy client-side editor (color pickers, live previews, instant resolve on every edit), JSON as the core data, and later accounts + sharing + a public URL per system.

| Option | Pros | Cons |
|---|---|---|
| **SvelteKit** | Small and fast, great for reactive editors, simple mental model | Smaller ecosystem than React |
| **Next.js (React)** | Biggest ecosystem (Radix, shadcn, color libs), easiest hiring/AI codegen | Heavier, App Router complexity |
| **React + Vite SPA, backend later** | Fastest to start, purely local while personal testing | Need to add server pieces for sharing later |

Supporting pieces regardless of framework: **Style Dictionary v4/v5** or **Terrazzo** for export transforms (both DTCG-native), **culori** for OKLCH color math and ramp generation, **Zod** schemas for the DTCG shape. Storage during personal testing: local files / IndexedDB. Later: Postgres (or SQLite/Turso) with systems stored as JSON documents, plus auth (e.g. Supabase or Better Auth).

**Lean:** React + Vite + TypeScript as a local-first SPA now, with the core (schema, resolver, exporters) as a framework-free TS package so it can also power a CLI and the MCP server later. Move to a full-stack setup when sharing arrives. If you'd rather start full-stack from day one, Next.js.

**Q:** Any framework you already like or want to learn? That should weigh heavily.

---

## Questions for you (short answers are fine)

1. **Scope of a "system"**: tokens + guidelines + component *recipes*, or should we also generate actual component code?
2. **Native format**: OK to make DTCG JSON the source of truth? (I recommend yes.)
3. **Forks**: snapshot copies (simple) or live forks that can pull upstream changes (recommended long-term, can come later)?
4. **Generation**: should the tool *generate* a system from a few inputs (brand color, font, base unit, personality) with AI help, or start as a manual editor?
5. **Framework**: React+Vite SPA (recommended), Next.js, SvelteKit, or something you prefer?

Sources: [DTCG Format Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/), [DTCG Resolver Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/), [Design Tokens CG](https://w3.org/community/design-tokens), [Atlassian on DESIGN.md](https://www.atlassian.com/blog/how-we-build/atlassians-design-md-is-here-what-we-learned-testing-portable-design-context-in-practice).

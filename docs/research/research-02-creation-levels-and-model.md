# TokenSeed research, round 2

Builds on [round 1](research-01-what-a-design-system-is.md). Decided so far: scope is tokens + guidelines + component recipes; snapshots, git-like; three creation levels with the non-expert developer as the main user; framework is my call.

---

## 1. Framework: decided

**React 19 + Vite + TypeScript**, as a pnpm monorepo:

```
packages/core     framework-free TS: DTCG schema (Zod), resolver, generators, exporters, diff
apps/web          React + Vite editor
(later) packages/cli, packages/mcp   reuse core unchanged
```

Why this over Svelte/Solid (which are lighter): the editor needs color pickers, drag-and-drop, virtualized token lists, command palette, and accessible primitives, and React has mature options for all of them. It is also the stack AI coding tools write best, which matters for how we'll build it. "Light" comes from keeping the heavy logic in `core` and the UI thin, not from the framework choice.

Supporting picks: **Zustand** for editor state (simple, fast), **TanStack Router** (typed, light), **Radix primitives** for accessible widgets, **culori** for OKLCH color math, **Style Dictionary** or our own exporters in `core` for outputs. Storage while you test: IndexedDB in the browser plus import/export of a folder/zip. Server and accounts come with sharing.

## 2. Design systems as git repositories

| Git | TokenSeed |
|---|---|
| Repository | A design system |
| Commit | A snapshot: full DTCG files + manifest, content-hashed, with a message |
| Tag | A released version (`v1.2.0`) that exports and share links point at |
| Branch | An experiment ("try warmer neutrals") you can merge or throw away |
| Fork | Copy of a repo at a tag, recording `forkedFrom: {id, version}` |
| Diff | Token-level: "`color.surface.hero` changed from X to Y", plus visual before/after |

Important distinction: **branches are not variants.** Variants (light/dark, compact, sub-brand) live *inside* every snapshot as resolver modifiers. Branches are alternate histories of the whole system.

Snapshots-only forks keep v1 simple, but because we store the fork point, "pull changes from upstream" can be added later as a token-level merge without migrating data.

**Lean:** our own small snapshot store (not real git) for v1, with the on-disk layout chosen so a system folder can be committed to a real git repo as-is. "Export as git repo" then costs nothing.

## 3. The three creation levels

The key design idea: **the three levels are entry points into the same system, not three separate tools.** They all produce identical DTCG output, and the level can be changed **per section** at any time. You might use *Make it for me* to get a full system, then open Color in *Assisted* to adjust the ramps, then drop into *Manual* to hand-tune one token. That covers "different levels of handholding throughout the process."

### Level 3: Make it for me
Inputs (only the first is required):
- 1–3 brand colors (or pick from a logo/screenshot)
- 1–2 fonts (or "choose for me" from a curated list)
- Personality: a few sliders or keywords, e.g. *calm ↔ bold*, *rounded ↔ sharp*, *airy ↔ dense*, *playful ↔ serious*
- Optional: reference screenshots (this is where BoldHero would come in)

Output: a complete system with every round-1 category filled, light + dark modes, and guidelines written in plain language. Then a review screen showing specimen UI with "this looks off" buttons per area that open that section in Assisted mode.

### Level 2: Assisted
A guided path through each category, in order: Color → Type → Spacing → Shape → Elevation → Motion → Components. Each step:
- explains the concept in two sentences ("A spacing scale keeps gaps consistent...")
- offers 2–4 visual choices instead of number fields (three type scales rendered as real headlines)
- shows a recommended default and why
- warns live (contrast failures, ramps with uneven steps, too many font weights)
- previews on specimen screens as you go

### Level 1: Manual
A token tree editor: groups, tokens, aliases, types, modes as columns (like Figma Variables), plus a raw JSON view. Validation and contrast checks still run, they just don't interrupt.

### What powers generation
Most of it should be **deterministic algorithms in `core`**, not AI: OKLCH tonal ramps from a seed color, contrast-solving for text/surface pairs, modular type scales, spacing scales from a base unit, dark mode derived from the light palette. That's fast, free, offline, and repeatable. An **LLM layer** (Claude) is optional on top, for interpreting personality and screenshots into parameters, and for writing guidelines and token descriptions.

## 4. Specimen previews
All three levels need something to look at. **Lean:** a fixed set of specimen screens rendered purely from the tokens: a dashboard, a form, a marketing hero, a settings list, a mobile card, and a type/color sheet. Component recipes (button, input, card...) render there too, so the recipes double as the preview.

---

## Questions for round 3
1. **AI dependency**: deterministic generation first with Claude as an optional layer (recommended), or AI-driven from the start?
2. **Personality inputs**: sliders (recommended, predictable), free-text description, or both?
3. **Starter component recipes**: which ones? My default list is button, input, select, checkbox/radio/switch, card, badge, alert, dialog, tabs, list item, nav bar.
4. **Name for the levels**: keep "Manual / Assisted / Make it for me", or something friendlier?

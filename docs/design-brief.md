# TokenSeed: brief for UI mockups

This document describes TokenSeed completely enough for a UI designer (human or AI) to produce high-fidelity mockups of every screen without seeing the code. The current prototype works but its interface is a functional placeholder; treat it as a list of features, not a visual reference. Everything in this brief is either built already or decided; the few open questions are marked as such.

The companion file [knobs.md](knobs.md) lists all 172 inputs ("knobs"), 12 personality traits and 12 presets with their exact labels, options and defaults. Use it for real copy in the mockups instead of lorem ipsum.

---

## 1. What TokenSeed is, in one paragraph

TokenSeed is a web app for creating, editing, versioning, forking and exporting **design systems**. A design system here means the full set of design decisions a product team needs: color palettes and color roles for light, dark and high-contrast modes, typography, spacing, sizing, layout grid, corner radii, borders, shadows, motion, interaction states, icon and image rules, recipes for common components (button, input, card, tabs, dialog…), content and accessibility guidelines. These are stored as **design tokens** in the W3C DTCG standard format and exported as CSS variables, a Tailwind theme, DTCG JSON, and a DESIGN.md file written for AI coding agents. The user does not draw anything: they answer questions, move sliders and pick from generated options, and the engine computes several hundred consistent, accessibility-checked tokens.

## 2. Who it's for

- **Primary user: developers who know a little design.** They can tell what looks good but can't build a type scale or a contrast-safe palette from scratch. They want a coherent system fast and want to understand why each value is what it is.
- **Secondary user: designers and design engineers** who want fine control over every value and a clean, standards-based export.
- **Third audience: AI agents.** Exports are designed so an agent building UI can read them. This affects export screens, not the main UI.

The interface must never assume design vocabulary. Every control has a plain-language label and one-line help text (already written; see knobs.md). Jargon such as "chroma", "OKLCH" or "APCA" appears only in Craft level and always with an explanation.

## 3. Core concepts the UI must make visible

1. **Seed.** Everything the user chose (knob values, trait positions, presets, locks) is a small "seed". Tokens are always regenerated from it, so the same seed always gives the same system. The user never edits tokens directly; they edit the seed. Users don't need the word "seed" except in Craft, where a raw seed editor exists.
2. **Knobs.** 172 inputs grouped into 18 groups (Identity, Color, Neutrals, Semantic color, Accessibility, Dark mode, Data viz, Typography, Spacing, Layout, Shape, Border, Elevation, States, Motion, Icons & imagery, Components, Content). Each knob has a type, which decides its control:
   - choice (2 to 9 options): segmented control when 4 or fewer, dropdown otherwise; some are flagged "visual choice" and should show small pictures of each option (corner style, shadow style, button style, nav pattern, tab indicator, harmony, density, dark mode style…)
   - number: slider with live value and unit (px, em, °, ×, ms)
   - on/off toggle
   - color, with an "empty = let the engine choose" state
   - list of up to 3 colors
   - font family, with an "empty = choose for me" state
   - free text
   - multi-select from a fixed list (only "Component recipes" today)
3. **Where a value came from (provenance).** Every knob shows its source: "default", "from SaaS / dashboard" (product preset), "from BoldHero" (style preset), "from Calm ↔ Bold" (trait), or "you set this". A reset action returns a user-set knob to whatever the layers below say. This label is important for trust and learning; give it a consistent, quiet treatment (a small tag or caption, maybe color-coded by source type).
4. **Locks.** Any explorable knob can be locked so "pick the one you like" and Shuffle never change it. Needs a small lock toggle per knob.
5. **Dependent knobs.** Some knobs only appear when another has a certain value (for example spring stiffness only when easing is "Springy", fluid type range only when fluid type is on, dark mode knobs only when dark mode is generated). Show and hide these smoothly.
6. **Personality traits.** 12 sliders between two words: Calm↔Bold, Rounded↔Sharp, Airy↔Dense, Playful↔Serious, Minimal↔Rich, Cool↔Warm, Classic↔Modern, Soft↔Crisp, Quiet↔Loud, Organic↔Geometric, Light↔Heavy, Flat↔Dimensional. A trait is either **untouched** ("open": the generator may explore it) or **set**. That two-state nature needs a clear visual: an untouched slider looks dormant or dashed, with a "clear" action once set.
7. **Presets.**
   - 7 product presets, chosen implicitly through "What are you building?": SaaS, Marketing, Mobile, Editorial, Commerce, Developer tool, Internal tool.
   - 5 style presets that stack in order: BoldHero, Editorial, Brutalist, Soft & friendly, Precise. They work as toggle chips, and stacking order matters.
8. **Pick the one you like.** In Sprout and Grow, the app always shows a grid of about 4 generated alternatives, each a live mini preview. Clicking one adopts it. A Shuffle button regenerates them. Alternatives explore only what the user left open. In Grow, each knob group has a "Show options" action that limits the alternatives to that group (for example, 4 typography alternatives). When everything is decided or locked, the grid is replaced by a short message explaining why there's nothing to suggest.
9. **Modes.** A system can generate light, dark, or both, and optionally high-contrast variants (light-hc, dark-hc). The preview can switch between them.
10. **Accessibility checks.** The engine checks around 40 to 60 foreground/background pairs per system against the chosen target (WCAG AA 4.5:1, WCAG AAA 7:1, APCA Lc 60 or APCA Lc 75). The preview header shows "All 40 contrast checks pass" or "3 contrast issues". Issues should be expandable to show the pair, the measured value and the requirement. The engine is built to pass, so failures are rare; design the failure state anyway.
11. **Repositories, like git.** Each design system is a repository:
    - **snapshot**: a saved version with a message, like a commit
    - **branch**: a parallel line of experiments; `main` by default
    - **tag**: a named release such as "v1.0"
    - **fork**: a copy of the whole system, history included, that remembers its origin
    - **working changes**: edits since the last snapshot ("3 unsaved changes"); autosaved locally so nothing is lost, but not a snapshot until the user saves one
    - **compare**: what changed between a snapshot and now, both as inputs ("Corner style: Soft → Sharp") and as resulting tokens ("radius.md: 8px → 2px", with color swatches)
    - **restore**: bring an old snapshot back as working changes
    - **view**: look at an old snapshot read-only (detached), then return to a branch
12. **Library.** All systems on this device, each with a live mini preview, name, snapshot and branch counts, "forked from X", last edited. Actions: open, fork, export (.tokenseed file), delete, import, new system.
13. **Exports.**
    - CSS custom properties: `--ts-*`, with light/dark/high-contrast via `[data-theme]` and the matching media queries, Display P3 colors with sRGB fallback, fluid `clamp()` type
    - Tailwind v4 theme
    - DTCG JSON folder: base, per-mode and resolved files, a resolver file, the seed and a manifest
    - DESIGN.md for AI agents
    - the whole repository as a `.tokenseed` file
    
    Each format has Copy and Download, and the DTCG view has a file picker.

## 4. The three levels

The top of the app offers three entry points into the **same** system. Switching level never loses work; the levels only change how much is shown. Names and subtitles are final:

| Level | Subtitle | What's shown |
| --- | --- | --- |
| **Sprout** | Give us a color and a vibe, get a full system | Only the required essentials (name, what are you building, light/dark, brand color, optional heading and body fonts), style preset chips, the 12 personality sliders, the options grid, the preview and export. Designed to finish in under a minute. |
| **Grow** | Step through each part with suggestions | The knob groups as collapsible sections with the common knobs (about 50), each group with "Show options". Options grid on top, preview below. This is the guided, teach-as-you-go mode and should feel like a friendly step-by-step, not a settings dump. |
| **Craft** | Every knob and token, by hand | All 172 knobs, a full token table (path, type, light/dark/base set, value with swatch, which generator made it, its description), and the raw seed editor. No options grid. Dense, precise, keyboard-friendly. |

**Design opportunity in Grow.** Today Grow is a long sidebar of sections. A better pattern is probably a stepper or wizard: one group per step with its options grid filling the main area, a progress indicator across the 18 groups (or a shorter curated path such as Brand → Color → Type → Space & shape → Depth & motion → Components → Content → Review), and Skip, Back and Next. Mock both the sidebar and the stepper, and recommend one.

## 5. Screens to mock

Please produce these, desktop at 1440 wide unless noted, each in the app's own light and dark themes where it matters.

### 5.1 First run / empty library
A welcoming start: name your system, pick a brand color (big, tactile color picker plus a few suggested swatches), choose what you're building (7 cards with small illustrations), and go. Offer "Import a .tokenseed file" as a secondary path. Within one screen, the user sees their first generated system.

### 5.2 Editor, Sprout level
- Top bar:
  - app logo and wordmark
  - repository button showing the system name, current branch, and an unsaved-changes indicator; it opens the library
  - level switcher (Sprout / Grow / Craft with subtitles)
  - preview mode switch (light / dark, plus a high-contrast toggle when the system has hc modes)
  - History button with a dot when there are unsaved changes
- Left column: Essentials, Style presets (chips), Personality (12 two-ended sliders, each open or set).
- Main area: "Pick the one you like" grid of 4 live previews with Shuffle, then the big Preview with the contrast status pill, then Export.

### 5.3 Editor, Grow level
Same frame as Sprout. Show one group expanded (Typography is the richest: fonts, style, pairing, base size, scale ratio, heading weight, line heights, tracking, case, numerals, link underline…) with its "Show options" grid active: "Options for Typography". Show provenance labels and lock toggles on several knobs, a knob in "you set this" state with reset, and a visual-choice control (for example Corner style with four little shape thumbnails).

### 5.4 Editor, Craft level
All groups collapsible. One group open showing every kind of control. The token table below the preview: sticky header, filter/search box (to add), color swatches, alias values shown as `{color.primary.default}` links that jump to the target, grouped by tier (palette, semantic, component). The raw seed editor (JSON textarea with Apply).

### 5.5 History panel (right side drawer, any level)
- Branch selector, New branch.
- "Save snapshot" box:
  - count of unsaved changes
  - list of the changes in plain language ("Preset Brutalist added", "Corner style: Soft → Sharp")
  - message field, primary Save button, and Discard
- Timeline of snapshots, newest first:
  - message, short id, time, engine version
  - branch and tag badges; the current one is highlighted
  - row actions: Compare, View, Restore, Tag, Branch from here
- "Forked from X at abc1234" footnote.
- A **compare** state: inputs that changed, then tokens that changed. Each token row has its path, a mode tag when the change differs per mode, and before → after values with swatches. It can be long (170+ rows), so it needs grouping or filtering.

Open design question: should compare also offer a side-by-side visual (two previews, before and after)? That would be very valuable. Please mock it.

### 5.6 Viewing an old snapshot
The editor in read-only "viewing a snapshot" state, with a clear banner: "You're looking at ‘Try BoldHero’ from 2 hours ago. Restore it, branch from it, or go back to main."

### 5.7 Library
Grid of system cards, each with a live mini preview rendered in that system's own tokens (so every card looks different), name, "3 snapshots · 2 branches · edited 5 min ago", "Forked from Acme" when relevant, and actions (Open, Fork, Export, Delete). Top: "Your systems", "Stored in this browser", Import, New system. Include an empty state and a card marked as currently open.

### 5.8 Export
Tabs: DESIGN.md (default), CSS, Tailwind, DTCG JSON (with file picker), and Repository (.tokenseed). Code view with syntax highlighting, Copy, Download, Download all. Consider a short "How to use this" line per format, for example "Paste DESIGN.md into your agent's context" or "Import tokens.css before your styles".

### 5.9 Settings (not built yet, decided)
- AI preference: Always use AI / Ask me first / Never use AI.
- Model selector: provider and model. Not tied to one vendor.
- API key field per provider, with the note "Stored only in this browser".
- When AI is on, an optional free-text "Describe the vibe" box appears in Sprout, and later screenshot upload. AI only maps descriptions to knob values and writes prose; it never writes tokens directly.

Mock the settings page and the Sprout essentials with the vibe box present.

### 5.10 Mobile (390 wide)
Editor in Sprout with the controls as a bottom sheet over the preview, and the library. The app must not scroll sideways on phones.

## 6. The preview ("specimen") is the hero

The preview is a small fake product screen styled **only** by the system's tokens. It is what users judge, so it should be the most prominent thing on screen. The app's own chrome should stay quiet and neutral so it never competes. Today the specimen contains:
- a hero block: overline, display title, supporting text, primary and secondary buttons
- an account card: headline, text, labeled input, helper text with a link
- a status card: success, warning, danger and info badges, an alert, a key/value list
- tabs with a table and chips
- a chart card: categorical bars, sequential and diverging ramps
- an emphasis card: the brand gradient when enabled, plus a toast

Designers may propose better specimen templates, chosen per product type: a dashboard for SaaS, a landing hero for marketing, a phone screen for mobile, an article for editorial, a product page for commerce, a terminal-ish panel for devtool. Mock at least two. BoldHero, the first preset, is inspired by Google Wallet's bold hero screens: huge type, saturated color blocks, round shapes, and the most important information as the biggest thing on screen. Use placeholder data only, never real personal data.

A compact variant of the specimen appears in option cards and library cards (hero only).

## 7. Visual direction for the app chrome

- Calm, neutral, precise; a tool for makers. Think Linear or Raycast restraint with a slightly warm, organic touch that suits the "seed / sprout / grow / craft" names. The current accent is a muted green (#2f6b4f light, #7cc4a0 dark) and the mark is a small ❋. Both can change; a proper logo is welcome.
- The generated systems bring the color. The app frame should look good next to any brand color, from neon yellow to near-black.
- Light and dark themes for the app itself.
- Plain-spoken copy in sentence case. No "Oops!", no exclamation marks in errors.
- Density: comfortable in Sprout and Grow, compact in Craft.
- Accessibility: WCAG 2.2 AA for the app itself, visible focus, all controls keyboard reachable, nothing communicated by color alone.

## 8. States and edge cases to cover

- Unsaved changes (the dot in the top bar and the History button; the count in the panel).
- Switching branch or viewing a snapshot with unsaved changes: a confirm dialog.
- Errors: "Nothing to commit", "Branch already exists", "This isn't a TokenSeed repository file". These are inline banners, not modal alerts.
- Contrast failure state in the preview header.
- Nothing left to suggest in the options grid.
- A system with only dark mode (the mode switch adapts), and a system with high-contrast modes.
- Long system names, long branch names.
- A fork's history showing "Fork of Acme" as its first snapshot.
- Loading the library (rare, fast; a skeleton is enough).

## 9. Things not in scope for mocks

Accounts, cloud sync and sharing links (decided for later: snapshots and forks are designed to sync), real component code, and Figma import.

## 10. Glossary for copy

| Term | Use in UI |
| --- | --- |
| Design system | "system" in most places |
| Knob | not shown to users; use the knob's label |
| Trait | "personality" |
| Snapshot | "snapshot" (save a snapshot, 3 snapshots) |
| Branch | "branch" (it's what it is; help text: "a separate line of experiments") |
| Tag | "release" in buttons ("Tag release"), "tag" as the badge |
| Fork | "fork" (help: "a copy that remembers where it came from") |
| Seed | "seed" only in Craft |
| Token | "token" (Craft and export) |

## 11. Deliverables requested from the designer

1. The screens in section 5 (desktop light, plus dark for the editor and library).
2. A component sheet for the app chrome: buttons, segmented control, visual-choice tiles, two-ended trait slider in open and set states, knob row (label, help, provenance, lock, reset), chips, color picker, font picker, timeline row, diff row, banner, cards.
3. A recommendation on Grow: sidebar or stepper.
4. Two or more specimen templates.

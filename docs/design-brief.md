# TokenSeed: brief for UI mockups

This document describes TokenSeed completely enough for a UI designer (human or AI) to produce high-fidelity mockups of every screen without seeing the code. The current prototype works, but its interface is a functional placeholder: treat it as a list of features, not a visual reference. Everything in this brief is either built already or decided. The few open questions are marked as such.

**Read section 0 first.** A first round of mocks made from an earlier version of this brief came back dense, dated and intimidating: a tree sidebar, tiny type, every control visible at once, and engine jargon on screen. That is exactly what TokenSeed must not look like. Section 0 sets the bar.

A clickable concept prototype shows the intended direction: [TokenSeed Studio Concept](https://claude.ai/artifact/6uZLtN4ZWqFKmgG1kUMsHc). It covers the start screen, the studio at all three depths, versions with before/after compare, export and the library. Match its spirit, then push it further. Don't copy it pixel for pixel.

The companion file [knobs.md](knobs.md) lists all 172 inputs ("knobs"), 12 personality traits and 12 presets with their exact labels, options and defaults. Use it for real copy when a screen shows settings, but most screens should show very few of them.

---

## 0. Design direction: read this first

TokenSeed is a tool for designers and developers to get inspired and make beautiful design systems. Opening it should feel like opening a great creative tool, not configuring enterprise software.

**Modern, bold, inspiring.**
- Use large, confident display type with real contrast between a big headline and calm body text.
- Use generous space and big rounded surfaces.
- Use few elements per screen, each with room to breathe.
- Motion is part of the product: when a slider moves, the whole system visibly reflows in real time.
- Touchstones for the level of craft (not things to copy): Linear, Arc, Raycast, Framer, Vercel, Apple's product pages, and Coolors for how playful generation can feel.

**The generated system is the hero.**
- The live preview of the user's system fills most of the screen.
- The app's controls float over or beside it as light, glassy panels.
- The app chrome borrows the hue of the system being made, so the tool always "wears" your system.
- Every thumbnail (options, versions, library cards) is rendered from that system's real tokens. Grey placeholders and generic icons are never acceptable stand-ins.

**Simple first, depth on demand.**
- Most people will never touch most of the 172 settings, so the first screen asks for one color and one choice.
- In the studio, the default view (Sprout) shows a handful of big personality sliders, a few style starting points, and four "pick one you like" options.
- Grow shows 8 friendly areas (Color, Typography, Shape, Space & layout, Depth, Motion & states, Components, Voice & access). Each opens to 2 to 4 visual choices (tiles showing the actual corner, font or shadow), never a form.
- "Fine-tune all 34 settings →" sits at the bottom of each area. Only Craft lists every setting, and even there they stay grouped and collapsed.
- Rule of thumb: no screen in Sprout or Grow shows more than about 12 interactive controls at once, excluding the preview itself.

**Fun to use.**
- Prefer direct manipulation: big sliders with two named ends (Calm ↔ Bold), tiles you tap, options you pick by looking.
- Use dropdowns and number fields sparingly.
- Shuffle is a toy; make it feel like one.
- Saving a version and comparing it with a before/after split slider over the live preview should feel satisfying.

**Never do this** (taken from the rejected mock):
- a file-tree or "architecture" sidebar
- 11px labels everywhere
- three columns of equal-weight controls
- numbered section headers like "01 / SYSTEM ESSENTIALS"
- status bars full of hashes, engine versions and byte counts
- invented jargon such as "entropy", "epoch", "neural engine", "pipeline state", "synthesized token variations"
- grey Windows-style form controls
- low-contrast pastel text on pastel

Technical details (hashes, engine version, token paths) live only in Craft, in Versions details, and in Export.

## 1. What TokenSeed is, in one paragraph

TokenSeed is a web app for creating, editing, versioning, forking and exporting **design systems**. A design system here means the full set of design decisions a product team needs: color palettes and color roles for light, dark and high-contrast modes, typography, spacing, sizing, layout grid, corner radii, borders, shadows, motion, interaction states, icon and image rules, recipes for common components (button, input, card, tabs, dialog…), content and accessibility guidelines. These are stored as **design tokens** in the W3C DTCG standard format and exported as CSS variables, a Tailwind theme, DTCG JSON, and a DESIGN.md file written for AI coding agents. The user does not draw anything: they answer questions, move sliders and pick from generated options, and the engine computes several hundred consistent, accessibility-checked tokens.

## 2. Who it's for

- **Primary user: developers who know a little design.** They can tell what looks good but can't build a type scale or a contrast-safe palette from scratch. They want a coherent system fast and want to understand why each value is what it is.
- **Secondary user: designers and design engineers** who want fine control over every value and a clean, standards-based export.
- **Third audience: AI agents.** Exports are designed so an agent building UI can read them. This affects export screens, not the main UI.

The interface must never assume design vocabulary. Every control has a plain-language label and one-line help text (already written; see knobs.md). Jargon such as "chroma", "OKLCH" or "APCA" appears only in Craft level and always with an explanation.

## 3. Core concepts (all reachable, most revealed only when wanted)

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

## 4. The three depths: Sprout, Grow, Craft

The studio has one switch at the top: **Sprout · Grow · Craft**. It is a depth control on the **same** system, not three different apps. Switching never loses work and the preview never moves; only the controls panel changes. Names are final, and the short subtitles shown in the switch are "just the vibe", "guided" and "every knob".

| Depth | The controls panel shows | Feels like |
| --- | --- | --- |
| **Sprout** | Five big personality sliders, with "3 more" folded away; style starting points as chips (BoldHero, Editorial, Brutalist, Soft, Precise); a "Pick one you like" strip of 4 live options with Shuffle. | Playing. Finished in under a minute. |
| **Grow** | 8 areas as cards, each with a one-line summary of its current state ("Grotesk · 750 headings", "12px corners"). Opening one shows 2 to 4 visual choice tiles and at most two sliders, with "Fine-tune all N settings →" at the bottom. Picking "Show options" in an area makes the pick strip explore just that area. | A friendly guide. One decision at a time. |
| **Craft** | The same 8 areas, each also listing every setting with a small tag saying where its value came from (you, preset, trait, default), plus a token table and the raw seed. | A precise instrument. Dense but orderly. |

**Open question for the designer:** should Grow be a stepper ("Color → Type → Shape → Space → Depth → Motion → Components → Voice → Done", with Back, Skip and Next) instead of a list of cards? Mock the stepper and recommend one.

## 5. Screens to mock

Please produce these, desktop at 1440 wide unless noted, in the app's light and dark themes.

### 5.1 Start: "Grow a whole design system from one color"
This is the first screen and the most important one.
- Left side:
  - a huge headline
  - one sentence of explanation
  - 6 tactile color orbs, plus "any color"
  - "What are you making?" as 6 large tiles: Dashboard, Website, Mobile app, Store, Publication, Dev tool
  - an optional "Describe the vibe" field, labeled when it uses AI
  - one big primary button, "Grow my system →"
- Right side: an immersive visual made from the system being created, such as its color ramp as a full-height wall with a live preview card floating over it. It updates instantly as the color or tile changes.
- A quiet secondary link, "Open a saved system".

### 5.2 Studio, Sprout depth
- **Top bar.** Logo; a pill with the system name, branch and unsaved dot, which opens the library; the Sprout · Grow · Craft switch centered; the app theme toggle; Versions; and Export as the primary button.
- **Left.** A glass panel titled "Shape the vibe".
  - Big two-ended sliders. An untouched slider looks "open" (dashed thumb, "options explore it"); a set one looks solid.
  - Style starting points as chips.
- **Center.** The preview, as large as possible.
  - Above it: template tabs (App · Landing · Mobile · Tokens), Light/Dark, and a green "All 44 contrast checks pass" pill.
  - Floating over its bottom edge: a "Pick one you like" strip of 4 live mini previews, with Shuffle and hide.

### 5.3 Studio, Grow depth
Same frame. The left panel is titled "Make it yours" and shows 8 area cards, with Typography open:
- 4 font tiles showing "Aa" in each pairing
- a "Heading weight" slider and a "Scale drama" slider
- "Fine-tune all 34 settings →"

Show one area with its "Show options" exploration active in the pick strip.

### 5.4 Studio, Craft depth
The same area cards, with an expanded area listing its settings as clean label/value rows with provenance tags and a "Show 26 more" link. Also show a "Tokens" view, either a preview template or a full-width table: grouped, searchable, with color swatches, and aliases shown as links that jump to their target. Craft may be denser, but it uses the same type, radii and spacing as everything else.

### 5.5 Versions (right drawer)
- A branch switcher as a pill segment with "+ Branch".
- A "Save version" card listing unsaved changes in plain words ("Calm ↔ Bold 0.55 → 0.70"), with a name field and a primary button.
- History as a visual timeline. Each version has a thumbnail rendered in that version's tokens, plus a name, a relative time, and branch and release badges.
- **Tapping a version turns the preview into a before/after split** with a draggable handle, labeled with the version's name and "Now". "Restore" and "Stop comparing" sit under the list.
- A token-level diff list stays available inside a version's details for Craft users, but the visual split is the default.
### 5.6 Viewing an old snapshot
The editor in read-only "viewing a snapshot" state, with a clear banner: "You're looking at ‘Try BoldHero’ from 2 hours ago. Restore it, branch from it, or go back to main."

### 5.7 Library
"Your systems" as a gallery of posters, one per system. Each poster is rendered in that system's own tokens: its hero color, its display font at a large size, and its color ramp as a strip. Under the poster go the name and one line of metadata ("6 versions · 2 branches · edited just now", "forked from Daily Press"). The gallery ends with a "+ Grow a new system" tile. Import and New system sit top right. Fork, Export and Delete live in a card's overflow menu, not as a row of buttons.

### 5.8 Export
A drawer titled "Take it with you". Four format cards, each with a one-line "what it's for":
- DESIGN.md: paste it into your AI agent's context
- CSS variables: light, dark and high contrast
- Tailwind v4
- Design tokens JSON: W3C standard, for Figma and Style Dictionary

Below the cards: a syntax-highlighted preview, Download (primary) and Copy, and "Download the whole system (.tokenseed)".

### 5.9 Settings (not built yet, decided)
- AI preference: Always use AI / Ask me first / Never use AI.
- Model selector: provider and model. Not tied to one vendor.
- API key field per provider, with the note "Stored only in this browser".
- When AI is on, an optional free-text "Describe the vibe" box appears in Sprout, and later screenshot upload. AI only maps descriptions to knob values and writes prose; it never writes tokens directly.

Mock the settings page and the Sprout essentials with the vibe box present.

### 5.10 Mobile (390 wide)
Editor in Sprout with the controls as a bottom sheet over the preview, and the library. The app must not scroll sideways on phones.

## 6. The preview ("specimen") is the hero

The preview is a small fake product screen styled **only** by the system's tokens. It is what users judge, so it should be the most prominent thing on screen. The app's chrome is bold in type and shape but never competes with it for color. Today the specimen contains:
- a hero block: overline, display title, supporting text, primary and secondary buttons
- an account card: headline, text, labeled input, helper text with a link
- a status card: success, warning, danger and info badges, an alert, a key/value list
- tabs with a table and chips
- a chart card: categorical bars, sequential and diverging ramps
- an emphasis card: the brand gradient when enabled, plus a toast

Designers may propose better specimen templates, chosen per product type: a dashboard for SaaS, a landing hero for marketing, a phone screen for mobile, an article for editorial, a product page for commerce, a terminal-ish panel for devtool. Mock at least two. BoldHero, the first preset, is inspired by Google Wallet's bold hero screens: huge type, saturated color blocks, round shapes, and the most important information as the biggest thing on screen. Use placeholder data only, never real personal data.

A compact variant of the specimen appears in option cards and library cards (hero only).

## 7. Visual direction for the app chrome

Section 0 sets the direction. Concretely:
- **Type.** A characterful display face for headlines and big numbers (the concept uses Funnel Display at 800), a clean UI sans for everything else (the concept uses Geist), and a mono for token values only. Body text is 14 to 15px; nothing in Sprout or Grow is smaller than 12px.
- **Color.** Neutrals tinted toward the current system's hue. The accent is the system's own primary color. Status colors are used only for status. It must still look good when the user picks neon yellow or near-black.
- **Surfaces.**
  - Big radii: about 22px for panels and 12px for controls.
  - Floating glass panels (blur and a soft shadow) over a softly tinted ground.
  - The preview sits in its own rounded canvas.
- **Motion.** Live reflow of the preview while dragging. Gentle lifts on hover for tiles and options. A satisfying split-handle compare. Reduced-motion users get instant changes.
- **Logo.** The current mark is a placeholder (a small conic-gradient tile). A real logo is welcome: something seed- or growth-like, simple enough for a favicon.
- **Themes and access.** Light and dark themes for the app. WCAG 2.2 AA for the app itself, visible focus, and everything keyboard reachable.
- **Copy.** Short, warm, plain, in sentence case. "Grow my system", "Pick one you like", "Make it yours", "Take it with you". No exclamation marks in errors, and no engine jargon.

## 8. States and edge cases to cover

- Unsaved changes (the dot in the system pill; the count in Versions).
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
| Trait | "personality" or "vibe" |
| Snapshot | "version" in the UI (save version, 6 versions); "snapshot" only in Craft and docs |
| Branch | "branch" (it's what it is; help text: "a separate line of experiments") |
| Tag | "release" in buttons ("Tag release"), "tag" as the badge |
| Fork | "fork" (help: "a copy that remembers where it came from") |
| Seed | "seed" only in Craft |
| Token | "token" (Craft and export) |

## 11. Deliverables requested from the designer

1. The screens in section 5 (desktop light, plus dark for the studio and library).
2. A component sheet for the app chrome: buttons, the depth switch, visual-choice tiles, the two-ended trait slider in open and set states, area cards (closed and open), Craft setting rows with provenance tags, chips, color orbs, font tiles, version rows with thumbnails, the compare split handle, banners, and posters.
3. A recommendation on Grow: area cards or stepper.
4. Two or more specimen templates.

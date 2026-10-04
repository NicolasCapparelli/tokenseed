# TokenSeed research, round 4: an extensible input system

Builds on rounds [1](research-01-what-a-design-system-is.md), [2](research-02-creation-levels-and-model.md), [3](research-03-inputs-ai-and-names.md). Decided: level names are **Sprout / Grow / Craft** with plain subtitles. Goal this round: the input set must be huge and must keep growing without breaking anything.

---

## 1. Vocabulary

| Term | What it is | Example |
|---|---|---|
| **Knob** | One atomic generation input. Not necessarily a slider. | `shape.radius.style = "soft"` |
| **Trait** | A macro knob that moves many knobs at once (the old "personality sliders") | Calm ↔ Bold |
| **Preset** | A named, partial seed: a bundle of knob and trait values | "Dashboard", "Editorial", "BoldHero" |
| **Seed** | Everything the user chose: presets + traits + knobs + random seed + engine version | `seed.json` in the repo |
| **Generator** | A pipeline stage that reads knobs and writes tokens | `palette`, `typeScale`, `elevation` |

## 2. The architecture (why it scales)

The rule: **knobs, traits, presets and generators are all data or plugins registered in `core`. Nothing about them is hard-coded in the UI.** Adding a knob is adding one definition; the UI, validation, AI prompt and docs pick it up automatically.

### 2.1 Knob definitions are declarative
```ts
defineKnob({
  id: "shape.radius.style",             // namespaced, stable forever
  type: "enum",                          // enum | number | color | colorList | font | boolean | curve | image | text
  options: ["sharp", "soft", "round", "pill"],
  default: "soft",
  label: "Corner style",
  help: "How rounded corners are across the system.",
  control: "visualChoice",               // UI hint: slider, segmented, swatch, xyPad, curveEditor, fontPicker, visualChoice...
  levels: ["grow", "craft"],             // where it is shown; Sprout shows only mandatory + traits
  group: "Shape",
  visibleWhen: null,                     // e.g. { "modes": ["dark", "both"] }
  since: "1.0",                          // engine version that introduced it
})
```
The UI is **generated from these definitions**. The same definitions produce the Zod schema for `seed.json`, the JSON schema handed to the AI (so it can only set knobs that exist), and the reference docs.

### 2.2 Traits are mappings, not code
```ts
defineTrait({
  id: "trait.bold",
  label: ["Calm", "Bold"],
  influences: {
    "color.chroma":             curve([0, 0.7], [1, 1.25]),
    "type.heading.weight":      steps([0, 500], [0.5, 650], [1, 800]),
    "type.scale.ratio":         curve([0, 1.15], [1, 1.414]),
    "color.surface.brandTint":  curve([0, 0.0], [1, 0.4]),
  },
})
```
When several traits touch the same knob, their effects are blended with weights. Because traits are data, we can tune the "taste" of the product without touching generators, and add new traits at any time.

### 2.3 Resolution order (lowest → highest)
1. Knob default
2. Presets, in the order applied (they stack: "Dashboard" + "BoldHero")
3. Traits
4. Explicit knob values the user set
5. Token overrides (hand edits after generation)

The UI always shows *where a value came from* ("set by trait Bold", "from preset Dashboard", "you set this").

### 2.4 Generators are a plugin pipeline
Each generator declares the knobs it reads and the token paths it writes. The engine orders them by dependency (semantic colors need palettes; component recipes need everything).
```
palette → neutrals → semanticColor → states → dataviz
typeface → typeScale → typeRoles
space → size → layout
shape → border → elevation → motion
recipes → guidelines → descriptions
```
A new idea (say, a "glass" material) is a new generator plus its knobs. Nothing else changes.

### 2.5 Provenance on every token
Each generated token records, in `$extensions.tokenseed`, which generator and knobs produced it. That powers "why is this value like this?" in the UI, which is exactly the hand-holding non-designers need, and it tells the regenerate step which overrides are still valid.

### 2.6 Versioning without breaking old systems
- Knob ids are permanent. A rename ships a migration (`old id → new id`).
- A missing knob in an old seed just takes its default, so **adding knobs never breaks seeds**.
- Changing a default or an algorithm *would* change outputs, so each seed pins `engineVersion`. Upgrading shows a token diff first, the same diff view as commits.
- Generation is deterministic: same seed + same engine = identical tokens.

### 2.7 Extensibility later, beyond us
Knob packs and generator packs as installable plugins (community "materials", industry presets). Plugins can't run arbitrary code at first: v1 packs are declarative (knobs, traits, presets, formula-based generators). Code plugins can come later in a sandbox.

## 3. Controls beyond sliders

Different knobs deserve different controls, and several are friendlier for non-designers than numbers:

| Control | Good for |
|---|---|
| Slider / knob dial | Continuous traits and amounts |
| **XY pad** | Two traits at once, e.g. Calm↔Bold × Warm↔Cool; drag a dot, watch the preview |
| Segmented / visual choice | Enums shown as rendered thumbnails, not words |
| Swatch & palette editor | Colors, with harmony helpers |
| Curve editor | Lightness distribution of ramps, type scale growth, easing |
| Font picker | With live specimen and pairing suggestions |
| Reference image | Extract colors (algorithmic) or mood (AI) |
| **"Pick the one you like"** | Engine generates 4 variations by nudging knobs; your pick moves the knobs. Repeat. Fully algorithmic, great for people who can't name what they want |
| **Shuffle / Surprise me** | Seeded randomness within the user's locked knobs; the random seed is stored so results reproduce |
| **Lock** | Pin any knob so shuffles and traits can't move it |

"Pick the one you like" plus locks plus shuffle is how a non-designer explores a huge space without understanding all of it.

## 4. Size of the space

With ~150 knobs, most having 3–6 discrete options or a continuous range, plus colors and fonts as open inputs, the number of distinct systems is effectively unlimited. Combined with stackable presets and random seeds, two users with the same brand color still get different systems.

---

## 5. Knob catalog v1 (proposed)

Mandatory knobs are marked **[M]**. Everything else is optional. (~170 knobs)

### Identity & context
- **[M] Name** · **[M] Primary brand color** · **[M] Product type** · **[M] Modes** (light/dark/both)
- Platforms (web, iOS, Android, desktop): units and touch targets follow
- Audience (general, professional, kids, older adults, developers): nudges size, contrast and density
- Primary locale/script (Latin, CJK, Arabic, Devanagari...): affects font choice and line heights
- RTL support on/off
- Brand assets: logo (colors extracted), reference screenshots

### Traits (macro)
Calm↔Bold · Rounded↔Sharp · Airy↔Dense · Playful↔Serious · Minimal↔Rich · Warm↔Cool · Classic↔Modern · Soft↔Crisp (edges and shadows) · Quiet↔Loud (color usage amount) · Organic↔Geometric · Light↔Heavy (visual weight) · Flat↔Dimensional

### Color: palette
- Secondary colors (0–3), accent colors (0–3)
- Accent harmony when not given: complementary, analogous, triadic, split, tetradic, monochrome
- Chroma / vibrance level
- Hue shift across ramps (cooler darks, warmer lights, none)
- Ramp step count; naming (50–950, 0–100, 1–12)
- Lightness distribution curve; chroma curve (peak at mid-tones vs flat)
- Gamut: sRGB or Display P3 extras
- Color space for generation (OKLCH default, HCT optional)

### Color: neutrals & surfaces
- Neutral temperature; brand tint amount in neutrals
- Number of surface levels (1–5)
- Surface strategy: flat fills, tonal steps, tinted by brand
- Background vs surface contrast
- Border color strength
- Overlay/scrim darkness and blur

### Color: semantics & usage
- Status hues: auto-harmonized or explicit (success, warning, danger, info)
- Status intensity: subtle backgrounds vs solid
- Brand color usage amount (accents only ↔ large surfaces)
- Text on brand: auto, always light, always dark
- Link style: brand color, underline always/hover/never
- Selection color, focus ring color
- Inverse surfaces on/off
- Gradients: none, subtle, bold; angle; stops from harmony

### Color: contrast & dark mode
- Contrast target: WCAG AA, AAA, APCA Lc level
- High-contrast mode generated on/off
- Dark style: true black, dim grey, brand-tinted
- Dark elevation: lighter surfaces vs shadows vs outlines
- Dark mode chroma reduction amount

### Color: data visualization
- Enabled on/off; categorical count (4–12); sequential & diverging scales
- Color-blind-safe constraint on/off
- Harmony with brand vs neutral/independent

### Typography: faces
- Heading font, body font, mono font, optional display font
- "Choose for me" category: sans, serif, slab, rounded, geometric, humanist, grotesque, mono-forward
- Pairing strategy: one family, contrast pair, superfamily
- Fallback stacks (system, platform-native)
- Variable font usage on/off

### Typography: scale & roles
- Base size (14/15/16/17/18)
- Scale ratio (1.067 → 1.618) or custom curve
- Number of steps; role set (display, headline, title, body, label, caption, overline, code)
- Sizes per role (L/M/S) on/off
- Fluid type on/off; min/max viewport for clamp()
- Optical sizing on/off

### Typography: details
- Line-height tightness (headings and body separately)
- Heading weight; body weight; available weights
- Letter-spacing: headings tight, labels wide, by size
- Heading case: sentence, title, uppercase for small labels
- Paragraph spacing; max line length (measure)
- Numerals: tabular, proportional, lining, oldstyle
- Font features: ligatures, slashed zero
- Link underline offset and thickness
- Minimum font size

### Spacing & sizing
- Base unit (2/4/8)
- Density (compact/comfortable/spacious), separately for data views
- Scale progression: linear, geometric, hybrid, custom
- Number of steps
- Control heights (sm/md/lg), default control size
- Touch target minimum (44/48)
- Icon sizes; avatar sizes

### Layout
- Breakpoint preset (or custom); container max widths
- Grid columns, gutters, margins per breakpoint
- Sidebar widths; header/app bar height
- Content width presets (prose, form, full)

### Shape
- Radius base; radius style (sharp, soft, round, pill)
- Per-element radius scale (control, card, sheet, chip)
- Nested radius rule on/off
- Corner smoothing (squircle) amount
- Cut/chamfer corners on/off (for "techy" looks)

### Border & stroke
- Border width scale; separation style (borders, shadows, fills, whitespace)
- Divider style (full, inset, none)
- Stroke style (solid, dashed accents)

### Elevation & depth
- Shadow style: none, soft, crisp, layered, long
- Shadow tint (neutral or brand hue); light direction; spread
- Number of elevation levels
- Inner shadows on/off
- Glass/backdrop blur amount (material)
- Texture/noise grain on/off
- z-index layer set

### Interaction states
- Hover strategy: darken, lighten, overlay layer, lift, outline
- Pressed: darker, scale down, inset
- State layer opacities (hover/focus/pressed/dragged)
- Disabled strategy: opacity vs desaturated tokens
- Focus ring: style (outline, offset, glow, double), width, offset
- Selected/active indicator style

### Motion
- Motion level (none, subtle, standard, expressive)
- Speed; duration scale
- Easing personality: standard, snappy, smooth, springy
- Spring stiffness/damping (if springy)
- Enter/exit asymmetry
- Stagger amount for lists
- Distance scale (how far things travel)
- Reduced-motion fallback (fade only, none)

### Iconography & imagery
- Icon style (outline, filled, duotone, rounded, sharp) and stroke width
- Suggested icon set (Lucide, Phosphor, Material Symbols, Tabler...)
- Image corner radius; default aspect ratios
- Image overlay/scrim style; avatar shape

### Component recipes (global)
- Button: style (filled, tonal, outline, ghost), shape, emphasis levels, icon placement, text case
- Inputs: style (outlined, filled, underlined), label position (top, floating, inline), required marker, helper/error style
- Cards: separation (shadow, border, fill), padding, header style
- Chips/badges: shape, fill style
- Navigation: tab indicator style (underline, pill, block), nav rail vs sidebar
- Dialog/sheet: radius, scrim, entrance motion
- Tables/lists: row density, zebra striping, dividers
- Toasts/alerts: position, accent style (bar, icon, filled)
- Which recipes to generate at all

### Content & voice (feeds guidelines)
- Tone (friendly, neutral, formal, playful)
- Capitalization for UI text (sentence vs title)
- Emoji usage allowed
- Number/date format conventions

### Accessibility
- Color-blind-safe status (always pair color with icon/shape)
- Minimum target size; minimum text size
- Focus visibility level
- Reduce-transparency fallback

### Engine
- Random seed (for Shuffle)
- Locked knobs
- Engine version

---

## Questions for round 5
1. **Catalog**: anything you'd add or drop? It's built to grow, so the question is really what's in v1.
2. **"Pick the one you like"**: should it be the heart of Sprout (recommended), or an extra tool inside Grow?
3. **Presets**: should we ship a library of style presets (e.g. "Material-ish", "Brutalist", "Glassy", "Editorial"), with BoldHero as one of the first?

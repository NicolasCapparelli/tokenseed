# TokenSeed research, round 3

Builds on [round 1](research-01-what-a-design-system-is.md) and [round 2](research-02-creation-levels-and-model.md). Decided this round: generation is algorithmic first; AI is optional, any model, bring-your-own API key, with an Always / Ask me / Never preference; personality comes from sliders plus optional free text.

---

## 1. The core idea: the "seed"

Every generated system starts from a **seed**: a small JSON file holding all the generation inputs (mandatory + whatever optional ones were set). The deterministic engine turns seed → full DTCG system.

- The seed is **stored in the system's repo** next to the tokens, so you can tweak one input and regenerate, diff two seeds, or fork someone's seed instead of their output.
- It fits the product name: TokenSeed literally grows systems from seeds.
- Hand edits made after generation are recorded as **overrides** on top of the seed output, so regenerating doesn't wipe them.

Input precedence, highest first:
**explicit detailed input > personality slider > product-type preset > global default**

So sliders are a macro layer that fills in sensible values for dozens of detailed inputs, and any detailed input the user sets explicitly wins.

## 2. Where AI fits (and why "Never" still works)

The AI never writes tokens directly. It has exactly three jobs:
1. **Interpret**: turn a free-text description ("a calm banking app for retirees") or reference screenshots into **seed inputs** (slider positions and detailed values). The user sees and can edit what it chose.
2. **Write**: token `$description`s, guidelines, do/don't rules, the DESIGN.md prose.
3. **Critique** (later): review a system and suggest changes, again expressed as seed or token edits.

Because AI output is always the same seed shape a human could fill in, **Never use AI** loses convenience, not capability. In that mode, the free-text box and screenshot input are hidden, and guidelines come from templates.

### AI settings
- **Model selector**: provider + model. Start with Anthropic, OpenAI, Google, plus a generic "OpenAI-compatible endpoint" (covers OpenRouter, Ollama, LM Studio, local models). The models list should be data, not code, so adding one is trivial.
- **API keys**: entered in Settings, stored only in the browser (IndexedDB), sent directly from the browser to the provider. Never to a TokenSeed server (there isn't one yet anyway). Show a "test key" button.
- **Capability flags per model**: vision (needed for screenshots), structured output / JSON mode. Features that need a missing capability are greyed out with a reason.
- **Preference**: *Always use AI* / *Ask me first* (shows what will be sent, to which model, rough cost) / *Never use AI*.
- **Library**: the Vercel AI SDK (`ai` package) gives one interface over all these providers and does structured output with Zod, which matches our core schemas.

## 3. Generation inputs

### Mandatory (4)
| Input | Why mandatory |
|---|---|
| **System name** | Repo identity, export names |
| **Primary brand color** | Seeds every color ramp and semantic role |
| **Product type**: SaaS/dashboard, marketing site, mobile consumer app, content/editorial, e-commerce, developer tool, internal tool | Picks a preset of sensible defaults for density, type scale, motion, etc. |
| **Modes**: light only / dark only / both | Decides which mode sets get generated |

Everything else has a default.

### Personality sliders (the macro layer)
Each slider drives several detailed inputs. Free text, with AI on, just sets these sliders plus any detailed values it can infer.

| Slider | Drives |
|---|---|
| Calm ↔ Bold | saturation, heading weight, type scale ratio, contrast of primary surfaces |
| Rounded ↔ Sharp | radius base and style |
| Airy ↔ Dense | density, base spacing, control heights, base font size |
| Playful ↔ Serious | easing bounce, accent harmony, radius, motion level |
| Minimal ↔ Rich | shadows, borders, gradients, number of surface levels |
| Warm ↔ Cool | neutral temperature, status hue shifts |
| Classic ↔ Modern | font pairing suggestions, letter-spacing, heading case |

### Optional detailed inputs (by category)

**Color**
- Secondary and accent colors (0–3)
- Accent harmony if not given: complementary, analogous, triadic, split-complementary, monochrome
- Neutral temperature (cool / pure / warm) and how much brand tint neutrals get (0–100%)
- Vibrance / chroma level
- Ramp step count (e.g. 10, 11, 13) and lightness distribution (linear vs perceptual)
- Status colors: auto-harmonized with brand, or explicit hues
- Contrast target: WCAG AA, AAA, or APCA level
- Dark mode style: true black, dim grey, or brand-tinted dark
- Dark mode elevation: lighter surfaces vs shadows
- Gamut: sRGB only or Display P3 extras
- Data-viz palette: on/off, categorical count, sequential/diverging

**Typography**
- Heading font, body font, mono font (or "choose for me" from a curated, licensed-friendly list)
- Base font size (14 / 16 / 18)
- Type scale ratio (1.125 → 1.618) and number of steps
- Line-height tightness
- Heading weight; available weights to include
- Heading letter-spacing; uppercase labels on/off
- Tabular numbers on/off
- Max line length (measure)
- Fluid/responsive type on/off

**Spacing & layout**
- Base unit (4 or 8)
- Density (compact / comfortable / spacious)
- Scale progression (linear, geometric, hybrid)
- Breakpoint preset; grid columns; gutter; max content width

**Shape & borders**
- Radius base and style (sharp, soft, round, pill)
- Nested radius rule (inner = outer − padding) on/off
- Border width; separation style (borders vs shadows vs tinted fills)

**Elevation**
- Shadow style (none/flat, soft, crisp, layered)
- Shadows tinted with brand hue on/off
- Number of elevation levels
- z-index layer set

**Motion**
- Motion level (none, subtle, expressive)
- Speed (fast, normal, slow)
- Easing personality (standard, snappy, springy)
- Reduced-motion behavior

**Component recipes**
- Button style (filled, tonal, outline) and shape
- Input style (outlined, filled, underlined)
- Default control size; touch target minimum (44 / 48)
- Focus ring style (outline, offset, glow)
- Icon style (outline, filled, duotone) and stroke width

**Accessibility**
- Minimum font size
- Color-blind-safe status (always pair color with icon/shape)
- Focus visibility level

## 4. Names for the three levels

| Option | Make it for me | Assisted | Manual | Feel |
|---|---|---|---|---|
| **A. Plain** | Quick start | Guided | From scratch | Clearest for non-designers |
| **B. Seed metaphor** | Sprout | Grow | Craft | On-brand with TokenSeed |
| **C. Driving** | Autopilot | Guided | Pro | Familiar, slightly techy |
| **D. Effort-based** | Instant | Step by step | Blank canvas | Describes what you'll experience |

**Recommendation: B with A as subtitles**, e.g. a card reading "**Sprout**: give us a color and a vibe, get a full system". The brand name gives the product personality, and the subtitle does the explaining for first-time users.

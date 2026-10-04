# Knob catalog

<!-- Generated from packages/core/src/knobs by catalogMarkdown(). Run `UPDATE_DOCS=1 pnpm -r test` after changing knobs. -->

172 knobs in 18 groups, 12 personality traits and 12 presets. Levels say where a knob is shown: Sprout shows the essentials, Grow the common choices, Craft everything.

## Identity (7)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| System name (required) | `identity.name` | text | Untitled system | sprout, grow, craft | Used for the repository and every export. |
| What are you building? (required) | `identity.productType` | SaaS / dashboard (`saas`), Marketing site (`marketing`), Mobile consumer app (`mobile`), Content / editorial (`editorial`), E-commerce (`commerce`), Developer tool (`devtool`), Internal tool (`internal`) | saas | sprout, grow, craft | Sets sensible defaults for density, type size and motion. |
| Light and dark (required) | `identity.modes` | Light only (`light`), Dark only (`dark`), Both (`both`) | both | sprout, grow, craft | Which color modes to generate. |
| Platform | `identity.platform` | Web (`web`), iOS (`ios`), Android (`android`), Several (`multi`) | web | grow, craft | Where it runs. Native platforms bring their own touch target and type conventions. |
| Audience | `identity.audience` | General public (`general`), Professionals (`professional`), Developers (`developers`), Kids (`kids`), Older adults (`older`) | general | grow, craft | Who uses it. Kids and older adults get larger text, targets and contrast. |
| Main writing system | `identity.script` | Latin (`latin`), Cyrillic (`cyrillic`), Greek (`greek`), Chinese / Japanese / Korean (`cjk`), Arabic (`arabic`), Hebrew (`hebrew`), Devanagari (`devanagari`), Thai (`thai`) | latin | craft | Picks fallback fonts and line height that suit the script. |
| Text direction | `identity.direction` | Left to right (`ltr`), Right to left (`rtl`) | ltr | craft | Right-to-left mirrors layout and icon guidance. |

## Color (11)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Primary brand color (required) | `color.primary` | color | #3b5bdb | sprout, grow, craft | Every color ramp and role is derived from this. |
| Secondary colors | `color.secondary` | up to 3 colors | none | grow, craft | Optional. Left empty, they are derived using the harmony below. |
| Accent harmony | `color.harmony` | Complementary (`complementary`), Analogous (`analogous`), Triadic (`triadic`), Split complementary (`split`), Tetradic (`tetradic`), Monochrome (`monochrome`) | analogous | grow, craft | How accent colors are derived when you don't give them. |
| Vibrance | `color.chroma` | 0.4 to 1.4, step 0.05 | 1 | grow, craft | How saturated the generated ramps are relative to your brand color. |
| Hue shift across ramps | `color.hueShift` | -30 to 30 °, step 1 | 0 | craft | Rotates hue toward dark steps. Small shifts make ramps feel natural. |
| Ramp steps | `color.rampSteps` | 11 (50–950) (`11`), 13 (0–1000) (`13`) | 11 | craft | How many shades each color ramp has. |
| Shade names | `color.rampNaming` | 50–950 (`scale`), Lightness (0–100) (`tone`), 1–11 (`index`) | scale | craft | How ramp steps are named in tokens. |
| Lightness curve | `color.lightnessCurve` | Balanced (`balanced`), Airy (`airy`), Deep (`deep`) | balanced | craft | Airy spends more steps on light tints, deep on dark shades. |
| Saturation curve | `color.chromaCurve` | Peaks in the middle (`peaked`), Even (`even`), Muted ends (`mutedEnds`) | peaked | craft | Where along a ramp color is strongest. |
| Color gamut | `color.gamut` | sRGB (`srgb`), Display P3 (`p3`) | srgb | craft | Wide gamut (Display P3) is more vivid on modern screens, with an sRGB fallback. |
| Ramp color space | `color.space` | OKLCH (`oklch`), CIE LCh (`lch`) | oklch | craft | OKLCH keeps perceived lightness even across hues. |

## Neutrals (9)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Neutral temperature | `color.neutral.temperature` | Cool (`cool`), Pure (`pure`), Warm (`warm`), Brand-tinted (`brand`) | brand | grow, craft | The undertone of greys. |
| Neutral tint | `color.neutral.tint` | 0 to 1, step 0.05 | 0.3 | grow, craft | How much color the greys carry. |
| Surface levels | `color.surface.levels` | 2 to 5, step 1 | 3 | craft | How many layers of surfaces (page, card, raised, overlay). |
| Brand tint on surfaces | `color.surface.brandTint` | 0 to 0.5, step 0.05 | 0 | grow, craft | Mixes a little brand color into surfaces. |
| Surface layering | `color.surface.strategy` | Tonal steps (`tonal`), Flat (`flat`) | tonal | craft | Tonal surfaces step in lightness; flat ones stay the same and rely on borders or shadows. |
| Surface contrast | `color.surface.contrast` | 0 to 1, step 0.05 | 0.5 | craft | How different neighbouring surfaces look. |
| Border strength | `color.border.strength` | 0 to 1, step 0.05 | 0.5 | grow, craft | How visible borders and dividers are. |
| Scrim opacity | `color.scrim.opacity` | 0.2 to 0.8, step 0.05 | 0.4 | craft | How much the backdrop behind dialogs darkens. |
| Scrim blur | `color.scrim.blur` | 0 to 16 px, step 1 | 0 | craft | Blur behind dialogs, in px. 0 is off. |

## Semantic color (13)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Harmonize status colors | `color.status.harmonize` | 0 to 0.5, step 0.05 | 0.15 | craft | Nudges success, warning, danger and info hues toward your brand. |
| Success color | `color.status.success` | color, or empty to let the engine choose | auto | craft | Leave empty for a generated green. |
| Warning color | `color.status.warning` | color, or empty to let the engine choose | auto | craft | Leave empty for a generated amber. |
| Danger color | `color.status.danger` | color, or empty to let the engine choose | auto | craft | Leave empty for a generated red. |
| Info color | `color.status.info` | color, or empty to let the engine choose | auto | craft | Leave empty for a generated blue. |
| Status style | `color.status.style` | Subtle tints (`subtle`), Solid fills (`solid`) | subtle | grow, craft | Whether badges and alerts use soft tints or solid fills. |
| How much brand color | `color.brand.usage` | Accents (`accents`), Balanced (`balanced`), Immersive (`immersive`) | balanced | grow, craft | Accents keeps brand for actions; immersive puts it on large surfaces too. |
| Text on brand color | `color.onBrand` | Auto (`auto`), Light (`light`), Dark (`dark`) | auto | craft | Auto picks whichever passes contrast. |
| Selection color | `color.selection` | Brand (`brand`), Neutral (`neutral`) | brand | craft | The highlight behind selected text and rows. |
| Focus ring color | `color.focus` | color, or empty to let the engine choose | auto | craft | Leave empty to derive it from the brand. |
| Inverse colors | `color.inverse` | on / off | true | craft | Dark-on-light tokens for toasts and tooltips. |
| Brand gradient | `color.gradient` | None (`none`), Subtle (`subtle`), Bold (`bold`) | none | grow, craft | An optional gradient built from your brand colors. |
| Gradient angle | `color.gradient.angle` | 0 to 360 °, step 5 | 135 | craft | Direction of the brand gradient. |

## Accessibility (8)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Contrast target | `color.contrast` | WCAG AA (4.5:1) (`AA`), WCAG AAA (7:1) (`AAA`), APCA Lc 60 (`APCA60`), APCA Lc 75 (`APCA75`) | AA | grow, craft | Minimum contrast for body text. WCAG AA is the common legal baseline; APCA is the newer perceptual model. |
| High-contrast modes | `color.highContrast` | on / off | false | grow, craft | Adds high-contrast light and dark modes for users who ask for more contrast. |
| Minimum touch target | `size.touchTarget` | 44px (Apple) (`44`), 48px (Material) (`48`) | 44 | craft | Smallest tappable size. |
| Minimum target size | `a11y.minTarget` | 24 to 48 px, step 4 | 24 | craft | Hard floor for any interactive element, in px. WCAG 2.2 asks for 24. |
| Smallest text size | `a11y.minFontSize` | 10 to 16 px, step 1 | 11 | craft | No text token goes below this. |
| Never color alone | `a11y.colorblindStatus` | on / off | true | craft | Status colors always come with an icon or label. |
| Focus visibility | `a11y.focusVisibility` | Standard (`standard`), Enhanced (`enhanced`) | standard | grow, craft | Enhanced makes keyboard focus thicker and higher contrast. |
| Reduce transparency | `a11y.reduceTransparency` | on / off | true | craft | Translucent glass surfaces become solid. |

## Dark mode (3)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Dark mode style | `color.dark.style` | True black (`black`), Dim grey (`dim`), Brand-tinted (`tinted`) | dim | grow, craft | The base of dark mode. |
| Elevation in dark mode | `color.dark.elevation` | Lighter surfaces (`lighter`), Shadows (`shadows`), Outlines (`outlines`) | lighter | craft | How raised surfaces stand out in the dark. |
| Desaturate in dark mode | `color.dark.chromaReduction` | 0 to 0.6, step 0.05 | 0.15 | craft | Bright colors glare on dark backgrounds; this calms them. |

## Data viz (4)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Chart colors | `dataviz.enabled` | on / off | true | grow, craft | Generate categorical, sequential and diverging palettes for charts. |
| Categorical colors | `dataviz.count` | 4 to 12, step 1 | 8 | craft | How many distinct series colors. |
| Color-blind safe | `dataviz.colorblindSafe` | on / off | true | craft | Uses a palette distinguishable with common color blindness. |
| Chart palette source | `dataviz.harmony` | From brand (`brand`), Independent (`independent`) | brand | craft | Start from the brand color, or use an independent palette. |

## Typography (34)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Heading font | `type.heading.font` | font family, or empty to choose from the type style | auto | sprout, grow, craft | Leave empty and we'll choose one from the style below. |
| Body font | `type.body.font` | font family, or empty to choose from the type style | auto | sprout, grow, craft | Leave empty and we'll choose one from the style below. |
| Display font | `type.display.font` | font family, or empty to choose from the type style | auto | craft | For the very largest text. Leave empty to use the heading font. |
| Code font | `type.mono.font` | font family, or empty to choose from the type style | auto | craft | Used for code and tabular data. |
| Type style | `type.style` | Neutral sans (`neutral`), Geometric (`geometric`), Humanist (`humanist`), Grotesque (`grotesque`), Rounded (`rounded`), Serif (`serif`), Serif headings, sans body (`editorial`), Slab serif (`slab`), Monospace (`mono`) | neutral | grow, craft | The feel of fonts we choose when you don't pick them. |
| Font pairing | `type.pairing` | Auto (`auto`), One family (`single`), Contrasting (`contrast`), Superfamily (`superfamily`) | auto | grow, craft | One family, two contrasting families, or a superfamily with matching sans, serif and mono. |
| Fallback fonts | `type.fallback` | System stack (`system`), Native per platform (`native`) | system | craft | System stacks are generic; native ones name each platform's UI font. |
| Prefer variable fonts | `type.variable` | on / off | true | craft | Loads one variable file and allows any weight. |
| Base text size | `type.base` | 13 to 20 px, step 1 | 16 | grow, craft | Body text size in px. |
| Type scale ratio | `type.ratio` | 1.067 to 1.618, step 0.001 | 1.2 | grow, craft | How quickly sizes grow from body to display. Bigger is more dramatic. |
| Scale steps | `type.steps` | 6 to 12, step 1 | 10 | craft | How many sizes the type scale has. |
| Type roles | `type.roles` | Compact (`compact`), Standard (`standard`), Expanded (`expanded`) | standard | grow, craft | Compact merges similar roles; expanded adds overline, caption, quote and numeric. |
| Small, medium and large per role | `type.roleSizes` | on / off | true | craft | Each role (headline, title, body…) gets three sizes. |
| Fluid type | `type.fluid` | on / off | false | grow, craft | Large sizes scale smoothly with the viewport using clamp(). |
| Fluid from width | `type.fluid.minViewport` | 320 to 768 px, step 1 | 375 | craft | Viewport width where fluid sizes are smallest. |
| Fluid to width | `type.fluid.maxViewport` | 1024 to 1920 px, step 1 | 1440 | craft | Viewport width where fluid sizes are largest. |
| Optical sizing | `type.opticalSizing` | on / off | true | craft | Lets variable fonts adjust their design for each size. |
| Heading weight | `type.heading.weight` | 300 to 900, step 50 | 600 | grow, craft | Weight of headlines and titles. |
| Body weight | `type.body.weight` | 300 to 500, step 50 | 400 | craft | Weight of running text. |
| Weight set | `type.weights` | Two (`minimal`), Three (`standard`), Full range (`full`) | standard | craft | How many weights the system uses. |
| Line height | `type.lineHeight` | 1.3 to 1.8, step 0.05 | 1.5 | craft | Body line height. |
| Heading line height | `type.heading.lineHeight` | 1 to 1.4, step 0.05 | 1.2 | craft | Line height of the largest headings. |
| Heading letter-spacing | `type.heading.tracking` | -0.04 to 0.02 em, step 0.005 | -0.01 | craft | Negative values tighten large headlines. |
| Label letter-spacing | `type.label.tracking` | 0 to 0.12 em, step 0.01 | 0.02 | craft | Extra spacing for small labels. |
| Uppercase small labels | `type.labels.uppercase` | on / off | false | grow, craft | Overlines and small labels in caps with wider spacing. |
| Heading case | `type.heading.case` | Sentence case (`sentence`), Title Case (`title`), UPPERCASE (`upper`) | sentence | craft | How headings are capitalized. |
| Paragraph spacing | `type.paragraphSpacing` | 0 to 1.5 em, step 0.05 | 0.75 | craft | Space between paragraphs, in em. |
| Line length | `type.measure` | 45 to 90 ch, step 1 | 68 | craft | Maximum characters per line of prose. |
| Numerals | `type.numerals` | Proportional (`proportional`), Tabular (`tabular`), Oldstyle (`oldstyle`) | proportional | craft | Tabular numbers line up in tables; oldstyle blend into prose. |
| Ligatures | `type.ligatures` | on / off | true | craft | Common ligatures such as fi and fl. |
| Slashed zero | `type.slashedZero` | on / off | false | craft | Distinguishes 0 from O. |
| Link underline | `type.link.underline` | Always (`always`), On hover (`hover`), Never (`never`) | always | grow, craft | When links are underlined. |
| Underline offset | `type.link.offset` | 1 to 6 px, step 1 | 3 | craft | Gap between text and underline. |
| Underline thickness | `type.link.thickness` | 1 to 3 px, step 1 | 1 | craft | Thickness of link underlines. |

## Spacing (8)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Base unit | `space.base` | 2px (`2`), 4px (`4`), 8px (`8`) | 4 | craft | Every spacing value is a multiple of this. |
| Density | `space.density` | Compact (`compact`), Comfortable (`comfortable`), Spacious (`spacious`) | comfortable | grow, craft | How much room UI elements get. |
| Table density | `space.dataDensity` | Same as above (`auto`), Compact (`compact`), Comfortable (`comfortable`), Spacious (`spacious`) | auto | craft | Tables and lists can be denser than the rest. |
| Spacing progression | `space.progression` | Linear (`linear`), Geometric (`geometric`), Hybrid (`hybrid`) | hybrid | craft | Linear steps evenly; geometric grows faster; hybrid does both. |
| Spacing steps | `space.steps` | 8 to 18, step 1 | 15 | craft | How many spacing values the scale has. |
| Default control size | `size.control.default` | Small (`sm`), Medium (`md`), Large (`lg`) | md | grow, craft | Height of buttons and inputs. |
| Icon size | `size.icon.base` | 16 to 24 px, step 2 | 20 | craft | Default icon size. |
| Avatar size | `size.avatar.base` | 24 to 48 px, step 4 | 32 | craft | Default avatar size. |

## Layout (7)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Breakpoints | `layout.breakpoints` | Tailwind (`tailwind`), Bootstrap (`bootstrap`), Material (`material`) | tailwind | grow, craft | Screen widths where layouts change. |
| Grid columns | `layout.columns` | 4, 8, 12, 16 | 12 | craft | Columns on wide screens. |
| Gutter | `layout.gutter` | 8 to 48 px, step 4 | 24 | craft | Space between grid columns. |
| Page margin | `layout.margin` | 8 to 64 px, step 4 | 24 | craft | Space between content and the screen edge. |
| Sidebar width | `layout.sidebar` | 200 to 360 px, step 8 | 264 | craft | Width of side navigation. |
| Header height | `layout.header` | 48 to 96 px, step 4 | 64 | craft | Height of the top bar. |
| Content max width | `layout.maxWidth` | 960 to 1600 px, step 40 | 1200 | craft | Widest content gets. |

## Shape (8)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Corner style | `shape.style` | Sharp (`sharp`), Soft (`soft`), Round (`round`), Pill (`pill`) | soft | grow, craft | How rounded corners are across the system. |
| Base radius | `shape.radius` | 0 to 24 px, step 1 | 8 | craft | Radius of a medium control in px. |
| Card rounding | `shape.card.scale` | 0.5 to 3 ×, step 0.25 | 1.5 | craft | Card radius relative to controls. |
| Chip shape | `shape.chip` | Pill (`full`), Match controls (`match`) | full | craft | Chips and badges as pills or matching controls. |
| Nested radius rule | `shape.nested` | on / off | true | craft | Inner corners shrink by the padding so nested shapes stay concentric. |
| Corner shape | `shape.corner` | Round (`round`), Squircle (`squircle`), Bevel (`bevel`) | round | craft | Squircle and bevel use CSS corner-shape where supported. |
| Avatar shape | `avatar.shape` | Circle (`circle`), Rounded (`rounded`), Square (`square`) | circle | craft | Shape of profile pictures. |
| Image corners | `image.radius` | Match cards (`match`), Square (`none`), Fully round (`full`) | match | craft | Corners of images and media. |

## Border (4)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| How things are separated | `border.separation` | Borders (`borders`), Shadows (`shadows`), Tinted fills (`fills`) | borders | grow, craft | What visually divides cards and sections. |
| Border width | `border.width` | 1 to 3 px, step 0.5 | 1 | craft | Default border width in px. |
| Dividers | `border.divider` | Full width (`full`), Inset (`inset`), None (`none`) | full | craft | How list and table dividers run. |
| Border style | `border.style` | Solid (`solid`), Dashed (`dashed`) | solid | craft | Line style of default borders. |

## Elevation (8)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Shadow style | `elevation.style` | None / flat (`flat`), Soft (`soft`), Crisp (`crisp`), Layered (`layered`) | soft | grow, craft | The character of shadows. |
| Brand-tinted shadows | `elevation.tint` | on / off | false | craft | Shadows pick up a hint of your brand hue. |
| Light direction | `elevation.light` | Top (`top`), Top left (`top-left`), Top right (`top-right`) | top | craft | Where light comes from; shadows fall the other way. |
| Shadow size | `elevation.spread` | 0.5 to 2 ×, step 0.1 | 1 | craft | Scales every shadow's blur and offset. |
| Elevation levels | `elevation.levels` | 3 to 6, step 1 | 4 | craft | How many shadow levels. |
| Inset shadow | `elevation.inner` | on / off | false | craft | Adds an inset shadow for wells and pressed states. |
| Glass blur | `elevation.glass` | 0 to 32 px, step 2 | 0 | craft | Blur behind translucent surfaces, in px. 0 is off. |
| Noise texture | `elevation.texture` | on / off | false | craft | A subtle grain on surfaces. |

## States (10)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Hover effect | `state.hover` | Color shift (`shift`), Overlay (`overlay`), Lift (`lift`), Outline (`outline`) | shift | grow, craft | What happens when the pointer is over something. |
| Pressed effect | `state.pressed` | Color shift (`shift`), Shrink (`scale`), Inset (`inset`) | shift | craft | What happens on press. |
| Hover overlay | `state.hoverOpacity` | 0.04 to 0.16, step 0.01 | 0.08 | craft | Opacity of hover overlays. |
| Focus overlay | `state.focusOpacity` | 0.06 to 0.2, step 0.01 | 0.12 | craft | Opacity of focus overlays. |
| Pressed overlay | `state.pressedOpacity` | 0.06 to 0.24, step 0.01 | 0.12 | craft | Opacity of pressed overlays. |
| Disabled look | `state.disabled` | Faded (`opacity`), Muted (`muted`) | opacity | craft | Faded keeps colors at low opacity; muted swaps to greys. |
| Disabled opacity | `state.disabledOpacity` | 0.3 to 0.6, step 0.02 | 0.38 | craft | Opacity of disabled elements. |
| Selected look | `state.selected` | Fill (`fill`), Outline (`outline`), Side bar (`bar`) | fill | craft | How selected items stand out. |
| Focus ring width | `recipe.focus.width` | 1 to 4 px, step 0.5 | 2 | craft | Thickness of keyboard focus. |
| Focus ring offset | `recipe.focus.offset` | 0 to 4 px, step 1 | 2 | craft | Gap between element and focus ring. |

## Motion (9)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Motion | `motion.level` | None (`none`), Subtle (`subtle`), Standard (`standard`), Expressive (`expressive`) | standard | grow, craft | How much things move. |
| Speed | `motion.speed` | 0.6 to 1.6 ×, step 0.05 | 1 | craft | Multiplier on all durations. Lower is faster. |
| Easing personality | `motion.easing` | Standard (`standard`), Snappy (`snappy`), Smooth (`smooth`), Springy (`springy`) | standard | grow, craft | The feel of acceleration. |
| Spring stiffness | `motion.spring.stiffness` | 100 to 600, step 10 | 300 | craft | Higher springs settle faster. |
| Spring damping | `motion.spring.damping` | 8 to 40, step 1 | 20 | craft | Lower damping bounces more. |
| Exit speed | `motion.exitRatio` | 0.5 to 1 ×, step 0.05 | 0.75 | craft | Exits as a fraction of entrance duration. |
| Stagger | `motion.stagger` | 0 to 80 ms, step 5 | 30 | craft | Delay between items animating in a list. |
| Travel distance | `motion.distance` | 0.5 to 2 ×, step 0.1 | 1 | craft | How far things slide when they move. |
| Reduced motion | `motion.reduced` | Fade only (`fade`), No animation (`none`) | fade | craft | What replaces movement when users ask for less motion. |

## Icons & imagery (5)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Icon set | `icon.set` | Lucide (`lucide`), Phosphor (`phosphor`), Material Symbols (`material`), Tabler (`tabler`), Heroicons (`heroicons`) | lucide | grow, craft | Recommended icon library. |
| Icon style | `icon.style` | Outline (`outline`), Filled (`filled`), Duotone (`duotone`), Rounded (`rounded`), Sharp (`sharp`) | outline | craft | The look of icons. |
| Icon stroke | `icon.stroke` | 1 to 2.5 px, step 0.25 | 1.75 | craft | Line width of outline icons. |
| Image ratio | `image.ratio` | 16:9 (`widescreen`), 3:2 (`photo`), 21:9 (`cinematic`) | widescreen | craft | Default aspect ratio of media. |
| Text on images | `image.overlay` | None (`none`), Scrim (`scrim`), Gradient (`gradient`) | scrim | craft | How text stays readable on top of images. |

## Components (20)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Component recipes | `recipe.include` | Badges & chips (`badge`), Links (`link`), Tabs (`tabs`), Navigation (`nav`), Dialogs (`dialog`), Tables (`table`), Toasts (`toast`), Alerts (`alert`), Avatars (`avatar`) | badge, link, tabs, nav, dialog, table, toast, alert, avatar | grow, craft | Buttons, inputs, cards and focus rings are always included. Pick the rest. |
| Primary button style | `recipe.button.style` | Filled (`filled`), Tonal (`tonal`), Outline (`outline`) | filled | grow, craft | How the main call to action looks. |
| Button shape | `recipe.button.shape` | Match corners (`match`), Pill (`pill`), Square (`square`) | match | grow, craft | Buttons can follow the corner style or override it. |
| Button variants | `recipe.button.emphasis` | 2 to 4, step 1 | 3 | craft | How many button variants: primary and secondary, plus ghost, plus danger. |
| Button icon side | `recipe.button.iconPosition` | Before text (`leading`), After text (`trailing`) | leading | craft | Where icons sit in buttons. |
| Button text case | `recipe.button.case` | Sentence case (`sentence`), Title Case (`title`), UPPERCASE (`upper`) | sentence | craft | How button labels are capitalized. |
| Input style | `recipe.input.style` | Outlined (`outlined`), Filled (`filled`), Underlined (`underlined`) | outlined | grow, craft | How text fields look. |
| Input label | `recipe.input.label` | Above (`top`), Floating (`floating`), Inline (`inline`) | top | craft | Where field labels sit. |
| Required fields | `recipe.input.required` | Asterisk (`asterisk`), "Required" (`text`), Mark optional instead (`none`) | asterisk | craft | How required fields are marked. |
| Validation feedback | `recipe.input.feedback` | Message (`text`), Icon and message (`icon`) | text | craft | How errors are shown. |
| Card padding | `recipe.card.padding` | Small (`sm`), Medium (`md`), Large (`lg`) | md | craft | Space inside cards. |
| Card header | `recipe.card.header` | Plain (`plain`), Divider (`divided`), Tinted (`tinted`) | plain | craft | How card headers are set apart. |
| Chip fill | `recipe.chip.fill` | Subtle (`subtle`), Outline (`outline`), Solid (`solid`) | subtle | craft | How chips and badges are filled. |
| Tab indicator | `recipe.tabs.indicator` | Underline (`underline`), Pill (`pill`), Block (`block`) | underline | craft | How the active tab is marked. |
| Navigation pattern | `recipe.nav.pattern` | Sidebar (`sidebar`), Rail (`rail`), Top bar (`top`), Bottom bar (`bottom`) | sidebar | grow, craft | Main navigation layout. |
| Dialog entrance | `recipe.dialog.motion` | Fade (`fade`), Scale (`scale`), Slide up (`slide`) | scale | craft | How dialogs appear. |
| Zebra rows | `recipe.table.zebra` | on / off | false | craft | Alternate row tints in tables. |
| Toast position | `recipe.toast.position` | Top (`top`), Bottom (`bottom`), Top right (`top-right`), Bottom right (`bottom-right`) | bottom-right | craft | Where notifications appear. |
| Alert accent | `recipe.alert.accent` | Side bar (`bar`), Icon (`icon`), Filled (`filled`) | icon | craft | How alerts show their status. |
| Focus ring | `recipe.focus.style` | Outline (`outline`), Offset outline (`offset`), Glow (`glow`) | offset | craft | How keyboard focus is shown. |

## Content (4)

| Knob | Id | Values | Default | Levels | What it does |
| --- | --- | --- | --- | --- | --- |
| Voice | `content.tone` | Friendly (`friendly`), Neutral (`neutral`), Formal (`formal`), Playful (`playful`) | neutral | grow, craft | How the product speaks. |
| UI text case | `content.case` | Sentence case (`sentence`), Title Case (`title`) | sentence | craft | Capitalization of buttons, menus and titles. |
| Emoji in UI | `content.emoji` | on / off | false | craft | Whether emoji may appear in product copy. |
| Primary locale | `content.locale` | text | en-US | craft | BCP 47 tag used for number, date and currency formatting guidance. |

## Personality traits

Each trait is a slider between two words. Moving it sets several knobs at once.

| Trait | Low end | High end | Moves |
| --- | --- | --- | --- |
| `trait.bold` | Calm | Bold | `color.chroma`, `type.heading.weight`, `type.ratio`, `color.surface.brandTint` |
| `trait.sharp` | Rounded | Sharp | `shape.radius`, `shape.style` |
| `trait.dense` | Airy | Dense | `space.density`, `type.base`, `type.lineHeight` |
| `trait.serious` | Playful | Serious | `motion.easing`, `motion.level`, `color.harmony`, `type.style` |
| `trait.rich` | Minimal | Rich | `elevation.style`, `border.separation`, `color.surface.levels` |
| `trait.warm` | Cool | Warm | `color.neutral.temperature`, `color.hueShift` |
| `trait.modern` | Classic | Modern | `type.style`, `type.heading.tracking` |
| `trait.crisp` | Soft | Crisp | `color.border.strength`, `elevation.spread`, `color.surface.contrast`, `state.hover` |
| `trait.loud` | Quiet | Loud | `color.brand.usage`, `color.gradient`, `color.status.style`, `recipe.chip.fill` |
| `trait.geometric` | Organic | Geometric | `shape.corner`, `space.progression`, `icon.style`, `color.lightnessCurve` |
| `trait.heavy` | Light | Heavy | `type.body.weight`, `border.width`, `icon.stroke`, `recipe.focus.width`, `type.weights` |
| `trait.dimensional` | Flat | Dimensional | `elevation.levels`, `elevation.glass`, `state.hover`, `state.pressed`, `color.dark.elevation` |

## Presets

| Preset | Kind | Description |
| --- | --- | --- |
| SaaS / dashboard (`product.saas`) | product | Information-dense, calm, efficient. |
| Marketing site (`product.marketing`) | product | Big type, generous space, expressive. |
| Mobile consumer app (`product.mobile`) | product | Touch-first, friendly, clear. |
| Content / editorial (`product.editorial`) | product | Reading comfort first. |
| E-commerce (`product.commerce`) | product | Clear hierarchy, strong calls to action. |
| Developer tool (`product.devtool`) | product | Dense, precise, dark-friendly. |
| Internal tool (`product.internal`) | product | Plain, dense and predictable. |
| BoldHero (`style.boldhero`) | style | Google Wallet style hero screens: huge type, saturated color blocks, round shapes. The most important information is the biggest thing on screen. |
| Editorial (`style.editorial`) | style | Magazine feel: serif headlines, warm paper neutrals, restrained color. |
| Brutalist (`style.brutalist`) | style | Raw and loud: hard edges, thick borders, no shadows, monochrome harmony. |
| Soft & friendly (`style.soft`) | style | Rounded everything, pastel-leaning color, gentle springy motion. |
| Precise (`style.precise`) | style | Engineered and neutral: tight grid, crisp shadows, small radii. |

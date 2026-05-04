---
name: Glitch-Core Terminal
colors:
  surface: "#0c1609"
  surface-dim: "#0c1609"
  surface-bright: "#323c2d"
  surface-container-lowest: "#071105"
  surface-container-low: "#141e11"
  surface-container: "#182214"
  surface-container-high: "#222d1e"
  surface-container-highest: "#2d3828"
  on-surface: "#dae6d0"
  on-surface-variant: "#baccb0"
  inverse-surface: "#dae6d0"
  inverse-on-surface: "#293324"
  outline: "#85967c"
  outline-variant: "#3c4b35"
  surface-tint: "#2ae500"
  primary: "#efffe3"
  on-primary: "#053900"
  primary-container: "#39ff14"
  on-primary-container: "#107100"
  inverse-primary: "#106e00"
  secondary: "#ffabf3"
  on-secondary: "#5b005b"
  secondary-container: "#fe00fe"
  on-secondary-container: "#500050"
  tertiary: "#fff8f7"
  on-tertiary: "#442927"
  tertiary-container: "#ffd3ce"
  on-tertiary-container: "#7a5955"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#79ff5b"
  primary-fixed-dim: "#2ae500"
  on-primary-fixed: "#022100"
  on-primary-fixed-variant: "#095300"
  secondary-fixed: "#ffd7f5"
  secondary-fixed-dim: "#ffabf3"
  on-secondary-fixed: "#380038"
  on-secondary-fixed-variant: "#810081"
  tertiary-fixed: "#ffdad6"
  tertiary-fixed-dim: "#e7bdb8"
  on-tertiary-fixed: "#2c1513"
  on-tertiary-fixed-variant: "#5d3f3c"
  background: "#0c1609"
  on-background: "#dae6d0"
  surface-variant: "#2d3828"
typography:
  h1:
    fontFamily: Space Mono
    fontSize: 48px
    fontWeight: "700"
    lineHeight: "1.1"
    letterSpacing: -0.02em
  h2:
    fontFamily: Space Mono
    fontSize: 32px
    fontWeight: "700"
    lineHeight: "1.2"
  h3:
    fontFamily: Space Mono
    fontSize: 24px
    fontWeight: "700"
    lineHeight: "1.2"
  body-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: "400"
    lineHeight: "1.6"
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: "400"
    lineHeight: "1.5"
  label:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: "700"
    lineHeight: "1"
  button:
    fontFamily: Space Mono
    fontSize: 14px
    fontWeight: "700"
    lineHeight: "1"
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
  gutter: 16px
  margin: 24px
---

## Brand & Style

This design system centers on a "glitch-core" aesthetic that treats the browser tab not as a utility, but as a digital wasteland. It merges **Harsh Brutalism** with **Cyberpunk HUD** elements to create an interface that feels like a hijacked military terminal.

The personality is intentionally confrontational, sarcastic, and judgmental. The UI should mock the user's digital hoarding habits. Every interaction is sharp, loud, and unapologetic, utilizing high-contrast visuals and vibrating colors to evoke a sense of digital instability.

## Colors

The palette is rooted in **Void Black**, providing a high-contrast foundation for neon "glitch" accents.

- **Acid Green** is the primary signal for "active" states, success, and destructive actions (ironically).
- **Glitch Magenta** serves as the warning and accent layer, creating a visual vibration against the green.
- **Harsh White** is reserved for high-readability text.
- **Ash Grey** is used exclusively for structural borders that aren't meant to draw immediate attention.

## Typography

The system uses a dual-mono pairing to maintain a technical, retro-terminal feel.

**Space Mono** is used for all "loud" elements: headings, buttons, and navigation labels. These must always be uppercase and heavy-weight to maintain a commanding presence.

**JetBrains Mono** is the functional workhorse for body text, tab titles, and terminal-style feedback. It provides the necessary legibility for dense information while reinforcing the developer-centric, "raw code" aesthetic.

## Layout & Spacing

The design system employs a **Fixed Grid** model based on a 4px baseline. Layouts should feel rigid and mathematical, using 12 columns for primary dashboard views.

Margins and gutters are kept tight (16-24px) to maximize the feeling of a packed, information-heavy HUD. Elements should be snapped to the grid with no "breathing room" that isn't functionally required. Alignment is strictly left-justified or justified to the edges to mimic terminal outputs.

## Elevation & Depth

Depth is created through **Glassmorphism** and aggressive **Hard Shadows**, rather than realistic lighting.

- **Surface Layers:** Use a dark surface color (#050505 at 60% opacity) with a `backdrop-blur` of 12px.
- **Shadows:** All interactive elements (buttons, cards, inputs) feature a heavy 4px offset drop shadow with 100% opacity.
- **Shadow Direction:** Shadows always offset to the bottom-right (4px 4px).
- **Shadow Color:** Active/Primary elements use Acid Green (#39FF14). Warning/Secondary elements use Glitch Magenta (#FF00FF).
- **Layering:** Hierarchy is established by "stacking" panels with 1px Ash Grey borders.

## Shapes

This design system strictly forbids rounded corners. All elements—including buttons, cards, input fields, and tooltips—must have a **0px border radius**. The sharp edges reinforce the brutalist aesthetic and the "jagged" nature of a glitching interface.

## Components

### Buttons

- **Style:** 0px radius, 1px solid border (match shadow color).
- **Shadow:** 4px offset (#39FF14 for primary, #FF00FF for warning).
- **Text:** Space Mono, All Caps, Heavy weight.
- **Hover:** Invert colors (Background becomes the shadow color, text becomes Void Black).

### Cards

- **Style:** Backdrop-blur (12px), semi-transparent Void Black background.
- **Border:** 1px Ash Grey (#52525B).
- **Accent:** A 2px top-border or corner-accent in Acid Green or Glitch Magenta.

### Inputs & Terminal Fields

- **Style:** Inset appearance using a 1px Ash Grey border.
- **Focus:** Border changes to Acid Green with a "glitch" flicker animation.
- **Prefix:** Every input should have a terminal prompt prefix like `USER_LOG@TAB:>`.

### Tab Chips

- **Style:** Small rectangular boxes with no padding on the sides, just enough to clear the text.
- **Interaction:** On hover, display "Judgmental Tooltips" (e.g., "STILL OPEN? REALLY?").

### Checkboxes & Radios

- **Style:** Square boxes (0px radius).
- **Active State:** Fill with Acid Green and use an "X" or "BLOCK" character instead of a checkmark.

### Additional Components

- **Glitch Overlay:** A full-screen scanline overlay (low opacity) to add texture.
- **Judgment Meter:** A progress bar (stepped blocks) that turns from Acid Green to Glitch Magenta as the user opens more tabs.

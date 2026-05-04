---
name: Neon Satire
colors:
  surface: "#131318"
  surface-dim: "#131318"
  surface-bright: "#39383e"
  surface-container-lowest: "#0e0e13"
  surface-container-low: "#1b1b20"
  surface-container: "#1f1f24"
  surface-container-high: "#2a292f"
  surface-container-highest: "#35343a"
  on-surface: "#e4e1e9"
  on-surface-variant: "#c4c9ac"
  inverse-surface: "#e4e1e9"
  inverse-on-surface: "#303035"
  outline: "#8e9379"
  outline-variant: "#444933"
  surface-tint: "#abd600"
  primary: "#ffffff"
  on-primary: "#283500"
  primary-container: "#c3f400"
  on-primary-container: "#556d00"
  inverse-primary: "#506600"
  secondary: "#dfb7ff"
  on-secondary: "#4b007e"
  secondary-container: "#9d05ff"
  on-secondary-container: "#f7e6ff"
  tertiary: "#ffffff"
  on-tertiary: "#00363a"
  tertiary-container: "#7df4ff"
  on-tertiary-container: "#006f77"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#c3f400"
  primary-fixed-dim: "#abd600"
  on-primary-fixed: "#161e00"
  on-primary-fixed-variant: "#3c4d00"
  secondary-fixed: "#f1daff"
  secondary-fixed-dim: "#dfb7ff"
  on-secondary-fixed: "#2d004f"
  on-secondary-fixed-variant: "#6b00b0"
  tertiary-fixed: "#7df4ff"
  tertiary-fixed-dim: "#00dbe9"
  on-tertiary-fixed: "#002022"
  on-tertiary-fixed-variant: "#004f54"
  background: "#131318"
  on-background: "#e4e1e9"
  surface-variant: "#35343a"
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 96px
    fontWeight: "700"
    lineHeight: 100%
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: "700"
    lineHeight: 110%
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: "600"
    lineHeight: 120%
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 160%
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 150%
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: "700"
    lineHeight: 100%
    letterSpacing: 0.1em
spacing:
  unit: 8px
  gutter: 24px
  margin: 40px
  container-max: 1440px
---

## Brand & Style

This design system is built for a "New Tab" experience that prioritizes wit, high-energy visuals, and a rebellious spirit. The brand personality is unapologetically loud, clever, and slightly chaotic, designed to disrupt the monotony of a typical workday. The target audience consists of digital natives, developers, and creatives who appreciate dark humor and "internet-native" aesthetics.

The visual direction is a fusion of **Neo-Brutalism** and **Cyberpunk-inspired High-Contrast**. It rejects traditional "safe" corporate aesthetics in favor of massive typography, aggressive color pairings, and hard-edged layouts. The UI should feel like a digital fanzine: raw, immediate, and high-velocity. Use thick strokes, intentional overlapping, and vibrant motion to keep the energy high.

## Colors

The palette is anchored in a deep, void-like neutral to make the neon accents "pop" with maximum vibration.

- **Primary (Electric Lime):** Used for critical calls to action, highlights, and sarcastic emphasis. This color should be used to draw the eye to the most irreverent parts of the page.
- **Secondary (Acid Purple):** The primary brand identifier. Used for decorative elements, secondary buttons, and gradients.
- **Tertiary (Cyber Cyan):** Reserved for data points, links, and accents within humorous widgets.
- **Neutral:** A near-black with a slight purple tint to maintain depth.

Surface levels are defined by high-contrast shifts rather than subtle grays. Always pair Electric Lime with black text to ensure legibility.

## Typography

The typography is the primary driver of the design system's "edge." **Space Grotesk** is used for all structural and high-impact elements, providing a technical yet slightly "off" geometric feel. Headlines should be massive, often breaking standard container bounds or using negative letter spacing for a compressed, urgent look.

**Be Vietnam Pro** handles the body copy, offering a contemporary and friendly contrast to the aggressive headlines. This ensures that while the page looks "wild," the actual humorous content and links remain highly readable. Use `label-caps` for metadata and section headers to maintain the brutalist grid aesthetic.

## Layout & Spacing

The layout follows a **Rigid Grid** philosophy. Content is organized into a 12-column grid with generous gutters to allow elements to breathe despite their high visual weight.

Avoid centered layouts; instead, favor "heavy" alignments where text blocks are pinned to the hard left or right margins. Use a 4pt/8pt rhythmic scale for internal padding. To achieve the edgy aesthetic, allow certain "sticker" elements (like icons or status badges) to break the grid and overlap adjacent columns or containers.

## Elevation & Depth

This design system rejects soft shadows and ambient light. Depth is communicated through **Hard Shadows** and **Tonal Offsets**.

- **Level 1 (Surface):** The base background color.
- **Level 2 (Containers):** Use a slightly lighter dark-purple tint with a 2px solid border in the Primary or Secondary color.
- **Level 3 (Interactive):** Elements don't "lift" with shadows; they "shift" with hard, 100% opacity offsets (e.g., a button with a 4px offset solid black shadow).

Avoid all backdrop blurs. Clarity and sharpness are the priority over realism.

## Shapes

The shape language is strictly **Sharp (0px)**. Every container, button, and input field must have 90-degree corners. This reinforces the brutalist, high-energy aesthetic and creates a sense of digital "raw-ness."

The only exception is for circular avatars or specific "pill" stickers used for status indicators, which should be perfectly round to create a deliberate visual clash with the otherwise rectangular world.

## Components

### Buttons

Primary buttons use the Electric Lime background with black text and a 4px offset hard shadow. On hover, the shadow disappears and the button "moves" down and right to simulate a physical press.

### Cards

Cards are defined by a 2px solid Acid Purple border. Header areas within cards should have a solid fill of Acid Purple with white or lime text to create clear information hierarchy.

### Input Fields

Inputs are stark white or very light gray with no borders, using the Primary color only when focused. Error states should use a vibrant, neon red-pink.

### Widgets (Unique to New Tab)

- **The "Roast" Widget:** A dedicated space for humorous daily quotes or snarky productivity reminders, using the `headline-md` type.
- **Stickers:** Non-functional decorative icons that can be "pinned" anywhere, often overlapping grid lines.
- **Progress Bars:** High-contrast neon fills against a black background, stripped of all rounded corners and gradients.

---
name: Alwin — life in motion
description: A monochrome daily workspace with expressive type and organic geometry.
colors:
  ink: "#111111"
  muted: "#626262"
  canvas: "#ededed"
  paper: "#f0f0f0"
  accent-soft: "#dedede"
  rule: "#d0d0d0"
  outer: "#dcdcdc"
  destination: "#d2d2d2"
  project: "#e0e0e0"
  white: "#ffffff"
  field: "#fafafa"
  hover-dark: "#333333"
  focus: "#808080"
typography:
  display:
    fontFamily: "Lobster, Georgia, serif"
    fontSize: "clamp(42px, 5.2vw, 76px)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "23px"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "19px"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    lineHeight: 1.55
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "11px"
rounded:
  tag: "5px"
  field: "12px"
  project: "23px"
  surface: "26px"
  button: "30px"
  shell: "32px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  gap-compact: "18px"
  gap: "22px"
  lg: "24px"
  surface: "28px"
  inset: "38px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.hover-dark}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "10px 18px"
  field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "10px 13px"
  tag:
    backgroundColor: "{colors.accent-soft}"
    rounded: "{rounded.tag}"
    padding: "4px 8px"
  surface:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
  navigation:
    backgroundColor: "{colors.ink}"
    rounded: "40px"
    padding: "5px"
---
# Design System: Alwin

## Overview
**Creative North Star: "Life in motion"**

The user's supplied milk-site reference establishes the organic dividing edge, expressive display type and rounded cards. Its geometry is adapted to the approved grayscale palette and the existing personal planner. The reference's commercial content is not part of this product.

**Key Characteristics:**
- Soft gray masthead above a black working area.
- Locally embedded display script paired with readable sans-serif task text.
- Pale rounded surfaces, pill navigation and an organic SVG boundary.

## Colors
Primary emphasis uses Ink; Canvas and Paper provide the pale upper and working surfaces. Destination and Project distinguish large supporting cards through tone. Muted and Rule support metadata and row separation. Status meaning always has a text label.

## Typography
Lobster is the display face for the wordmark, page title, destination heading, project titles and dialogs. It is embedded in `web/style.css`; its SIL Open Font License is in `web/OFL-Lobster.txt`. Fonts make no third-party requests. System sans serves tasks, section headings, controls and metadata.

The frontmatter records base roles; responsive display and component sizes remain in CSS. Page titles become 49px on phones. Functional text is explicitly at least 11px. The small desktop wordmark tagline is decorative. Meaningful section headings use semantic heading elements; ordinary support copy does not substitute for a heading.

## Layout
Desktop uses a centered shell up to 1480px with a horizontal masthead and black pill navigation. There is no left rail. The organic edge introduces the black workspace. Focus and destination form two columns; milestones use four columns; paired lower sections and source cards use two.

At 1100px outer padding reduces from 24px to 16px and inner gaps tighten. Below 760px outer padding and shell rounding disappear, working sections stack, milestones use two columns, and navigation becomes fixed above the safe-area bottom inset. Footer clearance and the raised toast keep the page end usable beneath navigation. At 1600px interior insets expand.

## Elevation & Depth
Tone and geometry carry most depth. The desktop shell uses `12px 26px 70px #00000017`; dialogs use `0 22px 90px #00000040` over a dark translucent backdrop. Cards remain flat. Focus uses a visible 3px gray outline with 4px offset.

## Shapes
The reusable working surface has generous rounding; project cards are slightly tighter. Pill buttons and navigation, circular task checks, task stars and icon controls complement the irregular SVG divider. The user reference authorizes this organic geometry.

## Components
Primary buttons use Ink and white; outline buttons have transparent fill and a neutral stroke. Fields use a pale fill, neutral border and rounded corners. Hover stays grayscale; disabled controls reduce opacity. Navigation has a pale selected pill inside the black container and retains all five labeled views on phones.

Task rows keep sans text, circular completion controls, source links and star controls. Starring selects Today's focus locally; completion remains a version-checked source edit. Source notes open as plain text in a native dialog. The loading dot is static. State changes use bounded motion: a sliding navigation pill (280ms), view continuity (250ms), focus selection (300ms) and dialog entry (260ms), all with cubic-bezier(.16,1,.3,1). Reduced-motion removes spatial effects; refresh rotation stops with the request. Reference notes use disclosure rows, and the Brain library supports full-text search. Source Markdown is rendered as safe DOM text with contained table scrolling.

## Do's and Don'ts
- **Do** preserve monochrome states, visible focus, source labels and readable sans-serif controls.
- **Do** retain the organic boundary and rounded surfaces when extending this visual system.
- **Do** keep reference imagery separate from genuine rendered evidence.
- **Don't** import the reference's milk branding, commercial copy or product claims.
- **Don't** turn recorded plans or sample data into claims of progress or a live connection.

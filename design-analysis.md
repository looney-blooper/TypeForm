# Typeform Design Analysis & Design System Spec

This is what we'll build the frontend against. It covers the three UI
surfaces we need to clone: the **respondent flow**, the **builder**, and
the **dashboard**.

## 1. Respondent Flow (the signature experience — highest priority)

This is the single most recognizable thing about Typeform. Key patterns:

**Layout**
- Full-viewport, one question per screen. No scrolling, no visible chrome
  except a thin progress bar and a small logo/branding corner.
- Question content is vertically centered-left on desktop, roughly the
  left 60% of the screen; a background color/image can fill the rest.
  On mobile it's simply centered, full-width.
- A question number badge sits above the question title in small
  muted text: e.g. `1 →` or `1/8`.

**Typography**
- Question titles are huge — 32–48px, bold, tight line-height. This is
  the dominant visual element on every screen.
- Typeform uses a proprietary/custom typeface in production; we'll use a
  clean geometric-humanist sans (Inter or system-ui stack) at similar
  weights/sizes to approximate the feel without needing licensed fonts.
- Help/description text under the title is small, muted gray, regular weight.

**Interaction pattern**
- Only one input is visible/focused at a time. Answering (typing, clicking
  a choice, selecting a rating) auto-advances after a short delay, OR the
  user presses **Enter** / clicks a black circular "OK" arrow button
  bottom-left of the input.
- A persistent hint bottom-right: `press Enter ↵`.
- Multiple-choice options are big tappable rows, each prefixed with a
  keyboard letter badge (A, B, C...) so power users can just type the
  letter. Selected state = filled black background, white text, with a
  checkmark.
- Transitions between questions: the outgoing question slides/fades up
  and out, the incoming one slides/fades up and in — quick (200–300ms),
  vertical motion, no jarring cuts.
- Back navigation: small up-chevron arrow (or Shift+Enter) top-left of
  the input area to go to the previous question, keeping the animation
  consistent but reversed.

**Progress bar**
- A thin (3–4px) bar fixed to the top of the viewport, filled left-to-right
  in the accent color as questions are answered. No percentage text by
  default — the bar alone communicates progress.

**Color / theme defaults**
- Default theme is stark: white or very light background, near-black
  text (`#191919` rather than pure `#000`), and ONE accent color used for
  the progress bar, the selected-choice state, and the OK button.
- This is exactly why our `Form.theme` JSON schema (`primaryColor`, `font`,
  `background`) matters — every published form can override these three
  tokens and the whole respondent experience re-skins itself.
- **Correction based on further research: Typeform themes are richer than
  a single accent color.** Pulled directly from Typeform's own public API
  schema for themes:

  ```json
  {
    "name": "My theme",
    "font": "Arial",
    "rounded_corners": "small",
    "has_transparent_button": false,
    "colors": {
      "question": "#000000",
      "answer": "#800000",
      "button": "#808080",
      "background": "#FFFFFF"
    },
    "background": {
      "layout": "fullscreen",
      "image_id": 987,
      "brightness": -0.59
    },
    "fields": { "alignment": "left", "font_size": "medium" },
    "screens": { "alignment": "center", "font_size": "small" }
  }
  ```

  Four separate colors (not one accent): `question` (title text),
  `answer` (input/selected-choice text), `button` (the OK button /
  primary action), `background`. Plus a background **image** (with its
  own brightness/darken overlay so text stays legible over photos), a
  `rounded_corners` setting that cascades to every button/input on the
  form, and independent font-size/alignment controls for questions vs.
  welcome/ending screens.
- Typeform ships a **gallery of preset themes** (solid-color minimalist
  ones like the classic black-on-white, plus photography-driven ones with
  a full-bleed background image and a dark overlay for contrast) that a
  creator picks from, then can still override any individual token. We
  should replicate this: a handful of built-in presets + full custom.

**Per-question images (this is the "images near the forms" the person
asked about)**
- Independent of the form-level background image above, **individual
  questions** can carry their own image or GIF, with a **Layout** control:
  - `fullscreen` — image fills the screen, text overlaid on top (with a
    scrim/gradient for legibility)
  - `split-right` / `split-left` — screen divides in half; question text
    on one side, image filling the other (this is the most iconic one —
    "Split" layout)
  - `float` — a smaller image floats above/beside the question text on
    an otherwise plain background
  - `background` — same as the form-level background image, but
    scoped to just this one question
- This maps cleanly onto our existing `Question.settings` JSON column —
  no schema/migration change needed, just a documented shape:
  ```json
  "settings": {
    "media": { "url": "https://...", "layout": "split-right" },
    "choices": [ ... ]
  }
  ```

**Welcome & thank-you screens**
- Welcome screen: big title, optional description, a single black
  "Start" pill button with the estimated time/question count as small
  muted text beneath it.
- Thank-you screen: centered checkmark or custom message, no further
  action needed — this maps directly to `Form.thank_you_message`.

## 2. Builder

**Three-pane layout**
- **Left sidebar**: vertical list of question "cards" in order, each
  showing a small type icon, truncated title, and a drag handle. Clicking
  selects it for editing; a `+ Add question` control sits at the bottom
  or as a floating action button. This is the drag-and-drop reorder
  target (dnd-kit maps well here).
- **Center canvas**: live, full-size preview of the currently-selected
  question exactly as a respondent would see it — this doubles as both
  the editor context and the "live preview" requirement.
- **Right panel**: tabbed settings for the selected question — Content
  (title, description, choices), Logic (placeholder/bonus), Design
  (per-form theme, not per-question).

**Top bar**
- Form title (inline-editable), a Draft/Published status pill, a
  Preview button, and a prominent black Publish button on the right.
  Autosave indicator ("Saved" / "Saving...") near the title.

**Visual tone**
- Builder chrome (sidebars, panels) uses a light neutral gray
  (`#F7F7F7`-ish) background to visually separate "tool" from "canvas,"
  while the center canvas preview renders on white/whatever the form's
  own theme is — this contrast is what makes the live preview read as
  "real" rather than another settings panel.

## 3. Dashboard (Form Management)

- Grid of form cards (not a dense table) — each card shows the form
  title, a status pill (Draft/Published), response count, and a
  thumbnail-style color swatch from the form's theme.
- Card hover reveals a `⋯` overflow menu: Edit, Duplicate, Publish/
  Unpublish, Delete (delete requires a confirm modal).
- A prominent `+ Create form` card/button, typically top-left of the grid.
- Minimal top nav: workspace name, search, the create button.

## Form Theme Schema (replaces the earlier flat `primaryColor`/`font` sketch)

Stored in `Form.theme` (JSON column, no migration needed — this is just
documenting the shape the frontend/backend agree to use):

```json
{
  "font": "Inter",
  "roundedCorners": "small",           // "none" | "small" | "large"
  "colors": {
    "question": "#191919",
    "answer": "#191919",
    "button": "#191919",
    "background": "#FFFFFF"
  },
  "background": {
    "layout": "none",                  // "none" | "fullscreen"
    "imageUrl": null,
    "brightness": 0                    // -1..1, darken/lighten overlay for legibility
  }
}
```

`Question.settings.media` (optional, per-question, independent of the
form-level background) for the per-question image layouts:

```json
{
  "media": { "url": "https://...", "layout": "split-right" },
  "choices": [ ... ]
}
```
`layout` ∈ `"split-right" | "split-left" | "float" | "background"`.

## Preset Theme Gallery (bonus scope: custom themes)

Ship a handful of built-in presets the creator can pick from in the
builder's Design tab, each just a value conforming to the schema above,
plus "Custom" for full manual control:

| Preset | colors.background | colors.question/button | background.layout |
|---|---|---|---|
| Classic (default) | `#FFFFFF` | `#191919` | none |
| Midnight | `#191919` | `#FFFFFF` | none |
| Coral | `#FFF4F0` | `#E8543D` | none |
| Ocean | `#F0F7FF` | `#1E6FD9` | none |
| Photo — Mountains | `#FFFFFF` | `#FFFFFF` | fullscreen + stock image, brightness -0.4 |
| Photo — Studio | `#FFFFFF` | `#FFFFFF` | fullscreen + stock image, brightness -0.4 |

## Design Tokens (Tailwind config / CSS variables — builder chrome & UI shell)

These are separate from the per-form theme above; they style the
*builder/dashboard app itself*, which always looks the same regardless
of what theme a given form uses.

```
--color-bg: #ffffff
--color-fg: #191919          /* near-black, not pure black */
--color-fg-muted: #6b7280
--color-border: #e5e7eb
--color-surface: #f7f7f7      /* builder chrome background */
--color-accent-default: #191919
--color-danger: #dc2626
--font-sans: 'Inter', system-ui, -apple-system, sans-serif

--radius-sm: 6px
--radius-md: 10px
--radius-full: 999px          /* pill buttons, progress bar caps */

--question-title-size: clamp(28px, 5vw, 44px)
--question-title-weight: 700
--question-title-leading: 1.15

--transition-question: 260ms cubic-bezier(0.4, 0, 0.2, 1)
```

## Component Inventory (frontend/components)

```
respondent/
  QuestionSlide.tsx        - animated wrapper per question (Framer Motion)
  ChoiceOption.tsx         - keyboard-lettered selectable row
  RatingInput.tsx          - star/number rating
  ProgressBar.tsx          - top-fixed thin bar
  OkButton.tsx             - circular black "advance" button + Enter hint
  QuestionMedia.tsx        - renders settings.media per its layout (split/fullscreen/float/background)
  ThemedBackground.tsx     - applies Form.theme.background (color or full-bleed image + brightness overlay)
  WelcomeScreen.tsx / ThankYouScreen.tsx

builder/
  QuestionListSidebar.tsx  - dnd-kit sortable list
  QuestionEditorPanel.tsx  - right-panel tabs (Content/Logic/Design)
  LivePreviewCanvas.tsx    - renders the same respondent components in "preview" mode
  QuestionTypePicker.tsx   - the "+ Add question" type menu
  MediaPicker.tsx          - upload/URL + layout selector for per-question images
  ThemeGallery.tsx         - preset theme picker + custom color/font/corner controls
  BuilderTopBar.tsx        - title, status pill, preview/publish

dashboard/
  FormCard.tsx
  CreateFormCard.tsx
  FormOverflowMenu.tsx

ui/ (shared primitives)
  Button.tsx, Modal.tsx, Toast.tsx, Pill.tsx, Input.tsx
```

## Key Takeaway for Implementation

The respondent flow and the builder's center canvas should literally
**share components** — a question renders the same way whether it's in
"fill mode" (respondent) or "preview mode" (builder), just with
interaction disabled/enabled differently. This guarantees the live
preview is pixel-accurate rather than a second implementation that can
drift out of sync — and it's the detail most likely to make or break the
"looks like real Typeform" evaluation criterion.

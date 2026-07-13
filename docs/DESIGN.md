# Design — Strength Stack

## 1. Aesthetic direction

**Blueprint/technical.** Strength Stack looks like a materials-engineering
schematic come to life: a deep navy sheet, fine cyan grid lines like graph
paper, and data drawn the way an engineer would annotate it — clean bars,
tick marks, and precise labels. It borrows the credibility of an Ashby
chart without the intimidation: the grid says "real data," the warm amber
highlight says "this part is for you."

This direction was chosen deliberately over a generic dark-cards-plus-accent
theme: the grid-paper background and cyan/amber pairing are specific to the
"schematic made friendly" idea and aren't reused from a stock dark-mode
template.

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0a1628` | Page background |
| `--color-surface-1` | `#0f1f3a` | Panels (chart, tray) |
| `--color-surface-2` | `#16294a` | Raised elements (buttons, chips) |
| `--color-text` | `#e8f0fb` | Primary text |
| `--color-text-muted` | `#7d92b3` | Secondary text, values |
| `--color-accent` | `#4fd1ff` | Bars, links, focus rings — "blueprint cyan" |
| `--color-accent-support` | `#ffb454` | Celebration highlight, favicon spark |
| `--color-success` | `#6ee7a8` | Positive/confirm states |
| `--color-danger` | `#ff6b6b` | Errors |

- **Type pairing:** display = [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk)
  (700 for the wordmark, 500 for headings) — geometric, technical, a little
  futuristic. UI = [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans)
  (400/500/600) — designed for engineering documentation, reads clean at
  small sizes. Both fall back to `system-ui, sans-serif`.
- **Spacing scale:** 8px base — `4 / 8 / 16 / 24 / 32 / 48px`
  (`--space-1` … `--space-6`).
- **Corner radius:** `4px` small elements, `8px` panels — sharp enough to
  read as technical, not a rounded consumer-app look.
- **Shadow/glow:** no drop shadows; depth comes from a soft cyan glow
  (`0 0 24px rgba(79, 209, 255, 0.25)`) on panels and hovered controls,
  like backlit schematic glass.
- **Motion:** UI transitions 180ms, chart rescale/re-sort transitions
  300ms, drag-drop feedback 100ms — all `cubic-bezier(0.16, 1, 0.3, 1)`
  ease-out.

## 3. Layout intent

The **chart is the hero**. On desktop (1440×900) it occupies the left ~70%
of the viewport at ≥60vh, with a materials tray docked to the right (~25%).
On phone (390×844) the tray drops below the chart in a single column; the
chart keeps a tall minimum height (50vh) rather than shrinking to a
thumbnail. The grid-paper background carries the page's atmosphere at every
size so there's never a dead flat expanse.

## 4. Signature detail

The **wordmark** ("Strength" in cyan-white, "Stack" in accent cyan) doubles
as the favicon's ascending-bars mark — a small nod to the chart itself. The
grid-paper background is the second signature touch: it's present on every
screen and reinforces the "materials schematic" premise without needing
decoration elsewhere.

## 5. Juice plan (the wow moment)

Dragging **snail teeth** onto a chart anchored by steel/bone/concrete is
the core moment the whole app builds toward. The feedback sequence:

1. **Drop feedback** — the chip snaps into the tray-to-chart transition
   with a quick scale-pop (100ms) on release.
2. **Rescale** — the x-axis domain animates to the new max over 300ms;
   every existing bar re-flows to its new width/position in the same
   transition (D3 enter/update/exit, not a hard redraw).
3. **Re-sort** — bars reorder by rank; snail teeth's bar travels to the
   top row.
4. **Celebration highlight** — the snail-teeth bar and label pulse in
   `--color-accent-support` (amber) for ~600ms, with a brief outer glow,
   before settling to the normal accent color.
5. **Synth SFX** (WebAudio, generated in code, no audio files):
   - `place` — soft short blip (sine, ~440Hz, 60ms) when any material
     lands on the chart
   - `rescale` — a quick ascending two-note sweep as the axis animates
   - `celebrate` — a brighter three-note chime when a material takes the
     top spot
   - All rate-throttled, subtle volume (~-18dB), created lazily on first
     user gesture, with a mute toggle in the header that persists to
     `localStorage`.
6. Respects `prefers-reduced-motion`: rescale/re-sort still happen
   (they're functional, not decorative) but the pulse/glow/particle
   flourish is dropped in favor of a plain color change.

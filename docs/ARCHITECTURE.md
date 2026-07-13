# Architecture — Strength Stack

Static TypeScript + D3 app, built with Vite. No backend, no build-time
data fetching — everything ships in one self-contained bundle.

## Modules (`src/`)

- **`materials.ts`** — the dataset (12 materials: id, name, category,
  tensile strength, density, one-line fact) plus pure functions:
  `specificStrength()` (tensile ÷ density, the app's single comparable
  value) and `rankByStrength()` (descending sort by that value). No DOM,
  no D3 — this is the layer chart-correctness tests target directly.
- **`state.ts`** — `ChartStore`: a minimal pub/sub holding the currently
  *placed* materials. `place()`/`remove()` mutate and notify listeners
  with `(placed, justPlacedId)`; `justPlacedId` is the id that triggered
  the update (`null` for a removal), so subscribers can tell a deliberate
  drop apart from a re-sort and only react to the former (SFX,
  celebration). The store is seeded with the default demo set via its
  constructor rather than by calling `place()` in a loop, specifically so
  startup never fires the just-placed celebration path.
- **`chart.ts`** — `StrengthChart`: renders the placed set as a ranked
  horizontal bar chart with D3's enter/update/exit join (redraws in
  place, never tears down the SVG). Key behaviors:
  - Row height and vertical spacing (`rowBand`/`barHeight`) are computed
    from the container's available height each render, so a short placed
    set fills the panel instead of leaving dead space below the last bar.
  - Margins are responsive (`computeMargin`): a compact preset kicks in
    under 480px so labels/values still fit on a phone.
  - Value labels place themselves *inside* a bar when there's room,
    otherwise just outside (`positionValueLabel`) — position depends on
    each bar's own rendered width, not a fixed column, so it can never
    collide with the remove control regardless of screen size.
  - Long labels that don't fit their column truncate with an ellipsis
    (`fitLabelWidth`), measured via `getComputedTextLength` (a no-op
    under jsdom, which doesn't implement it — tests stub it directly).
  - `render()` returns `true` when the just-placed material landed at
    rank 1, so callers can trigger the celebration chime without
    duplicating the rank check.
  - The remove control on each row is a custom SVG group (circle + ×,
    not a native `<button>`) wired to both `click` and `keydown`
    (Enter/Space) so it's operable without a mouse.
- **`drag.ts`** — `enableDragToPlace()`: one Pointer Events implementation
  for drag-to-place that covers mouse and touch identically. A press that
  moves less than the drag threshold is left alone so the tray button's
  own `click` handler still handles tap/keyboard placement; a real drag
  suppresses the trailing synthetic click so a successful drop doesn't
  double-place.
- **`sound.ts`** — `SoundEngine`: WebAudio-synthesized SFX (place/
  rescale/celebrate — sine oscillators, no audio files) per
  `docs/DESIGN.md`'s juice plan. The `AudioContext` is created lazily on
  first play (always from a user gesture), every call is a safe no-op
  where WebAudio isn't available, and the mute flag persists to
  `localStorage`.
- **`main.ts`** — wires everything together: builds the static layout
  shell, renders the tray (one button per material, drag source +
  click/keyboard target), subscribes the chart/tray/sound/live-region to
  the store, and manages focus so a chip that disables itself on
  placement doesn't drop focus to `<body>`.
- **`style.css`** — design tokens (colors, type, spacing, motion) from
  `docs/DESIGN.md` as CSS custom properties, plus all component styles.
  A `prefers-reduced-motion` override collapses CSS animation/transition
  durations globally; D3's own transitions (rescale/re-sort) are
  JS-timed and stay functional either way, per the design standard.

## Data flow

```
user drag/click/keyboard → ChartStore.place()/remove()
                              → notify(placed, justPlacedId)
                                  → StrengthChart.render() (redraws bars, returns celebrated?)
                                  → renderTray() (rebuilds tray buttons + focus handoff)
                                  → SoundEngine.playPlace()/playRescale()/playCelebrate()
                                  → live-region announce()
```

There's no other state layer — `ChartStore` is the single source of
truth, and every render is a pure function of its current placed set.

## Testing

- `tests/materials.test.ts`, `tests/chart.test.ts` — pure logic
  (`specificStrength`, `rankByStrength`), no DOM.
- `tests/chart-labels.test.ts` — the label/value layout helpers in
  isolation, with `getComputedTextLength` stubbed per case.
- `tests/drag.test.ts` — `enableDragToPlace` against synthetic
  `PointerEvent`s, independent of the rest of the app.
- `tests/state.test.ts` — `ChartStore` notification payloads.
- `tests/sound.test.ts` — `SoundEngine` with a fake `AudioContext`
  (mute persistence, throttling, no-WebAudio safety).
- `tests/main.test.ts` — end-to-end through the wired app (jsdom):
  drag-drop placement, remove control, the wow-moment celebration,
  SFX triggers, mute toggle, and live-region/focus behavior. Uses fake
  timers because jsdom doesn't implement `SVGTransformList`, which D3's
  transform transitions need — freezing the clock keeps the animation
  frame that would hit that gap from ever firing.

Run everything: `npm test` (vitest, jsdom environment — see
`vitest.config.ts`). Type-check: `npm run build` (`tsc -b && vite build`).
Lint: `npm run lint`.

## Build & deploy

`vite.config.ts` sets `base: "./"` so the production build
(`npm run build` → `dist/`) works from any subpath, e.g.
`apps.charliekrug.com/strength-stack/`. No environment variables, no
server-side rendering, no API calls at runtime.

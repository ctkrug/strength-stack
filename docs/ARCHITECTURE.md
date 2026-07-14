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
  - Each row also gets a transparent `rect.material-row__hit` spanning
    its full width and band height, behind the bar/label/remove control.
    SVG groups only receive pointer events over painted descendants, so
    without it, hovering the empty gap next to a short bar would miss
    the row's hover/tap/focus handlers entirely.
  - `StrengthChart` takes a `DetailPanel` collaborator (`show`/`hide`) in
    its constructor and wires mouseenter/mousemove/click/focus/blur on
    each row to it — hover, tap (touch has no hover state, so tap
    synthesizes a `click`), and keyboard focus all surface the same
    detail panel.
- **`drag.ts`** — `enableDragToPlace()`: one Pointer Events implementation
  for drag-to-place that covers mouse and touch identically. A press that
  moves less than the drag threshold is left alone so the tray button's
  own `click` handler still handles tap/keyboard placement; a real drag
  suppresses the trailing synthetic click so a successful drop doesn't
  double-place.
- **`tooltip.ts`** — `MaterialTooltip`: one lazily-created DOM panel showing
  a material's tensile strength, density, specific strength, and fact.
  `show()` repopulates and repositions the same node (clamped to the
  viewport) rather than building a new element per material; `hide()`
  just toggles its `hidden` attribute. Implements `chart.ts`'s
  `DetailPanel` interface, so `chart.test.ts`-style tests can fake it
  without touching the DOM.
- **`sound.ts`** — `SoundEngine`: WebAudio-synthesized SFX (place/
  rescale/celebrate — sine oscillators, no audio files) per
  `docs/DESIGN.md`'s juice plan. The `AudioContext` is created lazily on
  first play (always from a user gesture), every call is a safe no-op
  where WebAudio isn't available, and the mute flag persists to
  `localStorage`.
- **`main.ts`** — wires everything together: builds the static layout
  shell, renders the tray grouped into one section per
  `MaterialCategory` (natural/metal/synthetic-fiber, in `CATEGORY_ORDER`)
  under a heading, plus a legend naming what each category's accent
  means. Each chip is a drag source + click/keyboard placement target
  and also wires hover/focus to the shared `MaterialTooltip`. Subscribes
  the chart/tray/sound/live-region to the store, and manages focus so a
  chip that disables itself on placement doesn't drop focus to `<body>`.
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
                                  → renderTray() (rebuilds grouped tray chips + focus handoff)
                                  → SoundEngine.playPlace()/playRescale()/playCelebrate()
                                  → live-region announce()

user hover/tap/focus (bar or chip) → MaterialTooltip.show()/hide()
```

There's no other state layer — `ChartStore` is the single source of
truth, and every render is a pure function of its current placed set.
The tooltip is a side-channel: it reads a `Material` directly from the
event, not from the store, so it never needs to trigger a re-render.

## Testing

- `tests/materials.test.ts`, `tests/chart.test.ts` — pure logic
  (`specificStrength`, `rankByStrength`), no DOM. `materials.test.ts`
  also has a `fast-check` property-based block: arbitrary materials
  check that `specificStrength` is always positive and scales
  linearly/inversely with tensile strength/density, and that
  `rankByStrength` always returns a same-length permutation, sorted
  descending, and idempotent — invariants the fixed 12-material
  dataset alone can't exercise across the range fast-check generates.
- `tests/chart-labels.test.ts` — the label/value layout helpers in
  isolation, with `getComputedTextLength` stubbed per case.
- `tests/chart-empty.test.ts` — the empty-placed-set message appears/
  disappears correctly as materials are added/removed.
- `tests/chart-responsive.test.ts` — the container-size-driven
  branches (`computeMargin`'s compact/default breakpoint, height-driven
  row band, the minimum-row-band fallback) with `clientWidth`/
  `clientHeight` stubbed per case, plus that the `<svg>` element
  persists identity across repeated renders (never torn down).
- `tests/drag.test.ts` — `enableDragToPlace` against synthetic
  `PointerEvent`s, independent of the rest of the app: threshold
  crossing, multi-pointer isolation, touch parity, and window-blur
  cancellation.
- `tests/state.test.ts` — `ChartStore` notification payloads.
- `tests/sound.test.ts` — `SoundEngine` with a fake `AudioContext`
  (mute persistence, throttling, no-WebAudio safety).
- `tests/tooltip.test.ts` — `MaterialTooltip` show/hide, DOM node reuse,
  visibility, and viewport-edge safety (including a zero-size viewport).
- `tests/chart-detail.test.ts` — `StrengthChart`'s detail-panel wiring
  against a fake `DetailPanel`: hover/tap/focus/blur per row, and that
  clicking remove doesn't also bubble into the row's own handler.
- `tests/main.test.ts` — end-to-end through the wired app (jsdom):
  drag-drop placement, remove control, the wow-moment celebration,
  SFX triggers, mute toggle, live-region/focus behavior, the tooltip on
  bars and tray chips, the category-grouped tray with its legend, and
  long-session place/remove churn (no leaked DOM nodes or duplicate
  singletons). Uses fake timers because jsdom doesn't implement
  `SVGTransformList`, which D3's transform transitions need — freezing
  the clock keeps the animation frame that would hit that gap from
  ever firing (this is also why row *position* after a re-sort isn't
  asserted directly — `rankByStrength`'s property tests cover sort
  correctness instead).

Run everything: `npm test` (vitest, jsdom environment — see
`vitest.config.ts`). Coverage: `npm run test:coverage` (v8 provider).
Type-check: `npm run build` (`tsc -b && vite build`). Lint: `npm run lint`.

## Build & deploy

`vite.config.ts` sets `base: "./"` so the production build
(`npm run build` → `dist/`) works from any subpath, e.g.
`apps.charliekrug.com/strength-stack/`. No environment variables, no
server-side rendering, no API calls at runtime.

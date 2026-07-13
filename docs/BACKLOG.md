# Backlog — Strength Stack

Epics are ordered so the wow moment is reachable first. All stories start
unchecked; check them off as builds land.

## Epic 1 — Core drag-and-drop chart

### [x] 1. Wow moment: dragging snail teeth rescales the chart and celebrates
The chart starts with steel, bone, and concrete placed. Dragging the
"Snail Teeth" chip from the tray onto the chart animates the x-axis to
the new max, re-sorts every bar, and highlights the snail-teeth bar.

- Dropping "Snail Teeth" on the chart moves it to the top (rank 1) row
  within the same render pass — no manual refresh needed.
- The snail-teeth bar and its label visibly pulse in the amber
  `--color-accent-support` for roughly 500–700ms before settling to the
  normal accent color.
- The rescale/re-sort/highlight sequence completes in under 1.5s end to
  end and does not require a page reload or teardown of the SVG.

### [x] 2. Drag-and-drop placement for every material, mouse and touch
Any tray chip can be dragged onto the chart panel to place it; touch
drag works on a phone-width viewport, not just mouse drag on desktop.

- Dragging any of the 12 tray chips onto the chart panel places that
  material and removes it from the tray (or marks it placed/disabled).
- The same placement works via touch drag on a 390px-wide viewport,
  verified in a mobile emulation pass.
- Dropping outside the chart panel is a no-op — the chip returns to the
  tray with no error and no partial placement.

### [x] 3. Remove a placed material from the chart
A placed material can be taken back off the chart, returning it to the
tray as available.

- Each placed bar has a visible, themed remove control (not a bare "x"
  with no hover/focus state).
- Removing a material re-triggers the rescale/re-sort transition for the
  remaining bars.
- The removed material's tray chip becomes enabled/available again.

### [x] 4. Chart correctness across the full dataset in any order
The chart must rank and rescale correctly no matter which materials are
placed or in what order — the wow-moment path isn't the only path that
has to work.

- Placing all 12 materials in randomized order produces bars sorted
  strictly descending by specific strength (kN·m/kg).
- The x-axis max always reflects the current highest placed value
  (verified by placing then removing the top-ranked material and
  confirming the axis rescales down).
- Unit test coverage exists for the ranking/sort logic independent of
  the DOM (extends `tests/materials.test.ts` or a new `tests/chart.test.ts`).

### [ ] 5. Design polish: chart panel matches docs/DESIGN.md
The chart panel is reviewed against the design brief, not just left as
the SCOPE-phase placeholder styling.

- Panel glow, spacing, and corner radius match the token values in
  `docs/DESIGN.md` exactly (spot-checked with dev tools).
- Bar/label/value typography uses the IBM Plex Sans / Space Grotesk
  pairing at the documented type scale, not default system fonts.

## Epic 2 — Materials data & detail

### [ ] 6. Material detail on hover/tap
Hovering (desktop) or tapping (touch) a placed bar or tray chip surfaces
its tensile strength, density, specific strength, and one-line fact.

- Hovering a chart bar shows a themed tooltip/panel with all four values
  within 150ms, dismissed on mouse-out.
- Tapping a bar on a touch device shows the same detail without
  requiring a hover state that touch can't produce.

### [ ] 7. Category-coded tray with legend
Tray chips are visually grouped by category (natural / metal /
synthetic-fiber) so the dataset reads as organized, not a flat list.

- Each of the 3 categories renders with a distinct, documented accent
  treatment (color chip, icon, or grouped heading) consistent with
  `docs/DESIGN.md`'s palette.
- A legend or grouped headings identify what each treatment means
  without requiring a tooltip to decode.

### [ ] 8. Design polish: tray chips and legend
Tray chips get the same craft pass as the chart panel — this is where a
scaffold most often stays visually flat.

- Every tray chip has themed hover, focus-visible, active, and disabled
  states (placed materials read as clearly disabled, not just grayed
  text).
- Category color-coding passes a 4.5:1 contrast check against the tray
  background for any text drawn in that color.

## Epic 3 — Juice, sound & accessibility

### [x] 9. Synth SFX with a persistent mute toggle
WebAudio-synthesized sound effects play for place/rescale/celebrate per
the juice plan in `docs/DESIGN.md`, with a mute control.

- Placing a material plays a short synthesized blip; taking the top
  spot plays a distinct celebratory chime — both generated via
  oscillators/noise, zero audio files in the repo.
- A mute toggle in the header silences all SFX and its state persists
  across a page reload via `localStorage`.
- The `AudioContext` is created lazily on first user gesture and the app
  does not throw or log errors in an environment without WebAudio
  (e.g. the test runner).

### [x] 10. Respect prefers-reduced-motion
Users with reduced-motion preferences still get full chart functionality
without the decorative flourishes.

- With `prefers-reduced-motion: reduce` simulated, the celebratory pulse
  and any particle/shake effect are skipped in favor of an instant color
  change, while rescale/re-sort still happen (they're functional, not
  decorative).
- No console errors or layout breakage occur in either motion mode.

### [ ] 11. Keyboard-accessible placement
A visitor who can't drag (keyboard-only, screen reader, motor
impairment) can still place and remove every material.

- Every tray chip is reachable via Tab and can be placed onto the chart
  with Enter/Space, with no mouse involved.
- Focus order is logical (tray chip → chart update → focus lands
  somewhere sensible, not lost to `<body>`) and status changes are
  announced via an `aria-live` region.

### [ ] 12. Design polish: responsive + brand review
A dedicated pass confirms the whole page — not just the chart — holds
up at every breakpoint named in `docs/DESIGN.md`.

- The page is checked at 390×844, 768×1024, and 1440×900 with no
  horizontal scroll, no overlapping elements, and no dead empty margins
  around a small widget.
- Favicon and wordmark render correctly (no default globe icon, no
  system-font fallback visible on a font-loaded connection).

## Epic 4 — Ship

### [ ] 13. Deployable static build with share metadata
The production build is a self-contained static bundle ready for
`apps.charliekrug.com/strength-stack`, with metadata for link previews.

- `npm run build` output loads correctly when served from a non-root
  subpath (verified by serving `dist/` from e.g. `/strength-stack/`
  locally) — confirms the relative-asset-path setup holds under load.
- `index.html` includes Open Graph / Twitter Card meta tags (title,
  description, at minimum) so shared links render a real preview.

### [ ] 14. CI gate enforced on main
The GitHub Actions workflow added in SCOPE is treated as a hard gate,
not a soft signal.

- Branch protection (or an equivalent documented process) requires the
  CI workflow to pass before merging to `main`.
- `npm run lint`, `npm test`, and `npm run build` all exit 0 on the
  final `main` commit for this milestone.

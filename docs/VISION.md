# Vision — Strength Stack

## The problem

Materials scientists have a great tool for comparing strength-to-weight:
the Ashby chart. It's dense, log-scaled, plots dozens of properties at
once, and lives in CAD/engineering software. It was never built for a
curious general reader who just wants a straight answer to "is X actually
stronger than steel, once you account for weight?" That question gets
asked constantly (spider silk vs. steel, snail teeth vs. everything) and
the honest answer usually lives in a paywalled paper or a listicle that
picks one comparison and stops.

## Who it's for

Someone with no engineering background who's curious about a specific
materials-science claim they saw somewhere ("snail teeth are the strongest
natural material") and wants to see it proven, not just told. Secondary
audience: teachers/students who want a quick, visual, correct-enough
demonstration of strength-to-weight without opening a spreadsheet.

## The core idea

One chart, one axis, one honest number: **specific strength** (tensile
strength ÷ density, in kN·m/kg). Every material — bone, steel, spider silk,
snail teeth — gets reduced to that single comparable value. The interaction
is direct manipulation: drag a material chip onto the chart and watch the
chart itself do the explaining by rescaling and re-sorting live. No reading
required to understand the result — the animation is the explanation.

## Key design decisions

- **One axis, not a 2D Ashby-style scatter.** A ranked bar chart on
  specific strength alone is legible to a first-time visitor in seconds;
  a log-log scatter with multiple properties requires a legend and prior
  knowledge to read. We trade completeness for immediate comprehension —
  that's the whole "not for engineers in CAD" bet.
- **Direct manipulation over a form/dropdown.** Dragging (or, as a
  fallback, tapping) a material chip and watching the chart react in real
  time is what makes the comparison feel proven rather than asserted.
  Static side-by-side numbers wouldn't produce the same "whoa" reaction.
- **A curated, real dataset, not a live API.** Twelve materials with
  published/representative tensile-strength and density figures are
  enough to cover natural materials, metals, and synthetic fibers, and
  they ship as static data — no backend, no rate limits, works offline
  once loaded. See `src/materials.ts` for the values and their caveat
  (representative figures for comparison, not engineering-grade specs).
- **Snail teeth as the flagship demo, steel as the anchor.** Steel is the
  material everyone already has an intuition for ("strong"); snail teeth
  is the most surprising entry in the dataset (strongest natural material
  measured, ~12× steel's specific strength). Anchoring the first-run chart
  on steel/bone/concrete and making snail teeth the first draggable move
  guarantees the wow moment is the very first thing a visitor can do.
- **Static, self-contained build.** No server, no user accounts, no
  database — the whole app is a Vite-built static bundle with relative
  asset paths, deployable to a subpath (`apps.charliekrug.com/strength-stack`)
  with zero backend to operate.

## What "v1 done" looks like

- The full drag-and-drop interaction works on desktop and touch: any
  tray material can be placed on the chart, and any placed material can
  be removed.
- The chart rescales, re-sorts, and animates correctly for the full
  12-material dataset in any order, not just the scripted demo path.
- The snail-teeth wow moment (drag → rescale → re-sort → celebratory
  highlight → sound) is implemented exactly per `docs/DESIGN.md`.
- The page matches the design standard end to end: themed controls,
  responsive at 390/768/1440px, synth SFX with a persistent mute toggle,
  a real favicon and wordmark, no anti-generic tells.
- `npm test` and `npm run build` are green in CI, and the build output is
  a self-contained static bundle with relative asset paths.

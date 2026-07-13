# Strength Stack

[![CI](https://github.com/ctkrug/strength-stack/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/strength-stack/actions/workflows/ci.yml)

**Drag materials onto a shared strength chart and watch it redraw live.**

Spider silk. Snail teeth. Kevlar. Bone. Steel. Strength Stack puts real
materials-science data on one comparable scale — **specific strength**
(tensile strength per unit weight) — so you can drag any material onto the
chart and instantly see how it stacks up against the rest, no engineering
background required.

## Why

Materials scientists compare strength-to-weight with [Ashby charts](https://en.wikipedia.org/wiki/Material_selection#Ashby_charts) —
powerful, but built for engineers in CAD software, not curious readers. There
isn't a version of this comparison built for someone who just wants to know
"wait, is snail-teeth really stronger than steel?" and watch the answer prove
itself on screen. Strength Stack is that version: drag, drop, rescale, done.

## The wow moment

Drag **snail teeth** (limpet radula, the strongest natural material ever
measured) onto a chart anchored by ordinary steel. The scale rescales live,
snail teeth pops to the top with a celebratory highlight, and steel — the
material everything else usually gets measured against — visibly shrinks in
comparison.

## How it works

Every material in the dataset carries two real physical properties:

- **Tensile strength** (MPa) — how much pulling force it takes to break
- **Density** (kg/m³) — how much it weighs for its size

Strength Stack combines them into **specific strength** (tensile strength ÷
density), the number that answers "how strong is this material actually,
once you account for how heavy it is?" That's the single axis every material
gets plotted on, so a lightweight fiber and a dense metal are finally
comparable at a glance.

## Planned features

- Drag-and-drop material chips onto a live, animated D3 chart
- Specific-strength ranking that rescales and re-sorts as materials are added
- A curated dataset spanning natural and synthetic materials (steel, bone,
  spider silk, kevlar, carbon fiber, snail teeth, and more)
- Celebratory feedback when a dragged material takes the top spot
- A static, shareable, mobile-friendly build — no backend required

## Stack

- **TypeScript** for the app and data layer
- **D3** for the chart rendering and transitions
- **Vite** for bundling and local dev
- **Vitest** for unit tests

## Development

```bash
npm install
npm run dev       # local dev server
npm test          # run the test suite
npm run build     # production build to dist/
```

## Status

Early scaffold — see [`docs/VISION.md`](docs/VISION.md) for the full design
and [`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## License

MIT — see [LICENSE](LICENSE).

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

## Features

- Drag-and-drop material chips onto a live, animated D3 chart — mouse and
  touch both work via a single Pointer Events implementation; tap or
  keyboard (Tab + Enter/Space) work too, no drag required
- Specific-strength ranking that rescales and re-sorts as materials are
  added or removed, for the full 12-material dataset in any order
- A curated dataset spanning natural and synthetic materials (steel, bone,
  spider silk, kevlar, carbon fiber, snail teeth, and more)
- Celebratory highlight and synth chime when a dragged material takes the
  top spot, with a persistent mute toggle and full `prefers-reduced-motion`
  support
- Live-region announcements and managed focus so the whole interaction is
  usable without a mouse
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

Core interaction is functionally complete: drag-and-drop placement/removal,
the snail-teeth wow moment, and synth SFX all work end to end. See
[`docs/VISION.md`](docs/VISION.md) for the full design,
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the code is
organized, and [`docs/BACKLOG.md`](docs/BACKLOG.md) for what's left.

## CI gate

Every push and pull request runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):
`npm run lint`, `npm test`, and `npm run build`, in that order. A red run on
`main` is a stop-the-line signal — fix forward before adding new work, don't
build on top of a broken commit.

## License

MIT — see [LICENSE](LICENSE).

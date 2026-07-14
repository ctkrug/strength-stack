---
title: "Building Strength Stack: a drag-and-drop materials chart in TypeScript and D3"
published: false
tags: typescript, d3, dataviz, webdev
---

"Spider silk is stronger than steel" is one of those facts that sounds fake
until you look at the numbers. It is true, but only in a specific way: per unit
weight. Steel wins on raw pulling force by a mile. Spider silk wins once you
divide that force by how much the material weighs.

That ratio has a name, **specific strength**, and materials scientists plot it
on [Ashby charts](https://en.wikipedia.org/wiki/Material_selection#Ashby_charts).
Those charts are excellent and completely uninviting: dense scatter plots built
for engineers in CAD tools. I wanted the version you can poke at. Drag a
material onto a chart, watch every bar rescale and re-sort around it, and see
for yourself where snail teeth lands next to steel.

That became [Strength Stack](https://apps.charliekrug.com/strength-stack/).
Here are the build decisions that turned out to matter.

## Keep the math out of D3

The whole app rests on one function:

```ts
export function specificStrength(material: Material): number {
  return (material.tensileStrengthMPa / material.densityKgM3) * 1000;
}
```

I deliberately kept `specificStrength` and `rankByStrength` as pure functions
in their own module, with no D3 and no DOM. That let me test ranking
correctness without rendering anything, and it opened the door to property
based tests with [fast-check](https://github.com/dubzzz/fast-check): for
arbitrary tensile-strength and density values, specific strength stays
positive, scales linearly with strength and inversely with density, and
`rankByStrength` always returns a same-length permutation sorted descending.
The fixed 12-material dataset can't exercise that range on its own.

## Redraw in place, don't tear down

The satisfying part is the live rescale, and it only works because the chart
never rebuilds itself. Every update runs through D3's enter/update/exit join
keyed by material id. Existing bars transition to their new width and row
position over 300ms instead of blinking out and back. Adding snail teeth to a
chart of steel and bone is a single animated reflow, not a redraw.

## One pointer path for mouse and touch

Drag-and-drop is where toy projects usually fork into a mouse path and a touch
path. I used Pointer Events for both. A press that moves less than a 6px
threshold is left alone, so the tray button's own click handler still handles
tap and keyboard placement. A real drag past the threshold shows a ghost, and
on drop it suppresses the trailing synthetic click so a successful drop doesn't
also fire tap-to-place and add the material twice. One code path, no device
sniffing.

## Sound with zero audio files

The place, rescale, and celebrate cues are WebAudio oscillators generated in
code, so the repo ships no binary assets. The `AudioContext` is created lazily
on the first user gesture (browser autoplay policy), each cue is rate throttled,
and the mute state persists to `localStorage`. Every call is a safe no-op where
WebAudio is missing, which keeps the test environment quiet.

## The jsdom gotcha worth knowing

Tests run in jsdom, which does not implement `SVGTransformList`. D3's transform
transitions need it, so the end-to-end tests use fake timers to freeze the clock
before the animation frame that would hit that gap ever fires. Sort correctness
is covered by the `rankByStrength` property tests instead of by asserting pixel
positions after a re-sort. That split kept the suite fast and stable at 124
tests.

## What I would change

The dataset is 12 hand-picked materials. The natural next step is a small data
file anyone can extend, plus a second axis (stiffness) to turn the bar chart
into a real two-property Ashby plot. That is a bigger project, and the bar chart
answers the "wait, really?" question well enough on its own.

Live demo: https://apps.charliekrug.com/strength-stack/
Code: https://github.com/ctkrug/strength-stack

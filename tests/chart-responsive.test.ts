import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrengthChart } from "../src/chart";
import { getMaterial } from "../src/materials";

/** jsdom reports 0 for clientWidth/clientHeight by default (no layout
 * engine) — stub them per-element so the chart's responsive branches
 * (compact margin, height-driven row spacing) are actually exercised. */
function stubSize(el: HTMLElement, width: number, height: number) {
  Object.defineProperty(el, "clientWidth", {
    value: width,
    configurable: true,
  });
  Object.defineProperty(el, "clientHeight", {
    value: height,
    configurable: true,
  });
}

describe("StrengthChart responsive layout", () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function makeChart() {
    return new StrengthChart(container, vi.fn(), {
      show: vi.fn(),
      hide: vi.fn(),
    });
  }

  it("uses the compact margin below the 480px breakpoint", () => {
    stubSize(container, 375, 0);
    const chart = makeChart();
    chart.render([getMaterial("steel")!], null);

    expect(
      container
        .querySelector(".strength-chart__plot")
        ?.getAttribute("transform"),
    ).toBe("translate(84,20)");
  });

  it("uses the default margin at and above the 480px breakpoint", () => {
    stubSize(container, 480, 0);
    const chart = makeChart();
    chart.render([getMaterial("steel")!], null);

    expect(
      container
        .querySelector(".strength-chart__plot")
        ?.getAttribute("transform"),
    ).toBe("translate(160,24)");
  });

  it("distributes a tall container's height across a short placed set instead of leaving a gap", () => {
    stubSize(container, 1000, 900);
    const chart = makeChart();
    chart.render([getMaterial("steel")!, getMaterial("bone")!], null);

    // The hit rect's height carries the computed row band directly (it's
    // set outside the transform transition, so it's readable synchronously
    // under jsdom, which can't run D3's transform tween — see the
    // beforeEach comment in chart-detail.test.ts for why). With margin
    // top/bottom of 24/32 and 2 rows in a 900px-tall container, the band
    // should be (900-24-32)/2 = 422px, well above the 56px minimum used
    // when no real container height is known.
    const hits = [
      ...container.querySelectorAll<SVGRectElement>("rect.material-row__hit"),
    ];
    expect(hits).toHaveLength(2);
    expect(Number(hits[0].getAttribute("height"))).toBeCloseTo(422, 0);
  });

  it("falls back to the minimum row band when the container reports zero height", () => {
    stubSize(container, 1000, 0);
    const chart = makeChart();
    chart.render([getMaterial("steel")!, getMaterial("bone")!], null);

    const hit = container.querySelector<SVGRectElement>(
      "rect.material-row__hit",
    )!;
    expect(Number(hit.getAttribute("height"))).toBe(56);
  });

  it("keeps the same svg element across repeated renders (never tears down)", () => {
    const chart = makeChart();
    chart.render([getMaterial("steel")!], null);
    const svg = container.querySelector("svg.strength-chart");

    stubSize(container, 375, 400);
    chart.render([getMaterial("steel")!, getMaterial("bone")!], "bone");
    chart.render([], null);
    chart.render([getMaterial("snail-teeth")!], "snail-teeth");

    expect(container.querySelectorAll("svg.strength-chart")).toHaveLength(1);
    expect(container.querySelector("svg.strength-chart")).toBe(svg);
  });
});

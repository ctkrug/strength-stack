import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrengthChart } from "../src/chart";
import { getMaterial } from "../src/materials";

describe("StrengthChart empty state", () => {
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
    return new StrengthChart(container, vi.fn(), { show: vi.fn(), hide: vi.fn() });
  }

  it("shows an empty-state message when nothing is placed", () => {
    const chart = makeChart();
    chart.render([], null);

    expect(container.querySelectorAll("g.material-row")).toHaveLength(0);
    const empty = container.querySelector(".strength-chart__empty");
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toMatch(/drag/i);
  });

  it("removes the empty-state message once a material is placed", () => {
    const chart = makeChart();
    chart.render([], null);
    expect(container.querySelector(".strength-chart__empty")).not.toBeNull();

    chart.render([getMaterial("steel")!], "steel");
    expect(container.querySelector(".strength-chart__empty")).toBeNull();
  });

  it("restores the empty-state message after the last material is removed", () => {
    const chart = makeChart();
    chart.render([getMaterial("steel")!], "steel");
    expect(container.querySelector(".strength-chart__empty")).toBeNull();

    chart.render([], null);
    expect(container.querySelector(".strength-chart__empty")).not.toBeNull();
  });
});

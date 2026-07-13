import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrengthChart } from "../src/chart";
import { getMaterial } from "../src/materials";

function fakeDetailPanel() {
  return { show: vi.fn(), hide: vi.fn() };
}

describe("StrengthChart detail panel wiring", () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
    // jsdom doesn't implement SVGTransformList, which D3's transform
    // transitions need — freeze the clock so no animation frame fires.
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderSteel() {
    const detail = fakeDetailPanel();
    const chart = new StrengthChart(container, vi.fn(), detail);
    chart.render([getMaterial("steel")!], null);
    const row = container.querySelector<SVGGElement>("g.material-row")!;
    return { detail, row };
  }

  it("shows material detail on mouseenter", () => {
    const { detail, row } = renderSteel();
    row.dispatchEvent(
      new MouseEvent("mouseenter", { bubbles: true, clientX: 5, clientY: 9 }),
    );
    expect(detail.show).toHaveBeenCalledTimes(1);
    expect(detail.show.mock.calls[0][0].id).toBe("steel");
    expect(detail.show.mock.calls[0][1]).toBe(5);
    expect(detail.show.mock.calls[0][2]).toBe(9);
  });

  it("hides material detail on mouseleave", () => {
    const { detail, row } = renderSteel();
    row.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    row.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    expect(detail.hide).toHaveBeenCalledTimes(1);
  });

  it("shows material detail on a click (touch tap has no hover state)", () => {
    const { detail, row } = renderSteel();
    row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(detail.show).toHaveBeenCalledTimes(1);
  });

  it("shows material detail on keyboard focus and hides on blur", () => {
    const { detail, row } = renderSteel();
    row.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
    expect(detail.show).toHaveBeenCalledTimes(1);

    row.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
    expect(detail.hide).toHaveBeenCalledTimes(1);
  });

  it("does not show the removed row's detail when its remove control is clicked", () => {
    const detail = fakeDetailPanel();
    const onRemove = vi.fn();
    const chart = new StrengthChart(container, onRemove, detail);
    chart.render([getMaterial("steel")!], null);

    const removeControl = container.querySelector<SVGGElement>(
      "g.material-row__remove",
    )!;
    removeControl.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(onRemove).toHaveBeenCalledWith("steel");
    expect(detail.show).not.toHaveBeenCalled();
  });

  it("gives the remove control an invisible hit target at least 44px across", () => {
    const chart = new StrengthChart(container, vi.fn(), fakeDetailPanel());
    chart.render([getMaterial("steel")!], null);

    const hit = container.querySelector<SVGCircleElement>(
      "g.material-row__remove circle.material-row__remove-hit",
    )!;
    expect(hit).not.toBeNull();
    expect(Number(hit.getAttribute("r"))).toBeGreaterThanOrEqual(22);
  });
});

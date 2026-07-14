import { beforeEach, describe, expect, it } from "vitest";
import { MaterialTooltip } from "../src/tooltip";
import { getMaterial } from "../src/materials";

describe("MaterialTooltip", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("is hidden and absent from the DOM before the first show()", () => {
    new MaterialTooltip();
    expect(document.querySelector(".material-tooltip")).toBeNull();
  });

  it("renders the material's name, stats, and fact on show()", () => {
    const tooltip = new MaterialTooltip();
    const steel = getMaterial("steel")!;

    tooltip.show(steel, 10, 10);

    const el = document.querySelector(".material-tooltip")!;
    expect(el).not.toBeNull();
    expect(el.hasAttribute("hidden")).toBe(false);
    expect(el.textContent).toContain("Steel (hardened)");
    expect(el.textContent).toContain("950 MPa");
    expect(el.textContent).toContain("7,850 kg/m³");
    expect(el.textContent).toContain(steel.fact);
  });

  it("reuses the same DOM element across multiple show() calls", () => {
    const tooltip = new MaterialTooltip();
    tooltip.show(getMaterial("steel")!, 0, 0);
    tooltip.show(getMaterial("bone")!, 0, 0);

    expect(document.querySelectorAll(".material-tooltip")).toHaveLength(1);
    expect(document.querySelector(".material-tooltip")!.textContent).toContain(
      "Bone",
    );
  });

  it("hides on hide() and reports isVisible() accordingly", () => {
    const tooltip = new MaterialTooltip();
    expect(tooltip.isVisible()).toBe(false);

    tooltip.show(getMaterial("steel")!, 0, 0);
    expect(tooltip.isVisible()).toBe(true);

    tooltip.hide();
    expect(tooltip.isVisible()).toBe(false);
    expect(
      document.querySelector(".material-tooltip")!.hasAttribute("hidden"),
    ).toBe(true);
  });

  it("is a safe no-op to hide() before show() has ever been called", () => {
    const tooltip = new MaterialTooltip();
    expect(() => tooltip.hide()).not.toThrow();
    expect(tooltip.isVisible()).toBe(false);
  });

  it("does not throw when shown at the viewport edge", () => {
    const tooltip = new MaterialTooltip();
    expect(() => tooltip.show(getMaterial("steel")!, 0, 0)).not.toThrow();
    expect(() =>
      tooltip.show(getMaterial("steel")!, 100000, 100000),
    ).not.toThrow();
  });

  it("positions relative to the raw coordinates when the viewport reports zero size", () => {
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    Object.defineProperty(window, "innerWidth", { value: 0, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 0, configurable: true });

    try {
      const tooltip = new MaterialTooltip();
      tooltip.show(getMaterial("steel")!, 50, 40);

      const el = document.querySelector<HTMLElement>(".material-tooltip")!;
      expect(el.style.left).toBe("62px");
      expect(el.style.top).toBe("52px");
    } finally {
      Object.defineProperty(window, "innerWidth", {
        value: originalWidth,
        configurable: true,
      });
      Object.defineProperty(window, "innerHeight", {
        value: originalHeight,
        configurable: true,
      });
    }
  });

  it("clamps away from the right/bottom edge accounting for its own rendered size", () => {
    // jsdom always reports 0 for offsetWidth/offsetHeight, which degrades
    // position()'s clamp to a no-op — stub real dimensions per instance so
    // the "pull back so the tooltip's own box stays on-screen" math (not
    // just the raw-coordinate clamp) is actually exercised.
    const tooltip = new MaterialTooltip();
    tooltip.show(getMaterial("steel")!, 0, 0);
    const el = document.querySelector<HTMLElement>(".material-tooltip")!;
    Object.defineProperty(el, "offsetWidth", { value: 200, configurable: true });
    Object.defineProperty(el, "offsetHeight", { value: 100, configurable: true });

    tooltip.show(getMaterial("steel")!, window.innerWidth - 5, window.innerHeight - 5);

    expect(el.style.left).toBe(`${window.innerWidth - 200 - 12}px`);
    expect(el.style.top).toBe(`${window.innerHeight - 100 - 12}px`);
  });

  it("appends to a custom root element when provided", () => {
    const root = document.createElement("div");
    root.id = "custom-root";
    document.body.appendChild(root);

    const tooltip = new MaterialTooltip(root);
    tooltip.show(getMaterial("steel")!, 0, 0);

    expect(root.querySelector(".material-tooltip")).not.toBeNull();
  });
});

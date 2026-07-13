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

  it("does not throw when shown at the viewport edge", () => {
    const tooltip = new MaterialTooltip();
    expect(() => tooltip.show(getMaterial("steel")!, 0, 0)).not.toThrow();
    expect(() =>
      tooltip.show(getMaterial("steel")!, 100000, 100000),
    ).not.toThrow();
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

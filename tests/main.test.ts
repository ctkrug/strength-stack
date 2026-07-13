import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function stubRect(el: Element, rect: Partial<DOMRect>) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => "",
    ...rect,
  } as DOMRect);
}

describe("main", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    vi.resetModules();
    // jsdom doesn't implement SVGTransformList, which D3's transform
    // transitions rely on — freeze the clock so no animation frame ever
    // fires and hits that gap. DOM structure updates happen synchronously
    // regardless (enter/exit run immediately; only the tween is deferred).
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the default demo materials on load", async () => {
    await import("../src/main");
    expect(document.querySelectorAll(".material-row")).toHaveLength(3);
  });

  it("places a material by dragging its tray chip onto the chart panel", async () => {
    await import("../src/main");

    const chartPanel = document.querySelector<HTMLElement>(".chart-panel")!;
    stubRect(chartPanel, { left: 0, top: 0, right: 900, bottom: 900 });

    const button = [
      ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
    ].find((b) => b.textContent === "Snail Teeth")!;
    stubRect(button, { left: 0, top: 0, right: 20, bottom: 20 });

    button.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 5,
        clientY: 5,
        button: 0,
        bubbles: true,
      }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 400, clientY: 400 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointerup", { clientX: 400, clientY: 400 }),
    );

    expect(document.querySelectorAll(".material-row")).toHaveLength(4);
    const rerendered = [
      ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
    ].find((b) => b.textContent === "Snail Teeth")!;
    expect(rerendered.disabled).toBe(true);
  });

  it("leaves the tray unchanged when a chip is dragged and dropped outside the chart", async () => {
    await import("../src/main");

    const chartPanel = document.querySelector<HTMLElement>(".chart-panel")!;
    stubRect(chartPanel, { left: 500, top: 500, right: 900, bottom: 900 });

    const button = [
      ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
    ].find((b) => b.textContent === "Snail Teeth")!;
    stubRect(button, { left: 0, top: 0, right: 20, bottom: 20 });

    button.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 5,
        clientY: 5,
        button: 0,
        bubbles: true,
      }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 10, clientY: 10 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointerup", { clientX: 10, clientY: 10 }),
    );

    expect(document.querySelectorAll(".material-row")).toHaveLength(3);
    expect(button.disabled).toBe(false);
  });

  it("removes a placed material when its remove control is clicked", async () => {
    await import("../src/main");

    const removeBone = document.querySelector<SVGGElement>(
      '[aria-label="Remove Bone from the chart"]',
    )!;
    removeBone.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(document.querySelectorAll(".material-row")).toHaveLength(2);
    const boneButton = [
      ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
    ].find((b) => b.textContent === "Bone")!;
    expect(boneButton.disabled).toBe(false);
  });

  it("removes a placed material via Enter on its remove control", async () => {
    await import("../src/main");

    const removeSteel = document.querySelector<SVGGElement>(
      '[aria-label="Remove Steel (hardened) from the chart"]',
    )!;
    removeSteel.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );

    expect(document.querySelectorAll(".material-row")).toHaveLength(2);
  });

  it("ignores unrelated keys on the remove control", async () => {
    await import("../src/main");

    const removeSteel = document.querySelector<SVGGElement>(
      '[aria-label="Remove Steel (hardened) from the chart"]',
    )!;
    removeSteel.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
    );

    expect(document.querySelectorAll(".material-row")).toHaveLength(3);
  });
});

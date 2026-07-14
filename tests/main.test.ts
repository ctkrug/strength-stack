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
    localStorage.clear();
    vi.resetModules();
    // jsdom doesn't implement SVGTransformList, which D3's transform
    // transitions rely on — freeze the clock so no animation frame ever
    // fires and hits that gap. DOM structure updates happen synchronously
    // regardless (enter/exit run immediately; only the tween is deferred).
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not throw when the #app root is missing from the page", async () => {
    document.body.innerHTML = "";
    await expect(import("../src/main")).resolves.not.toThrow();
    expect(document.querySelectorAll(".material-row")).toHaveLength(0);
  });

  it("renders the default demo materials on load", async () => {
    await import("../src/main");
    expect(document.querySelectorAll(".material-row")).toHaveLength(3);
  });

  it("does not celebrate any material in the default demo set on load", async () => {
    await import("../src/main");
    expect(document.querySelector(".material-row--celebrate")).toBeNull();
  });

  it("celebrates snail teeth when dragged onto the default steel/bone/concrete chart", async () => {
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

    const celebrating = document.querySelector(".material-row--celebrate")!;
    expect(celebrating).not.toBeNull();
    expect(celebrating.querySelector(".material-row__label")?.textContent).toBe(
      "Snail Teeth",
    );
  });

  it("does not celebrate a material placed alongside a stronger one already on the chart", async () => {
    await import("../src/main");

    const chartPanel = document.querySelector<HTMLElement>(".chart-panel")!;
    stubRect(chartPanel, { left: 0, top: 0, right: 900, bottom: 900 });

    // Nylon's specific strength is well below steel's, so it can never
    // land at rank 1 on top of the default set — no celebration expected.
    const button = [
      ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
    ].find((b) => b.textContent === "Nylon")!;
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

    expect(document.querySelector(".material-row--celebrate")).toBeNull();
  });

  it("does not double-place when the same tray button is clicked twice in quick succession", async () => {
    await import("../src/main");

    const button = [
      ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
    ].find((b) => b.textContent === "Nylon")!;

    // The first click's synchronous re-render disables (and detaches) this
    // exact button — a native disabled <button> doesn't dispatch click on
    // a second .click() call, so this exercises that browser guarantee
    // directly rather than only the store-level idempotency it backstops.
    button.click();
    button.click();

    const nylonRows = [...document.querySelectorAll(".material-row")].filter(
      (row) =>
        row.querySelector(".material-row__label")?.textContent === "Nylon",
    );
    expect(nylonRows).toHaveLength(1);
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

  it("dispatching a second click on an already-detached remove control is a safe no-op", async () => {
    await import("../src/main");

    const removeBone = document.querySelector<SVGGElement>(
      '[aria-label="Remove Bone from the chart"]',
    )!;
    // The bar re-render synchronously detaches this exact node from the
    // DOM on the first click (D3's exit().remove()) — a second click
    // dispatched on the now-detached node (e.g. a duplicate event from an
    // overzealous input library) must not throw or remove anything else.
    removeBone.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(() =>
      removeBone.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    ).not.toThrow();

    expect(document.querySelectorAll(".material-row")).toHaveLength(2);
  });

  it("restores the chart's empty state after every default material is removed", async () => {
    await import("../src/main");

    for (const label of [
      "Remove Steel (hardened) from the chart",
      "Remove Bone from the chart",
      "Remove Concrete from the chart",
    ]) {
      document
        .querySelector<SVGGElement>(`[aria-label="${label}"]`)!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }

    expect(document.querySelectorAll(".material-row")).toHaveLength(0);
    expect(document.querySelector(".strength-chart__empty")).not.toBeNull();
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

  it("removes a placed material via Space on its remove control", async () => {
    await import("../src/main");

    const removeSteel = document.querySelector<SVGGElement>(
      '[aria-label="Remove Steel (hardened) from the chart"]',
    )!;
    removeSteel.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
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

  it("renders the mute toggle unmuted by default", async () => {
    await import("../src/main");

    const muteButton = document.getElementById("mute-toggle")!;
    expect(muteButton.getAttribute("aria-pressed")).toBe("false");
    expect(muteButton.classList.contains("is-muted")).toBe(false);
  });

  it("toggles mute state, aria-pressed, and label on click", async () => {
    await import("../src/main");

    const muteButton = document.getElementById("mute-toggle")!;
    muteButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(muteButton.getAttribute("aria-pressed")).toBe("true");
    expect(muteButton.classList.contains("is-muted")).toBe(true);
    expect(muteButton.getAttribute("aria-label")).toBe("Unmute sound effects");

    muteButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(muteButton.getAttribute("aria-pressed")).toBe("false");
    expect(muteButton.getAttribute("aria-label")).toBe("Mute sound effects");
  });

  it("reflects a previously persisted mute state on load", async () => {
    localStorage.setItem("strength-stack:muted", "true");

    await import("../src/main");

    const muteButton = document.getElementById("mute-toggle")!;
    expect(muteButton.getAttribute("aria-pressed")).toBe("true");
    expect(muteButton.classList.contains("is-muted")).toBe(true);
  });

  it("plays place and rescale SFX when a material is placed", async () => {
    const { SoundEngine } = await import("../src/sound");
    const playPlace = vi.spyOn(SoundEngine.prototype, "playPlace");
    const playRescale = vi.spyOn(SoundEngine.prototype, "playRescale");
    const playCelebrate = vi.spyOn(SoundEngine.prototype, "playCelebrate");

    await import("../src/main");

    const chartPanel = document.querySelector<HTMLElement>(".chart-panel")!;
    stubRect(chartPanel, { left: 0, top: 0, right: 900, bottom: 900 });
    const button = [
      ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
    ].find((b) => b.textContent === "Nylon")!;
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

    expect(playPlace).toHaveBeenCalledTimes(1);
    expect(playRescale).toHaveBeenCalledTimes(1);
    expect(playCelebrate).not.toHaveBeenCalled();
  });

  it("also plays the celebrate SFX when the drop reaches rank 1", async () => {
    const { SoundEngine } = await import("../src/sound");
    const playCelebrate = vi.spyOn(SoundEngine.prototype, "playCelebrate");

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

    expect(playCelebrate).toHaveBeenCalledTimes(1);
  });

  it("does not play any SFX for a removal or the initial demo set", async () => {
    const { SoundEngine } = await import("../src/sound");
    const playPlace = vi.spyOn(SoundEngine.prototype, "playPlace");
    const playRescale = vi.spyOn(SoundEngine.prototype, "playRescale");
    const playCelebrate = vi.spyOn(SoundEngine.prototype, "playCelebrate");

    await import("../src/main");

    const removeBone = document.querySelector<SVGGElement>(
      '[aria-label="Remove Bone from the chart"]',
    )!;
    removeBone.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(playPlace).not.toHaveBeenCalled();
    expect(playRescale).not.toHaveBeenCalled();
    expect(playCelebrate).not.toHaveBeenCalled();
  });

  it("does not play any SFX when a drag is dropped outside the chart panel", async () => {
    const { SoundEngine } = await import("../src/sound");
    const playPlace = vi.spyOn(SoundEngine.prototype, "playPlace");
    const playRescale = vi.spyOn(SoundEngine.prototype, "playRescale");
    const playCelebrate = vi.spyOn(SoundEngine.prototype, "playCelebrate");

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

    expect(playPlace).not.toHaveBeenCalled();
    expect(playRescale).not.toHaveBeenCalled();
    expect(playCelebrate).not.toHaveBeenCalled();
  });

  it("announces a placement in the status live region", async () => {
    await import("../src/main");

    const button = [
      ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
    ].find((b) => b.textContent === "Nylon")!;
    button.click();

    const announcer = document.getElementById("status-announcer")!;
    expect(announcer.textContent).toBe(
      "Nylon placed on the chart. 4 materials placed.",
    );
  });

  it("announces a removal in the status live region", async () => {
    await import("../src/main");

    const removeBone = document.querySelector<SVGGElement>(
      '[aria-label="Remove Bone from the chart"]',
    )!;
    removeBone.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const announcer = document.getElementById("status-announcer")!;
    expect(announcer.textContent).toBe(
      "Material removed from the chart. 2 materials placed.",
    );
  });

  it("does not throw when the status announcer element is missing", async () => {
    await import("../src/main");
    document.getElementById("status-announcer")?.remove();

    const button = [
      ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
    ].find((b) => b.textContent === "Nylon")!;

    expect(() => button.click()).not.toThrow();
    expect(document.querySelectorAll(".material-row")).toHaveLength(4);
  });

  it("moves focus to another tray chip after a keyboard placement disables it", async () => {
    await import("../src/main");

    const button = [
      ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
    ].find((b) => b.textContent === "Nylon")!;
    button.focus();
    button.click();

    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement?.tagName).toBe("BUTTON");
    expect((document.activeElement as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows a chart bar's detail panel on hover and hides it on mouse-out", async () => {
    await import("../src/main");

    const boneRow = [...document.querySelectorAll(".material-row")].find(
      (row) =>
        row.querySelector(".material-row__label")?.textContent === "Bone",
    )!;
    boneRow.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

    const tooltip = document.querySelector(".material-tooltip")!;
    expect(tooltip.hasAttribute("hidden")).toBe(false);
    expect(tooltip.textContent).toContain("Bone");

    boneRow.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    expect(tooltip.hasAttribute("hidden")).toBe(true);
  });

  it("shows a chart bar's detail panel on tap (click) for touch devices", async () => {
    await import("../src/main");

    const boneRow = [...document.querySelectorAll(".material-row")].find(
      (row) =>
        row.querySelector(".material-row__label")?.textContent === "Bone",
    )!;
    boneRow.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    const tooltip = document.querySelector(".material-tooltip")!;
    expect(tooltip.hasAttribute("hidden")).toBe(false);
    expect(tooltip.textContent).toContain("Bone");
  });

  it("shows a tray chip's detail panel on hover and hides it on mouse-out", async () => {
    await import("../src/main");

    const nylonButton = [
      ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
    ].find((b) => b.textContent === "Nylon")!;
    nylonButton.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

    const tooltip = document.querySelector(".material-tooltip")!;
    expect(tooltip.hasAttribute("hidden")).toBe(false);
    expect(tooltip.textContent).toContain("Nylon");

    nylonButton.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    expect(tooltip.hasAttribute("hidden")).toBe(true);
  });

  it("keeps a tray chip's detail panel positioned as the pointer moves over it", async () => {
    await import("../src/main");

    const nylonButton = [
      ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
    ].find((b) => b.textContent === "Nylon")!;
    nylonButton.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX: 30, clientY: 40 }),
    );

    const tooltip = document.querySelector(".material-tooltip")!;
    expect(tooltip.hasAttribute("hidden")).toBe(false);
    expect(tooltip.textContent).toContain("Nylon");
  });

  it("groups tray chips into category sections with headings", async () => {
    await import("../src/main");

    const headings = [...document.querySelectorAll(".tray__group-heading")].map(
      (h) => h.textContent,
    );
    expect(headings).toEqual(["Natural", "Metal", "Synthetic Fiber"]);

    const naturalGroup = document.querySelector(
      '.tray__group[data-category="natural"]',
    )!;
    expect(
      naturalGroup.querySelector<HTMLButtonElement>(".tray__button")?.dataset
        .category,
    ).toBe("natural");
  });

  it("renders a category legend with one entry per category", async () => {
    await import("../src/main");

    const legendItems = [
      ...document.querySelectorAll(".tray__legend-item"),
    ].map((item) => item.getAttribute("data-category"));
    expect(legendItems).toEqual(["natural", "metal", "synthetic-fiber"]);
  });

  it("keeps tray chips grouped by category after a placement re-render", async () => {
    await import("../src/main");

    const button = [
      ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
    ].find((b) => b.textContent === "Nylon")!;
    button.click();

    const syntheticGroup = document.querySelector(
      '.tray__group[data-category="synthetic-fiber"]',
    )!;
    const nylon = [...syntheticGroup.querySelectorAll(".tray__button")].find(
      (b) => b.textContent === "Nylon",
    ) as HTMLButtonElement;
    expect(nylon.disabled).toBe(true);
  });

  it("coalesces rapid resize events into a single re-render", async () => {
    const { StrengthChart } = await import("../src/chart");
    const renderSpy = vi.spyOn(StrengthChart.prototype, "render");

    await import("../src/main");
    renderSpy.mockClear();

    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("resize"));

    expect(renderSpy).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it("moves focus to the tray heading once every material is placed", async () => {
    await import("../src/main");

    let remaining = [
      ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
    ].filter((b) => !b.disabled);

    while (remaining.length > 0) {
      const [next] = remaining;
      next.focus();
      next.click();
      remaining = [
        ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
      ].filter((b) => !b.disabled);
    }

    expect(document.activeElement?.id).toBe("tray-title");
  });

  it("keeps DOM node counts stable across many place/remove cycles (no leaks)", async () => {
    await import("../src/main");

    for (let cycle = 0; cycle < 5; cycle++) {
      let unplaced = [
        ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
      ].filter((b) => !b.disabled);
      while (unplaced.length > 0) {
        unplaced[0].click();
        unplaced = [
          ...document.querySelectorAll<HTMLButtonElement>(".tray__button"),
        ].filter((b) => !b.disabled);
      }
      expect(document.querySelectorAll(".material-row")).toHaveLength(12);

      // Hover a bar each cycle so the lazily-created tooltip singleton gets
      // exercised repeatedly too, not just placement/removal.
      document
        .querySelector(".material-row")!
        .dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));

      let removeControls = [
        ...document.querySelectorAll<SVGGElement>("g.material-row__remove"),
      ];
      while (removeControls.length > 0) {
        removeControls[0].dispatchEvent(
          new MouseEvent("click", { bubbles: true }),
        );
        removeControls = [
          ...document.querySelectorAll<SVGGElement>("g.material-row__remove"),
        ];
      }
      expect(document.querySelectorAll(".material-row")).toHaveLength(0);
    }

    // A long session of churn shouldn't leave behind extra shared singletons
    // (tooltip, chart svg) or an in-progress drag ghost.
    expect(document.querySelectorAll(".material-tooltip")).toHaveLength(1);
    expect(document.querySelectorAll(".strength-chart")).toHaveLength(1);
    expect(document.querySelectorAll(".drag-ghost")).toHaveLength(0);
  });
});

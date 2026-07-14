import { beforeEach, describe, expect, it, vi } from "vitest";
import { enableDragToPlace } from "../src/drag";

function pointerEvent(
  type: string,
  x: number,
  y: number,
  init: Partial<PointerEventInit> = {},
): PointerEvent {
  return new PointerEvent(type, {
    clientX: x,
    clientY: y,
    button: 0,
    bubbles: true,
    cancelable: true,
    ...init,
  });
}

function stubRect(el: HTMLElement, rect: Partial<DOMRect>) {
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

describe("enableDragToPlace", () => {
  let source: HTMLButtonElement;
  let target: HTMLDivElement;
  let onDrop: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    document.body.innerHTML = "";
    source = document.createElement("button");
    target = document.createElement("div");
    document.body.appendChild(source);
    document.body.appendChild(target);
    stubRect(source, { left: 0, top: 0, right: 20, bottom: 20 });
    stubRect(target, { left: 100, top: 100, right: 300, bottom: 300 });
    onDrop = vi.fn();
    enableDragToPlace({ source, dropTarget: target, onDrop });
  });

  it("calls onDrop when released inside the drop target", () => {
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5));
    window.dispatchEvent(pointerEvent("pointermove", 150, 150));
    window.dispatchEvent(pointerEvent("pointerup", 150, 150));

    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it("does not call onDrop when released outside the drop target", () => {
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5));
    window.dispatchEvent(pointerEvent("pointermove", 400, 400));
    window.dispatchEvent(pointerEvent("pointerup", 400, 400));

    expect(onDrop).not.toHaveBeenCalled();
  });

  it("does not call onDrop for a tap with no movement (below the drag threshold)", () => {
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5));
    window.dispatchEvent(pointerEvent("pointerup", 6, 5));

    expect(onDrop).not.toHaveBeenCalled();
  });

  it("does not start a drag for a pointermove that stays under the threshold", () => {
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5));
    window.dispatchEvent(pointerEvent("pointermove", 8, 6));

    expect(source.classList.contains("is-dragging")).toBe(false);
    expect(document.querySelector(".drag-ghost")).toBeNull();

    // Close out the interaction so this test doesn't leak its window
    // listeners (still live, since no threshold was ever crossed) into
    // whichever test runs next.
    window.dispatchEvent(pointerEvent("pointerup", 8, 6));
  });

  it("keeps tracking the same ghost across repeated moves once dragging", () => {
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5));
    window.dispatchEvent(pointerEvent("pointermove", 150, 150));
    const ghost = document.querySelector(".drag-ghost");

    window.dispatchEvent(pointerEvent("pointermove", 200, 220));

    expect(document.querySelectorAll(".drag-ghost")).toHaveLength(1);
    expect(document.querySelector(".drag-ghost")).toBe(ghost);
    expect((ghost as HTMLElement).style.transform).toBe(
      "translate(200px, 220px)",
    );
  });

  it("removes the ghost element and dragging class after drop", () => {
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5));
    window.dispatchEvent(pointerEvent("pointermove", 150, 150));
    expect(source.classList.contains("is-dragging")).toBe(true);
    expect(document.querySelector(".drag-ghost")).not.toBeNull();

    window.dispatchEvent(pointerEvent("pointerup", 150, 150));

    expect(source.classList.contains("is-dragging")).toBe(false);
    expect(document.querySelector(".drag-ghost")).toBeNull();
  });

  it("cleans up and no-ops on pointercancel mid-drag", () => {
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5));
    window.dispatchEvent(pointerEvent("pointermove", 150, 150));
    window.dispatchEvent(pointerEvent("pointercancel", 150, 150));

    expect(onDrop).not.toHaveBeenCalled();
    expect(source.classList.contains("is-dragging")).toBe(false);
    expect(document.querySelector(".drag-ghost")).toBeNull();
  });

  it("supports repeated drags after a completed drop", () => {
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5));
    window.dispatchEvent(pointerEvent("pointermove", 150, 150));
    window.dispatchEvent(pointerEvent("pointerup", 150, 150));

    source.dispatchEvent(pointerEvent("pointerdown", 5, 5));
    window.dispatchEvent(pointerEvent("pointermove", 150, 150));
    window.dispatchEvent(pointerEvent("pointerup", 150, 150));

    expect(onDrop).toHaveBeenCalledTimes(2);
  });

  it("drops identically for a touch pointer as for a mouse pointer", () => {
    source.dispatchEvent(
      pointerEvent("pointerdown", 5, 5, { pointerType: "touch" }),
    );
    window.dispatchEvent(
      pointerEvent("pointermove", 150, 150, { pointerType: "touch" }),
    );
    window.dispatchEvent(
      pointerEvent("pointerup", 150, 150, { pointerType: "touch" }),
    );

    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it("ignores non-primary pointer buttons", () => {
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5, { button: 2 }));
    window.dispatchEvent(pointerEvent("pointermove", 150, 150));
    window.dispatchEvent(pointerEvent("pointerup", 150, 150));

    expect(onDrop).not.toHaveBeenCalled();
    expect(document.querySelector(".drag-ghost")).toBeNull();
  });

  it("ignores movement from an unrelated pointer during a drag (multi-touch)", () => {
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5, { pointerId: 1 }));
    window.dispatchEvent(
      pointerEvent("pointermove", 20, 20, { pointerId: 1 }),
    );
    expect(source.classList.contains("is-dragging")).toBe(true);

    // A second finger touches down elsewhere and moves — this must not
    // relocate source's ghost, which tracks only pointerId 1.
    window.dispatchEvent(
      pointerEvent("pointermove", 500, 500, { pointerId: 2 }),
    );

    const ghost = document.querySelector<HTMLElement>(".drag-ghost")!;
    expect(ghost.style.transform).toBe("translate(20px, 20px)");
  });

  it("cancels an in-progress drag when the window loses focus (alt-tab, OS dialog)", () => {
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5));
    window.dispatchEvent(pointerEvent("pointermove", 150, 150));
    expect(source.classList.contains("is-dragging")).toBe(true);
    expect(document.querySelector(".drag-ghost")).not.toBeNull();

    window.dispatchEvent(new Event("blur"));

    expect(source.classList.contains("is-dragging")).toBe(false);
    expect(document.querySelector(".drag-ghost")).toBeNull();
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("suppresses the trailing synthetic click after a completed drag", () => {
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5));
    window.dispatchEvent(pointerEvent("pointermove", 150, 150));
    window.dispatchEvent(pointerEvent("pointerup", 150, 150));

    const clickHandler = vi.fn();
    source.addEventListener("click", clickHandler);

    const click = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    source.dispatchEvent(click);

    expect(clickHandler).not.toHaveBeenCalled();
    expect(click.defaultPrevented).toBe(true);
  });

  it("does not suppress a plain click that never dragged", () => {
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5));
    window.dispatchEvent(pointerEvent("pointerup", 6, 5));

    const clickHandler = vi.fn();
    source.addEventListener("click", clickHandler);
    source.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it("ignores a pointercancel from an unrelated pointer during a drag", () => {
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5, { pointerId: 1 }));
    window.dispatchEvent(
      pointerEvent("pointermove", 150, 150, { pointerId: 1 }),
    );
    expect(source.classList.contains("is-dragging")).toBe(true);

    // A second, unrelated pointer cancels — the in-progress drag on
    // pointerId 1 must survive untouched.
    window.dispatchEvent(pointerEvent("pointercancel", 150, 150, { pointerId: 2 }));

    expect(source.classList.contains("is-dragging")).toBe(true);
    expect(document.querySelector(".drag-ghost")).not.toBeNull();

    window.dispatchEvent(pointerEvent("pointerup", 150, 150, { pointerId: 1 }));
    expect(onDrop).toHaveBeenCalledTimes(1);
  });

  it("does not drop a source when a different pointer is released inside the target", () => {
    // Source's own drag never crosses the threshold — it should not be
    // considered "dragging" at all, let alone dropped by another pointer.
    source.dispatchEvent(pointerEvent("pointerdown", 5, 5, { pointerId: 1 }));

    // A second, unrelated pointer drags and releases inside the target.
    window.dispatchEvent(
      pointerEvent("pointermove", 150, 150, { pointerId: 2 }),
    );
    window.dispatchEvent(
      pointerEvent("pointerup", 150, 150, { pointerId: 2 }),
    );

    expect(onDrop).not.toHaveBeenCalled();
  });
});

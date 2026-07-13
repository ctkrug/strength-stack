/**
 * Unified pointer-based drag-and-drop: one code path handles mouse and
 * touch (Pointer Events), so a tray chip dragged onto the chart panel
 * behaves identically regardless of input device.
 */

const DRAG_THRESHOLD_PX = 6;

export interface DragToPlaceOptions {
  /** The tray chip being dragged. */
  source: HTMLElement;
  /** The element a drop must land inside to count as a placement. */
  dropTarget: HTMLElement;
  /** Called once when the pointer is released inside dropTarget. */
  onDrop: () => void;
  /** Movement in px before a press counts as a drag rather than a tap. */
  dragThresholdPx?: number;
}

function isInsideRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function makeGhost(source: HTMLElement): HTMLElement {
  const ghost = source.cloneNode(true) as HTMLElement;
  const rect = source.getBoundingClientRect();
  ghost.classList.add("drag-ghost");
  ghost.style.position = "fixed";
  ghost.style.left = "0";
  ghost.style.top = "0";
  ghost.style.width = `${rect.width}px`;
  ghost.style.pointerEvents = "none";
  ghost.style.zIndex = "1000";
  ghost.setAttribute("aria-hidden", "true");
  document.body.appendChild(ghost);
  return ghost;
}

/**
 * Wires `source` to be draggable onto `dropTarget`. A plain tap/click
 * (movement under the threshold) is left alone so the existing click
 * handler on `source` still fires for keyboard/no-drag placement.
 */
export function enableDragToPlace(options: DragToPlaceOptions): void {
  const { source, dropTarget, onDrop } = options;
  const threshold = options.dragThresholdPx ?? DRAG_THRESHOLD_PX;

  source.addEventListener("pointerdown", (downEvent: PointerEvent) => {
    if (downEvent.button !== undefined && downEvent.button !== 0) return;

    const pointerId = downEvent.pointerId;
    const startX = downEvent.clientX;
    const startY = downEvent.clientY;
    let dragging = false;
    let ghost: HTMLElement | null = null;

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;

      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (!dragging) {
        if (Math.hypot(dx, dy) < threshold) return;
        dragging = true;
        source.classList.add("is-dragging");
        ghost = makeGhost(source);
      }

      if (ghost) {
        ghost.style.transform = `translate(${moveEvent.clientX}px, ${moveEvent.clientY}px)`;
      }
    };

    const detach = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("blur", onBlur);
      source.classList.remove("is-dragging");
      if (ghost) ghost.remove();
    };

    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;

      const wasDragging = dragging;
      detach();

      if (wasDragging) {
        // A real drag occurred — suppress the trailing synthetic click so
        // a successful drop doesn't also fire the tap-to-place handler.
        source.addEventListener("click", suppressNextClick, {
          once: true,
          capture: true,
        });

        const rect = dropTarget.getBoundingClientRect();
        if (isInsideRect(upEvent.clientX, upEvent.clientY, rect)) {
          onDrop();
        }
      }
    };

    const onCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId !== pointerId) return;
      detach();
    };

    // The window can lose focus mid-drag without any pointer event firing
    // at all (alt-tab, an OS permission dialog, opening devtools) — without
    // this, the ghost and is-dragging class would be stuck indefinitely.
    const onBlur = () => detach();

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("blur", onBlur);
  });
}

function suppressNextClick(event: MouseEvent): void {
  event.preventDefault();
  event.stopImmediatePropagation();
}

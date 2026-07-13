import { Material, describeMaterial } from "./materials";

const VIEWPORT_MARGIN = 12;

/**
 * Single shared detail panel for hover/tap/focus on a chart bar or tray
 * chip. One DOM node is created lazily and repositioned/repopulated on
 * every show() rather than building a new element per material.
 */
export class MaterialTooltip {
  private el: HTMLElement | null = null;
  private root: HTMLElement;

  constructor(root: HTMLElement = document.body) {
    this.root = root;
  }

  private ensureElement(): HTMLElement {
    if (this.el) return this.el;
    const el = document.createElement("div");
    el.className = "material-tooltip";
    el.setAttribute("role", "tooltip");
    el.hidden = true;
    this.root.appendChild(el);
    this.el = el;
    return el;
  }

  /** Shows detail for `material`, positioned near (x, y) in viewport coordinates. */
  show(material: Material, x: number, y: number): void {
    const el = this.ensureElement();
    const detail = describeMaterial(material);

    el.innerHTML = `
      <p class="material-tooltip__name">${material.name}</p>
      <dl class="material-tooltip__stats">
        <dt>Tensile strength</dt><dd>${detail.tensileStrength}</dd>
        <dt>Density</dt><dd>${detail.density}</dd>
        <dt>Specific strength</dt><dd>${detail.specificStrength}</dd>
      </dl>
      <p class="material-tooltip__fact">${detail.fact}</p>
    `;
    el.hidden = false;
    this.position(el, x, y);
  }

  hide(): void {
    if (this.el) this.el.hidden = true;
  }

  isVisible(): boolean {
    return this.el !== null && !this.el.hidden;
  }

  private position(el: HTMLElement, x: number, y: number): void {
    const viewportWidth = window.innerWidth || Infinity;
    const viewportHeight = window.innerHeight || Infinity;
    // jsdom reports 0x0 for offsetWidth/offsetHeight (no layout engine); the
    // clamps below degenerate harmlessly to the raw x/y in that environment.
    const width = el.offsetWidth;
    const height = el.offsetHeight;

    const left = Math.min(
      Math.max(x + VIEWPORT_MARGIN, VIEWPORT_MARGIN),
      viewportWidth - width - VIEWPORT_MARGIN,
    );
    const top = Math.min(
      Math.max(y + VIEWPORT_MARGIN, VIEWPORT_MARGIN),
      viewportHeight - height - VIEWPORT_MARGIN,
    );

    el.style.left = `${Math.max(left, VIEWPORT_MARGIN)}px`;
    el.style.top = `${Math.max(top, VIEWPORT_MARGIN)}px`;
  }
}

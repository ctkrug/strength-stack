import * as d3 from "d3";
import { Material, rankByStrength, specificStrength } from "./materials";

const MARGIN_DEFAULT = { top: 24, right: 100, bottom: 32, left: 160 };
const MARGIN_COMPACT = { top: 20, right: 56, bottom: 24, left: 84 };
const COMPACT_BREAKPOINT_PX = 480;
const MIN_ROW_BAND = 56;
const MAX_BAR_HEIGHT = 72;
const MIN_BAR_HEIGHT = 32;

function computeMargin(width: number) {
  return width < COMPACT_BREAKPOINT_PX ? MARGIN_COMPACT : MARGIN_DEFAULT;
}

/** Truncates a label with an ellipsis when it overflows its column, rather
 * than bleeding past the SVG's edge or relying on lengthAdjust glyph
 * compression (unreliable across renderers for large ratios). No-op where
 * getComputedTextLength isn't implemented (jsdom under test). */
export function fitLabelWidth(
  selection: d3.Selection<SVGTextElement, Material, d3.BaseType, unknown>,
  maxWidth: number,
) {
  selection.each(function (d) {
    const node = this as SVGTextElement & {
      getComputedTextLength?: () => number;
    };
    if (typeof node.getComputedTextLength !== "function") return;
    if (node.getComputedTextLength() <= maxWidth) return;

    let truncated = d.name;
    while (truncated.length > 1 && node.getComputedTextLength() > maxWidth) {
      truncated = truncated.slice(0, -1);
      node.textContent = `${truncated}…`;
    }
  });
}

const VALUE_INSIDE_PADDING = 8;
const VALUE_FALLBACK_WIDTH = 28;

/** Right-aligns a value label inside its bar when there's room, otherwise
 * places it just outside — so it never overlaps a short bar's empty tail
 * or a long bar's neighboring columns. Falls back to a fixed width estimate
 * where getComputedTextLength isn't implemented (jsdom under test). */
export function positionValueLabel(
  selection: d3.Selection<SVGTextElement, Material, d3.BaseType, unknown>,
  x: d3.ScaleLinear<number, number>,
) {
  selection.each(function (d) {
    const node = this as SVGTextElement & {
      getComputedTextLength?: () => number;
    };
    const barWidth = x(specificStrength(d));
    const textWidth =
      typeof node.getComputedTextLength === "function"
        ? node.getComputedTextLength()
        : VALUE_FALLBACK_WIDTH;
    const fitsInside = barWidth > textWidth + VALUE_INSIDE_PADDING * 2;
    const selected = d3.select(node);
    selected
      .attr("text-anchor", fitsInside ? "end" : "start")
      .attr(
        "x",
        fitsInside
          ? barWidth - VALUE_INSIDE_PADDING
          : barWidth + VALUE_INSIDE_PADDING,
      )
      .classed("material-row__value--inside", fitsInside);
  });
}

/** Shows/hides the hover/tap/focus detail panel for a material — implemented
 * by `MaterialTooltip` in the real app, faked in tests. */
export interface DetailPanel {
  show(material: Material, x: number, y: number): void;
  hide(): void;
}

/**
 * Renders the materials as a horizontal bar chart, ranked by specific
 * strength. Call render() again whenever the placed set changes — it
 * redraws in place rather than tearing down the SVG.
 */
export class StrengthChart {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private plot: d3.Selection<SVGGElement, unknown, null, undefined>;
  private caption: d3.Selection<SVGTextElement, unknown, null, undefined>;
  private container: HTMLElement;
  private onRemove: (id: string) => void;
  private detail: DetailPanel;

  constructor(
    container: HTMLElement,
    onRemove: (id: string) => void,
    detail: DetailPanel,
  ) {
    this.container = container;
    this.onRemove = onRemove;
    this.detail = detail;
    this.svg = d3
      .select(container)
      .append("svg")
      .attr("class", "strength-chart")
      .attr("role", "img")
      .attr("aria-label", "Materials ranked by specific strength");
    this.plot = this.svg.append("g").attr("class", "strength-chart__plot");
    this.caption = this.svg
      .append("text")
      .attr("class", "strength-chart__caption")
      .attr("text-anchor", "end")
      .text("Specific strength — kN·m/kg");
  }

  /** Returns true when this render celebrated a newly placed top-rank material. */
  render(materials: Material[], justPlacedId: string | null = null): boolean {
    const width = this.container.clientWidth || 800;
    const ranked = rankByStrength(materials);
    const celebrateId =
      justPlacedId && ranked[0]?.id === justPlacedId ? justPlacedId : null;

    const margin = computeMargin(width);
    const plotWidth = Math.max(width - margin.left - margin.right, 100);

    // Distribute available panel height across rows so a short placed set
    // fills the panel instead of leaving a dead gap below the last bar;
    // a long set falls back to a comfortable minimum band per row.
    const availableHeight = this.container.clientHeight || 0;
    const rowCount = Math.max(ranked.length, 1);
    const availableBand = availableHeight
      ? (availableHeight - margin.top - margin.bottom) / rowCount
      : MIN_ROW_BAND;
    const rowBand = Math.max(MIN_ROW_BAND, availableBand);
    const barHeight = Math.min(
      MAX_BAR_HEIGHT,
      Math.max(MIN_BAR_HEIGHT, rowBand - 16),
    );

    const contentHeight = margin.top + margin.bottom + ranked.length * rowBand;
    const height = Math.max(contentHeight, availableHeight, 200);

    this.svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", width)
      .attr("height", height);

    this.plot.attr("transform", `translate(${margin.left},${margin.top})`);
    this.caption.attr("x", width - 4).attr("y", margin.top - 8);

    const maxValue = d3.max(ranked, specificStrength) ?? 1;
    const x = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([0, plotWidth]);

    const rows = this.plot
      .selectAll<SVGGElement, Material>("g.material-row")
      .data(ranked, (m) => m.id);

    rows.exit().remove();

    const entering = rows
      .enter()
      .append("g")
      .attr("class", "material-row")
      .attr("tabindex", "0");

    entering.append("rect").attr("class", "material-row__bar");
    entering.append("text").attr("class", "material-row__label");
    entering.append("text").attr("class", "material-row__value");
    entering.classed("material-row--celebrate", (d) => d.id === celebrateId);

    const enteringRemove = entering
      .append("g")
      .attr("class", "material-row__remove")
      .attr("tabindex", "0")
      .attr("role", "button");
    enteringRemove.append("circle").attr("r", 11);
    enteringRemove.append("text").attr("dy", "0.32em").text("×");

    const merged = entering.merge(rows);

    // The remove control sits in a fixed column past the plot area — a bar
    // near the axis max (up to the domain's 1.1x headroom) can never reach
    // into it, so it never collides regardless of bar length.
    const removeX = plotWidth + margin.right - 28;

    const remove = merged.select<SVGGElement>("g.material-row__remove");
    remove
      .attr("aria-label", (d) => `Remove ${d.name} from the chart`)
      .attr("transform", `translate(${removeX},${barHeight / 2})`)
      .on("click", (event: MouseEvent, d) => {
        // Stops the click from also bubbling to the row's own detail-panel
        // handler below, which would otherwise show a tooltip for a
        // material that this same click just removed from the chart.
        event.stopPropagation();
        this.onRemove(d.id);
      })
      .on("keydown", (event: KeyboardEvent, d) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          this.onRemove(d.id);
        }
      });

    // Hover (desktop), tap (touch — synthesized as a click), and keyboard
    // focus all surface the same detail panel; mouse-out/blur dismiss it.
    merged
      .attr("aria-label", (d) => `${d.name}, press for material detail`)
      .on("mouseenter", (event: MouseEvent, d) =>
        this.detail.show(d, event.clientX, event.clientY),
      )
      .on("mousemove", (event: MouseEvent, d) =>
        this.detail.show(d, event.clientX, event.clientY),
      )
      .on("mouseleave", () => this.detail.hide())
      .on("focus", (event: FocusEvent, d) => {
        const rect = (event.currentTarget as Element).getBoundingClientRect();
        this.detail.show(d, rect.left, rect.top);
      })
      .on("blur", () => this.detail.hide())
      .on("click", (event: MouseEvent, d) =>
        this.detail.show(d, event.clientX, event.clientY),
      );

    merged
      .transition()
      .duration(300)
      .attr("transform", (_d, i) => `translate(0,${i * rowBand})`);

    merged
      .select<SVGRectElement>("rect.material-row__bar")
      .attr("height", barHeight)
      .attr("x", 0)
      .transition()
      .duration(300)
      .attr("width", (d) => x(specificStrength(d)));

    const label = merged
      .select<SVGTextElement>("text.material-row__label")
      .attr("x", -12)
      .attr("y", barHeight / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .text((d) => d.name);
    fitLabelWidth(label, margin.left - 20);

    const value = merged
      .select<SVGTextElement>("text.material-row__value")
      .attr("y", barHeight / 2)
      .attr("dy", "0.35em")
      .text((d) => `${specificStrength(d).toFixed(0)}`);
    positionValueLabel(value, x);

    return celebrateId !== null;
  }
}

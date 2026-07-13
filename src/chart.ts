import * as d3 from "d3";
import { Material, specificStrength } from "./materials";

const MARGIN = { top: 24, right: 96, bottom: 32, left: 160 };
const BAR_HEIGHT = 40;
const BAR_GAP = 16;

/**
 * Renders the materials as a horizontal bar chart, ranked by specific
 * strength. Call render() again whenever the placed set changes — it
 * redraws in place rather than tearing down the SVG.
 */
export class StrengthChart {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private plot: d3.Selection<SVGGElement, unknown, null, undefined>;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.svg = d3
      .select(container)
      .append("svg")
      .attr("class", "strength-chart")
      .attr("role", "img")
      .attr("aria-label", "Materials ranked by specific strength");
    this.plot = this.svg.append("g").attr("class", "strength-chart__plot");
  }

  render(materials: Material[]): void {
    const width = this.container.clientWidth || 800;
    const ranked = [...materials].sort(
      (a, b) => specificStrength(b) - specificStrength(a),
    );
    const height =
      MARGIN.top + MARGIN.bottom + ranked.length * (BAR_HEIGHT + BAR_GAP);
    const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 100);

    this.svg
      .attr("viewBox", `0 0 ${width} ${Math.max(height, 200)}`)
      .attr("width", width)
      .attr("height", Math.max(height, 200));

    this.plot.attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const maxValue = d3.max(ranked, specificStrength) ?? 1;
    const x = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([0, plotWidth]);

    const rows = this.plot
      .selectAll<SVGGElement, Material>("g.material-row")
      .data(ranked, (m) => m.id);

    rows.exit().remove();

    const entering = rows.enter().append("g").attr("class", "material-row");

    entering.append("rect").attr("class", "material-row__bar");
    entering.append("text").attr("class", "material-row__label");
    entering.append("text").attr("class", "material-row__value");

    const merged = entering.merge(rows);

    merged
      .transition()
      .duration(300)
      .attr(
        "transform",
        (_d, i) => `translate(0,${i * (BAR_HEIGHT + BAR_GAP)})`,
      );

    merged
      .select<SVGRectElement>("rect.material-row__bar")
      .attr("height", BAR_HEIGHT)
      .attr("x", 0)
      .transition()
      .duration(300)
      .attr("width", (d) => x(specificStrength(d)));

    merged
      .select<SVGTextElement>("text.material-row__label")
      .attr("x", -12)
      .attr("y", BAR_HEIGHT / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .text((d) => d.name);

    merged
      .select<SVGTextElement>("text.material-row__value")
      .attr("y", BAR_HEIGHT / 2)
      .attr("dy", "0.35em")
      .attr("x", (d) => x(specificStrength(d)) + 12)
      .text((d) => `${specificStrength(d).toFixed(0)} kN·m/kg`);
  }
}

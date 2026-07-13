import { afterEach, describe, expect, it } from "vitest";
import * as d3 from "d3";
import { fitLabelWidth, positionValueLabel } from "../src/chart";
import { getMaterial } from "../src/materials";

const steel = getMaterial("steel")!;
const bone = getMaterial("bone")!;

function svgTextSelection(datum = steel) {
  const svg = d3.select(document.body).append("svg");
  const text = svg.append("text").datum(datum);
  return { svg, text };
}

function stubTextLength(node: SVGTextElement, length: number) {
  (
    node as SVGTextElement & { getComputedTextLength: () => number }
  ).getComputedTextLength = () => length;
}

describe("fitLabelWidth", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("is a no-op when getComputedTextLength isn't implemented (jsdom)", () => {
    const { text } = svgTextSelection();
    text.text(steel.name);
    fitLabelWidth(text, 40);
    expect(text.text()).toBe(steel.name);
  });

  it("leaves the label untouched when it already fits", () => {
    const { text } = svgTextSelection();
    text.text(bone.name);
    stubTextLength(text.node()!, 30);
    fitLabelWidth(text, 40);
    expect(text.text()).toBe(bone.name);
  });

  it("truncates with an ellipsis when the label overflows its column", () => {
    const { text } = svgTextSelection();
    text.text("Titanium (Ti-6Al-4V)");
    // Every measurement reports overflow until the string shrinks enough
    // that its length alone drops under a small threshold.
    stubTextLength(text.node()!, 200);
    const node = text.node()! as SVGTextElement & {
      getComputedTextLength: () => number;
    };
    node.getComputedTextLength = () => (text.text().length > 8 ? 200 : 30);

    fitLabelWidth(text, 40);

    const result = text.text();
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThan("Titanium (Ti-6Al-4V)".length);
  });
});

describe("positionValueLabel", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  const scale = d3.scaleLinear().domain([0, 100]).range([0, 300]);

  it("falls back to a fixed width estimate when getComputedTextLength is unavailable", () => {
    const { text } = svgTextSelection(steel);
    text.text("100");
    positionValueLabel(text, scale);
    // bar width for steel's specific strength (121, clamped by domain) is
    // 300px, comfortably over the ~28px fallback width — fits inside.
    expect(text.attr("text-anchor")).toBe("end");
    expect(text.classed("material-row__value--inside")).toBe(true);
  });

  it("places the value inside the bar when there's room", () => {
    const { text } = svgTextSelection(bone);
    text.text("68");
    stubTextLength(text.node()!, 20);
    positionValueLabel(text, scale);

    expect(text.attr("text-anchor")).toBe("end");
    expect(text.classed("material-row__value--inside")).toBe(true);
  });

  it("places the value outside the bar when the bar is too short", () => {
    const tiny = { ...bone, tensileStrengthMPa: 1, densityKgM3: 1000000 };
    const { text } = svgTextSelection(tiny);
    text.text("0");
    stubTextLength(text.node()!, 20);
    positionValueLabel(text, scale);

    expect(text.attr("text-anchor")).toBe("start");
    expect(text.classed("material-row__value--inside")).toBe(false);
  });
});

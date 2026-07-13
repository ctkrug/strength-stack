import { describe, expect, it } from "vitest";
import {
  CATEGORY_ORDER,
  MATERIALS,
  categoryLabel,
  describeMaterial,
  getMaterial,
  specificStrength,
} from "../src/materials";

describe("MATERIALS", () => {
  it("has unique ids", () => {
    const ids = MATERIALS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has positive tensile strength and density for every material", () => {
    for (const material of MATERIALS) {
      expect(material.tensileStrengthMPa).toBeGreaterThan(0);
      expect(material.densityKgM3).toBeGreaterThan(0);
    }
  });
});

describe("specificStrength", () => {
  it("computes tensile strength per unit weight in kN·m/kg", () => {
    const steel = getMaterial("steel")!;
    expect(specificStrength(steel)).toBeCloseTo(121.02, 1);
  });

  it("ranks snail teeth dramatically above steel", () => {
    const steel = getMaterial("steel")!;
    const snailTeeth = getMaterial("snail-teeth")!;
    expect(specificStrength(snailTeeth)).toBeGreaterThan(
      specificStrength(steel) * 10,
    );
  });
});

describe("getMaterial", () => {
  it("returns undefined for an unknown id", () => {
    expect(getMaterial("unobtainium")).toBeUndefined();
  });
});

describe("categoryLabel", () => {
  it("has a distinct, non-empty label for every category in CATEGORY_ORDER", () => {
    const labels = CATEGORY_ORDER.map(categoryLabel);
    expect(labels.every((label) => label.length > 0)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("covers every category present in the dataset", () => {
    const datasetCategories = new Set(MATERIALS.map((m) => m.category));
    for (const category of datasetCategories) {
      expect(CATEGORY_ORDER).toContain(category);
    }
  });
});

describe("describeMaterial", () => {
  it("formats tensile strength, density, specific strength, and fact for steel", () => {
    const steel = getMaterial("steel")!;
    const detail = describeMaterial(steel);
    expect(detail.tensileStrength).toBe("950 MPa");
    expect(detail.density).toBe("7,850 kg/m³");
    expect(detail.specificStrength).toBe("121 kN·m/kg");
    expect(detail.fact).toBe(steel.fact);
  });

  it("matches specificStrength()'s rounding for every material", () => {
    for (const material of MATERIALS) {
      const detail = describeMaterial(material);
      expect(detail.specificStrength).toBe(
        `${specificStrength(material).toFixed(0)} kN·m/kg`,
      );
    }
  });
});

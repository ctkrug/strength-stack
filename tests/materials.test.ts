import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  CATEGORY_ORDER,
  Material,
  MaterialCategory,
  MATERIALS,
  categoryLabel,
  describeMaterial,
  getMaterial,
  rankByStrength,
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

const categoryArb: fc.Arbitrary<MaterialCategory> = fc.constantFrom(
  "natural",
  "metal",
  "synthetic-fiber",
);

const materialArb: fc.Arbitrary<Material> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 40 }),
  category: categoryArb,
  tensileStrengthMPa: fc.double({
    min: 0.001,
    max: 10000,
    noNaN: true,
  }),
  densityKgM3: fc.double({ min: 0.001, max: 20000, noNaN: true }),
  fact: fc.string(),
});

/** Relative-error comparison — `toBeCloseTo`'s fixed decimal-digit tolerance
 * breaks down at the scales these properties exercise (values spanning many
 * orders of magnitude), where floating-point rounding alone exceeds a fixed
 * absolute epsilon. */
function expectRelativelyClose(actual: number, expected: number) {
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(1e-9);
}

describe("specificStrength (property-based)", () => {
  it("is always positive for positive tensile strength and density", () => {
    fc.assert(
      fc.property(materialArb, (material) => {
        expect(specificStrength(material)).toBeGreaterThan(0);
      }),
    );
  });

  it("scales linearly with tensile strength", () => {
    fc.assert(
      fc.property(
        materialArb,
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        (material, factor) => {
          const scaled = {
            ...material,
            tensileStrengthMPa: material.tensileStrengthMPa * factor,
          };
          expectRelativelyClose(
            specificStrength(scaled),
            specificStrength(material) * factor,
          );
        },
      ),
    );
  });

  it("scales inversely with density", () => {
    fc.assert(
      fc.property(
        materialArb,
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        (material, factor) => {
          const scaled = {
            ...material,
            densityKgM3: material.densityKgM3 * factor,
          };
          expectRelativelyClose(
            specificStrength(scaled),
            specificStrength(material) / factor,
          );
        },
      ),
    );
  });
});

describe("rankByStrength (property-based)", () => {
  it("returns a permutation of the input (same ids, same length)", () => {
    fc.assert(
      fc.property(fc.array(materialArb, { maxLength: 20 }), (materials) => {
        const ranked = rankByStrength(materials);
        expect(ranked).toHaveLength(materials.length);
        expect(new Set(ranked.map((m) => m.id))).toEqual(
          new Set(materials.map((m) => m.id)),
        );
      }),
    );
  });

  it("always sorts descending by specific strength", () => {
    fc.assert(
      fc.property(fc.array(materialArb, { maxLength: 20 }), (materials) => {
        const ranked = rankByStrength(materials);
        for (let i = 1; i < ranked.length; i++) {
          expect(specificStrength(ranked[i - 1])).toBeGreaterThanOrEqual(
            specificStrength(ranked[i]),
          );
        }
      }),
    );
  });

  it("is idempotent — ranking an already-ranked list changes nothing", () => {
    fc.assert(
      fc.property(fc.array(materialArb, { maxLength: 20 }), (materials) => {
        const ranked = rankByStrength(materials);
        expect(rankByStrength(ranked)).toEqual(ranked);
      }),
    );
  });
});

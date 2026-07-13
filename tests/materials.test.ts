import { describe, expect, it } from "vitest";
import { MATERIALS, getMaterial, specificStrength } from "../src/materials";

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

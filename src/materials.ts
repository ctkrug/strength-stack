/**
 * Materials dataset for Strength Stack.
 *
 * Values are typical/representative figures for each material class, drawn
 * from standard materials-science references. Real-world values vary with
 * processing, grade, and test method — this dataset is for comparative
 * visualization, not engineering design.
 */

export type MaterialCategory = "natural" | "metal" | "synthetic-fiber";

export interface Material {
  /** Stable identifier, used as the drag/drop and D3 key. */
  id: string;
  /** Display name shown in the UI. */
  name: string;
  category: MaterialCategory;
  /** Ultimate tensile strength, in megapascals (MPa). */
  tensileStrengthMPa: number;
  /** Density, in kilograms per cubic meter (kg/m^3). */
  densityKgM3: number;
  /** One-line fact shown alongside the material in the tray. */
  fact: string;
}

export const MATERIALS: Material[] = [
  {
    id: "concrete",
    name: "Concrete",
    category: "natural",
    tensileStrengthMPa: 4,
    densityKgM3: 2400,
    fact: "Strong in compression, notoriously weak in tension.",
  },
  {
    id: "bone",
    name: "Bone",
    category: "natural",
    tensileStrengthMPa: 130,
    densityKgM3: 1900,
    fact: "Living tissue that rebuilds itself under load.",
  },
  {
    id: "nylon",
    name: "Nylon",
    category: "synthetic-fiber",
    tensileStrengthMPa: 80,
    densityKgM3: 1150,
    fact: "The first fully synthetic fiber, from 1935.",
  },
  {
    id: "wood-oak",
    name: "Oak (along grain)",
    category: "natural",
    tensileStrengthMPa: 90,
    densityKgM3: 750,
    fact: "Strength varies hugely with grain direction.",
  },
  {
    id: "aluminum-7075",
    name: "Aluminum (7075-T6)",
    category: "metal",
    tensileStrengthMPa: 570,
    densityKgM3: 2810,
    fact: "Aerospace-grade alloy, a third the density of steel.",
  },
  {
    id: "steel",
    name: "Steel (hardened)",
    category: "metal",
    tensileStrengthMPa: 950,
    densityKgM3: 7850,
    fact: "The reference point everything else gets compared to.",
  },
  {
    id: "titanium-ti6al4v",
    name: "Titanium (Ti-6Al-4V)",
    category: "metal",
    tensileStrengthMPa: 950,
    densityKgM3: 4430,
    fact: "Matches hardened steel's strength at half the weight.",
  },
  {
    id: "spider-silk",
    name: "Spider Silk",
    category: "natural",
    tensileStrengthMPa: 1100,
    densityKgM3: 1300,
    fact: "Dragline silk, spun at ambient temperature from water.",
  },
  {
    id: "glass-fiber",
    name: "Glass Fiber",
    category: "synthetic-fiber",
    tensileStrengthMPa: 3450,
    densityKgM3: 2580,
    fact: "Cheap, stiff, and the backbone of fiberglass composites.",
  },
  {
    id: "carbon-fiber",
    name: "Carbon Fiber",
    category: "synthetic-fiber",
    tensileStrengthMPa: 3500,
    densityKgM3: 1600,
    fact: "Woven sheets of near-pure carbon, thinner than a hair.",
  },
  {
    id: "kevlar-49",
    name: "Kevlar 49",
    category: "synthetic-fiber",
    tensileStrengthMPa: 3620,
    densityKgM3: 1440,
    fact: "The aramid fiber behind bulletproof vests.",
  },
  {
    id: "snail-teeth",
    name: "Snail Teeth",
    category: "natural",
    tensileStrengthMPa: 4900,
    densityKgM3: 3400,
    fact: "Limpet radula teeth — the strongest natural material measured.",
  },
];

/**
 * Specific strength: tensile strength per unit weight, in kN·m/kg.
 * This is the single axis every material is plotted on.
 */
export function specificStrength(material: Material): number {
  return (material.tensileStrengthMPa / material.densityKgM3) * 1000;
}

export function getMaterial(id: string): Material | undefined {
  return MATERIALS.find((m) => m.id === id);
}

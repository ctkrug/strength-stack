import { describe, expect, it } from "vitest";
import { MATERIALS, rankByStrength, specificStrength } from "../src/materials";

function shuffled<T>(items: T[], seed: number): T[] {
  // Deterministic shuffle (Fisher-Yates with an LCG) so failures reproduce.
  const arr = [...items];
  let state = seed;
  const next = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

describe("rankByStrength", () => {
  it("returns an empty array for an empty input", () => {
    expect(rankByStrength([])).toEqual([]);
  });

  it("ranks a single material as its own top row", () => {
    const [steel] = MATERIALS.filter((m) => m.id === "steel");
    expect(rankByStrength([steel])).toEqual([steel]);
  });

  it("does not mutate the input array", () => {
    const input = [...MATERIALS];
    const copy = [...input];
    rankByStrength(input);
    expect(input).toEqual(copy);
  });

  it("ranks strictly descending by specific strength for the full dataset in randomized order", () => {
    for (const seed of [1, 42, 1337, 90210, 7]) {
      const ranked = rankByStrength(shuffled(MATERIALS, seed));
      expect(ranked).toHaveLength(MATERIALS.length);
      for (let i = 1; i < ranked.length; i++) {
        expect(specificStrength(ranked[i - 1])).toBeGreaterThanOrEqual(
          specificStrength(ranked[i]),
        );
      }
    }
  });

  it("puts snail teeth at rank 1 when placed alongside the default demo set", () => {
    const demoSet = MATERIALS.filter((m) =>
      ["concrete", "bone", "steel", "snail-teeth"].includes(m.id),
    );
    const ranked = rankByStrength(demoSet);
    expect(ranked[0].id).toBe("snail-teeth");
  });

  it("preserves original relative order for materials tied on specific strength", () => {
    // Steel and titanium are both 950 MPa but at different densities in the
    // real dataset, so this pins an exact tie synthetically — a naive
    // unstable sort could jitter these two on repeated re-renders.
    const [steel] = MATERIALS.filter((m) => m.id === "steel");
    const tiedTitanium = {
      ...MATERIALS.find((m) => m.id === "titanium-ti6al4v")!,
      tensileStrengthMPa: steel.tensileStrengthMPa,
      densityKgM3: steel.densityKgM3,
    };
    const bone = MATERIALS.find((m) => m.id === "bone")!;

    const ranked = rankByStrength([bone, steel, tiedTitanium]);
    expect(ranked.map((m) => m.id)).toEqual([
      "steel",
      "titanium-ti6al4v",
      "bone",
    ]);
  });

  it("moves the next-highest material to rank 1 after the current top is removed", () => {
    const ranked = rankByStrength(MATERIALS);
    const withoutTop = ranked.slice(1);
    const reranked = rankByStrength(withoutTop);
    expect(reranked[0].id).not.toBe(ranked[0].id);
    expect(specificStrength(reranked[0])).toBeLessThan(
      specificStrength(ranked[0]),
    );
  });
});

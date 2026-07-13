import { describe, expect, it, vi } from "vitest";
import { ChartStore } from "../src/state";
import { getMaterial } from "../src/materials";

const steel = getMaterial("steel")!;
const bone = getMaterial("bone")!;

describe("ChartStore", () => {
  it("starts empty with no initial argument", () => {
    const store = new ChartStore();
    expect(store.getPlaced()).toEqual([]);
  });

  it("seeds initial state without notifying listeners", () => {
    const store = new ChartStore([steel]);
    const listener = vi.fn();
    store.subscribe(listener);

    expect(store.getPlaced()).toEqual([steel]);
    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies listeners with the placed material's id on place()", () => {
    const store = new ChartStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.place(steel);

    expect(listener).toHaveBeenCalledWith([steel], steel.id);
  });

  it("notifies listeners with null on remove()", () => {
    const store = new ChartStore([steel, bone]);
    const listener = vi.fn();
    store.subscribe(listener);

    store.remove(steel.id);

    expect(listener).toHaveBeenCalledWith([bone], null);
  });

  it("is a no-op to place an already-placed material", () => {
    const store = new ChartStore([steel]);
    const listener = vi.fn();
    store.subscribe(listener);

    store.place(steel);

    expect(listener).not.toHaveBeenCalled();
    expect(store.getPlaced()).toEqual([steel]);
  });

  it("is a no-op to remove a material that isn't placed", () => {
    const store = new ChartStore([steel]);
    const listener = vi.fn();
    store.subscribe(listener);

    store.remove("kevlar-49");

    expect(listener).not.toHaveBeenCalled();
    expect(store.getPlaced()).toEqual([steel]);
  });

  it("stops notifying after unsubscribe", () => {
    const store = new ChartStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();

    store.place(steel);

    expect(listener).not.toHaveBeenCalled();
  });

  it("getPlaced returns a defensive copy", () => {
    const store = new ChartStore([steel]);
    const snapshot = store.getPlaced();
    snapshot.push(bone);

    expect(store.getPlaced()).toEqual([steel]);
  });
});

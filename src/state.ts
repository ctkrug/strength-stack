import { Material } from "./materials";

/**
 * `justPlacedId` is the id of the material that triggered this update via
 * `place()`, or null for removals — lets the chart tell a deliberate drop
 * apart from a re-sort so it only celebrates the former.
 */
export type Listener = (
  placed: Material[],
  justPlacedId: string | null,
) => void;

/**
 * Tracks which materials are currently placed on the chart. Minimal
 * pub/sub store — the chart re-renders whenever the placed set changes.
 */
export class ChartStore {
  private placed: Material[];
  private listeners: Set<Listener> = new Set();

  constructor(initial: Material[] = []) {
    this.placed = [...initial];
  }

  getPlaced(): Material[] {
    return [...this.placed];
  }

  isPlaced(id: string): boolean {
    return this.placed.some((m) => m.id === id);
  }

  place(material: Material): void {
    if (this.isPlaced(material.id)) return;
    this.placed = [...this.placed, material];
    this.notify(material.id);
  }

  remove(id: string): void {
    if (!this.isPlaced(id)) return;
    this.placed = this.placed.filter((m) => m.id !== id);
    this.notify(null);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(justPlacedId: string | null): void {
    const placed = this.getPlaced();
    for (const listener of this.listeners) listener(placed, justPlacedId);
  }
}

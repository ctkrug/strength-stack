import { Material } from "./materials";

export type Listener = (placed: Material[]) => void;

/**
 * Tracks which materials are currently placed on the chart. Minimal
 * pub/sub store — the chart re-renders whenever the placed set changes.
 */
export class ChartStore {
  private placed: Material[] = [];
  private listeners: Set<Listener> = new Set();

  getPlaced(): Material[] {
    return [...this.placed];
  }

  isPlaced(id: string): boolean {
    return this.placed.some((m) => m.id === id);
  }

  place(material: Material): void {
    if (this.isPlaced(material.id)) return;
    this.placed = [...this.placed, material];
    this.notify();
  }

  remove(id: string): void {
    this.placed = this.placed.filter((m) => m.id !== id);
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener(this.getPlaced());
  }
}

import { MATERIALS, getMaterial } from "./materials";
import { ChartStore } from "./state";
import { StrengthChart } from "./chart";
import { enableDragToPlace } from "./drag";

const DEFAULT_PLACED_IDS = ["concrete", "bone", "steel"];

function buildLayout(root: HTMLElement) {
  root.innerHTML = `
    <header class="site-header">
      <span class="wordmark">Strength<span class="wordmark__accent">Stack</span></span>
      <p class="tagline">Real materials, one honest scale.</p>
    </header>
    <main class="layout">
      <section class="chart-panel" aria-label="Specific strength chart">
        <div class="chart-panel__canvas" id="chart"></div>
      </section>
      <aside class="tray" aria-label="Available materials">
        <h2 class="tray__title">Materials</h2>
        <ul class="tray__list" id="tray-list"></ul>
      </aside>
    </main>
  `;
}

function renderTray(store: ChartStore, dropTarget: HTMLElement) {
  const list = document.getElementById("tray-list")!;
  list.innerHTML = "";
  for (const material of MATERIALS) {
    const item = document.createElement("li");
    item.className = "tray__item";
    const placed = store.isPlaced(material.id);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "tray__button";
    button.textContent = material.name;
    button.disabled = placed;
    button.setAttribute("aria-pressed", String(placed));
    button.addEventListener("click", () => store.place(material));

    if (!placed) {
      enableDragToPlace({
        source: button,
        dropTarget,
        onDrop: () => store.place(material),
      });
    }

    item.appendChild(button);
    list.appendChild(item);
  }
}

function main() {
  const root = document.getElementById("app");
  if (!root) return;

  buildLayout(root);

  const store = new ChartStore();
  const chart = new StrengthChart(document.getElementById("chart")!, (id) =>
    store.remove(id),
  );
  const chartPanel = document.querySelector<HTMLElement>(".chart-panel")!;

  store.subscribe((placed) => {
    chart.render(placed);
    renderTray(store, chartPanel);
  });

  for (const id of DEFAULT_PLACED_IDS) {
    const material = getMaterial(id);
    if (material) store.place(material);
  }

  window.addEventListener("resize", () => chart.render(store.getPlaced()));
}

main();

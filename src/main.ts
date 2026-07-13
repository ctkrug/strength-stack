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

  const initialPlaced = DEFAULT_PLACED_IDS.map(getMaterial).filter(
    (m): m is NonNullable<typeof m> => m !== undefined,
  );
  const store = new ChartStore(initialPlaced);
  const chart = new StrengthChart(document.getElementById("chart")!, (id) =>
    store.remove(id),
  );
  const chartPanel = document.querySelector<HTMLElement>(".chart-panel")!;

  store.subscribe((placed, justPlacedId) => {
    chart.render(placed, justPlacedId);
    renderTray(store, chartPanel);
  });

  // Seeded directly (not via place()) so the initial demo set never
  // triggers the just-placed celebration meant for a deliberate drop.
  chart.render(store.getPlaced(), null);
  renderTray(store, chartPanel);

  window.addEventListener("resize", () =>
    chart.render(store.getPlaced(), null),
  );
}

main();

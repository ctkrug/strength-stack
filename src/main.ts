import { MATERIALS, getMaterial } from "./materials";
import { ChartStore } from "./state";
import { StrengthChart } from "./chart";
import { enableDragToPlace } from "./drag";
import { SoundEngine } from "./sound";

const DEFAULT_PLACED_IDS = ["concrete", "bone", "steel"];

function buildLayout(root: HTMLElement) {
  root.innerHTML = `
    <header class="site-header">
      <div class="site-header__brand">
        <span class="wordmark">Strength<span class="wordmark__accent">Stack</span></span>
        <p class="tagline">Real materials, one honest scale.</p>
      </div>
      <button
        type="button"
        class="mute-toggle"
        id="mute-toggle"
        aria-pressed="false"
        aria-label="Mute sound effects"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
          <path class="mute-toggle__speaker" d="M4 9v6h4l5 5V4L8 9H4z" />
          <path class="mute-toggle__wave" d="M16.2 8.8a5 5 0 0 1 0 6.4" />
          <path class="mute-toggle__slash" d="M4 4l16 16" />
        </svg>
      </button>
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

function initMuteButton(sound: SoundEngine) {
  const button = document.getElementById("mute-toggle") as HTMLButtonElement;

  const sync = () => {
    const muted = sound.isMuted();
    button.classList.toggle("is-muted", muted);
    button.setAttribute("aria-pressed", String(muted));
    button.setAttribute(
      "aria-label",
      muted ? "Unmute sound effects" : "Mute sound effects",
    );
  };

  button.addEventListener("click", () => {
    sound.toggleMuted();
    sync();
  });

  sync();
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

  const sound = new SoundEngine();
  initMuteButton(sound);

  const initialPlaced = DEFAULT_PLACED_IDS.map(getMaterial).filter(
    (m): m is NonNullable<typeof m> => m !== undefined,
  );
  const store = new ChartStore(initialPlaced);
  const chart = new StrengthChart(document.getElementById("chart")!, (id) =>
    store.remove(id),
  );
  const chartPanel = document.querySelector<HTMLElement>(".chart-panel")!;

  store.subscribe((placed, justPlacedId) => {
    const celebrated = chart.render(placed, justPlacedId);
    renderTray(store, chartPanel);

    if (justPlacedId) {
      sound.playPlace();
      sound.playRescale();
      if (celebrated) sound.playCelebrate();
    }
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

import { MATERIALS, getMaterial } from "./materials";
import { ChartStore } from "./state";
import { StrengthChart } from "./chart";
import { enableDragToPlace } from "./drag";
import { SoundEngine } from "./sound";
import { MaterialTooltip } from "./tooltip";

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
        <h2 class="tray__title" id="tray-title" tabindex="-1">Materials</h2>
        <ul class="tray__list" id="tray-list"></ul>
      </aside>
    </main>
    <p id="status-announcer" class="sr-only" role="status" aria-live="polite"></p>
  `;
}

function announce(message: string) {
  const announcer = document.getElementById("status-announcer");
  if (announcer) announcer.textContent = message;
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

function renderTray(
  store: ChartStore,
  dropTarget: HTMLElement,
  tooltip: MaterialTooltip,
) {
  const list = document.getElementById("tray-list")!;
  const focusWasInTray = list.contains(document.activeElement);
  list.innerHTML = "";

  let firstEnabledButton: HTMLButtonElement | null = null;

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
    button.addEventListener("mouseenter", (event) =>
      tooltip.show(material, event.clientX, event.clientY),
    );
    button.addEventListener("mousemove", (event) =>
      tooltip.show(material, event.clientX, event.clientY),
    );
    button.addEventListener("mouseleave", () => tooltip.hide());
    button.addEventListener("focus", () => {
      const rect = button.getBoundingClientRect();
      tooltip.show(material, rect.right, rect.top);
    });
    button.addEventListener("blur", () => tooltip.hide());

    if (!placed) {
      enableDragToPlace({
        source: button,
        dropTarget,
        onDrop: () => store.place(material),
      });
      firstEnabledButton ??= button;
    }

    item.appendChild(button);
    list.appendChild(item);
  }

  // The tray button that triggered this render (if any) was just disabled
  // and dropped from the DOM, which knocks focus back to <body> — land it
  // somewhere useful instead of losing it.
  if (focusWasInTray && document.activeElement === document.body) {
    if (firstEnabledButton) {
      firstEnabledButton.focus();
    } else {
      document.getElementById("tray-title")?.focus();
    }
  }
}

function main() {
  const root = document.getElementById("app");
  if (!root) return;

  buildLayout(root);

  const sound = new SoundEngine();
  initMuteButton(sound);

  const tooltip = new MaterialTooltip();

  const initialPlaced = DEFAULT_PLACED_IDS.map(getMaterial).filter(
    (m): m is NonNullable<typeof m> => m !== undefined,
  );
  const store = new ChartStore(initialPlaced);
  const chart = new StrengthChart(
    document.getElementById("chart")!,
    (id) => store.remove(id),
    tooltip,
  );
  const chartPanel = document.querySelector<HTMLElement>(".chart-panel")!;

  store.subscribe((placed, justPlacedId) => {
    const celebrated = chart.render(placed, justPlacedId);
    renderTray(store, chartPanel, tooltip);

    if (justPlacedId) {
      sound.playPlace();
      sound.playRescale();
      if (celebrated) sound.playCelebrate();

      const name = getMaterial(justPlacedId)?.name ?? "Material";
      const rank = celebrated ? ", now ranked #1" : "";
      announce(`${name} placed on the chart${rank}. ${placed.length} materials placed.`);
    } else {
      announce(`Material removed from the chart. ${placed.length} materials placed.`);
    }
  });

  // Seeded directly (not via place()) so the initial demo set never
  // triggers the just-placed celebration meant for a deliberate drop.
  chart.render(store.getPlaced(), null);
  renderTray(store, chartPanel, tooltip);

  window.addEventListener("resize", () =>
    chart.render(store.getPlaced(), null),
  );
}

main();

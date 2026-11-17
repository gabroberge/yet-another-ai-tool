import type { Portfolio, Venture } from "../lib/domain/types";
import { describeVenture, type VentureView } from "../lib/domain/view";
import { SUBSTRATES } from "../lib/domain/substrates";
import { requireEnhancement } from "../lib/domain/enhancements";
import {
  createVenture,
  deleteVenture,
  findVenture,
  installEnhancement,
  rebrandVenture,
  setActive,
  spinOutVenture,
  uninstallEnhancement,
} from "../lib/domain/portfolio";
import { runInference } from "../lib/domain/console";
import { buildArtifact, type ArtifactId } from "../lib/generation/artifacts";
import { randomSeed } from "../lib/generation/rng";
import { commit, getPortfolio, persisted, subscribe } from "../lib/persistence/store";
import { updateCarton, updateShelfLabel } from "../lib/ui/carton-dom";
import {
  renderArchitecturePanel,
  renderArtifactsPanel,
  renderBuildPanel,
  renderConsolePanel,
  renderContentsPanel,
  renderHistoryPanel,
  renderMetrics,
  renderStrip,
  renderTrace,
  renderVentureHead,
} from "../lib/ui/panels";
import { announce } from "../lib/ui/announce";
import { confirmDialog } from "../lib/ui/confirm";
import { wait } from "../lib/ui/motion";
import { money } from "../lib/format";

type Tab = "build" | "architecture" | "artifacts" | "console" | "contents" | "history";
const TABS: readonly Tab[] = ["build", "architecture", "artifacts", "console", "contents", "history"];

const root = document.querySelector<HTMLElement>("[data-factory]")!;
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
const strip = $("[data-strip]");
const catalogView = $("[data-view=catalog]");
const ventureView = $("[data-view=venture]");
const head = $("[data-venture-head]");
const carton = $("[data-stage-carton]");
const label = $("[data-stage-label]");
const metrics = $("[data-stage-metrics]");
const panel = $("[data-panel]");
const tabs = [...root.querySelectorAll<HTMLButtonElement>("[role=tab]")];

const ui = {
  tab: "build" as Tab,
  catalog: false,
  artifact: "launch" as ArtifactId,
  inputs: new Map<string, string>(),
  panelKey: "",
  consoleRun: 0,
};

const params = new URLSearchParams(location.search);
let activeId: string | null = null;
{
  const p = getPortfolio();
  const requested = params.get("v");
  if (requested && findVenture(p, requested)) activeId = requested;
  else activeId = p.activeId ?? p.ventures[0]?.id ?? null;
  if (activeId && p.activeId !== activeId) commit((x) => setActive(x, activeId!));
  ui.catalog = !activeId || params.has("new");
  const tab = params.get("tab") as Tab | null;
  if (tab && TABS.includes(tab)) ui.tab = tab;
}

function active(p: Portfolio = getPortfolio()): Venture | undefined {
  return findVenture(p, activeId);
}

function syncUrl() {
  const url = new URL(location.href);
  url.search = "";
  if (ui.catalog) url.searchParams.set("new", "1");
  else if (activeId) url.searchParams.set("v", activeId);
  history.replaceState(null, "", url);
}

function focusKey(): string | null {
  return (document.activeElement as HTMLElement | null)?.closest<HTMLElement>("[data-key]")?.dataset.key ?? null;
}

function restoreFocus(key: string | null) {
  if (!key) return;
  const el = root.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`);
  if (el && !(el as HTMLButtonElement).disabled) el.focus({ preventScroll: true });
}

function renderPanel(venture: Venture, view: VentureView, force = false) {
  const key = `${ui.tab}:${venture.id}:${venture.updatedAt}:${venture.rebrands}:${ui.artifact}`;
  if (!force && key === ui.panelKey) return;
  ui.panelKey = key;
  panel.setAttribute("aria-labelledby", `tab-${ui.tab}`);
  switch (ui.tab) {
    case "build":
      panel.innerHTML = renderBuildPanel(venture, view);
      break;
    case "architecture":
      panel.innerHTML = renderArchitecturePanel(view);
      break;
    case "artifacts":
      panel.innerHTML = renderArtifactsPanel(view, ui.artifact);
      break;
    case "console":
      panel.innerHTML = renderConsolePanel(view, ui.inputs.get(venture.id) ?? view.substrate.console.sample);
      break;
    case "contents":
      panel.innerHTML = renderContentsPanel(view);
      break;
    case "history":
      panel.innerHTML = renderHistoryPanel(venture);
      break;
  }
}

function render(opts: { assemble?: boolean } = {}) {
  const key = focusKey();
  const p = getPortfolio();
  const venture = active(p);
  if (!venture) ui.catalog = true;
  strip.innerHTML = renderStrip(p, activeId, ui.catalog);
  strip.hidden = p.ventures.length === 0;
  catalogView.hidden = !ui.catalog;
  ventureView.hidden = ui.catalog;
  if (!ui.catalog && venture) {
    const view = describeVenture(venture);
    document.title = `${view.identity.name} · Factory · YAAT™`;
    head.innerHTML = renderVentureHead(view);
    updateCarton(carton, view, { size: "stage" }, opts.assemble);
    updateShelfLabel(label, view);
    metrics.innerHTML = renderMetrics(view);
    tabs.forEach((t) => {
      const selected = t.dataset.tab === ui.tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
    });
    renderPanel(venture, view, opts.assemble);
  } else {
    document.title = "Factory · YAAT™";
  }
  syncUrl();
  restoreFocus(key);
}

/* ---------- actions ---------- */

function manufacture(substrateId: string) {
  let createdId = "";
  commit((p) => {
    const { portfolio, venture } = createVenture(p, substrateId, randomSeed(), Date.now());
    createdId = venture.id;
    return portfolio;
  });
  activeId = createdId;
  ui.catalog = false;
  ui.tab = "build";
  render({ assemble: true });
  const view = describeVenture(active()!);
  announce(`Manufactured ${view.identity.name}, ${view.category}.`);
  head.querySelector<HTMLElement>("[data-head-name]")?.scrollIntoView({ block: "nearest" });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function install(id: string, remove = false) {
  const venture = active();
  if (!venture) return;
  const before = describeVenture(venture);
  commit((p) => (remove ? uninstallEnhancement(p, venture.id, id, Date.now()) : installEnhancement(p, venture.id, id, Date.now())));
  const after = describeVenture(active()!);
  render();
  const def = requireEnhancement(id);
  const verb = remove ? "Removed" : "Installed";
  const stage = after.stage.id !== before.stage.id ? ` ${after.identity.name} is now ${after.stage.label}.` : "";
  announce(`${verb} ${def.title}. Valuation ${money(after.valuation)}.${stage}`);
}

async function runConsole(form: HTMLFormElement) {
  const venture = active();
  if (!venture) return;
  const view = describeVenture(venture);
  const input = (form.elements.namedItem("input") as HTMLInputElement | HTMLTextAreaElement).value;
  ui.inputs.set(venture.id, input);
  const out = panel.querySelector<HTMLElement>("[data-console-output]")!;
  const result = runInference(view, input);
  const mine = ++ui.consoleRun;
  for (let i = 0; i <= result.trace.length; i++) {
    if (mine !== ui.consoleRun || !out.isConnected) return;
    out.innerHTML = renderTrace(view, result, input, i);
    const step = result.trace[i];
    if (step) await wait(Math.min(650, Math.max(70, step.ms * 0.22)));
  }
}

function download(id: ArtifactId) {
  const venture = active();
  if (!venture) return;
  const art = buildArtifact(describeVenture(venture), id);
  const url = URL.createObjectURL(new Blob([art.body], { type: "text/markdown" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: art.filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce(`Downloaded ${art.filename}.`);
}

async function copy(id: ArtifactId, button: HTMLElement) {
  const venture = active();
  if (!venture) return;
  const art = buildArtifact(describeVenture(venture), id);
  try {
    await navigator.clipboard.writeText(art.body);
    const original = button.innerHTML;
    button.textContent = "Copied";
    setTimeout(() => (button.innerHTML = original), 1400);
    announce(`${art.title} copied to clipboard.`);
  } catch {
    announce("Clipboard unavailable. Use Download instead.");
  }
}

root.addEventListener("click", async (e) => {
  const target = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!target || (target as HTMLButtonElement).disabled) return;
  const id = target.dataset.id ?? "";
  switch (target.dataset.action) {
    case "open":
      e.preventDefault();
      if (id === activeId && !ui.catalog) return;
      activeId = id;
      ui.catalog = false;
      commit((p) => setActive(p, id));
      render({ assemble: true });
      break;
    case "catalog":
      if (!getPortfolio().ventures.length) return;
      ui.catalog = !ui.catalog;
      render();
      break;
    case "manufacture":
      manufacture(id);
      break;
    case "random":
      manufacture(SUBSTRATES[Math.floor(Math.random() * SUBSTRATES.length)]!.id);
      break;
    case "install":
      install(id);
      break;
    case "uninstall":
      install(id, true);
      break;
    case "rebrand": {
      const venture = active();
      if (!venture) return;
      const before = describeVenture(venture).identity.name;
      commit((p) => rebrandVenture(p, venture.id, Date.now()));
      render({ assemble: true });
      announce(`${before} is now ${describeVenture(active()!).identity.name}.`);
      break;
    }
    case "spinout": {
      const venture = active();
      if (!venture) return;
      let createdId = "";
      commit((p) => {
        const r = spinOutVenture(p, venture.id, randomSeed(), Date.now());
        createdId = r.venture?.id ?? "";
        return r.portfolio;
      });
      if (createdId) {
        activeId = createdId;
        render({ assemble: true });
        announce(`Spun out ${describeVenture(active()!).identity.name}.`);
      }
      break;
    }
    case "delete": {
      const venture = active();
      if (!venture) return;
      const name = describeVenture(venture).identity.name;
      const ok = await confirmDialog({
        title: `Delete ${name}?`,
        body: "Its modules, artifacts, and history are removed from this browser. Other companies are not affected.",
        confirm: "Delete company",
      });
      if (!ok) return;
      const p = commit((x) => deleteVenture(x, venture.id));
      activeId = p.activeId;
      ui.catalog = !activeId;
      render({ assemble: true });
      announce(`Deleted ${name}.`);
      break;
    }
    case "artifact":
      ui.artifact = id as ArtifactId;
      render();
      break;
    case "copy":
      void copy(id as ArtifactId, target);
      break;
    case "download":
      download(id as ArtifactId);
      break;
  }
});

root.addEventListener("submit", (e) => {
  const form = (e.target as HTMLElement).closest<HTMLFormElement>("[data-console]");
  if (!form) return;
  e.preventDefault();
  void runConsole(form);
});

/* ---------- tabs ---------- */

function selectTab(tab: Tab, focus = false) {
  ui.tab = tab;
  render();
  if (focus) tabs.find((t) => t.dataset.tab === tab)?.focus();
}

tabs.forEach((t, i) => {
  t.addEventListener("click", () => selectTab(t.dataset.tab as Tab));
  t.addEventListener("keydown", (e) => {
    const move: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    if (e.key in move) {
      e.preventDefault();
      selectTab(TABS[(i + move[e.key]! + TABS.length) % TABS.length]!, true);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      selectTab(TABS[e.key === "Home" ? 0 : TABS.length - 1]!, true);
    }
  });
});

/* ---------- catalog filter ---------- */

const filters = [...catalogView.querySelectorAll<HTMLButtonElement>("[data-filter]")];
filters.forEach((b) =>
  b.addEventListener("click", () => {
    const kind = b.dataset.filter!;
    filters.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    catalogView.querySelectorAll<HTMLElement>("li[data-kind]").forEach((li) => (li.hidden = kind !== "all" && li.dataset.kind !== kind));
  }),
);

/* ---------- external changes ---------- */

subscribe((p) => {
  if (activeId && !findVenture(p, activeId)) {
    activeId = p.activeId;
    ui.catalog = !activeId;
    render({ assemble: true });
  }
});

window.addEventListener("storage", () => render());

render({ assemble: false });
if (!persisted()) announce("This browser is not saving changes. Your companies will be lost when you leave.");

import { describeVenture, STAGES, type VentureView } from "../lib/domain/view";
import { clearPortfolio, deleteVenture } from "../lib/domain/portfolio";
import { commit, getPortfolio, subscribe } from "../lib/persistence/store";
import { renderCarton } from "../lib/ui/carton";
import { renderShelfLabel, priceFigure } from "../lib/ui/labels";
import { fitClaims } from "../lib/ui/carton-dom";
import { confirmDialog } from "../lib/ui/confirm";
import { announce } from "../lib/ui/announce";
import { icon } from "../lib/ui/icons";
import { esc } from "../lib/ui/html";
import { ventureUrl } from "../lib/ui/paths";
import { lowerFirst, money, plural, relativeTime } from "../lib/format";

type Mode = "shelf" | "table";
type SortKey = "name" | "technology" | "stage" | "valuation" | "price" | "agents" | "modules" | "created";

const root = document.querySelector<HTMLElement>("[data-portfolio]")!;
const content = root.querySelector<HTMLElement>("[data-content]")!;
const empty = root.querySelector<HTMLElement>("[data-empty]")!;
const toolbar = root.querySelector<HTMLElement>("[data-toolbar]")!;
const summary = root.querySelector<HTMLElement>("[data-summary]")!;
const modes = [...root.querySelectorAll<HTMLButtonElement>("[data-mode]")];

const MODE_KEY = "yaat.portfolio.view";
function readMode(): Mode {
  try {
    return localStorage.getItem(MODE_KEY) === "table" ? "table" : "shelf";
  } catch {
    return "shelf";
  }
}

const state = {
  mode: readMode(),
  sort: "valuation" as SortKey,
  dir: -1 as 1 | -1,
};

const stageIndex = (v: VentureView) => STAGES.findIndex((s) => s.id === v.stage.id);
const SORTS: Record<SortKey, (v: VentureView) => string | number> = {
  name: (v) => v.identity.name.toLowerCase(),
  technology: (v) => v.substrate.name.toLowerCase(),
  stage: stageIndex,
  valuation: (v) => v.valuation,
  price: (v) => (v.pricing.model === "outcome" ? v.pricing.perOutcome : v.pricing.perSeat),
  agents: (v) => v.agents.length,
  modules: (v) => v.installedCount,
  created: (v) => v.venture.createdAt,
};

function deleteButton(v: VentureView, className = ""): string {
  return `<button type="button" data-delete="${esc(v.venture.id)}" class="grid size-8 place-items-center text-ink-2 transition-colors hover:bg-die hover:text-white ${className}" aria-label="Delete ${esc(v.identity.name)}">${icon("trash")}</button>`;
}

function renderShelf(views: VentureView[]): string {
  return `<ul class="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-y-10">
    ${views
      .map(
        (v) => `<li class="flex min-w-0 flex-col">
      <a href="${ventureUrl(v.venture.id)}" class="group flex h-[290px] items-end justify-center px-3 no-underline" aria-label="Open ${esc(v.identity.name)} in the Factory">
        <span class="transition-transform duration-200 group-hover:-translate-y-1.5">${renderCarton(v, { size: "shelf", label: false })}</span>
      </a>
      <div class="h-3 bg-ink" aria-hidden="true"></div>
      <div class="flex flex-1 flex-col gap-2 bg-[#d9dce3] px-2.5 pt-2.5 pb-3">
        ${renderShelfLabel(v, { compact: true })}
        <div class="flex items-center justify-between gap-2 px-0.5">
          <p class="min-w-0 truncate text-xs text-ink-2">Made from <span class="font-semibold text-ink">${esc(lowerFirst(v.substrate.name))}</span></p>
          ${deleteButton(v, "shrink-0")}
        </div>
      </div>
    </li>`,
      )
      .join("")}
  </ul>`;
}

function th(key: SortKey, label: string, align = "text-left"): string {
  const active = state.sort === key;
  const sort = active ? (state.dir === 1 ? "ascending" : "descending") : "none";
  return `<th scope="col" aria-sort="${sort}" class="${align} border-b-2 border-ink px-3 py-2 font-bold whitespace-nowrap">
    <button type="button" data-sort="${key}" class="inline-flex items-center gap-1 hover:text-ultra">${esc(label)}<span class="${active ? "" : "opacity-0"} text-xs" aria-hidden="true">${state.dir === 1 ? "▲" : "▼"}</span></button>
  </th>`;
}

function renderTable(views: VentureView[]): string {
  const rows = views
    .map((v) => {
      const fig = priceFigure(v);
      return `<tr class="border-b border-rule bg-paper hover:bg-board/60">
        <td class="px-3 py-2.5"><a href="${ventureUrl(v.venture.id)}" class="flex items-center gap-2.5 font-bold text-ink no-underline hover:text-ultra"><span class="size-4 shrink-0" style="background:${v.identity.color.bg}" aria-hidden="true"></span>${esc(v.identity.name)}</a><span class="ml-6.5 block text-xs text-ink-2">${esc(v.category)}</span></td>
        <td class="px-3 py-2.5 text-ink-2">${esc(v.substrate.name)}</td>
        <td class="whitespace-nowrap px-3 py-2.5">${esc(v.stage.label)}</td>
        <td class="px-3 py-2.5 text-right font-bold tabular">${esc(money(v.valuation))}</td>
        <td class="whitespace-nowrap px-3 py-2.5 text-right tabular">${esc(fig.amount)}<span class="block text-[11px] text-ink-2">${esc(fig.unit)}</span></td>
        <td class="px-3 py-2.5 text-right tabular">${v.agents.length}</td>
        <td class="px-3 py-2.5 text-right tabular">${v.installedCount}</td>
        <td class="px-3 py-2.5 text-right whitespace-nowrap text-ink-2 tabular">${esc(relativeTime(v.venture.createdAt))}</td>
        <td class="px-1 py-2.5 text-right">${deleteButton(v)}</td>
      </tr>`;
    })
    .join("");
  return `<div class="overflow-x-auto">
    <table class="w-full min-w-[860px] border-collapse text-sm">
      <caption class="sr-only">Companies, sorted by ${esc(state.sort)}</caption>
      <thead><tr>
        ${th("name", "Company")}${th("technology", "Technology")}${th("stage", "Stage")}${th("valuation", "Valuation", "text-right")}${th("price", "Price", "text-right")}${th("agents", "Agents", "text-right")}${th("modules", "Modules", "text-right")}${th("created", "Created", "text-right")}
        <th class="border-b-2 border-ink"><span class="sr-only">Actions</span></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function render() {
  const p = getPortfolio();
  const views = p.ventures.map(describeVenture);
  const total = views.reduce((s, v) => s + v.valuation, 0);
  const agents = views.reduce((s, v) => s + v.agents.length, 0);
  summary.textContent = views.length ? `${plural(views.length, "company", "companies")}, ${money(total)} combined valuation, ${plural(agents, "agent")} deployed.` : "";
  empty.hidden = views.length > 0;
  toolbar.hidden = views.length === 0;
  modes.forEach((m) => m.setAttribute("aria-pressed", String(m.dataset.mode === state.mode)));
  if (!views.length) {
    content.innerHTML = "";
    return;
  }
  const get = SORTS[state.sort];
  const sorted = [...views].sort((a, b) => {
    const x = get(a);
    const y = get(b);
    return (x < y ? -1 : x > y ? 1 : 0) * state.dir;
  });
  content.innerHTML = state.mode === "shelf" ? renderShelf(sorted) : renderTable(sorted);
  fitClaims(content);
}

root.addEventListener("click", async (e) => {
  const t = e.target as HTMLElement;
  const mode = t.closest<HTMLElement>("[data-mode]")?.dataset.mode as Mode | undefined;
  if (mode) {
    state.mode = mode;
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* view preference is optional */
    }
    render();
    return;
  }
  const sort = t.closest<HTMLElement>("[data-sort]")?.dataset.sort as SortKey | undefined;
  if (sort) {
    state.dir = state.sort === sort ? ((state.dir * -1) as 1 | -1) : sort === "name" || sort === "technology" ? 1 : -1;
    state.sort = sort;
    render();
    root.querySelector<HTMLElement>(`[data-sort="${sort}"]`)?.focus();
    return;
  }
  const del = t.closest<HTMLElement>("[data-delete]")?.dataset.delete;
  if (del) {
    const v = getPortfolio().ventures.find((x) => x.id === del);
    if (!v) return;
    const name = describeVenture(v).identity.name;
    const ok = await confirmDialog({ title: `Delete ${name}?`, body: "Its modules, artifacts, and history are removed from this browser. Other companies are not affected.", confirm: "Delete company" });
    if (!ok) return;
    commit((p) => deleteVenture(p, del));
    announce(`Deleted ${name}.`);
    return;
  }
  if (t.closest("[data-clear]")) {
    const n = getPortfolio().ventures.length;
    const ok = await confirmDialog({
      title: "Clear the portfolio?",
      body: `All ${plural(n, "company", "companies")} and their history are removed from this browser. This cannot be undone.`,
      confirm: "Clear portfolio",
    });
    if (!ok) return;
    commit(() => clearPortfolio());
    announce("Portfolio cleared.");
  }
});

subscribe(render);
render();

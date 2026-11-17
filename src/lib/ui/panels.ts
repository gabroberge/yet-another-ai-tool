import type { Portfolio, Venture, VentureEvent } from "../domain/types";
import { describeVenture, TIER_LABELS, type VentureView } from "../domain/view";
import { ENHANCEMENTS, GROUP_LABELS, GROUP_ORDER, type EnhancementDef } from "../domain/enhancements";
import { canInstall, canUninstall } from "../domain/portfolio";
import { KIND_LABELS } from "../domain/substrates";
import { fillTemplate, VOICES } from "../generation/identity";
import { ARTIFACT_ORDER, buildArtifact, grossMargin, type ArtifactId } from "../generation/artifacts";
import type { InferenceResult } from "../domain/console";
import { billions, latency, microCost, money, plural, price, relativeTime } from "../format";
import { renderContents } from "./labels";
import { renderMarkdown } from "./markdown";
import { renderMark } from "./mark";
import { icon, type IconName } from "./icons";
import { cx, esc } from "./html";

const BTN = "inline-flex h-9 items-center gap-1.5 px-3 text-sm font-bold transition-colors disabled:cursor-not-allowed";
export const BUTTON = {
  primary: `${BTN} bg-ultra text-white hover:bg-ultra-deep disabled:bg-transparent disabled:text-ink-3 disabled:shadow-[inset_0_0_0_1px_var(--color-rule)]`,
  ink: `${BTN} bg-ink text-white hover:bg-ultra`,
  outline: `${BTN} border border-ink/80 bg-paper hover:bg-ink hover:text-white disabled:border-rule disabled:bg-transparent disabled:text-ink-3`,
  quiet: `${BTN} text-ink-2 hover:bg-board hover:text-ink`,
  danger: `${BTN} text-ink-2 hover:bg-die hover:text-white`,
};

function signedMoney(n: number): string {
  return `${n >= 0 ? "+" : "−"}${money(Math.abs(n))}`;
}

/* ---------- Venture strip ---------- */

export function renderStrip(p: Portfolio, activeId: string | null, catalogOpen: boolean): string {
  const items = p.ventures
    .map((v) => {
      const view = describeVenture(v);
      const active = !catalogOpen && v.id === activeId;
      return `<li class="shrink-0"><a href="?v=${esc(v.id)}" data-action="open" data-id="${esc(v.id)}" data-key="open-${esc(v.id)}" ${active ? 'aria-current="true"' : ""}
        class="group flex h-14 items-center gap-2.5 border border-transparent bg-paper pr-4 pl-2 text-left no-underline transition-colors hover:border-ink/40 aria-[current=true]:border-ink aria-[current=true]:shadow-[inset_0_-3px_0_var(--color-ultra)]">
        <span class="grid size-9 shrink-0 place-items-center" style="background:${view.identity.color.bg};color:${view.identity.color.ink}">${renderMark(view.identity.markSeed, "size-5")}</span>
        <span class="min-w-0 leading-tight"><span class="block max-w-[11rem] truncate text-sm font-bold text-ink">${esc(view.identity.name)}</span><span class="block text-xs text-ink-2 tabular">${esc(money(view.valuation))}, ${esc(view.stage.label)}</span></span>
      </a></li>`;
    })
    .join("");
  return `<ul class="flex items-center gap-2 overflow-x-auto py-3 [scrollbar-width:none]" aria-label="Your companies">
    <li class="shrink-0"><button type="button" data-action="catalog" data-key="catalog" ${catalogOpen ? 'aria-pressed="true"' : 'aria-pressed="false"'}
      class="flex h-14 items-center gap-2 border border-dashed border-ink/50 px-4 text-sm font-bold transition-colors hover:border-ink hover:bg-paper aria-pressed:border-solid aria-pressed:border-ultra aria-pressed:bg-ultra aria-pressed:text-white">${icon("plus", "size-4")}New company</button></li>
    ${items}
  </ul>`;
}

/* ---------- Venture head ---------- */

export function renderVentureHead(view: VentureView): string {
  const { identity } = view;
  return `<div class="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
    <div class="min-w-0 max-w-[62ch]">
      <div class="flex items-center gap-3">
        <span class="grid size-11 shrink-0 place-items-center" style="background:${identity.color.bg};color:${identity.color.ink}">${renderMark(identity.markSeed, "size-6")}</span>
        <h1 class="truncate text-[clamp(1.9rem,3.2vw,2.75rem)] leading-none font-black tracking-[-0.02em] wide" data-head-name>${esc(identity.name)}</h1>
      </div>
      <p class="mt-3 text-base font-semibold">${esc(view.category)}</p>
      <p class="mt-2 text-[15px] leading-snug text-ink-2">${esc(view.positioning)}</p>
    </div>
    <div class="flex flex-wrap gap-1">
      <button type="button" class="${BUTTON.quiet}" data-action="rebrand" data-key="rebrand">${icon("rebrand")}Rebrand</button>
      <button type="button" class="${BUTTON.quiet}" data-action="spinout" data-key="spinout">${icon("spinout")}Spin out</button>
      <button type="button" class="${BUTTON.danger}" data-action="delete" data-key="delete">${icon("trash")}Delete</button>
    </div>
  </div>`;
}

/* ---------- Metrics ---------- */

export function renderMetrics(view: VentureView): string {
  const margin = grossMargin(view);
  const next = view.nextStage;
  const progress = next ? Math.min(100, Math.max(2, ((view.valuation - view.stage.min) / (next.min - view.stage.min)) * 100)) : 100;
  const cell = (label: string, value: string, extra = "") =>
    `<div class="bg-paper px-3 py-2.5"><dt class="text-[11px] text-ink-2">${esc(label)}</dt><dd class="mt-0.5 text-lg leading-tight font-extrabold tabular ${extra}">${esc(value)}</dd></div>`;
  return `<div class="grid gap-px bg-rule">
    <div class="bg-paper px-3 py-3">
      <div class="flex items-baseline justify-between gap-3 text-[11px] text-ink-2"><span>${esc(view.stage.label)}</span><span>${next ? `${esc(next.label)} at ${esc(money(next.min))}` : "Top stage"}</span></div>
      <div class="mt-1.5 h-2 bg-board" role="progressbar" aria-label="Progress to ${esc(next?.label ?? "top stage")}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress)}"><div class="h-full bg-ultra transition-[width] duration-500" style="width:${progress}%"></div></div>
    </div>
    <dl class="grid grid-cols-3 gap-px bg-rule">
      ${cell("YIQ", String(view.yiq))}
      ${cell("Agents", String(view.agents.length))}
      ${cell("Layers", String(view.layers.length))}
      ${cell("Latency", latency(view.latencyMs))}
      ${cell("Gross margin", `${margin}%`, margin < 0 ? "text-die" : "")}
      ${cell("Market", billions(view.tamBillions))}
    </dl>
  </div>`;
}

/* ---------- Build ---------- */

function previewDelta(venture: Venture, view: VentureView, def: EnhancementDef): string {
  const next = describeVenture({ ...venture, installed: [...venture.installed, { id: def.id, at: 0 }] });
  const parts: string[] = [];
  const dv = next.valuation - view.valuation;
  if (dv) parts.push(`<span class="font-bold text-ink">${esc(signedMoney(dv))}</span> valuation`);
  const unitNow = view.pricing.model === "outcome" ? view.pricing.perOutcome : view.pricing.perSeat;
  const unitNext = next.pricing.model === "outcome" ? next.pricing.perOutcome : next.pricing.perSeat;
  if (next.pricing.model !== view.pricing.model) parts.push(`priced per ${esc(view.substrate.domain.object)}`);
  else if (unitNext !== unitNow) parts.push(`${unitNext > unitNow ? "+" : "−"}${esc(price(Math.abs(unitNext - unitNow)))} ${next.pricing.model === "outcome" ? "per " + esc(view.substrate.domain.object) : "per seat"}`);
  const dl = next.latencyMs - view.latencyMs;
  if (dl >= 1) parts.push(`+${esc(latency(dl))}`);
  if (next.category !== view.category) parts.push(`becomes ${esc(next.category)}`);
  return parts.join('<span class="text-ink-3"> / </span>');
}

function moduleRow(venture: Venture, view: VentureView, def: EnhancementDef): string {
  const count = view.counts[def.id] ?? 0;
  const install = canInstall(venture, def.id);
  const uninstall = count ? canUninstall(venture, def.id) : null;
  const multi = def.max > 1;
  const pitch = fillTemplate(def.pitch, view.substrate, view.identity.name);
  const installed = count > 0;
  const titleExtra = multi && count ? ` <span class="ml-1 inline-block bg-ink px-1.5 py-px align-middle text-[11px] font-bold text-white tabular">${count} of ${def.max}</span>` : "";
  const status = !install.ok && !installed ? `<p class="mt-1.5 flex items-center gap-1.5 text-xs text-ink-2">${icon("lock", "size-3.5")}${esc(install.reason)}</p>` : "";
  const delta = install.ok ? `<p class="mt-1.5 text-xs text-ink-2">${previewDelta(venture, view, def)}</p>` : "";

  let actions = "";
  if (multi) {
    actions = `<div class="flex items-center gap-1">
      ${count ? `<button type="button" class="${BUTTON.outline} w-9 justify-center px-0" data-action="uninstall" data-id="${def.id}" data-key="uninstall-${def.id}" aria-label="Remove one ${esc(def.title)}" ${uninstall && !uninstall.ok ? `disabled title="${esc(uninstall.reason)}"` : ""}>${icon("minus")}</button>` : ""}
      <button type="button" class="${BUTTON.primary}" data-action="install" data-id="${def.id}" data-key="install-${def.id}" ${install.ok ? "" : "disabled"}>${icon("plus")}${count ? "Add" : "Deploy"}</button>
    </div>`;
  } else if (installed) {
    actions = `<button type="button" class="${BUTTON.outline}" data-action="uninstall" data-id="${def.id}" data-key="uninstall-${def.id}" ${uninstall && !uninstall.ok ? `disabled title="${esc(uninstall.reason)}"` : ""}>Remove</button>`;
  } else {
    actions = `<button type="button" class="${BUTTON.primary}" data-action="install" data-id="${def.id}" data-key="install-${def.id}" ${install.ok ? "" : "disabled"}>${icon("plus")}Install</button>`;
  }
  const removeReason = uninstall && !uninstall.ok ? `<p class="mt-1.5 text-xs text-ink-2">${esc(uninstall.reason)}</p>` : "";

  return `<li class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-rule py-4">
    <div class="min-w-0">
      <p class="flex items-center gap-2 font-bold">${installed ? `<span class="grid size-4 place-items-center bg-ok text-white">${icon("check", "size-3")}</span>` : ""}${esc(def.title)}${titleExtra}</p>
      <p class="mt-1 max-w-[60ch] text-sm text-ink-2">${esc(pitch)}</p>
      ${installed && !multi ? removeReason : delta}${status}
    </div>
    ${actions}
  </li>`;
}

export function renderBuildPanel(venture: Venture, view: VentureView): string {
  return GROUP_ORDER.map((group) => {
    const defs = ENHANCEMENTS.filter((e) => e.group === group);
    const installed = defs.reduce((s, d) => s + (view.counts[d.id] ?? 0), 0);
    return `<section class="mb-8 last:mb-0" aria-labelledby="group-${group}">
      <div class="flex items-baseline justify-between border-b-2 border-ink pb-2">
        <h3 id="group-${group}" class="text-lg font-extrabold semiwide">${esc(GROUP_LABELS[group])}</h3>
        <span class="text-xs text-ink-2 tabular">${installed ? `${installed} installed` : ""}</span>
      </div>
      <ul>${defs.map((d) => moduleRow(venture, view, d)).join("")}</ul>
    </section>`;
  }).join("");
}

/* ---------- Architecture ---------- */

export function renderArchitecturePanel(view: VentureView): string {
  const above = view.layers.filter((l) => l.tier !== "foundation");
  const foundation = view.layers.find((l) => l.tier === "foundation")!;
  const row = (tier: string, name: string, detail: string, ms: string, cost: string, dark = false) =>
    `<li class="${cx("grid grid-cols-[6rem_minmax(0,1fr)_auto] items-center gap-3 py-2.5 pr-3 pl-3 sm:grid-cols-[7rem_minmax(0,1fr)_5.5rem_5.5rem]", dark ? "bg-ink text-white" : "bg-paper")}">
      <span class="${cx("narrow text-xs font-bold", dark ? "text-white/70" : "text-ink-2")}">${esc(tier)}</span>
      <span class="min-w-0"><span class="block truncate text-sm font-bold">${esc(name)}</span><span class="${cx("block truncate text-xs", dark ? "text-white/70" : "text-ink-2")}">${esc(detail)}</span></span>
      <span class="${cx("text-right text-xs tabular", dark ? "text-white/70" : "text-ink-2")}">${esc(ms)}</span>
      <span class="${cx("hidden text-right text-xs tabular sm:block", dark ? "text-white/70" : "text-ink-2")}">${esc(cost)}</span>
    </li>`;
  return `<div>
    <dl class="mb-6 grid grid-cols-2 gap-px bg-rule sm:grid-cols-4">
      <div class="bg-paper px-3 py-2.5"><dt class="text-[11px] text-ink-2">Layers above foundation</dt><dd class="text-xl font-extrabold tabular">${above.length}</dd></div>
      <div class="bg-paper px-3 py-2.5"><dt class="text-[11px] text-ink-2">End-to-end latency</dt><dd class="text-xl font-extrabold tabular">${esc(latency(view.latencyMs))}</dd></div>
      <div class="bg-paper px-3 py-2.5"><dt class="text-[11px] text-ink-2">Cost per request</dt><dd class="text-xl font-extrabold tabular">${esc(microCost(view.costPerCall))}</dd></div>
      <div class="bg-paper px-3 py-2.5"><dt class="text-[11px] text-ink-2">Platform code</dt><dd class="text-xl font-extrabold tabular">${view.loc.toLocaleString("en-US")} lines</dd></div>
    </dl>
    ${above.length ? `<ol class="grid gap-1">${above.map((l) => row(TIER_LABELS[l.tier], l.name, l.detail, `+${latency(l.latencyMs)}`, `+${microCost(l.costPerCall)}`)).join("")}</ol>` : `<p class="bg-paper px-4 py-6 text-sm text-ink-2">No layers yet. Install modules from Build to add them above the foundation.</p>`}
    <div class="relative my-4 border-t-2 border-dashed border-die" role="separator" aria-label="Foundation line"><span class="absolute top-0 right-0 -translate-y-1/2 bg-board pl-2 text-xs font-bold text-die">Foundation line</span></div>
    <ol>${row("Foundation", foundation.name, `${view.substrate.does} Unmodified.`, latency(foundation.latencyMs), microCost(foundation.costPerCall), true)}</ol>
  </div>`;
}

/* ---------- Artifacts ---------- */

export function renderArtifactsPanel(view: VentureView, active: ArtifactId): string {
  const art = buildArtifact(view, active);
  const list = ARTIFACT_ORDER.map((id) => {
    const a = buildArtifact(view, id);
    return `<li><button type="button" data-action="artifact" data-id="${id}" data-key="artifact-${id}" aria-pressed="${id === active}"
      class="w-full border-l-[3px] border-transparent px-3 py-2.5 text-left transition-colors hover:bg-paper aria-pressed:border-ultra aria-pressed:bg-paper">
      <span class="block text-sm font-bold">${esc(a.title)}</span><span class="block text-xs text-ink-2">${esc(a.filename)}</span></button></li>`;
  }).join("");
  return `<div class="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
    <ul class="flex gap-1 overflow-x-auto lg:block lg:space-y-1" aria-label="Artifacts">${list}</ul>
    <article class="min-w-0 bg-paper shadow-panel">
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3">
        <p class="text-sm text-ink-2">${esc(art.description)}</p>
        <div class="flex gap-1">
          <button type="button" class="${BUTTON.quiet}" data-action="copy" data-id="${active}" data-key="copy">${icon("copy")}Copy</button>
          <button type="button" class="${BUTTON.outline}" data-action="download" data-id="${active}" data-key="download">${icon("download")}Download</button>
        </div>
      </header>
      <div class="prose-artifact max-h-[70vh] overflow-y-auto px-5 py-6 sm:px-8">${renderMarkdown(art.body)}</div>
    </article>
  </div>`;
}

/* ---------- Console ---------- */

export function renderConsolePanel(view: VentureView, input: string): string {
  const c = view.substrate.console;
  const field = c.multiline
    ? `<textarea id="console-input" name="input" rows="5" class="w-full resize-y border border-ink/40 bg-paper p-3 font-mono text-sm focus:border-ink focus:outline-none">${esc(input)}</textarea>`
    : `<input id="console-input" name="input" value="${esc(input)}" class="h-11 w-full border border-ink/40 bg-paper px-3 font-mono text-sm focus:border-ink focus:outline-none" />`;
  return `<form data-console class="grid gap-3">
    <label for="console-input" class="text-sm font-bold">${esc(c.inputLabel)}</label>
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div class="flex-1">${field}</div>
      <button type="submit" class="${BUTTON.primary} h-11 justify-center px-5" data-key="console-run">${icon("play")}Run ${esc(view.identity.name)}</button>
    </div>
  </form>
  <div data-console-output class="mt-6" aria-live="polite"></div>`;
}

export function renderTrace(view: VentureView, r: InferenceResult, input: string, revealed: number): string {
  const max = Math.max(...r.trace.map((t) => t.ms));
  const rows = r.trace
    .map((t, i) => {
      const shown = i < revealed;
      return `<li class="${cx("grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-3 py-1.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_4.5rem]", !shown && "opacity-30")}">
        <span class="min-w-0"><span class="block truncate text-sm font-semibold">${esc(t.layer)}</span><span class="block truncate text-xs text-ink-2">${esc(t.note)}</span></span>
        <span class="hidden h-2 bg-board sm:block"><span class="block h-full ${t.tier === "foundation" ? "bg-ink" : "bg-ultra"} transition-[width] duration-300" style="width:${shown ? Math.max(1, (t.ms / max) * 100) : 0}%"></span></span>
        <span class="text-right text-xs tabular text-ink-2">${shown ? esc(latency(t.ms)) : ""}</span>
      </li>`;
    })
    .join("");
  const done = revealed >= r.trace.length;
  return `<div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
    <div>
      <h3 class="mb-2 text-sm font-bold">Inference trace</h3>
      <ol class="divide-y divide-rule border-y border-rule">${rows}</ol>
    </div>
    <div>
      <h3 class="mb-2 text-sm font-bold">Response</h3>
      ${
        done
          ? `<pre class="max-h-72 overflow-auto bg-ink p-4 text-[13px] leading-relaxed whitespace-pre-wrap text-white">${esc(r.result)}</pre>
      <dl class="mt-3 grid grid-cols-2 gap-px bg-rule text-sm">
        <div class="bg-paper px-3 py-2"><dt class="text-[11px] text-ink-2">Latency</dt><dd class="font-bold tabular">${esc(latency(r.totalMs))}</dd></div>
        <div class="bg-paper px-3 py-2"><dt class="text-[11px] text-ink-2">Cost</dt><dd class="font-bold tabular">${esc(microCost(r.costPerCall))}</dd></div>
        <div class="bg-paper px-3 py-2"><dt class="text-[11px] text-ink-2">Confidence</dt><dd class="font-bold tabular">${r.confidence === null ? "Not scored" : `${r.confidence.toFixed(1)}%`}</dd></div>
        <div class="bg-paper px-3 py-2"><dt class="text-[11px] text-ink-2">Policy</dt><dd class="font-bold">${esc(r.policy ?? "None")}</dd></div>
        <div class="col-span-2 bg-paper px-3 py-2"><dt class="text-[11px] text-ink-2">Request</dt><dd class="font-mono text-xs">${esc(r.requestId)}${r.reviewed ? ", human-reviewed" : ""}</dd></div>
      </dl>`
          : `<div class="grid h-40 place-items-center bg-paper text-sm text-ink-2">Processing through ${plural(r.trace.length, "layer")}</div>`
      }
    </div>
  </div>
  ${
    done
      ? `<details class="mt-6 border-t border-rule pt-4">
    <summary class="cursor-pointer text-sm font-bold">Foundation call</summary>
    <div class="mt-3 grid gap-2 text-sm">
      <code class="block overflow-x-auto bg-board px-3 py-2 font-mono text-xs">${esc(view.substrate.footprint)}</code>
      <pre class="max-h-60 overflow-auto bg-paper p-3 font-mono text-xs whitespace-pre-wrap">${esc(view.substrate.run(input))}</pre>
      <p class="text-xs text-ink-2">${esc(latency(view.substrate.baseLatencyMs))}, ${esc(microCost(view.substrate.baseCostPerCall))} per call</p>
    </div>
  </details>`
      : ""
  }`;
}

/* ---------- Contents ---------- */

export function renderContentsPanel(view: VentureView): string {
  const d = view.substrate.domain;
  const row = (k: string, v: string) => `<div class="grid grid-cols-[9rem_1fr] gap-4 py-2.5"><dt class="text-ink-2">${esc(k)}</dt><dd>${esc(v)}</dd></div>`;
  return `<div class="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
    ${renderContents(view.substrate, { className: "self-start shadow-panel" })}
    <div>
      <h3 class="border-b-2 border-ink pb-2 text-lg font-extrabold semiwide">Market</h3>
      <dl class="divide-y divide-rule text-sm">
        ${row("Type", KIND_LABELS[view.substrate.kind].one)}
        ${row("Buyer", d.buyer)}
        ${row("Industries", d.industry)}
        ${row("Pains addressed", d.pains.join(", "))}
        ${row("Addressable market", billions(view.tamBillions))}
        ${row("Voice", VOICES[view.identity.voice].label)}
        ${row("Tagline", view.tagline)}
      </dl>
      <h3 class="mt-8 border-b-2 border-ink pb-2 text-lg font-extrabold semiwide">Pricing</h3>
      <div class="grid grid-cols-3 gap-px bg-rule">
        ${view.pricing.tiers
          .map(
            (t) => `<div class="bg-paper px-3 py-3"><p class="text-xs text-ink-2">${esc(t.name)}</p><p class="mt-1 text-lg font-black tabular semiwide">${t.price === null ? "Contact sales" : esc(price(t.price))}</p><p class="text-[11px] text-ink-2">${esc(t.unit)}</p>
            <ul class="mt-2 space-y-1 text-xs">${t.includes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`,
          )
          .join("")}
      </div>
    </div>
  </div>`;
}

/* ---------- History ---------- */

const EVENT_ICONS: Record<VentureEvent["kind"], IconName> = {
  manufactured: "carton",
  installed: "plus",
  uninstalled: "minus",
  rebranded: "rebrand",
  "spun-out": "spinout",
  stage: "sparkle",
};

export function renderHistoryPanel(venture: Venture, now = Date.now()): string {
  if (!venture.events.length) return `<p class="text-sm text-ink-2">No events yet.</p>`;
  return `<ol class="border-t border-rule">${venture.events
    .map(
      (e) => `<li class="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-start gap-3 border-b border-rule py-3 text-sm">
        <span class="${cx("grid size-6 place-items-center", e.kind === "stage" ? "bg-seal text-ink" : "bg-paper text-ink-2")}">${icon(EVENT_ICONS[e.kind], "size-3.5")}</span>
        <span class="${cx(e.kind === "stage" && "font-bold")}">${esc(e.text)}</span>
        <time class="text-xs text-ink-2 tabular" datetime="${new Date(e.at).toISOString()}">${esc(relativeTime(e.at, now))}</time>
      </li>`,
    )
    .join("")}</ol>`;
}

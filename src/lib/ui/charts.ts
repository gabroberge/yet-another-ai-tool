import type { PortfolioTelemetry } from "../domain/telemetry";
import { KIND_LABELS, SUBSTRATE_KINDS } from "../domain/substrates";
import { latency, money } from "../format";
import { esc } from "./html";

/** Horizontal bars, one per company, in each company's carton color. */
export function valuationBars(t: PortfolioTelemetry): string {
  const rows = [...t.views].sort((a, b) => b.valuation - a.valuation).slice(0, 12);
  const max = Math.max(...rows.map((v) => v.valuation), 1);
  return `<ol class="grid gap-2">${rows
    .map(
      (v) => `<li class="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm">
      <span class="truncate font-semibold">${esc(v.identity.name)}</span>
      <span class="h-5 bg-board"><span class="block h-full" style="width:${Math.max(1.5, (v.valuation / max) * 100)}%;background:${v.identity.color.bg}"></span></span>
      <span class="text-right font-bold tabular">${esc(money(v.valuation))}</span>
    </li>`,
    )
    .join("")}</ol>`;
}

export function stageLadder(t: PortfolioTelemetry): string {
  const max = Math.max(...t.byStage.map((s) => s.count), 1);
  return `<div class="grid grid-cols-7 items-end gap-2" role="list">${t.byStage
    .map(
      (s) => `<div role="listitem" class="flex flex-col items-center gap-2" aria-label="${esc(s.label)}: ${s.count}">
      <span class="text-sm font-bold tabular" aria-hidden="true">${s.count || ""}</span>
      <span class="w-full ${s.count ? "bg-ultra" : "bg-board"}" style="height:${s.count ? 12 + (s.count / max) * 108 : 4}px" aria-hidden="true"></span>
      <span class="text-center text-[11px] leading-tight text-ink-2" aria-hidden="true">${esc(s.label)}</span>
    </div>`,
    )
    .join("")}</div>`;
}

export function kindMix(t: PortfolioTelemetry): string {
  const total = Math.max(1, t.ventures);
  const shades = ["#3a2bff", "#121318", "#e8157a", "#ffd23f", "#7b70ff", "#9a9caa"];
  const parts = SUBSTRATE_KINDS.map((k, i) => ({ k, n: t.byKind[k], color: shades[i]! })).filter((p) => p.n > 0);
  return `<div>
    <div class="flex h-6 w-full overflow-hidden" aria-hidden="true">${parts.map((p) => `<span style="width:${(p.n / total) * 100}%;background:${p.color}"></span>`).join("")}</div>
    <ul class="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">${parts
      .map((p) => `<li class="flex items-center gap-2"><span class="size-3 shrink-0" style="background:${p.color}"></span><span class="flex-1">${esc(KIND_LABELS[p.k].many)}</span><span class="font-bold tabular">${p.n}</span></li>`)
      .join("")}</ul>
  </div>`;
}

/** Foundation latency against company latency on a log scale, per company. */
export function latencyDumbbells(t: PortfolioTelemetry): string {
  const rows = [...t.views].sort((a, b) => b.latencyMs - a.latencyMs).slice(0, 10);
  const lo = Math.log10(0.1);
  const hi = Math.log10(Math.max(10_000, ...rows.map((v) => v.latencyMs)));
  const x = (ms: number) => ((Math.log10(Math.max(0.1, ms)) - lo) / (hi - lo)) * 100;
  const TICKS: [number, string][] = [[0.1, "0.1 ms"], [1, "1 ms"], [10, "10 ms"], [100, "100 ms"], [1000, "1 s"], [10000, "10 s"]];
  const ticks = TICKS.filter(([v]) => Math.log10(v) <= hi);
  return `<div>
    <div class="relative ml-[9.75rem] h-5 text-[10px] text-ink-3" aria-hidden="true">${ticks
      .map(([v, text], i) => `<span class="absolute ${i === 0 ? "" : i === ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2"} whitespace-nowrap tabular" style="left:${x(v)}%">${text}</span>`)
      .join("")}</div>
    <ol class="grid gap-2.5">${rows
      .map((v) => {
        const a = x(v.substrate.baseLatencyMs);
        const b = x(v.latencyMs);
        return `<li class="grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-3 text-sm" aria-label="${esc(v.identity.name)}: foundation ${esc(latency(v.substrate.baseLatencyMs))}, company ${esc(latency(v.latencyMs))}">
        <span class="truncate font-semibold" aria-hidden="true">${esc(v.identity.name)}</span>
        <span class="relative h-4" aria-hidden="true">
          <span class="absolute inset-x-0 top-1/2 h-px bg-rule"></span>
          <span class="absolute top-1/2 h-0.5 -translate-y-1/2 bg-ultra/40" style="left:${a}%;width:${Math.max(0, b - a)}%"></span>
          <span class="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 bg-ink" style="left:${a}%"></span>
          <span class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ultra" style="left:${b}%"></span>
        </span>
      </li>`;
      })
      .join("")}</ol>
    <p class="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2"><span class="flex items-center gap-1.5"><span class="size-2.5 bg-ink"></span>Foundation</span><span class="flex items-center gap-1.5"><span class="size-3 rounded-full bg-ultra"></span>Company, all layers</span></p>
  </div>`;
}

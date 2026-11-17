import type { Substrate } from "../domain/types";
import type { VentureView } from "../domain/view";
import { KIND_LABELS } from "../domain/substrates";
import { latency, microCost, money, price } from "../format";
import { renderBarcode } from "./barcode";
import { cx, esc } from "./html";

export function priceFigure(view: VentureView): { amount: string; unit: string } {
  return view.pricing.model === "outcome"
    ? { amount: price(view.pricing.perOutcome), unit: `per ${view.substrate.domain.object}` }
    : { amount: price(view.pricing.perSeat), unit: "per seat / month" };
}

/** Shelf-edge price label: the commercial face of a venture. */
export function renderShelfLabel(view: VentureView, opts: { compact?: boolean; className?: string } = {}): string {
  const fig = priceFigure(view);
  return `<div class="${cx("shelf-label relative grid min-w-0 bg-paper text-ink shadow-panel [&>*]:min-w-0", opts.compact ? "gap-1 p-2.5" : "gap-2 p-3.5", opts.className)}">
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <p class="${cx("truncate font-extrabold semiwide leading-tight", opts.compact ? "text-xs" : "text-sm")}" data-fig="name">${esc(view.identity.name)}</p>
      <p class="${cx("truncate text-ink-2", opts.compact ? "text-[10px]" : "text-xs")}" data-fig="category">${esc(view.category)}</p>
    </div>
    <span class="shrink-0 bg-seal px-1.5 py-0.5 text-[10px] font-bold tabular" data-fig="stage">${esc(view.stage.label)}</span>
  </div>
  <div class="flex items-end justify-between gap-3 border-t border-ink pt-2">
    <p class="leading-none">
      <span class="${cx("font-black wide tabular tracking-tight", opts.compact ? "text-2xl" : "text-4xl")}" data-fig="price">${esc(fig.amount)}</span>
      <span class="mt-1 block text-[10px] text-ink-2" data-fig="unit">${esc(fig.unit)}</span>
    </p>
    <p class="text-right leading-tight">
      <span class="block text-[10px] text-ink-2">Valuation</span>
      <span class="${cx("font-extrabold tabular", opts.compact ? "text-sm" : "text-lg")}" data-fig="valuation">${esc(money(view.valuation))}</span>
    </p>
  </div>
  ${opts.compact ? "" : `<div class="flex items-end justify-between gap-3 text-[10px] text-ink-2"><span class="tabular" data-fig="unitcost">${esc(microCost(view.costPerCall))} per call, ${esc(latency(view.latencyMs))}</span>${renderBarcode(view.identity.sku, "h-7 w-auto text-ink")}</div>`}
</div>`;
}

/** Nutrition-style panel listing the technology inside. Its size never changes. */
export function renderContents(substrate: Substrate, opts: { className?: string; headingLevel?: 2 | 3 } = {}): string {
  const h = `h${opts.headingLevel ?? 3}`;
  const row = (k: string, v: string, mono = false) =>
    `<div class="flex justify-between gap-4 border-b border-ink/25 py-1.5"><dt class="text-ink-2">${esc(k)}</dt><dd class="${cx("text-right font-semibold", mono && "font-mono text-[11px] font-normal")}">${esc(v)}</dd></div>`;
  return `<div class="${cx("contents-label bg-paper p-4 text-[13px] text-ink", opts.className)}">
  <${h} class="border-b-[6px] border-ink pb-1 text-3xl font-black narrow leading-none tracking-tight">Contents</${h}>
  <p class="border-b-2 border-ink py-1.5 text-xs"><span class="font-semibold">Serving size</span> 1 ${esc(KIND_LABELS[substrate.kind].noun)}</p>
  <dl>
    ${row("Technology", substrate.name)}
    ${row("Function", substrate.does)}
    ${row("First released", String(substrate.firstReleased))}
    ${row("Maintained by", substrate.maintainers)}
    ${row("License", substrate.license)}
    ${row("Latency", latency(substrate.baseLatencyMs))}
    ${row("Cost per call", microCost(substrate.baseCostPerCall))}
  </dl>
  <p class="mt-3 text-[11px] text-ink-2">Usage</p>
  <code class="mt-1 block overflow-x-auto whitespace-pre bg-board px-2 py-1.5 font-mono text-[11px]">${esc(substrate.footprint)}</code>
</div>`;
}

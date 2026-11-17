import type { VentureView } from "../domain/view";
import { KIND_LABELS } from "../domain/substrates";
import { renderBarcode } from "./barcode";
import { renderMark } from "./mark";
import { cx, esc } from "./html";

export type CartonSize = "hero" | "stage" | "shelf" | "mini";

const UNIT: Record<CartonSize, number> = { hero: 1.25, stage: 1, shelf: 0.66, mini: 0.42 };

export function cartonDimensions(volume: number): { w: number; h: number; d: number; g: number } {
  const g = Math.max(0, Math.min(volume, 9) - 1);
  return { w: Math.round(150 + 17 * g), h: Math.round(180 + 27 * g), d: Math.round(56 + 6 * g), g };
}

function claimMarkup(text: string, rank: number, isNew: boolean): string {
  return `<li class="${cx("claim", `claim--r${rank}`, rank >= 3 && "claim--seal", isNew && "is-new")}">${esc(text)}</li>`;
}

export interface CartonOptions {
  size: CartonSize;
  /** Claim ids that just appeared; they stamp on. */
  fresh?: ReadonlySet<string>;
  className?: string;
  label?: boolean;
}

export function renderCarton(view: VentureView, opts: CartonOptions): string {
  const { w, h, d } = cartonDimensions(view.volume);
  const { color, wordmark, sku, markSeed } = view.identity;
  const shown = opts.size === "mini" ? [] : view.claims;
  const style = [
    `--w:${w}`,
    `--h:${h}`,
    `--d:${d}`,
    `--u:${UNIT[opts.size]}px`,
    `--len:${Math.max(6, wordmark.length)}`,
    `--bg:${color.bg}`,
    `--ink:${color.ink}`,
    `--soft:${color.soft}`,
  ].join(";");
  const kind = KIND_LABELS[view.substrate.kind].noun;
  const label = opts.label === false ? "" : ` role="img" aria-label="${esc(`${view.identity.name} carton: ${view.category}. Contains ${view.substrate.name}.`)}"`;

  return `<div class="${cx("carton", `carton--${opts.size}`, opts.className)}" style="${style}"${label}>
  <div class="carton__top" aria-hidden="true"><span>YAAT</span><span>${esc(sku)}</span></div>
  <div class="carton__side" aria-hidden="true"><span class="carton__spine">${esc(wordmark)}</span></div>
  <div class="carton__front" aria-hidden="true">
    <div class="carton__brand">${renderMark(markSeed, "carton__mark")}<span class="carton__name">${esc(wordmark)}</span></div>
    <p class="carton__category">${esc(view.category)}</p>
    ${shown.length ? `<ul class="carton__claims">${shown.map((c) => claimMarkup(c.text, c.rank, Boolean(opts.fresh?.has(c.id)))).join("")}</ul>` : ""}
    <div class="carton__window"><span class="carton__window-label">Contains 1 ${esc(kind)}</span><code>${esc(view.substrate.footprint)}</code></div>
    <div class="carton__foot">${renderBarcode(sku, "carton__barcode", false)}<span>${esc(view.stage.label)}</span></div>
  </div>
</div>`;
}

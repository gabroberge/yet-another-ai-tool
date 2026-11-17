import type { VentureView } from "../domain/view";
import { renderCarton, type CartonOptions } from "./carton";
import { renderShelfLabel, priceFigure } from "./labels";
import { money, latency, microCost } from "../format";
import { setFigure } from "./motion";

/** Hide the lowest-ranked claims that do not fit on the front panel and count them instead. */
export function fitClaims(scope: ParentNode = document): void {
  scope.querySelectorAll<HTMLElement>(".carton__claims").forEach((list) => {
    list.querySelector(".claim--more")?.remove();
    const items = [...list.querySelectorAll<HTMLElement>(".claim")];
    items.forEach((i) => (i.hidden = false));
    const overflows = () => list.scrollHeight > list.clientHeight + 1;
    if (!overflows()) return;
    const more = document.createElement("li");
    more.className = "claim claim--more";
    list.append(more);
    for (let k = items.length - 1; k >= 0 && overflows(); k--) {
      items[k]!.hidden = true;
      more.textContent = `+${items.length - k} more`;
    }
  });
}

function toElement(html: string): HTMLElement {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}

/**
 * Morph an existing carton into the given venture's carton, keeping the element
 * so its dimensions transition. Claims that were not on the previous carton stamp on.
 */
export function updateCarton(host: HTMLElement, view: VentureView, opts: CartonOptions, assemble = false): void {
  const prev = new Set((host.dataset.claims ?? "").split("|").filter(Boolean));
  const fresh = new Set(prev.size || host.dataset.claims !== undefined ? view.claims.filter((c) => !prev.has(c.id)).map((c) => c.id) : []);
  const next = toElement(renderCarton(view, { ...opts, fresh }));
  const current = host.querySelector<HTMLElement>(":scope > .carton");
  if (!current || assemble) {
    host.replaceChildren(next);
    if (assemble) {
      next.classList.add("is-assembling");
      next.addEventListener("animationend", () => next.classList.remove("is-assembling"), { once: true });
    }
  } else {
    current.setAttribute("style", next.getAttribute("style") ?? "");
    current.setAttribute("aria-label", next.getAttribute("aria-label") ?? "");
    current.replaceChildren(...next.childNodes);
  }
  host.dataset.claims = view.claims.map((c) => c.id).join("|");
  fitClaims(host);
  window.setTimeout(() => fitClaims(host), 650);
}

export function updateShelfLabel(host: HTMLElement, view: VentureView, compact = false): void {
  if (!host.querySelector("[data-fig=price]")) {
    host.innerHTML = renderShelfLabel(view, { compact });
    return;
  }
  const fig = priceFigure(view);
  const set = (key: string, text: string, animate = true) => {
    const el = host.querySelector<HTMLElement>(`[data-fig=${key}]`);
    if (!el) return;
    if (animate) setFigure(el, text);
    else el.textContent = text;
  };
  set("name", view.identity.name, false);
  set("category", view.category, false);
  set("stage", view.stage.label, false);
  set("price", fig.amount);
  set("unit", fig.unit, false);
  set("valuation", money(view.valuation));
  set("unitcost", `${microCost(view.costPerCall)} per call, ${latency(view.latencyMs)}`, false);
}

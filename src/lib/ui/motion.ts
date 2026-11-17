import { esc } from "./html";

export const reducedMotion = (): boolean =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Replace a figure's text, flipping only the characters that changed, left to right. */
export function setFigure(el: HTMLElement | null, next: string): void {
  if (!el) return;
  const prev = el.dataset.value ?? el.textContent ?? "";
  if (prev === next) return;
  el.dataset.value = next;
  if (reducedMotion()) {
    el.textContent = next;
    return;
  }
  const offset = next.length - prev.length;
  let delay = 0;
  const glyphs = [...next]
    .map((ch, i) => {
      if (prev[i - offset] === ch) return esc(ch);
      delay += 38;
      return `<span class="flap" style="animation-delay:${delay}ms">${esc(ch)}</span>`;
    })
    .join("");
  el.innerHTML = `<span class="sr-only">${esc(next)}</span><span aria-hidden="true">${glyphs}</span>`;
  window.setTimeout(() => {
    if (el.dataset.value === next) el.textContent = next;
  }, delay + 600);
}

export function wait(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, reducedMotion() ? 0 : ms));
}

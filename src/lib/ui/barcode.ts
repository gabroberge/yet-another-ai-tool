import { hashString } from "../generation/rng";
import { esc } from "./html";

export function renderBarcode(code: string, className = "", label = true): string {
  let h = hashString(code);
  let x = 0;
  const bars: string[] = [];
  for (let i = 0; i < 34; i++) {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
    const w = 1 + (h % 3);
    if (i % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${w}" height="${i % 11 === 0 ? 30 : 26}"/>`);
    x += w;
  }
  const text = label ? `<text x="${x / 2}" y="37" text-anchor="middle" font-size="7" font-family="var(--font-mono)" letter-spacing=".08em">${esc(code)}</text>` : "";
  return `<svg class="${className}" viewBox="0 0 ${x} ${label ? 39 : 30}" fill="currentColor" role="img" aria-label="SKU ${esc(code)}">${bars.join("")}${text}</svg>`;
}

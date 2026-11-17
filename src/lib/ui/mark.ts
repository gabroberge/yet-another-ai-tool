import { Rng } from "../generation/rng";

type Cell = "square" | "circle" | "quarter" | "triangle" | "half" | "empty";
const CELLS: readonly Cell[] = ["square", "circle", "quarter", "quarter", "triangle", "half", "empty"];

function cellPath(kind: Cell, x: number, y: number, turn: number): string {
  const s = 12;
  const rot = ` transform="rotate(${turn * 90} ${x + s / 2} ${y + s / 2})"`;
  switch (kind) {
    case "square":
      return `<rect x="${x}" y="${y}" width="${s}" height="${s}"/>`;
    case "circle":
      return `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s / 2}"/>`;
    case "quarter":
      return `<path d="M${x} ${y}h${s}a${s} ${s} 0 0 1 -${s} ${s}z"${rot}/>`;
    case "triangle":
      return `<path d="M${x} ${y}h${s}l-${s} ${s}z"${rot}/>`;
    case "half":
      return `<rect x="${x}" y="${y}" width="${s}" height="${s / 2}"${rot}/>`;
    default:
      return "";
  }
}

/** A 2×2 geometric monogram, unique per brand seed. */
export function renderMark(seed: number, className = ""): string {
  const rng = new Rng(seed);
  let cells = Array.from({ length: 4 }, () => rng.pick(CELLS));
  if (cells.filter((c) => c !== "empty").length < 3) cells = cells.map((c, i) => (c === "empty" && i % 2 === 0 ? "quarter" : c));
  const shapes = cells.map((c, i) => cellPath(c, (i % 2) * 12, Math.floor(i / 2) * 12, rng.int(4))).join("");
  return `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${shapes}</svg>`;
}

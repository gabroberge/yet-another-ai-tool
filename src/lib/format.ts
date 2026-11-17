export function money(n: number): string {
  const abs = Math.abs(n);
  const fmt = (v: number, unit: string) => `$${v >= 100 ? Math.round(v) : v.toFixed(v >= 10 ? 1 : 2).replace(/\.?0+$/, "")}${unit}`;
  if (abs >= 1e9) return fmt(n / 1e9, "B");
  if (abs >= 1e6) return fmt(n / 1e6, "M");
  if (abs >= 1e3) return fmt(n / 1e3, "K");
  return `$${Math.round(n)}`;
}

export function price(n: number): string {
  if (n < 1) return `$${n.toFixed(2)}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })}`;
}

/** Per-call costs span eight orders of magnitude. */
export function microCost(n: number): string {
  if (n === 0) return "$0";
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  if (n >= 0.0001) return `$${n.toFixed(4)}`;
  return `$${n.toExponential(1).replace("e-", "×10⁻").replace(/\d+$/, (d) => toSuperscript(d))}`;
}

function toSuperscript(digits: string): string {
  const map = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  return digits.replace(/\d/g, (d) => map[Number(d)]!);
}

export function latency(ms: number): string {
  if (ms < 1) return `${ms.toFixed(1)} ms`;
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function integer(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function billions(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}T` : `$${n}B`;
}

export function relativeTime(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} d ago`;
}

/** Lowercase the first letter unless the first word is an acronym. */
export function lowerFirst(s: string): string {
  return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function listOf(items: readonly string[]): string {
  if (items.length < 3) return items.join(" and ");
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

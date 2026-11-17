import type { Portfolio, Venture, VentureEvent, VentureEventKind } from "./types";
import { getEnhancement, requireEnhancement } from "./enhancements";
import { getSubstrate, requireSubstrate } from "./substrates";
import { countInstalled, describeVenture, type VentureView } from "./view";
import { brandKey, generateName } from "../generation/naming/naming";
import { money } from "../format";

export const MAX_EVENTS = 60;

export function emptyPortfolio(): Portfolio {
  return { version: 1, activeId: null, ventures: [] };
}

export type Check = { ok: true } | { ok: false; reason: string };

function requirementLabel(id: string, count?: number): string {
  const def = requireEnhancement(id);
  if (id === "agent") return `${count ?? 1} agent${(count ?? 1) === 1 ? "" : "s"}`;
  return def.title;
}

export function canInstall(venture: Venture, enhancementId: string): Check {
  const def = getEnhancement(enhancementId);
  if (!def) return { ok: false, reason: "Unknown module" };
  const counts = countInstalled(venture);
  const have = counts[def.id] ?? 0;
  if (have >= def.max) return { ok: false, reason: def.max === 1 ? "Installed" : `Maximum of ${def.max}` };
  for (const req of def.requires ?? []) {
    if ((counts[req.id] ?? 0) < (req.count ?? 1)) return { ok: false, reason: `Requires ${requirementLabel(req.id, req.count)}` };
  }
  return { ok: true };
}

export function canUninstall(venture: Venture, enhancementId: string): Check {
  const counts = countInstalled(venture);
  if (!counts[enhancementId]) return { ok: false, reason: "Not installed" };
  const after = { ...counts, [enhancementId]: counts[enhancementId]! - 1 };
  for (const [id, n] of Object.entries(after)) {
    if (n <= 0) continue;
    for (const req of requireEnhancement(id).requires ?? []) {
      if ((after[req.id] ?? 0) < (req.count ?? 1)) return { ok: false, reason: `Required by ${requireEnhancement(id).title}` };
    }
  }
  return { ok: true };
}

function pushEvent(venture: Venture, kind: VentureEventKind, text: string, at: number): Venture {
  const events: VentureEvent[] = [{ at, kind, text }, ...venture.events].slice(0, MAX_EVENTS);
  return { ...venture, events, updatedAt: at };
}

function withStageEvent(before: VentureView, after: Venture, at: number): Venture {
  const next = describeVenture(after);
  if (next.stage.id === before.stage.id) return after;
  const rising = next.valuation > before.valuation;
  return pushEvent(after, "stage", rising ? `Reached ${next.stage.label} at a ${money(next.valuation)} valuation.` : `Revalued to ${money(next.valuation)}. Now ${next.stage.label}.`, at);
}

function replaceVenture(p: Portfolio, venture: Venture): Portfolio {
  return { ...p, ventures: p.ventures.map((v) => (v.id === venture.id ? venture : v)) };
}

export function findVenture(p: Portfolio, id: string | null | undefined): Venture | undefined {
  return id ? p.ventures.find((v) => v.id === id) : undefined;
}

/** Brand keys in use, so no two ventures in a portfolio share a name. */
export function takenNames(p: Portfolio, exceptId?: string): Set<string> {
  return new Set(p.ventures.filter((v) => v.id !== exceptId).map((v) => brandKey(v.name)));
}

function newId(seed: number, at: number, p: Portfolio): string {
  let id = `v-${(at % 1e10).toString(36)}-${(seed % 1e6).toString(36)}`;
  while (p.ventures.some((v) => v.id === id)) id += "x";
  return id;
}

export function createVenture(p: Portfolio, substrateId: string, seed: number, at: number): { portfolio: Portfolio; venture: Venture } {
  const substrate = getSubstrate(substrateId);
  if (!substrate) throw new Error(`Unknown substrate: ${substrateId}`);
  const s = seed >>> 0;
  const name = generateName(substrate, s, 0, { taken: takenNames(p) });
  const base: Venture = { id: newId(s, at, p), seed: s, substrateId, name, createdAt: at, updatedAt: at, rebrands: 0, installed: [], events: [] };
  const view = describeVenture(base);
  const venture = pushEvent(base, "manufactured", `Manufactured ${view.identity.name} on ${view.substrate.short}.`, at);
  return { portfolio: { ...p, activeId: venture.id, ventures: [venture, ...p.ventures] }, venture };
}

export function installEnhancement(p: Portfolio, ventureId: string, enhancementId: string, at: number): Portfolio {
  const venture = findVenture(p, ventureId);
  if (!venture) return p;
  if (!canInstall(venture, enhancementId).ok) return p;
  const before = describeVenture(venture);
  let next: Venture = { ...venture, installed: [...venture.installed, { id: enhancementId, at }] };
  const view = describeVenture(next);
  let text: string;
  if (enhancementId === "agent") {
    const agent = view.agents.at(-1)!;
    text = `Deployed ${agent.name}, ${agent.role}.`;
  } else {
    const layer = view.layers.find((l) => l.enhancementId === enhancementId);
    text = `Installed ${layer?.name ?? requireEnhancement(enhancementId).title}.`;
  }
  next = pushEvent(next, "installed", text, at);
  return replaceVenture(p, withStageEvent(before, next, at));
}

export function uninstallEnhancement(p: Portfolio, ventureId: string, enhancementId: string, at: number): Portfolio {
  const venture = findVenture(p, ventureId);
  if (!venture || !canUninstall(venture, enhancementId).ok) return p;
  const before = describeVenture(venture);
  const idx = venture.installed.map((i) => i.id).lastIndexOf(enhancementId);
  const installed = venture.installed.filter((_, i) => i !== idx);
  const label = enhancementId === "agent" ? `${before.agents.at(-1)?.name ?? "an agent"}` : requireEnhancement(enhancementId).title;
  let next = pushEvent({ ...venture, installed }, "uninstalled", `Retired ${label}.`, at);
  next = withStageEvent(before, next, at);
  return replaceVenture(p, next);
}

export function rebrandVenture(p: Portfolio, ventureId: string, at: number): Portfolio {
  const venture = findVenture(p, ventureId);
  if (!venture) return p;
  const before = describeVenture(venture);
  const taken = takenNames(p, ventureId).add(brandKey(venture.name));
  const rebrands = venture.rebrands + 1;
  const name = generateName(requireSubstrate(venture.substrateId), venture.seed, rebrands, { taken });
  let next: Venture = { ...venture, rebrands, name };
  next = pushEvent(next, "rebranded", `Rebranded from ${venture.name} to ${name}.`, at);
  return replaceVenture(p, withStageEvent(before, next, at));
}

export function spinOutVenture(p: Portfolio, ventureId: string, seed: number, at: number): { portfolio: Portfolio; venture: Venture | null } {
  const parent = findVenture(p, ventureId);
  if (!parent) return { portfolio: p, venture: null };
  const created = createVenture(p, parent.substrateId, seed, at);
  let child: Venture = { ...created.venture, installed: parent.installed.map((i) => ({ ...i, at })), spunOutFrom: parent.id, events: [] };
  child = pushEvent(child, "spun-out", `Spun out of ${parent.name} with ${child.installed.length} modules.`, at);
  const parentNext = pushEvent(parent, "spun-out", `Spun out ${child.name}.`, at);
  const ventures = created.portfolio.ventures.map((v) => (v.id === child.id ? child : v.id === parent.id ? parentNext : v));
  return { portfolio: { ...created.portfolio, ventures }, venture: child };
}

export function deleteVenture(p: Portfolio, ventureId: string): Portfolio {
  const ventures = p.ventures.filter((v) => v.id !== ventureId);
  const activeId = p.activeId === ventureId ? (ventures[0]?.id ?? null) : p.activeId;
  return { ...p, ventures, activeId };
}

export function clearPortfolio(): Portfolio {
  return emptyPortfolio();
}

export function setActive(p: Portfolio, ventureId: string): Portfolio {
  return findVenture(p, ventureId) ? { ...p, activeId: ventureId } : p;
}

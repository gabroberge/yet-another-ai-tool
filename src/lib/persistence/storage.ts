import type { InstalledEnhancement, Portfolio, Venture, VentureEvent } from "../domain/types";
import { emptyPortfolio, MAX_EVENTS } from "../domain/portfolio";
import { getEnhancement } from "../domain/enhancements";
import { getSubstrate } from "../domain/substrates";
import { migrateNames } from "./migrate";

export const STORAGE_KEY = "yaat.portfolio.v1";

const EVENT_KINDS = new Set(["manufactured", "installed", "uninstalled", "rebranded", "spun-out", "stage"]);

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function sanitizeInstalled(raw: unknown): InstalledEnhancement[] {
  if (!Array.isArray(raw)) return [];
  const out: InstalledEnhancement[] = [];
  const counts: Record<string, number> = {};
  for (const item of raw) {
    if (!isObject(item) || typeof item.id !== "string") continue;
    const def = getEnhancement(item.id);
    if (!def || (counts[def.id] ?? 0) >= def.max) continue;
    counts[def.id] = (counts[def.id] ?? 0) + 1;
    out.push({ id: def.id, at: typeof item.at === "number" ? item.at : 0 });
  }
  return out;
}

function sanitizeEvents(raw: unknown): VentureEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is VentureEvent => isObject(e) && typeof e.at === "number" && typeof e.text === "string" && EVENT_KINDS.has(e.kind as string))
    .slice(0, MAX_EVENTS);
}

export function sanitizeVenture(raw: unknown): Venture | null {
  if (!isObject(raw)) return null;
  const { id, seed, substrateId, createdAt } = raw;
  if (typeof id !== "string" || !id || typeof seed !== "number" || !Number.isFinite(seed)) return null;
  if (typeof substrateId !== "string" || !getSubstrate(substrateId)) return null;
  const created = typeof createdAt === "number" ? createdAt : 0;
  return {
    id,
    seed: seed >>> 0,
    substrateId,
    name: typeof raw.name === "string" ? raw.name.trim().slice(0, 80) : "",
    createdAt: created,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : created,
    rebrands: typeof raw.rebrands === "number" && raw.rebrands >= 0 ? Math.floor(raw.rebrands) : 0,
    installed: sanitizeInstalled(raw.installed),
    events: sanitizeEvents(raw.events),
    ...(typeof raw.spunOutFrom === "string" ? { spunOutFrom: raw.spunOutFrom } : {}),
  };
}

export function parsePortfolio(json: string | null): Portfolio {
  if (!json) return emptyPortfolio();
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return emptyPortfolio();
  }
  if (!isObject(raw) || raw.version !== 1 || !Array.isArray(raw.ventures)) return emptyPortfolio();
  const seen = new Set<string>();
  const ventures: Venture[] = [];
  for (const v of raw.ventures) {
    const venture = sanitizeVenture(v);
    if (!venture || seen.has(venture.id)) continue;
    seen.add(venture.id);
    ventures.push(venture);
  }
  const activeId = typeof raw.activeId === "string" && seen.has(raw.activeId) ? raw.activeId : (ventures[0]?.id ?? null);
  return { version: 1, activeId, ventures: migrateNames(ventures) };
}

function storageOrNull(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadPortfolio(storage: Storage | null = storageOrNull()): Portfolio {
  if (!storage) return emptyPortfolio();
  try {
    return parsePortfolio(storage.getItem(STORAGE_KEY));
  } catch {
    return emptyPortfolio();
  }
}

/** Returns false when the browser refuses the write (quota, private mode). */
export function savePortfolio(p: Portfolio, storage: Storage | null = storageOrNull()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

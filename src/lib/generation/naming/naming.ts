import type { Substrate } from "../../domain/types";
import { Rng } from "../rng";
import { KNOWN_CONFLICTS } from "./conflicts";

/** Descriptors that do not make a brand distinct: "Codex", "Codex.ai", "CodexOS", and "Ask Codex" are one name. */
const SUFFIXES = ["technologies", "software", "systems", "platform", "studios", "studio", "cloud", "labs", "lab", "apps", "app", "corp", "tech", "inc", "hub", "hq", "ai", "io", "os", "co"];
const PREFIXES = ["meet", "ask", "get", "try", "use", "hey", "the", "my", "go"];
const GLUED_SUFFIXES = ["cloud", "labs", "lab", "app", "hq", "ai", "io", "os"];
const GLUED_PREFIXES = ["ask", "get", "try", "use", "hey"];
/** Marks that are distinctive even inside a longer word. */
const EMBEDDED = ["gpt"];

export function nameTokens(name: string): string[] {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Case-, accent-, and punctuation-insensitive, with separate descriptor words removed. */
function spacedKey(name: string): string {
  const tokens = nameTokens(name);
  while (tokens.length > 1 && PREFIXES.includes(tokens[0]!)) tokens.shift();
  while (tokens.length > 1 && SUFFIXES.includes(tokens.at(-1)!)) tokens.pop();
  return tokens.join("");
}

/**
 * The distinctive part of a brand: descriptors are also removed when glued on,
 * so "Codexlabs" and "AskCodex.ai" both reduce to "codex". Two names with the same
 * key are the same brand.
 */
export function brandKey(name: string): string {
  let key = spacedKey(name);
  for (let changed = true; changed; ) {
    changed = false;
    for (const s of GLUED_SUFFIXES) {
      if (key.endsWith(s) && key.length - s.length >= 3) {
        key = key.slice(0, -s.length);
        changed = true;
      }
    }
    for (const p of GLUED_PREFIXES) {
      if (key.startsWith(p) && key.length - p.length >= 3) {
        key = key.slice(p.length);
        changed = true;
      }
    }
  }
  return key;
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length]!;
}

export class ConflictList {
  private readonly entries: { mark: string; key: string }[];

  constructor(marks: readonly string[]) {
    this.entries = marks.map((mark) => ({ mark, key: spacedKey(mark) })).filter((e) => e.key.length > 0);
  }

  extend(marks: readonly string[]): ConflictList {
    return new ConflictList([...this.entries.map((e) => e.mark), ...marks]);
  }

  /** The known mark a name collides with, or null. Exact, affixed, embedded, and one-letter-off variants all count. */
  match(name: string): string | null {
    const whole = nameTokens(name).join("");
    const keys = [...new Set([brandKey(name), spacedKey(name), whole])].filter(Boolean);
    for (const { mark, key: k } of this.entries) {
      if (EMBEDDED.includes(k) && whole.includes(k)) return mark;
      for (const key of keys) {
        if (key === k) return mark;
        if (k.length >= 4 && (key.startsWith(k) || key.endsWith(k))) return mark;
        if (k.length >= 6 && key.includes(k)) return mark;
        if (k.length >= 5 && editDistance(key, k) <= (k.length >= 8 ? 2 : 1)) return mark;
      }
    }
    return null;
  }
}

export const KNOWN = new ConflictList(KNOWN_CONFLICTS);

export function conflictFor(name: string, list: ConflictList = KNOWN): string | null {
  return list.match(name);
}

export function isNameSafe(name: string, list: ConflictList = KNOWN): boolean {
  return brandKey(name).length >= 3 && list.match(name) === null;
}

/**
 * Brands are coined from a substrate's stems (fragments, never whole words) plus
 * invented endings, so the core of every name is a word that did not exist before.
 */
const ENDINGS = ["enza", "orel", "ivo", "ella", "ando", "ara", "essa", "ovo", "iva", "oro", "ilo", "una", "eon", "yra", "andi", "ello", "ume", "ix"];
const TAILS = ["vix", "lyn", "mo", "ra", "quo", "rin", "tal", "vo", "nza", "dri", "sel", "ven"];
const LINKS = ["a", "e", "i", "o"];
const VOWELS = "aeiouy";

type Decoration = "plain" | "ai" | "labs" | "dotai" | "os";
/** Descriptors only ever wrap a coined core, and most names carry none. */
const DECORATIONS: readonly Decoration[] = ["plain", "plain", "plain", "plain", "plain", "plain", "plain", "ai", "labs", "dotai", "os"];

const ATTEMPTS = 16;
const FALLBACK_ATTEMPTS = 256;

function capitalize(s: string): string {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}

function fuse(stem: string, part: string): string {
  let s = stem.toLowerCase();
  if (VOWELS.includes(part[0]!)) while (s.length > 2 && VOWELS.includes(s.at(-1)!)) s = s.slice(0, -1);
  if (s.at(-1) === part[0]) return s + part.slice(1);
  return s + part;
}

/** stem + ending ("Nimbora"), or stem + link + tail ("Kairalyn"); long forms only when short ones are exhausted. */
function coinCore(rng: Rng, stems: readonly string[], form: "short" | "tail" | "long"): string {
  const stem = rng.pick(stems).toLowerCase();
  const linked = (tail: string) => (VOWELS.includes(stem.at(-1)!) ? fuse(stem, tail) : stem + rng.pick(LINKS) + tail);
  const word = form === "short" ? fuse(stem, rng.pick(ENDINGS)) : form === "tail" ? linked(rng.pick(TAILS)) : fuse(linked(rng.pick(TAILS)), rng.pick(ENDINGS));
  return capitalize(word.replace(/(.)\1\1+/g, "$1$1"));
}

function decorate(core: string, decoration: Decoration): string {
  switch (decoration) {
    case "ai":
      return `${core} AI`;
    case "labs":
      return `${core} Labs`;
    case "dotai":
      return `${core}.ai`;
    case "os":
      return `${core}OS`;
    default:
      return core;
  }
}

export function wordmarkFor(name: string): string {
  return name.endsWith(".ai") ? name.toLowerCase() : name;
}

export interface NameOptions {
  /** Brand keys already used in the portfolio. */
  taken?: ReadonlySet<string>;
  conflicts?: ConflictList;
}

/**
 * Deterministic for (substrate, seed, rebrands, taken). Candidates are tried in a fixed
 * order and the first one that is neither a known conflict nor already taken wins.
 */
export function generateName(substrate: Substrate, seed: number, rebrands: number, options: NameOptions = {}): string {
  const taken = options.taken ?? new Set<string>();
  const list = options.conflicts ?? KNOWN;
  const stems = substrate.domain.stems;
  const label = `name:${substrate.id}:${rebrands}`;
  const ok = (name: string) => isNameSafe(name, list) && !taken.has(brandKey(name));
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const rng = Rng.for(seed, attempt === 0 ? label : `${label}:${attempt}`);
    const name = decorate(coinCore(rng, stems, rng.int(4) === 0 ? "tail" : "short"), rng.pick(DECORATIONS));
    if (ok(name)) return name;
  }
  for (let attempt = 0; attempt < FALLBACK_ATTEMPTS; attempt++) {
    const name = coinCore(Rng.for(seed, `${label}:fallback:${attempt}`), stems, "long");
    if (ok(name)) return name;
  }
  const base = coinCore(Rng.for(seed, `${label}:fallback`), stems, "long");
  for (let n = 2; ; n++) {
    const name = `${base} ${n}`;
    if (!taken.has(brandKey(name))) return name;
  }
}

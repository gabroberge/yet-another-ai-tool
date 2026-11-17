import { Rng } from "../rng";

/**
 * The naming scheme used before brand names were stored on the venture. Frozen so
 * portfolios saved by earlier versions can recover the names their history refers to.
 * Never use it to name anything new.
 */
const LEGACY_ROOTS: Record<string, readonly string[]> = {
  "weather-api": ["Strata", "Nimbus", "Isobar", "Cirrus", "Zephyr", "Baro", "Front", "Aero"],
  "static-analyzer": ["Lintel", "Sentin", "Codex", "Syntra", "Parsel", "Vigil", "Cortex", "Linea"],
  "browser-automation": ["Clickwright", "Pilot", "Journey", "Probe", "Assert", "Tandem", "Surfa", "Scout"],
  "date-parser": ["Kairos", "Tempora", "Chron", "Meridia", "Epoch", "Horae", "Calend", "Dayl"],
  levenshtein: ["Twin", "Resolv", "Kindred", "Paral", "Mirra", "Unify", "Akin", "Proxim"],
  "cosine-similarity": ["Vectra", "Semant", "Lumen", "Cosin", "Meaning", "Corpus", "Noesis", "Embed"],
  cron: ["Cadence", "Tempo", "Rhythm", "Pulse", "Metron", "Ostin", "Cycle", "Orbit"],
  "email-api": ["Envoy", "Herald", "Missiv", "Courier", "Relay", "Postal", "Inkwell", "Signal"],
  "health-check": ["Sentry", "Vigil", "Uptime", "Beacon", "Pulse", "Watch", "Aegis", "Halo"],
  "json-formatter": ["Lucid", "Struct", "Nest", "Brace", "Schema", "Clarit", "Indent", "Keystone"],
  "regex-redaction": ["Veil", "Cipher", "Masq", "Shroud", "Redact", "Privy", "Aegis", "Opaque"],
  "csv-parser": ["Tabula", "Ledger", "Column", "Grid", "Cellar", "Rowan", "Sheet", "Abacus"],
  "geocoding-api": ["Terra", "Locus", "Atlas", "Meridian", "Vantage", "Waypoint", "Topos", "Compass"],
  "image-resizer": ["Pixel", "Frame", "Prism", "Lumi", "Canvas", "Optic", "Aspect", "Vista"],
  "text-diff": ["Delta", "Redline", "Revis", "Variant", "Contrast", "Strata", "Draftly", "Clause"],
  "file-renamer": ["Order", "Taxon", "Filea", "Name", "Curat", "Archiv", "Sortis", "Label"],
  spellchecker: ["Lexi", "Verba", "Prose", "Glyph", "Syntax", "Quill", "Orthos", "Diction"],
  "fx-api": ["Forex", "Parity", "Bourse", "Mint", "Sterling", "Bullion", "Tender", "Cambio"],
};

const JOIN_SUFFIXES = ["cast", "ly", "form", "wise", "sight", "stack", "mind", "grid", "loop", "ra", "io", "ify", "iq"];
const NAME_PATTERNS = ["join", "join", "join", "join", "ai", "labs", "dotai", "os", "ask", "plain", "plain"] as const;

/** Same length as the current agent roster, so a seed shuffles both into the same positions. */
export const LEGACY_AGENT_NAMES = [
  "Atlas", "Juno", "Orion", "Mira", "Vega", "Sol", "Echo", "Nova", "Iris", "Kepler", "Rhea", "Cassio",
  "Lumen", "Tess", "Halcyon", "Pax", "Wren", "Sage", "Onyx", "Lyra", "Ezra", "Quill", "Indigo", "Rune",
];

/** Product vocabulary that history entries may still contain, longest first. */
export const LEGACY_TERMS: readonly (readonly [string, string])[] = [
  ["Natural-language copilot", "Natural-language concierge"],
  ["Negotiation Copilot", "Negotiation Strategist"],
  [" Copilot", " Concierge"],
];

function joinRoot(root: string, suffix: string): string {
  const r = root.toLowerCase();
  const vowels = "aeiou";
  const trimmed = vowels.includes(r.at(-1)!) && vowels.includes(suffix[0]!) ? r.slice(0, -1) : r;
  const doubled = trimmed.at(-1) === suffix[0] ? trimmed.slice(0, -1) : trimmed;
  return doubled[0]!.toUpperCase() + doubled.slice(1) + suffix;
}

export function legacyName(substrateId: string, seed: number, rebrands: number): string | null {
  const roots = LEGACY_ROOTS[substrateId];
  if (!roots) return null;
  const rng = Rng.for(seed, `name:${substrateId}:${rebrands}`);
  const root = rng.pick(roots);
  switch (rng.pick(NAME_PATTERNS)) {
    case "join":
      return joinRoot(root, rng.pick(JOIN_SUFFIXES));
    case "ai":
      return `${root} AI`;
    case "labs":
      return `${root} Labs`;
    case "dotai":
      return `${root}.ai`;
    case "os":
      return `${root}OS`;
    case "ask":
      return `Ask${root}`;
    default:
      return root;
  }
}

export function legacyAgentOrder(seed: number): string[] {
  return Rng.for(seed, "agents").shuffle(LEGACY_AGENT_NAMES);
}

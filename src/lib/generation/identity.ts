import type { Substrate } from "../domain/types";
import { Rng, hashString } from "./rng";
import { conflictFor, wordmarkFor } from "./naming/naming";

export interface CartonColor {
  id: string;
  bg: string;
  ink: string;
  /** Secondary ink tinted for this ground. */
  soft: string;
}

export const CARTON_COLORS: readonly CartonColor[] = [
  { id: "tomato", bg: "#FF4B2B", ink: "#131317", soft: "#4a1206" },
  { id: "emerald", bg: "#10A86A", ink: "#08130e", soft: "#06331f" },
  { id: "violet", bg: "#7B3FF2", ink: "#FFFFFF", soft: "#E4D8FF" },
  { id: "tangerine", bg: "#FF8A00", ink: "#131317", soft: "#4d2700" },
  { id: "teal", bg: "#00A5A5", ink: "#061717", soft: "#003a3a" },
  { id: "cobalt", bg: "#1F5BFF", ink: "#FFFFFF", soft: "#DCE6FF" },
  { id: "raspberry", bg: "#D81E5B", ink: "#FFFFFF", soft: "#FFE0EA" },
  { id: "lime", bg: "#B4E31B", ink: "#131317", soft: "#2f3d00" },
  { id: "graphite", bg: "#2E3140", ink: "#FFFFFF", soft: "#C9CCDA" },
  { id: "bubblegum", bg: "#FF7EB9", ink: "#131317", soft: "#4d0d2b" },
  { id: "porcelain", bg: "#F4F2EC", ink: "#131317", soft: "#5a5850" },
  { id: "sky", bg: "#36B5F0", ink: "#071722", soft: "#08364d" },
];

export type VoiceId = "visionary" | "operator" | "enterprise" | "technical" | "category";

export const VOICES: Record<VoiceId, { label: string; taglines: readonly string[] }> = {
  visionary: {
    label: "Visionary",
    taglines: [
      "The intelligence layer for every {object}.",
      "What if every {object} could think?",
      "The future of {objects} is autonomous.",
    ],
  },
  operator: {
    label: "Operator",
    taglines: ["{Objects}, handled.", "Stop managing {objects}. Start trusting them.", "Fewer meetings about {objects}."],
  },
  enterprise: {
    label: "Enterprise",
    taglines: [
      "Trusted {object} intelligence for {industry}.",
      "The system of intelligence for {objects}.",
      "Governed {object} intelligence at global scale.",
    ],
  },
  technical: {
    label: "Technical",
    taglines: ["Production-grade {object} reasoning.", "{Object} inference at the edge.", "The {object} engine for serious teams."],
  },
  category: {
    label: "Category-defining",
    taglines: ["Welcome to the {object}-native era.", "We didn't improve {objects}. We redefined them.", "Every company will be a {object} company."],
  },
};

const VOICE_IDS = Object.keys(VOICES) as VoiceId[];

/** Invented given names. Keep the length at 24: stored histories are remapped by shuffle position. */
export const AGENT_NAMES = [
  "Talvo", "Orsa", "Velin", "Quenna", "Darsi", "Ilvo", "Sefa", "Corrin", "Brisa", "Nolle", "Pell", "Mirelle",
  "Tobin", "Fenna", "Oskel", "Rilla", "Hollis", "Zevi", "Lunet", "Merrin", "Ivett", "Caspel", "Wenna", "Tamsin",
];

const GENERIC_ROLES = ["Planning Agent", "Critic Agent", "Verification Agent", "Routing Agent", "Memory Curator", "Policy Agent"];

export const PARTNERS = [
  "Harrowgate Freight", "Halvorsen Group", "Brightwater Health", "Kestrel Bank", "Maple & Finch", "Corvid Logistics",
  "Arden Mutual", "Pinecrest Retail", "Lumière Hotels", "Oakridge Energy", "Tidemoor Foods", "Verrin Mutual Insurance",
  "Granite Peak Capital", "Bluehaven Media", "Ferro Industrial", "Quayside Ports",
];

export interface Identity {
  name: string;
  wordmark: string;
  color: CartonColor;
  voice: VoiceId;
  tagline: string;
  sku: string;
  markSeed: number;
}

function capitalize(s: string): string {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}

export function fillTemplate(template: string, substrate: Substrate, name = ""): string {
  const d = substrate.domain;
  return template
    .replaceAll("{Objects}", capitalize(d.objects))
    .replaceAll("{Object}", capitalize(d.object))
    .replaceAll("{objects}", d.objects)
    .replaceAll("{object}", d.object)
    .replaceAll("{industry}", d.industry)
    .replaceAll("{buyer}", d.buyer)
    .replaceAll("{name}", name);
}

export function generateIdentity(substrate: Substrate, seed: number, rebrands: number, name: string): Identity {
  const wordmark = wordmarkFor(name);
  const rng = Rng.for(seed, `brand:${substrate.id}:${rebrands}`);
  const color = rng.pick(CARTON_COLORS);
  const voice = rng.pick(VOICE_IDS);
  const tagline = fillTemplate(rng.pick(VOICES[voice].taglines), substrate, name);
  const sku = `${substrate.id.slice(0, 3).toUpperCase()}-${(hashString(`${seed}:${rebrands}`) % 46656).toString(36).toUpperCase().padStart(3, "0")}`;
  return { name, wordmark, color, voice, tagline, sku, markSeed: hashString(`${substrate.id}:${seed}:mark:${rebrands}`) };
}

export function generateAgents(substrate: Substrate, seed: number, count: number): { name: string; role: string }[] {
  const names = Rng.for(seed, "agents").shuffle(AGENT_NAMES);
  const roles = [...substrate.domain.agentRoles, ...GENERIC_ROLES];
  return Array.from({ length: count }, (_, i) => ({ name: names[i % names.length]!, role: roles[i % roles.length]! }));
}

export function generatePartners(seed: number, count = 5): string[] {
  return Rng.for(seed, "partners").shuffle(PARTNERS).slice(0, count);
}

/** Brand initial + score noun initials + "I"; when that spells a known mark, the closing letter changes. */
export function indexAbbr(name: string, scoreNoun: string): string {
  const cacheKey = `${name}\n${scoreNoun}`;
  const cached = abbrCache.get(cacheKey);
  if (cached) return cached;
  const stem = `${name.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase()}${abbreviate(scoreNoun)}`;
  const abbr = ["I", "X", "Q", "Z", "IX"].map((end) => stem + end).find((a) => !conflictFor(a)) ?? `${stem}XQ`;
  abbrCache.set(cacheKey, abbr);
  return abbr;
}

const abbrCache = new Map<string, string>();

export function abbreviate(phrase: string): string {
  return phrase
    .split(/[\s-]+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

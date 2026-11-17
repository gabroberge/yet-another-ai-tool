import type { LayerTier, ScoreKey, Substrate, Venture } from "./types";
import { ENHANCEMENTS, requireEnhancement, type EnhancementDef } from "./enhancements";
import { requireSubstrate } from "./substrates";
import {
  fillTemplate,
  generateAgents,
  generateIdentity,
  generatePartners,
  indexAbbr,
  type Identity,
} from "../generation/identity";
import { Rng } from "../generation/rng";
import { latency as formatLatency } from "../format";

export const STAGES = [
  { id: "concept", label: "Concept", min: 0 },
  { id: "pre-seed", label: "Pre-seed", min: 2_000_000 },
  { id: "seed", label: "Seed", min: 8_000_000 },
  { id: "series-a", label: "Series A", min: 30_000_000 },
  { id: "series-b", label: "Series B", min: 120_000_000 },
  { id: "series-c", label: "Series C", min: 400_000_000 },
  { id: "unicorn", label: "Unicorn", min: 1_000_000_000 },
] as const;

export type Stage = (typeof STAGES)[number];

export const TIER_ORDER: readonly LayerTier[] = [
  "experience",
  "platform",
  "governance",
  "orchestration",
  "agents",
  "intelligence",
  "model",
  "foundation",
];

export const TIER_LABELS: Record<LayerTier, string> = {
  experience: "Experience",
  platform: "Platform",
  governance: "Governance",
  orchestration: "Orchestration",
  agents: "Agents",
  intelligence: "Intelligence",
  model: "Model",
  foundation: "Foundation",
};

export interface Layer {
  key: string;
  tier: LayerTier;
  name: string;
  detail: string;
  latencyMs: number;
  costPerCall: number;
  loc: number;
  enhancementId: string | null;
}

export interface Claim {
  id: string;
  text: string;
  /** Billing rank: how large the claim prints, from 1 to 4. */
  rank: number;
}

export interface PriceTier {
  name: string;
  price: number | null;
  unit: string;
  includes: string[];
}

export interface VentureView {
  venture: Venture;
  substrate: Substrate;
  identity: Identity;
  counts: Record<string, number>;
  installedCount: number;
  category: string;
  tagline: string;
  positioning: string;
  stage: Stage;
  nextStage: Stage | null;
  layers: Layer[];
  agents: { name: string; role: string }[];
  claims: Claim[];
  scores: Record<ScoreKey, number>;
  yiq: number;
  index: { name: string; abbr: string; value: number } | null;
  confidence: number | null;
  partners: string[];
  latencyMs: number;
  costPerCall: number;
  loc: number;
  volume: number;
  valuation: number;
  tamBillions: number;
  pricing: { model: "seat" | "outcome"; perSeat: number; perOutcome: number; tiers: PriceTier[] };
  modelName: string | null;
}

const BASE_SCORES: Record<ScoreKey, number> = { intelligence: 11, autonomy: 4, trust: 18, moat: 3, enterprise: 7 };
const YIQ_WEIGHTS: Record<ScoreKey, number> = { intelligence: 0.3, autonomy: 0.2, trust: 0.15, moat: 0.2, enterprise: 0.15 };
const WRAPPER_BASE_LOC = 120;
const BASE_SEAT_PRICE = 15;

export function countInstalled(venture: Venture): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of venture.installed) counts[item.id] = (counts[item.id] ?? 0) + 1;
  return counts;
}

/** Round to three significant figures; valuations are quoted, not computed to the dollar. */
export function roundSignificant(n: number, digits = 3): number {
  if (n === 0) return 0;
  const magnitude = 10 ** (Math.floor(Math.log10(Math.abs(n))) - digits + 1);
  return Math.round(n / magnitude) * magnitude;
}

/** Monthly list prices end in 9. */
export function listPrice(n: number): number {
  if (n < 10) return Math.max(1, Math.round(n));
  return Math.max(9, Math.round(n / 10) * 10 - 1);
}

export function stageFor(valuation: number): Stage {
  let current: Stage = STAGES[0];
  for (const s of STAGES) if (valuation >= s.min) current = s;
  return current;
}

function nextStageAfter(stage: Stage): Stage | null {
  const i = STAGES.findIndex((s) => s.id === stage.id);
  return STAGES[i + 1] ?? null;
}

function buildCategory(substrate: Substrate, venture: Venture, counts: Record<string, number>, total: number): string {
  const rng = Rng.for(venture.seed, "category");
  const core = counts.category ? rng.pick(substrate.domain.coined) : rng.pick(substrate.domain.cores);
  const prefixes: string[] = [];
  if (counts.enterprise) prefixes.push("Enterprise");
  if (counts.orchestrator) prefixes.push("Multi-Agent");
  else if (counts.agent) prefixes.push("Agentic");
  else prefixes.push("AI-Native");
  const suffix = counts.marketplace ? "Ecosystem" : total >= 7 ? "Cloud" : total >= 3 ? "Platform" : "";
  return [...prefixes, core, suffix].filter(Boolean).join(" ");
}

function layerFor(def: EnhancementDef, ctx: { name: string; substrate: Substrate; abbr: string; modelName: string }): { name: string; detail: string } {
  const d = ctx.substrate.domain;
  switch (def.id) {
    case "orchestrator":
      return { name: `${ctx.name} Orchestration Mesh`, detail: "Plans, delegates, and reconciles agent work" };
    case "marketplace":
      return { name: `${ctx.name} Agent Exchange`, detail: "Third-party agents, 30% revenue share" };
    case "reasoning":
      return { name: `${ctx.name} Reasoning Engine`, detail: `Step-by-step rationale for every ${d.object}` };
    case "memory":
      return { name: `${ctx.name} Memory Graph`, detail: `Vector memory of every ${d.object}` };
    case "confidence":
      return { name: "Calibrated Confidence Engine", detail: "Scores every response" };
    case "model":
      return { name: ctx.modelName, detail: `Foundation model tuned for ${d.industry}` };
    case "copilot":
      return { name: `${ctx.name} Concierge`, detail: "Natural-language interface" };
    case "workflow":
      return { name: `${ctx.name} Studio`, detail: "No-code workflow canvas" };
    case "dashboard":
      return { name: `${ctx.name} Command Center`, detail: "Executive dashboard" };
    case "sdk":
      return { name: `${ctx.name} SDK Suite`, detail: "11 generated client libraries" };
    case "governance":
      return { name: `${ctx.name} Governance Fabric`, detail: "Policy-as-code with lineage" };
    case "hitl":
      return { name: "Human Review Queue", detail: "Low-confidence routing to reviewers" };
    case "explainability":
      return { name: "Explainability Layer", detail: "Audit-ready reports" };
    case "score":
      return { name: `${ctx.name} ${d.scoreNoun} Index (${ctx.abbr})`, detail: "Proprietary scoring service" };
    case "enterprise":
      return { name: "Enterprise Control Plane", detail: "SSO, audit logs, private deployment" };
    default:
      return { name: def.title, detail: def.pitch };
  }
}

function claimText(def: EnhancementDef, view: { agents: number; abbr: string; index: number; confidence: number | null }): string {
  switch (def.id) {
    case "agent":
      return `${view.agents} AI agent${view.agents === 1 ? "" : "s"}`;
    case "score":
      return `${view.abbr} ${view.index}`;
    case "confidence":
      return `${view.confidence?.toFixed(1)}% confidence`;
    default:
      return def.claim;
  }
}

function claimRank(def: EnhancementDef, agents: number): number {
  if (def.id === "agent") return Math.min(4, 1 + Math.floor(agents / 2));
  const m = def.effects.valuationMultiplier;
  return m >= 1.55 ? 3 : m >= 1.35 ? 2 : 1;
}

export function describeVenture(venture: Venture): VentureView {
  const substrate = requireSubstrate(venture.substrateId);
  const identity = generateIdentity(substrate, venture.seed, venture.rebrands, venture.name);
  const counts = countInstalled(venture);
  const installedCount = venture.installed.length;
  const agentCount = counts.agent ?? 0;
  const agents = generateAgents(substrate, venture.seed, agentCount);

  const scores = { ...BASE_SCORES };
  let latencyMs = substrate.baseLatencyMs;
  let costPerCall = substrate.baseCostPerCall;
  let loc = WRAPPER_BASE_LOC;
  let volume = 1;
  let multiplier = 1;
  let perSeat = BASE_SEAT_PRICE;

  for (const item of venture.installed) {
    const e = requireEnhancement(item.id).effects;
    latencyMs += e.latencyMs;
    costPerCall += e.costPerCall;
    loc += e.loc;
    volume += e.volume;
    multiplier *= e.valuationMultiplier;
    perSeat += e.pricePerSeat;
    for (const [k, v] of Object.entries(e.scores) as [ScoreKey, number][]) scores[k] += v;
  }
  for (const k of Object.keys(scores) as ScoreKey[]) scores[k] = Math.min(99, Math.max(0, scores[k]));

  const yiq = Math.round((Object.keys(scores) as ScoreKey[]).reduce((s, k) => s + scores[k] * YIQ_WEIGHTS[k], 0));
  const abbr = indexAbbr(identity.name, substrate.domain.scoreNoun);
  const index = counts.score ? { name: `${identity.name} ${substrate.domain.scoreNoun} Index`, abbr, value: Math.min(99, yiq + 9) } : null;
  const confidence = counts.confidence ? Math.min(99.7, 91.2 + agentCount * 0.6 + (counts.reasoning ? 2.1 : 0) + (counts.hitl ? 1.4 : 0)) : null;
  const modelName = counts.model ? `${identity.name.replace(/\W.*$/, "")}-1` : null;

  const valuation = roundSignificant(substrate.baseValuation * multiplier * (1 + 0.04 * venture.rebrands));
  const stage = stageFor(valuation);
  const groups = new Set(venture.installed.map((i) => requireEnhancement(i.id).group));
  const tamBillions = Math.round(substrate.domain.tamBillions * (1 + 0.18 * groups.size + 0.04 * installedCount));

  const ctx = { name: identity.name, substrate, abbr, modelName: modelName ?? "" };
  const layers: Layer[] = [];
  const seen = new Set<string>();
  agents.forEach((a, i) => {
    const e = requireEnhancement("agent").effects;
    layers.push({ key: `agent-${i}`, tier: "agents", name: a.name, detail: a.role, latencyMs: e.latencyMs, costPerCall: e.costPerCall, loc: e.loc, enhancementId: "agent" });
  });
  for (const item of venture.installed) {
    if (item.id === "agent" || seen.has(item.id)) continue;
    seen.add(item.id);
    const def = requireEnhancement(item.id);
    if (!def.tier) continue;
    const { name, detail } = layerFor(def, ctx);
    layers.push({ key: def.id, tier: def.tier, name, detail, latencyMs: def.effects.latencyMs, costPerCall: def.effects.costPerCall, loc: def.effects.loc, enhancementId: def.id });
  }
  layers.push({
    key: "foundation",
    tier: "foundation",
    name: substrate.name,
    detail: substrate.does,
    latencyMs: substrate.baseLatencyMs,
    costPerCall: substrate.baseCostPerCall,
    loc: 0,
    enhancementId: null,
  });
  layers.sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));

  const claimCtx = { agents: agentCount, abbr, index: index?.value ?? 0, confidence };
  const claims: Claim[] = [];
  for (const def of ENHANCEMENTS) {
    if (!counts[def.id]) continue;
    claims.push({ id: def.id, text: claimText(def, claimCtx), rank: claimRank(def, agentCount) });
  }
  claims.sort((a, b) => b.rank - a.rank);

  const outcome = Boolean(counts["outcome-pricing"]);
  const seat = listPrice(perSeat);
  const perOutcome = Math.max(0.05, Math.round(perSeat * 0.9) / 100);
  const unit = outcome ? `per ${substrate.domain.object}` : "per seat / month";
  const tiers: PriceTier[] = [
    { name: "Starter", price: outcome ? perOutcome : seat, unit, includes: [`Core ${substrate.domain.object} intelligence`, "Community support"] },
    {
      name: "Growth",
      price: outcome ? Math.round(perOutcome * 0.8 * 100) / 100 : listPrice(seat * 2.4),
      unit,
      includes: [agentCount ? `${agentCount} agent${agentCount === 1 ? "" : "s"} included` : "Priority processing", counts.dashboard ? "Executive dashboard" : "Usage analytics"],
    },
    {
      name: "Enterprise",
      price: counts.enterprise ? null : listPrice(seat * 6),
      unit: counts.enterprise ? "annual contract" : unit,
      includes: [counts.governance ? "Governance fabric" : "Audit log export", counts.enterprise ? "Private deployment, SSO, named team" : "Email support"],
    },
  ];

  const positioning = buildPositioning(substrate, identity, { agentCount, counts, index, latency: formatLatency(latencyMs) });
  const category = buildCategory(substrate, venture, counts, installedCount);

  return {
    venture,
    substrate,
    identity,
    counts,
    installedCount,
    category,
    tagline: identity.tagline,
    positioning: positioning.replace("{category}", category),
    stage,
    nextStage: nextStageAfter(stage),
    layers,
    agents,
    claims,
    scores,
    yiq,
    index,
    confidence,
    partners: counts["design-partners"] ? generatePartners(venture.seed) : [],
    latencyMs: Math.round(latencyMs * 10) / 10,
    costPerCall,
    loc,
    volume: Math.round(volume * 100) / 100,
    valuation,
    tamBillions,
    pricing: { model: outcome ? "outcome" : "seat", perSeat: seat, perOutcome, tiers },
    modelName,
  };
}

const POSITIONING: Record<Identity["voice"], { lead: string; agents: string; solo: string }> = {
  visionary: {
    lead: "{name} is building the {category} layer for {industry}.",
    agents: "{team} {verb} {objects} before anyone asks, so the {buyer} can focus on what only people can do.",
    solo: "It brings AI to every {object}, so the {buyer} can leave {pain} behind.",
  },
  operator: {
    lead: "{name} takes {objects} off the {buyer}'s plate.",
    agents: "{team} {verb} every {object} end to end, with no tickets and no handoffs.",
    solo: "AI handles each {object} end to end, ending {pain}.",
  },
  enterprise: {
    lead: "{name} is the {category} for {industry}.",
    agents: "{team} {verb} {objects} with full auditability, at the scale large organizations require.",
    solo: "It gives the {buyer} AI-grade control over {objects}, without {pain}.",
  },
  technical: {
    lead: "{name} is {category}, engineered for production.",
    agents: "{team} {verb} {objects} at scale, with a median response time of {latency}.",
    solo: "A single API to {verb} {objects}, with a median response time of {latency}.",
  },
  category: {
    lead: "{name} defined {category}.",
    agents: "{team} {verb} {objects} in ways legacy tools never could.",
    solo: "It is the first platform built to {verb} {objects} the AI-native way.",
  },
};

function buildPositioning(
  substrate: Substrate,
  identity: Identity,
  s: { agentCount: number; counts: Record<string, number>; index: VentureView["index"]; latency: string },
): string {
  const d = substrate.domain;
  const t = POSITIONING[identity.voice];
  const team =
    s.agentCount === 0
      ? ""
      : s.counts.orchestrator
        ? `${s.agentCount} orchestrated agents`
        : s.agentCount === 1
          ? "A dedicated agent"
          : `${s.agentCount} specialized agents`;
  const parts = [t.lead, s.agentCount ? t.agents : t.solo];
  if (s.index) parts.push(`Every {object} is scored on the ${s.index.name} (${s.index.abbr}).`);
  if (s.counts.governance || s.counts.compliance) parts.push("Governance is built in from day one.");
  const pain = Rng.for(identity.markSeed, "pain").pick(d.pains);
  const text = parts
    .join(" ")
    .replaceAll("{team}", team)
    .replaceAll("{verb}", s.agentCount === 1 ? `${d.verb}s` : d.verb)
    .replaceAll("{pain}", pain)
    .replaceAll("{latency}", s.latency);
  return fillTemplate(text, substrate, identity.name);
}

export function runSubstrate(substrate: Substrate, input: string): string {
  return substrate.run(input);
}

import type { EnhancementGroup, LayerTier, ScoreKey } from "./types";

export interface EnhancementEffects {
  latencyMs: number;
  costPerCall: number;
  loc: number;
  /** Packaging volume added to the carton. */
  volume: number;
  scores: Partial<Record<ScoreKey, number>>;
  valuationMultiplier: number;
  pricePerSeat: number;
}

export interface EnhancementDef {
  id: string;
  group: EnhancementGroup;
  title: string;
  /** One sentence; may use {object}, {objects}, {industry}, {name}. */
  pitch: string;
  max: number;
  requires?: { id: string; count?: number }[];
  /** Where the installed layer sits in the architecture; null when it adds no runtime layer. */
  tier: LayerTier | null;
  effects: EnhancementEffects;
  /** Seal text printed on the carton. */
  claim: string;
}

export const GROUP_LABELS: Record<EnhancementGroup, string> = {
  agents: "Agents",
  intelligence: "Intelligence",
  platform: "Platform",
  trust: "Trust & governance",
  moat: "Differentiation",
  market: "Go-to-market",
};

export const GROUP_ORDER: readonly EnhancementGroup[] = ["agents", "intelligence", "platform", "trust", "moat", "market"];

const fx = (e: Partial<EnhancementEffects> & Pick<EnhancementEffects, "valuationMultiplier">): EnhancementEffects => ({
  latencyMs: 0,
  costPerCall: 0,
  loc: 0,
  volume: 0.2,
  scores: {},
  pricePerSeat: 0,
  ...e,
});

export const ENHANCEMENTS: readonly EnhancementDef[] = [
  {
    id: "agent",
    group: "agents",
    title: "Deploy an agent",
    pitch: "A named, specialized agent with its own role, memory budget, and reasoning loop.",
    max: 8,
    tier: "agents",
    effects: fx({ latencyMs: 340, costPerCall: 0.0031, loc: 1800, volume: 0.32, scores: { intelligence: 7, autonomy: 9 }, valuationMultiplier: 1.32, pricePerSeat: 6 }),
    claim: "AI agents",
  },
  {
    id: "orchestrator",
    group: "agents",
    title: "Multi-agent orchestration",
    pitch: "A supervisor that plans, delegates, and reconciles work across every agent.",
    max: 1,
    requires: [{ id: "agent", count: 2 }],
    tier: "orchestration",
    effects: fx({ latencyMs: 520, costPerCall: 0.006, loc: 4200, volume: 0.5, scores: { autonomy: 14, intelligence: 6 }, valuationMultiplier: 1.55, pricePerSeat: 12 }),
    claim: "Multi-agent",
  },
  {
    id: "marketplace",
    group: "agents",
    title: "Agent marketplace",
    pitch: "Partners publish their own agents on {name}. You keep 30% of every install.",
    max: 1,
    requires: [{ id: "agent", count: 3 }, { id: "orchestrator" }],
    tier: "platform",
    effects: fx({ latencyMs: 60, costPerCall: 0.0005, loc: 9000, volume: 0.6, scores: { moat: 12, enterprise: 4 }, valuationMultiplier: 1.6 }),
    claim: "Agent ecosystem",
  },
  {
    id: "reasoning",
    group: "intelligence",
    title: "Chain-of-reasoning engine",
    pitch: "Every {object} arrives with a step-by-step rationale.",
    max: 1,
    tier: "intelligence",
    effects: fx({ latencyMs: 880, costPerCall: 0.009, loc: 2600, volume: 0.4, scores: { intelligence: 12, trust: 4 }, valuationMultiplier: 1.4, pricePerSeat: 8 }),
    claim: "Reasoning",
  },
  {
    id: "memory",
    group: "intelligence",
    title: "Long-term memory",
    pitch: "A vector store that remembers every {object} the platform has ever seen.",
    max: 1,
    tier: "intelligence",
    effects: fx({ latencyMs: 140, costPerCall: 0.0012, loc: 1500, volume: 0.3, scores: { intelligence: 6, moat: 6 }, valuationMultiplier: 1.22, pricePerSeat: 4 }),
    claim: "Persistent memory",
  },
  {
    id: "confidence",
    group: "intelligence",
    title: "Confidence scoring",
    pitch: "Every response carries a calibrated confidence score.",
    max: 1,
    tier: "intelligence",
    effects: fx({ latencyMs: 90, costPerCall: 0.0008, loc: 900, volume: 0.2, scores: { trust: 9, intelligence: 3 }, valuationMultiplier: 1.18, pricePerSeat: 3 }),
    claim: "Confidence-scored",
  },
  {
    id: "model",
    group: "intelligence",
    title: "Domain foundation model",
    pitch: "A proprietary model tuned for {industry}.",
    max: 1,
    tier: "model",
    effects: fx({ latencyMs: 650, costPerCall: 0.012, loc: 3200, volume: 0.55, scores: { intelligence: 14, moat: 10 }, valuationMultiplier: 1.75, pricePerSeat: 14 }),
    claim: "Proprietary model",
  },
  {
    id: "copilot",
    group: "intelligence",
    title: "Natural-language concierge",
    pitch: "Ask {name} anything about your {objects}, in plain English.",
    max: 1,
    tier: "experience",
    effects: fx({ latencyMs: 420, costPerCall: 0.004, loc: 2100, volume: 0.35, scores: { intelligence: 5, enterprise: 3 }, valuationMultiplier: 1.25, pricePerSeat: 9 }),
    claim: "Ask anything",
  },
  {
    id: "workflow",
    group: "platform",
    title: "No-code workflow builder",
    pitch: "A drag-and-drop canvas for composing {objects} into automations.",
    max: 1,
    tier: "platform",
    effects: fx({ latencyMs: 30, costPerCall: 0.0002, loc: 6200, volume: 0.45, scores: { autonomy: 5, enterprise: 6 }, valuationMultiplier: 1.3, pricePerSeat: 10 }),
    claim: "No-code",
  },
  {
    id: "dashboard",
    group: "platform",
    title: "Executive insights dashboard",
    pitch: "Board-ready views of every {object}, refreshed in real time.",
    max: 1,
    tier: "experience",
    effects: fx({ latencyMs: 20, costPerCall: 0.0001, loc: 3800, volume: 0.35, scores: { enterprise: 8 }, valuationMultiplier: 1.2, pricePerSeat: 7 }),
    claim: "Real-time insights",
  },
  {
    id: "sdk",
    group: "platform",
    title: "SDKs in 11 languages",
    pitch: "First-class client libraries for every stack your customers run.",
    max: 1,
    tier: "platform",
    effects: fx({ loc: 14000, volume: 0.3, scores: { enterprise: 5, moat: 3 }, valuationMultiplier: 1.15, pricePerSeat: 2 }),
    claim: "Developer-first",
  },
  {
    id: "governance",
    group: "trust",
    title: "Governance fabric",
    pitch: "Policy-as-code over every agent decision, with full lineage.",
    max: 1,
    tier: "governance",
    effects: fx({ latencyMs: 210, costPerCall: 0.0015, loc: 3400, volume: 0.4, scores: { trust: 14, enterprise: 9 }, valuationMultiplier: 1.45, pricePerSeat: 11 }),
    claim: "Governed AI",
  },
  {
    id: "hitl",
    group: "trust",
    title: "Human-in-the-loop review",
    pitch: "Low-confidence {objects} are routed to a human reviewer before release.",
    max: 1,
    requires: [{ id: "confidence" }],
    tier: "governance",
    effects: fx({ latencyMs: 2400, costPerCall: 0.02, loc: 1100, volume: 0.25, scores: { trust: 12 }, valuationMultiplier: 1.2, pricePerSeat: 6 }),
    claim: "Human-in-the-loop",
  },
  {
    id: "explainability",
    group: "trust",
    title: "Explainability reports",
    pitch: "A plain-language report for every {object}, ready for auditors.",
    max: 1,
    requires: [{ id: "reasoning" }],
    tier: "governance",
    effects: fx({ latencyMs: 300, costPerCall: 0.003, loc: 1700, volume: 0.25, scores: { trust: 9, enterprise: 4 }, valuationMultiplier: 1.22, pricePerSeat: 5 }),
    claim: "Explainable",
  },
  {
    id: "compliance",
    group: "trust",
    title: "SOC 2 readiness program",
    pitch: "Controls, policies, and a public Trust Center your buyers can link to.",
    max: 1,
    tier: null,
    effects: fx({ loc: 600, scores: { enterprise: 14, trust: 6 }, valuationMultiplier: 1.35, pricePerSeat: 9 }),
    claim: "SOC 2 in progress",
  },
  {
    id: "score",
    group: "moat",
    title: "Proprietary intelligence index",
    pitch: "A named score your customers will quote in their own board meetings.",
    max: 1,
    tier: "intelligence",
    effects: fx({ latencyMs: 45, costPerCall: 0.0004, loc: 700, scores: { moat: 11, intelligence: 4 }, valuationMultiplier: 1.3, pricePerSeat: 4 }),
    claim: "Index",
  },
  {
    id: "patent",
    group: "moat",
    title: "Patent-pending method",
    pitch: "A provisional application covering the platform's core method.",
    max: 1,
    tier: null,
    effects: fx({ volume: 0.15, scores: { moat: 14 }, valuationMultiplier: 1.4 }),
    claim: "Patent pending",
  },
  {
    id: "category",
    group: "moat",
    title: "Category creation",
    pitch: "Name the category before anyone else can lead it.",
    max: 1,
    tier: null,
    effects: fx({ scores: { moat: 9 }, valuationMultiplier: 1.5 }),
    claim: "Category leader",
  },
  {
    id: "enterprise",
    group: "market",
    title: "Enterprise edition",
    pitch: "SSO, audit logs, private deployment, and a named account team.",
    max: 1,
    tier: "platform",
    effects: fx({ latencyMs: 35, costPerCall: 0.0003, loc: 5200, volume: 0.45, scores: { enterprise: 16, trust: 5 }, valuationMultiplier: 1.6, pricePerSeat: 20 }),
    claim: "Enterprise-ready",
  },
  {
    id: "outcome-pricing",
    group: "market",
    title: "Outcome-based pricing",
    pitch: "Charge per {object} delivered, not per seat.",
    max: 1,
    tier: null,
    effects: fx({ volume: 0.1, scores: { moat: 3, enterprise: 3 }, valuationMultiplier: 1.25 }),
    claim: "Pay per outcome",
  },
  {
    id: "design-partners",
    group: "market",
    title: "Design partner program",
    pitch: "Five launch customers co-developing the roadmap.",
    max: 1,
    tier: null,
    effects: fx({ scores: { enterprise: 6, moat: 4 }, valuationMultiplier: 1.3 }),
    claim: "Design partners",
  },
];

const BY_ID = new Map(ENHANCEMENTS.map((e) => [e.id, e]));

export function getEnhancement(id: string): EnhancementDef | undefined {
  return BY_ID.get(id);
}

export function requireEnhancement(id: string): EnhancementDef {
  const e = BY_ID.get(id);
  if (!e) throw new Error(`Unknown enhancement: ${id}`);
  return e;
}

export type SubstrateKind = "api" | "library" | "tool" | "algorithm" | "service" | "cli";

/** The existing technology a venture is built on. Immutable by design. */
export interface Substrate {
  id: string;
  kind: SubstrateKind;
  /** Plain, generic description of the technology. */
  name: string;
  /** Short noun phrase used inside sentences. */
  short: string;
  /** What it actually does, in one honest sentence. */
  does: string;
  /** The real call, request, or invocation. */
  footprint: string;
  license: string;
  firstReleased: number;
  maintainers: string;
  baseLatencyMs: number;
  baseCostPerCall: number;
  baseValuation: number;
  domain: SubstrateDomain;
  console: {
    inputLabel: string;
    sample: string;
    multiline?: boolean;
  };
  run: (input: string) => string;
}

export interface SubstrateDomain {
  /** Category cores, e.g. "Environmental Intelligence". */
  cores: readonly string[];
  /** Coined categories unlocked by category creation. */
  coined: readonly string[];
  object: string;
  objects: string;
  verb: string;
  buyer: string;
  industry: string;
  pains: readonly string[];
  /** Word fragments brand names are coined from. Never whole words, so cores stay invented. */
  stems: readonly string[];
  agentRoles: readonly string[];
  scoreNoun: string;
  tamBillions: number;
}

export type ScoreKey = "intelligence" | "autonomy" | "trust" | "moat" | "enterprise";

export type EnhancementGroup = "agents" | "intelligence" | "platform" | "trust" | "moat" | "market";

export type LayerTier =
  | "foundation"
  | "model"
  | "intelligence"
  | "agents"
  | "orchestration"
  | "governance"
  | "platform"
  | "experience";

export interface InstalledEnhancement {
  id: string;
  at: number;
}

export type VentureEventKind =
  | "manufactured"
  | "installed"
  | "uninstalled"
  | "rebranded"
  | "spun-out"
  | "stage";

export interface VentureEvent {
  at: number;
  kind: VentureEventKind;
  text: string;
}

/** Persisted venture state. Everything else is derived. */
export interface Venture {
  id: string;
  seed: number;
  substrateId: string;
  /** Stored because uniqueness depends on the rest of the portfolio at the time it was chosen. */
  name: string;
  createdAt: number;
  updatedAt: number;
  rebrands: number;
  installed: InstalledEnhancement[];
  events: VentureEvent[];
  spunOutFrom?: string;
}

export interface Portfolio {
  version: 1;
  activeId: string | null;
  ventures: Venture[];
}

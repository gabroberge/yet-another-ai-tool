import type { VentureView } from "./view";
import { runSubstrate } from "./view";
import { hashString } from "../generation/rng";

export interface TraceStep {
  layer: string;
  tier: string;
  note: string;
  ms: number;
}

export interface InferenceResult {
  result: string;
  trace: TraceStep[];
  totalMs: number;
  costPerCall: number;
  confidence: number | null;
  reviewed: boolean;
  policy: string | null;
  requestId: string;
}

const NOTES: Record<string, string> = {
  experience: "request received",
  platform: "routed",
  governance: "policy evaluated",
  orchestration: "plan created",
  agents: "assessment recorded",
  intelligence: "context enriched",
  model: "conditioned",
  foundation: "executed",
};

export function runInference(view: VentureView, input: string): InferenceResult {
  const h = hashString(`${view.venture.id}:${input}`);
  const trace = view.layers.map((l, i) => {
    const jitter = 0.85 + (((h >>> (i % 24)) & 0xff) / 255) * 0.3;
    return { layer: l.name, tier: l.tier, note: l.tier === "agents" ? `${l.detail}: ${NOTES.agents}` : NOTES[l.tier]!, ms: Math.max(0.1, Math.round(l.latencyMs * jitter * 10) / 10) };
  });
  return {
    result: runSubstrate(view.substrate, input),
    trace,
    totalMs: Math.round(trace.reduce((s, t) => s + t.ms, 0) * 10) / 10,
    costPerCall: view.costPerCall,
    confidence: view.confidence,
    reviewed: Boolean(view.counts.hitl) && (view.confidence ?? 100) < 99,
    policy: view.counts.governance ? `POL-${(h % 900) + 100} approved` : null,
    requestId: `req_${h.toString(36)}`,
  };
}

import type { Portfolio, SubstrateKind, VentureEvent } from "./types";
import { STAGES, describeVenture, type VentureView } from "./view";
import { SUBSTRATE_KINDS } from "./substrates";

export interface PortfolioTelemetry {
  views: VentureView[];
  ventures: number;
  totalValuation: number;
  agents: number;
  modules: number;
  claims: number;
  avgYiq: number;
  technologies: number;
  byKind: Record<SubstrateKind, number>;
  byStage: { id: string; label: string; count: number }[];
  categories: string[];
  /** Mean of venture latency over the latency of the technology underneath. */
  latencyMultiple: number;
  wrapperLoc: number;
  foundationsModified: number;
  top: VentureView | null;
  events: (VentureEvent & { ventureId: string; ventureName: string })[];
}

export function portfolioTelemetry(p: Portfolio): PortfolioTelemetry {
  const views = p.ventures.map(describeVenture);
  const byKind = Object.fromEntries(SUBSTRATE_KINDS.map((k) => [k, 0])) as Record<SubstrateKind, number>;
  for (const v of views) byKind[v.substrate.kind]++;

  const events = views
    .flatMap((v) => v.venture.events.map((e) => ({ ...e, ventureId: v.venture.id, ventureName: v.identity.name })))
    .sort((a, b) => b.at - a.at)
    .slice(0, 40);

  const latencyMultiple = views.length
    ? views.reduce((s, v) => s + v.latencyMs / Math.max(0.1, v.substrate.baseLatencyMs), 0) / views.length
    : 0;

  return {
    views,
    ventures: views.length,
    totalValuation: views.reduce((s, v) => s + v.valuation, 0),
    agents: views.reduce((s, v) => s + v.agents.length, 0),
    modules: views.reduce((s, v) => s + v.installedCount, 0),
    claims: views.reduce((s, v) => s + v.claims.length, 0),
    avgYiq: views.length ? Math.round(views.reduce((s, v) => s + v.yiq, 0) / views.length) : 0,
    technologies: new Set(views.map((v) => v.substrate.id)).size,
    byKind,
    byStage: STAGES.map((s) => ({ id: s.id, label: s.label, count: views.filter((v) => v.stage.id === s.id).length })),
    categories: [...new Set(views.map((v) => v.category))],
    latencyMultiple,
    wrapperLoc: views.reduce((s, v) => s + v.loc, 0),
    foundationsModified: views.filter((v) => v.layers.at(-1)?.name !== v.substrate.name).length,
    top: views.reduce<VentureView | null>((best, v) => (!best || v.valuation > best.valuation ? v : best), null),
    events,
  };
}

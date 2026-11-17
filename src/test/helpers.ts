import { createVenture, emptyPortfolio, installEnhancement } from "../lib/domain/portfolio";
import type { Portfolio } from "../lib/domain/types";

export const T0 = Date.UTC(2026, 10, 16, 12);

export function portfolioWith(substrateId: string, seed = 42, installs: string[] = []): { p: Portfolio; id: string } {
  const { portfolio, venture } = createVenture(emptyPortfolio(), substrateId, seed, T0);
  let p = portfolio;
  installs.forEach((e, i) => {
    p = installEnhancement(p, venture.id, e, T0 + i + 1);
  });
  return { p, id: venture.id };
}

export const FULL_STACK = [
  "agent",
  "agent",
  "agent",
  "orchestrator",
  "marketplace",
  "reasoning",
  "memory",
  "confidence",
  "model",
  "copilot",
  "workflow",
  "dashboard",
  "sdk",
  "governance",
  "hitl",
  "explainability",
  "compliance",
  "score",
  "patent",
  "category",
  "enterprise",
  "outcome-pricing",
  "design-partners",
];

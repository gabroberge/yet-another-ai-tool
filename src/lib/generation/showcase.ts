import { createVenture, emptyPortfolio, installEnhancement, canInstall } from "../domain/portfolio";
import { describeVenture, type VentureView } from "../domain/view";
import type { Venture } from "../domain/types";

const SHOWCASE_AT = Date.UTC(2026, 10, 2, 15, 0, 0);

export function buildVenture(substrateId: string, seed: number, installs: readonly string[], at = SHOWCASE_AT): Venture {
  let { portfolio, venture } = createVenture(emptyPortfolio(), substrateId, seed, at);
  for (const id of installs) {
    const current = portfolio.ventures.find((v) => v.id === venture.id)!;
    if (canInstall(current, id).ok) portfolio = installEnhancement(portfolio, venture.id, id, at);
  }
  return portfolio.ventures.find((v) => v.id === venture.id)!;
}

export const showcase = (substrateId: string, seed: number, installs: readonly string[]): VentureView =>
  describeVenture(buildVenture(substrateId, seed, installs));

/** Fixed ventures used on the marketing site; deterministic so the page renders identically on every build. */
export const SHELF: readonly { substrateId: string; seed: number; installs: readonly string[] }[] = [
  { substrateId: "levenshtein", seed: 9, installs: ["agent", "agent", "orchestrator", "reasoning", "explainability", "governance", "score", "patent", "enterprise"] },
  { substrateId: "cron", seed: 3, installs: ["agent", "agent", "agent", "orchestrator", "memory", "workflow"] },
  { substrateId: "csv-parser", seed: 5, installs: ["agent", "copilot", "confidence"] },
  { substrateId: "email-api", seed: 10, installs: ["agent", "agent", "orchestrator", "reasoning", "memory", "confidence", "hitl", "compliance", "category", "outcome-pricing", "dashboard"] },
  { substrateId: "date-parser", seed: 12, installs: ["reasoning"] },
  { substrateId: "image-resizer", seed: 9, installs: ["agent", "agent", "orchestrator", "model", "sdk"] },
];

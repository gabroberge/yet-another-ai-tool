import { describe, expect, it } from "vitest";
import { describeVenture } from "./view";
import { findVenture, installEnhancement, canInstall, canUninstall, uninstallEnhancement, rebrandVenture } from "./portfolio";
import { SUBSTRATES } from "./substrates";
import { ENHANCEMENTS } from "./enhancements";
import { runInference } from "./console";
import { FULL_STACK, T0, portfolioWith } from "../../test/helpers";

const viewOf = (substrateId: string, installs: string[] = [], seed = 42) => {
  const { p, id } = portfolioWith(substrateId, seed, installs);
  return describeVenture(findVenture(p, id)!);
};

describe("substrate invariant", () => {
  it.each(SUBSTRATES.map((s) => s.id))("%s returns the same result at every level of packaging", (id) => {
    const bare = viewOf(id);
    const full = viewOf(id, FULL_STACK);
    const input = bare.substrate.console.sample;
    expect(runInference(full, input).result).toBe(runInference(bare, input).result);
    expect(runInference(full, input).result).toBe(bare.substrate.run(input));
  });

  it("keeps the foundation layer identical to the substrate", () => {
    const full = viewOf("weather-api", FULL_STACK);
    const foundation = full.layers.at(-1)!;
    expect(foundation.tier).toBe("foundation");
    expect(foundation.name).toBe(full.substrate.name);
    expect(foundation.latencyMs).toBe(full.substrate.baseLatencyMs);
  });
});

describe("transformations", () => {
  it("raises valuation, intelligence, price, and latency with every agent", () => {
    const zero = viewOf("date-parser");
    const one = viewOf("date-parser", ["agent"]);
    const two = viewOf("date-parser", ["agent", "agent"]);
    expect(one.valuation).toBeGreaterThan(zero.valuation);
    expect(two.valuation).toBeGreaterThan(one.valuation);
    expect(two.scores.intelligence).toBeGreaterThan(zero.scores.intelligence);
    expect(two.pricing.perSeat).toBeGreaterThan(zero.pricing.perSeat);
    expect(two.latencyMs).toBeGreaterThan(zero.latencyMs);
    expect(two.agents).toHaveLength(2);
    expect(two.layers.filter((l) => l.tier === "agents")).toHaveLength(2);
  });

  it("every enhancement changes something a visitor can see", () => {
    for (const def of ENHANCEMENTS) {
      const installs = [...(def.requires ?? []).flatMap((r) => Array(r.count ?? 1).fill(r.id)), def.id];
      if (def.id === "marketplace") installs.unshift("agent");
      const before = viewOf("csv-parser", installs.slice(0, -1));
      const after = viewOf("csv-parser", installs);
      expect(after.valuation, def.id).toBeGreaterThan(before.valuation);
      expect(after.claims.length, def.id).toBeGreaterThan(before.claims.length - (def.id === "agent" ? 1 : 0));
    }
  });

  it("escalates the invented category with the architecture", () => {
    const bare = viewOf("health-check");
    const agentic = viewOf("health-check", ["agent"]);
    const orchestrated = viewOf("health-check", ["agent", "agent", "orchestrator", "enterprise"]);
    expect(bare.category.startsWith("AI-Native")).toBe(true);
    expect(agentic.category.startsWith("Agentic")).toBe(true);
    expect(orchestrated.category).toMatch(/^Enterprise Multi-Agent .+ Platform$/);
  });

  it("category creation swaps in a coined category", () => {
    const v = viewOf("cron", ["category"]);
    expect(v.substrate.domain.coined.some((c) => v.category.includes(c))).toBe(true);
  });

  it("switches pricing model with outcome-based pricing", () => {
    const seat = viewOf("email-api");
    const outcome = viewOf("email-api", ["outcome-pricing"]);
    expect(seat.pricing.tiers[0]!.unit).toBe("per seat / month");
    expect(outcome.pricing.tiers[0]!.unit).toBe("per message");
  });

  it("moves the enterprise tier to an annual contract", () => {
    const v = viewOf("fx-api", ["enterprise"]);
    expect(v.pricing.tiers[2]!.price).toBeNull();
  });

  it("list prices end in 9", () => {
    const v = viewOf("weather-api", ["agent", "agent", "governance"]);
    for (const tier of v.pricing.tiers) if (tier.price && tier.price >= 10) expect(tier.price % 10).toBe(9);
  });

  it("advances lifecycle stage as valuation grows", () => {
    expect(viewOf("file-renamer").stage.id).toBe("concept");
    expect(viewOf("file-renamer", FULL_STACK).stage.id).toBe("series-c");
    expect(viewOf("file-renamer", [...FULL_STACK, ...Array(5).fill("agent")]).stage.id).toBe("unicorn");
  });

  it("billing rank: claims backed by bigger numbers print larger", () => {
    const v = viewOf("levenshtein", ["agent", "agent", "agent", "agent", "patent"]);
    const agentClaim = v.claims.find((c) => c.id === "agent")!;
    const patent = v.claims.find((c) => c.id === "patent")!;
    expect(agentClaim.text).toBe("4 AI agents");
    expect(agentClaim.rank).toBeGreaterThan(patent.rank);
  });
});

describe("requirements", () => {
  it("blocks orchestration until two agents exist", () => {
    const { p, id } = portfolioWith("cron", 1, ["agent"]);
    expect(canInstall(findVenture(p, id)!, "orchestrator")).toEqual({ ok: false, reason: "Requires 2 agents" });
    const next = installEnhancement(p, id, "orchestrator", T0);
    expect(findVenture(next, id)!.installed.map((i) => i.id)).toEqual(["agent"]);
  });

  it("caps stackable modules", () => {
    const { p, id } = portfolioWith("cron", 1, Array(8).fill("agent"));
    expect(canInstall(findVenture(p, id)!, "agent").ok).toBe(false);
    expect(installEnhancement(p, id, "agent", T0)).toBe(p);
  });

  it("refuses to retire a module others depend on", () => {
    const { p, id } = portfolioWith("cron", 1, ["confidence", "hitl"]);
    expect(canUninstall(findVenture(p, id)!, "confidence")).toEqual({ ok: false, reason: "Required by Human-in-the-loop review" });
    const after = uninstallEnhancement(uninstallEnhancement(p, id, "hitl", T0), id, "confidence", T0);
    expect(findVenture(after, id)!.installed).toHaveLength(0);
  });
});

describe("generation", () => {
  it("is deterministic for a seed", () => {
    expect(viewOf("geocoding-api", ["agent"], 7)).toEqual(viewOf("geocoding-api", ["agent"], 7));
  });

  it("produces distinct names across seeds", () => {
    const names = new Set(Array.from({ length: 30 }, (_, i) => viewOf("weather-api", [], i * 7919).identity.name));
    expect(names.size).toBeGreaterThan(12);
  });

  it("speaks each substrate's own market language", () => {
    const weather = viewOf("weather-api", ["agent"]);
    const lint = viewOf("static-analyzer", ["agent"]);
    expect(weather.positioning).toContain("forecasts");
    expect(lint.positioning).toContain("findings");
    expect(weather.agents[0]!.role).not.toBe(lint.agents[0]!.role);
    expect(weather.category).not.toBe(lint.category);
  });

  it("rebranding changes identity but not the technology or modules", () => {
    const { p, id } = portfolioWith("text-diff", 3, ["agent", "governance"]);
    const before = describeVenture(findVenture(p, id)!);
    const after = describeVenture(findVenture(rebrandVenture(p, id, T0 + 10), id)!);
    expect(after.identity.name).not.toBe(before.identity.name);
    expect(after.substrate).toBe(before.substrate);
    expect(after.venture.installed).toEqual(before.venture.installed);
  });
});

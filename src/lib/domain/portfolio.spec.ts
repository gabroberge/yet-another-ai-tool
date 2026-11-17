import { describe, expect, it } from "vitest";
import {
  clearPortfolio,
  createVenture,
  deleteVenture,
  emptyPortfolio,
  findVenture,
  installEnhancement,
  setActive,
  spinOutVenture,
} from "./portfolio";
import { describeVenture } from "./view";
import { portfolioTelemetry } from "./telemetry";
import { T0 } from "../../test/helpers";

function threeVentures() {
  let p = emptyPortfolio();
  const ids: string[] = [];
  for (const [i, s] of ["weather-api", "static-analyzer", "browser-automation"].entries()) {
    const r = createVenture(p, s, 100 + i, T0 + i);
    p = r.portfolio;
    ids.push(r.venture.id);
  }
  return { p, ids };
}

describe("independent ventures", () => {
  it("creating a venture never replaces existing ones", () => {
    const { p, ids } = threeVentures();
    expect(p.ventures).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(p.activeId).toBe(ids[2]);
  });

  it("changes to one venture leave the others untouched", () => {
    const { p, ids } = threeVentures();
    const next = installEnhancement(p, ids[0]!, "agent", T0 + 10);
    expect(findVenture(next, ids[0]!)!.installed).toHaveLength(1);
    expect(findVenture(next, ids[1]!)).toBe(findVenture(p, ids[1]!));
    expect(findVenture(next, ids[2]!)).toBe(findVenture(p, ids[2]!));
  });

  it("switching the active venture preserves every venture's state", () => {
    const { p, ids } = threeVentures();
    const a = installEnhancement(p, ids[1]!, "governance", T0 + 5);
    const b = setActive(setActive(a, ids[0]!), ids[1]!);
    expect(b.ventures).toEqual(a.ventures);
    expect(b.activeId).toBe(ids[1]);
  });

  it("avoids duplicate names in one portfolio", () => {
    let p = emptyPortfolio();
    for (let i = 0; i < 6; i++) p = createVenture(p, "date-parser", 5, T0 + i).portfolio;
    const names = p.ventures.map((v) => describeVenture(v).identity.name);
    expect(new Set(names).size).toBe(6);
  });

  it("spin-out copies modules onto a new identity on the same technology", () => {
    const { p, ids } = threeVentures();
    const withAgents = installEnhancement(installEnhancement(p, ids[0]!, "agent", T0), ids[0]!, "reasoning", T0);
    const { portfolio, venture } = spinOutVenture(withAgents, ids[0]!, 999, T0 + 20);
    const parent = describeVenture(findVenture(portfolio, ids[0]!)!);
    const child = describeVenture(venture!);
    expect(portfolio.ventures).toHaveLength(4);
    expect(child.substrate.id).toBe(parent.substrate.id);
    expect(child.venture.installed.map((i) => i.id)).toEqual(["agent", "reasoning"]);
    expect(child.identity.name).not.toBe(parent.identity.name);
    expect(child.venture.spunOutFrom).toBe(ids[0]);
  });

  it("deleting one venture keeps the rest and moves the active selection", () => {
    const { p, ids } = threeVentures();
    const next = deleteVenture(p, ids[2]!);
    expect(next.ventures.map((v) => v.id)).toEqual([ids[1], ids[0]]);
    expect(next.activeId).toBe(ids[1]);
  });

  it("clearing empties the portfolio", () => {
    expect(clearPortfolio()).toEqual(emptyPortfolio());
  });

  it("records history per venture", () => {
    const { p, ids } = threeVentures();
    const next = installEnhancement(p, ids[0]!, "agent", T0 + 99);
    const events = findVenture(next, ids[0]!)!.events;
    expect(events[0]!.kind).toBe("installed");
    expect(events[0]!.text).toMatch(/^Deployed \w+, .+\.$/);
    expect(findVenture(next, ids[1]!)!.events).toHaveLength(1);
  });
});

describe("telemetry", () => {
  it("aggregates from actual portfolio state", () => {
    const { p, ids } = threeVentures();
    const next = installEnhancement(installEnhancement(p, ids[0]!, "agent", T0), ids[1]!, "agent", T0);
    const t = portfolioTelemetry(next);
    expect(t.ventures).toBe(3);
    expect(t.agents).toBe(2);
    expect(t.modules).toBe(2);
    expect(t.technologies).toBe(3);
    expect(t.totalValuation).toBe(t.views.reduce((s, v) => s + v.valuation, 0));
    expect(t.byKind.api + t.byKind.tool).toBe(3);
    expect(t.foundationsModified).toBe(0);
    expect(t.latencyMultiple).toBeGreaterThan(1);
  });

  it("handles an empty portfolio", () => {
    const t = portfolioTelemetry(emptyPortfolio());
    expect(t.ventures).toBe(0);
    expect(t.top).toBeNull();
    expect(t.latencyMultiple).toBe(0);
  });
});

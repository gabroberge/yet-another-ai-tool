import { beforeEach, describe, expect, it } from "vitest";
import { loadPortfolio, parsePortfolio, savePortfolio, STORAGE_KEY } from "./storage";
import { emptyPortfolio, installEnhancement } from "../domain/portfolio";
import { describeVenture } from "../domain/view";
import { portfolioWith, T0 } from "../../test/helpers";
import { brandKey, isNameSafe } from "../generation/naming/naming";
import { legacyAgentOrder, legacyName } from "../generation/naming/legacy";

beforeEach(() => localStorage.clear());

describe("persistence", () => {
  it("round-trips a portfolio, including derived output", () => {
    const { p, id } = portfolioWith("weather-api", 11, ["agent", "agent", "orchestrator"]);
    expect(savePortfolio(p)).toBe(true);
    const loaded = loadPortfolio();
    expect(loaded).toEqual(p);
    expect(describeVenture(loaded.ventures[0]!)).toEqual(describeVenture(p.ventures[0]!));
    expect(loaded.activeId).toBe(id);
  });

  it("returns an empty portfolio for missing or corrupt data", () => {
    expect(loadPortfolio()).toEqual(emptyPortfolio());
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadPortfolio()).toEqual(emptyPortfolio());
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, ventures: [] }));
    expect(loadPortfolio()).toEqual(emptyPortfolio());
  });

  it("drops ventures built on unknown technology and modules that no longer exist", () => {
    const { p } = portfolioWith("cron", 4, ["agent"]);
    const raw = JSON.parse(JSON.stringify(p));
    raw.ventures[0].installed.push({ id: "retired-module", at: T0 });
    raw.ventures.push({ ...raw.ventures[0], id: "ghost", substrateId: "mainframe" });
    const loaded = parsePortfolio(JSON.stringify(raw));
    expect(loaded.ventures).toHaveLength(1);
    expect(loaded.ventures[0]!.installed.map((i) => i.id)).toEqual(["agent"]);
  });

  it("enforces module limits on load", () => {
    const { p } = portfolioWith("cron", 4);
    const raw = JSON.parse(JSON.stringify(p));
    raw.ventures[0].installed = Array.from({ length: 20 }, () => ({ id: "agent", at: T0 }));
    expect(parsePortfolio(JSON.stringify(raw)).ventures[0]!.installed).toHaveLength(8);
  });

  it("repairs a dangling active id", () => {
    const { p } = portfolioWith("cron", 4);
    const loaded = parsePortfolio(JSON.stringify({ ...p, activeId: "missing" }));
    expect(loaded.activeId).toBe(p.ventures[0]!.id);
  });

  it("keeps names stored by this version untouched", () => {
    const { p } = portfolioWith("cron", 4, ["agent"]);
    expect(parsePortfolio(JSON.stringify(p)).ventures[0]!.name).toBe(p.ventures[0]!.name);
  });

  it("reports a refused write instead of throwing", () => {
    const full = { ...localStorage, setItem: () => { throw new Error("QuotaExceededError"); } } as unknown as Storage;
    const { p, id } = portfolioWith("cron", 4);
    expect(savePortfolio(installEnhancement(p, id, "agent", T0), full)).toBe(false);
  });
});

/** A venture as saved before names were stored: no name field, history quoting the old generator's output. */
function legacyVenture(substrateId: string, seed: number, createdAt: number, extra: Record<string, unknown> = {}) {
  const name = legacyName(substrateId, seed, 0)!;
  const agent = legacyAgentOrder(seed)[0]!;
  return {
    name,
    raw: {
      id: `v-${seed}`,
      seed,
      substrateId,
      createdAt,
      updatedAt: createdAt + 3,
      rebrands: 0,
      installed: [{ id: "agent", at: createdAt + 1 }, { id: "copilot", at: createdAt + 2 }, { id: "model", at: createdAt + 3 }],
      events: [
        { at: createdAt + 3, kind: "installed", text: `Installed ${name.replace(/\W.*$/, "")}-1.` },
        { at: createdAt + 2, kind: "installed", text: `Installed ${name} Copilot.` },
        { at: createdAt + 1, kind: "installed", text: `Deployed ${agent}, Code Review Agent.` },
        { at: createdAt, kind: "manufactured", text: `Manufactured ${name} on a linter.` },
      ],
      ...extra,
    },
  };
}

function seedWhere(substrateId: string, safe: boolean): number {
  for (let seed = 0; ; seed++) if (isNameSafe(legacyName(substrateId, seed, 0)!) === safe) return seed;
}

describe("name migration", () => {
  it("replaces an unsafe legacy name everywhere it appears and keeps everything else", () => {
    const seed = seedWhere("static-analyzer", false);
    const { name: old, raw } = legacyVenture("static-analyzer", seed, T0);
    const loaded = parsePortfolio(JSON.stringify({ version: 1, activeId: raw.id, ventures: [raw] }));
    const v = loaded.ventures[0]!;
    expect(isNameSafe(v.name)).toBe(true);
    expect(v.name).not.toBe(old);
    expect({ id: v.id, seed: v.seed, createdAt: v.createdAt, installed: v.installed }).toEqual({ id: raw.id, seed, createdAt: T0, installed: raw.installed });
    expect(loaded.activeId).toBe(raw.id);

    const view = describeVenture(v);
    const texts = v.events.map((e) => e.text);
    expect(texts.join("\n")).not.toContain(old);
    expect(texts).toContain(`Manufactured ${v.name} on a linter.`);
    expect(texts).toContain(`Installed ${v.name} Concierge.`);
    expect(texts).toContain(`Installed ${view.layers.find((l) => l.enhancementId === "model")!.name}.`);
    expect(texts).toContain(`Deployed ${view.agents[0]!.name}, Code Review Agent.`);
  });

  it("keeps a legacy name that is still acceptable", () => {
    const seed = seedWhere("static-analyzer", true);
    const { name, raw } = legacyVenture("static-analyzer", seed, T0);
    const v = parsePortfolio(JSON.stringify({ version: 1, activeId: null, ventures: [raw] })).ventures[0]!;
    expect(v.name).toBe(name);
    expect(v.events.at(-1)!.text).toBe(`Manufactured ${name} on a linter.`);
  });

  it("resolves duplicate names in favor of the older venture and is stable on reload", () => {
    const older = { ...legacyVenture("cron", 1, T0).raw, id: "a", name: "Ostinorel" };
    const newer = { ...legacyVenture("cron", 2, T0 + 50).raw, id: "b", name: "Ostinorel Labs" };
    const once = parsePortfolio(JSON.stringify({ version: 1, activeId: "b", ventures: [newer, older] }));
    const byId = Object.fromEntries(once.ventures.map((v) => [v.id, v.name]));
    expect(byId.a).toBe("Ostinorel");
    expect(brandKey(byId.b!)).not.toBe(brandKey("Ostinorel"));
    expect(parsePortfolio(JSON.stringify(once))).toEqual(once);
  });

  it("rewrites a spin-out's parent history when the child is renamed", () => {
    const seed = seedWhere("static-analyzer", false);
    const child = legacyVenture("static-analyzer", seed, T0 + 10).raw;
    const parent = { ...legacyVenture("cron", 3, T0).raw, id: "parent", name: "Ostinorel" };
    const childName = legacyName("static-analyzer", seed, 0)!;
    parent.events = [{ at: T0 + 10, kind: "spun-out", text: `Spun out ${childName}.` }, ...parent.events];
    const loaded = parsePortfolio(JSON.stringify({ version: 1, activeId: null, ventures: [{ ...child, spunOutFrom: "parent" }, parent] }));
    const renamed = loaded.ventures.find((v) => v.id === child.id)!.name;
    expect(loaded.ventures.find((v) => v.id === "parent")!.events[0]!.text).toBe(`Spun out ${renamed}.`);
  });
});

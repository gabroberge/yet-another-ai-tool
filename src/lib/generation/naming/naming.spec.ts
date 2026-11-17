import { describe, expect, it } from "vitest";
import { brandKey, ConflictList, conflictFor, generateName, isNameSafe, KNOWN } from "./naming";
import { legacyName } from "./legacy";
import { SUBSTRATES, requireSubstrate } from "../../domain/substrates";
import { AGENT_NAMES, PARTNERS, indexAbbr } from "../identity";
import { createVenture, emptyPortfolio, rebrandVenture, spinOutVenture } from "../../domain/portfolio";
import { describeVenture } from "../../domain/view";
import { SHELF, showcase } from "../showcase";
import { FULL_STACK, portfolioWith, T0 } from "../../../test/helpers";

describe("conflict checks", () => {
  it("catch known marks regardless of case, punctuation, and descriptor affixes", () => {
    for (const name of ["Codex", "Codex.ai", "CODEX Labs", "codex-cloud", "CodexOS", "AskCodex", "Ask Codex", "codexlabs", "Get Codex HQ", "Copilot", "Co-pilot", "co pilot", "CopilotOS", "Copilot.ai", "ChatGPT", "Chat GPT"]) {
      expect(conflictFor(name), name).not.toBeNull();
    }
  });

  it("catch near-matches, extensions, and embedded marks", () => {
    for (const name of ["Kodex", "Codexa", "Copilott", "Copilotly", "Sentrys", "Datadogs", "Snowflaek", "Grammarli", "Notionify", "Superclaude", "BaroGPT", "Zephyrio", "Northwind Freight"]) {
      expect(conflictFor(name), name).not.toBeNull();
    }
  });

  it("ignore accents", () => {
    expect(conflictFor("Cödex")).toBe("Codex");
  });

  it("leave invented names alone", () => {
    for (const name of ["Nimborel", "Kairalyn Labs", "Epistandi", "Drachenza.ai", "OstinorelOS"]) {
      expect(conflictFor(name), name).toBeNull();
    }
  });

  it("can be extended without touching the shared list", () => {
    const local = KNOWN.extend(["Nimborel"]);
    expect(local.match("Nimborel.ai")).toBe("Nimborel");
    expect(conflictFor("Nimborel.ai")).toBeNull();
    expect(new ConflictList(["Acme Rockets"]).match("acme-rockets labs")).toBe("Acme Rockets");
  });

  it("brand keys identify the same brand behind descriptors", () => {
    expect(brandKey("Nimborel Labs")).toBe(brandKey("nimborel.ai"));
    expect(brandKey("NimborelOS")).toBe(brandKey("Ask Nimborel"));
    expect(brandKey("Nimborel")).not.toBe(brandKey("Nimbenza"));
  });

  it("flags the kinds of names the old generator produced", () => {
    for (const name of ["Codex.ai", "Cortex Labs", "Sentry", "AskAtlas", "EpochOS", "Relay AI", "Signalcast", "Ledgerly", "Mintwise", "Frame.ai", "Tabula.ai", "Proxim"]) {
      expect(isNameSafe(name), name).toBe(false);
    }
    expect(legacyName("static-analyzer", 0, 0)).toBeTypeOf("string");
  });
});

describe("name generation", () => {
  it("is reproducible", () => {
    const s = requireSubstrate("static-analyzer");
    expect(generateName(s, 1234, 0)).toBe(generateName(s, 1234, 0));
    expect(generateName(s, 1234, 1)).toBe(generateName(s, 1234, 1));
  });

  it("never produces a known conflict, across every substrate and many seeds", () => {
    for (const s of SUBSTRATES) for (let seed = 0; seed < 150; seed++) {
      const name = generateName(s, seed, seed % 3);
      expect(conflictFor(name), `${s.id}/${seed}: ${name}`).toBeNull();
    }
  });

  it("coins its core rather than borrowing a substrate word", () => {
    for (const s of SUBSTRATES) for (let seed = 0; seed < 50; seed++) {
      const core = brandKey(generateName(s, seed, 0));
      expect(s.domain.stems).not.toContain(core);
      expect(core.length).toBeGreaterThan(4);
    }
  });

  it("falls back deterministically when candidates conflict or are taken", () => {
    const s = requireSubstrate("cron");
    const first = generateName(s, 7, 0);
    const strict = KNOWN.extend([first]);
    const fallback = generateName(s, 7, 0, { conflicts: strict });
    expect(fallback).not.toBe(first);
    expect(generateName(s, 7, 0, { conflicts: strict })).toBe(fallback);
    expect(generateName(s, 7, 0, { taken: new Set([brandKey(first)]) })).toBe(fallback);
  });

  it("still returns a unique name when the candidate space is exhausted", () => {
    const s = requireSubstrate("cron");
    const taken = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const name = generateName({ ...s, domain: { ...s.domain, stems: ["ostin"] } }, 1, 0, { taken });
      expect(taken.has(brandKey(name))).toBe(false);
      taken.add(brandKey(name));
    }
  });

  it("keeps derived terms clear of known marks", () => {
    expect(indexAbbr("Similando Labs", "Identity Resolution")).toBe("SIRX");
    expect(conflictFor(indexAbbr("Similando Labs", "Identity Resolution"))).toBeNull();
    for (const s of SUBSTRATES) for (let seed = 0; seed < 12; seed++) {
      const { p, id } = portfolioWith(s.id, seed, FULL_STACK);
      const v = describeVenture(p.ventures.find((x) => x.id === id)!);
      expect(conflictFor(v.index!.abbr), v.index!.abbr).toBeNull();
      const model = v.layers.find((l) => l.enhancementId === "model")!.name;
      expect(conflictFor(model), model).toBeNull();
    }
  });

  it("agent names and partner names are invented", () => {
    expect(AGENT_NAMES).toHaveLength(24);
    expect(new Set(AGENT_NAMES).size).toBe(24);
    for (const n of [...AGENT_NAMES, ...PARTNERS]) expect(conflictFor(n), n).toBeNull();
  });

  it("marketing showcase names are clear and distinct", () => {
    const names = SHELF.map((s) => showcase(s.substrateId, s.seed, s.installs).identity.name);
    for (const n of names) expect(conflictFor(n), n).toBeNull();
    expect(new Set(names.map(brandKey)).size).toBe(names.length);
  });
});

describe("portfolio uniqueness", () => {
  it("never repeats a brand within a portfolio, even with the same seed and descriptors", () => {
    let p = emptyPortfolio();
    for (let i = 0; i < 30; i++) p = createVenture(p, "date-parser", 5, T0 + i).portfolio;
    expect(new Set(p.ventures.map((v) => brandKey(v.name))).size).toBe(30);
  });

  it("rebrands and spin-outs pick names nobody else holds", () => {
    let p = emptyPortfolio();
    for (let i = 0; i < 6; i++) p = createVenture(p, "cron", 11, T0 + i).portfolio;
    const id = p.ventures[0]!.id;
    for (let i = 0; i < 10; i++) p = rebrandVenture(p, id, T0 + 100 + i);
    p = spinOutVenture(p, id, 11, T0 + 200).portfolio;
    const keys = p.ventures.map((v) => brandKey(v.name));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("the stored name is the one every view shows", () => {
    const { p, id } = portfolioWith("csv-parser", 5, ["agent", "copilot", "score", "model"]);
    const venture = p.ventures.find((v) => v.id === id)!;
    const view = describeVenture(venture);
    expect(view.identity.name).toBe(venture.name);
    expect(view.layers.some((l) => l.name === `${venture.name} Concierge`)).toBe(true);
    expect(venture.events.at(-1)!.text).toContain(venture.name);
  });
});

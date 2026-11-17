import { describe, expect, it } from "vitest";
import { Rng, hashString } from "./rng";
import { buildArtifact, buildArtifacts, grossMargin } from "./artifacts";
import { describeVenture } from "../domain/view";
import { findVenture } from "../domain/portfolio";
import { FULL_STACK, portfolioWith } from "../../test/helpers";
import * as ops from "../domain/substrate-ops";

const viewOf = (substrateId: string, installs: string[] = [], seed = 42) => {
  const { p, id } = portfolioWith(substrateId, seed, installs);
  return describeVenture(findVenture(p, id)!);
};

describe("rng", () => {
  it("is reproducible and label-isolated", () => {
    expect(new Rng(1).float()).toBe(new Rng(1).float());
    expect(Rng.for(1, "a").float()).not.toBe(Rng.for(1, "b").float());
    expect(hashString("yaat")).toBe(hashString("yaat"));
  });
});

describe("artifacts", () => {
  it("builds every artifact for a bare and a fully packaged venture", () => {
    for (const installs of [[], FULL_STACK]) {
      for (const a of buildArtifacts(viewOf("browser-automation", installs))) {
        expect(a.body.length).toBeGreaterThan(200);
        expect(a.body).not.toMatch(/undefined|NaN|\{[a-z]+\}/);
      }
    }
  });

  it("the agent skill grows a step per agent and always calls the foundation", () => {
    const small = buildArtifact(viewOf("date-parser", ["agent"]), "skill").body;
    const big = buildArtifact(viewOf("date-parser", ["agent", "agent", "agent", "orchestrator", "reasoning"]), "skill").body;
    const steps = (s: string) => (s.match(/^\d+\. /gm) ?? []).length;
    expect(steps(big)).toBeGreaterThan(steps(small));
    expect(small).toContain("parseDate(input, { reference })");
    expect(big).toContain("parseDate(input, { reference })");
    expect(big.startsWith("---\nname: ")).toBe(true);
  });

  it("the trust center lists the underlying technology as a subprocessor", () => {
    const v = viewOf("fx-api", ["governance"]);
    expect(buildArtifact(v, "trust").body).toContain(v.substrate.name);
  });

  it("modeled margin falls as the architecture gets heavier", () => {
    expect(grossMargin(viewOf("email-api", Array(8).fill("agent")))).toBeLessThan(grossMargin(viewOf("email-api")));
  });
});

describe("substrate operations", () => {
  it("do real work", () => {
    expect(ops.levenshtein("kitten", "sitting")).toBe(3);
    expect(ops.parseDate("next friday")).toBe("2026-11-20 (Friday)");
    expect(ops.parseDate("2027-01-05")).toBe("2027-01-05 (Tuesday)");
    expect(ops.formatJson('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(ops.describeCron("0 9 * * 1-5")).toBe("At 09:00, on Monday through Friday");
    expect(ops.redact("mail dana@x.io")).toBe("mail [EMAIL]");
    expect(ops.resizeImage("4032x3024 to 800w")).toBe("4032×3024 → 800×600");
    expect(ops.renameFiles("My File.JPG")).toBe("My File.JPG → my-file.jpg");
    expect(ops.convertCurrency("100 USD to EUR")).toContain("92.00 EUR");
    expect(ops.lint("var a == 1")).toContain("no-var");
    expect(ops.wordDiff("a b\na c")).toBe("  a\n- b\n+ c");
  });
});

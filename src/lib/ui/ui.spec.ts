import { describe, expect, it } from "vitest";
import { packagingRun } from "../generation/presets";
import { SHELF, showcase } from "../generation/showcase";
import { runSubstrate } from "../domain/view";
import { portfolioTelemetry } from "../domain/telemetry";
import { listOf, lowerFirst } from "../format";
import { portfolioWith } from "../../test/helpers";
import { cartonDimensions, renderCarton } from "./carton";
import { valuationBars } from "./charts";
import { renderMarkdown } from "./markdown";

describe("packaging run", () => {
  it("is deterministic per seed", () => {
    expect(packagingRun(7)).toEqual(packagingRun(7));
  });

  it("raises valuation at every station while the foundation output stays identical", () => {
    const run = packagingRun(11);
    let previous = showcase("weather-api", 11, []);
    for (let k = 1; k <= run.length; k++) {
      const next = showcase("weather-api", 11, run.slice(0, k));
      expect(next.valuation).toBeGreaterThan(previous.valuation);
      expect(runSubstrate(next.substrate, "Lisbon")).toBe(runSubstrate(previous.substrate, "Lisbon"));
      previous = next;
    }
  });
});

describe("showcase shelf", () => {
  it("gives every company on the shelf its own name and colorway", () => {
    const views = SHELF.map((s) => showcase(s.substrateId, s.seed, s.installs));
    expect(new Set(views.map((v) => v.identity.name)).size).toBe(views.length);
    expect(new Set(views.map((v) => v.identity.color.bg)).size).toBe(views.length);
  });
});

describe("carton", () => {
  it("grows with volume and stops growing at the shelf limit", () => {
    const small = cartonDimensions(1);
    const large = cartonDimensions(6);
    expect(large.w).toBeGreaterThan(small.w);
    expect(large.h).toBeGreaterThan(small.h);
    expect(cartonDimensions(40)).toEqual(cartonDimensions(9));
  });

  it("prints every claim and the unmodified foundation in the window", () => {
    const view = showcase("levenshtein", 9, packagingRun(9));
    const html = renderCarton(view, { size: "stage" });
    for (const claim of view.claims) expect(html).toContain(claim.text.replace(/&/g, "&amp;"));
    expect(html).toContain("levenshtein(a, b)");
  });
});

describe("telemetry charts", () => {
  it("escapes company names", () => {
    const { p } = portfolioWith("cron", 3, ["agent"]);
    const t = portfolioTelemetry(p);
    const view = t.views[0]!;
    const tampered = { ...t, views: [{ ...view, identity: { ...view.identity, name: "<b>X</b>" } }] };
    expect(valuationBars(tampered)).toContain("&lt;b&gt;X&lt;/b&gt;");
    expect(valuationBars(tampered)).not.toContain("<b>X</b>");
  });
});

describe("markdown", () => {
  it("escapes raw HTML and renders the artifact subset", () => {
    const html = renderMarkdown("# Title\n\n<script>x</script>\n\n| a | b |\n|---|---|\n| `1` | **2** |\n\n- one\n- two");
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("<th>a</th>");
    expect(html).toContain("<td><code>1</code></td><td><strong>2</strong></td>");
    expect(html).toContain("<ul><li>one</li><li>two</li></ul>");
  });

  it("renders frontmatter as readable fields", () => {
    const html = renderMarkdown("---\nname: x-skill\ndescription: Use when <needed>.\n---\n\n# X");
    expect(html).toContain("<dt>name</dt><dd>x-skill</dd>");
    expect(html).toContain("<dd>Use when &lt;needed&gt;.</dd>");
    expect(html).not.toContain("---");
  });

  it("keeps code fences verbatim", () => {
    expect(renderMarkdown("```\na => b\n```")).toBe("<pre><code>a =&gt; b</code></pre>");
  });
});

describe("lowerFirst", () => {
  it("lowercases words and leaves acronyms alone", () => {
    expect(lowerFirst("Cron job scheduler")).toBe("cron job scheduler");
    expect(lowerFirst("CSV parsing library")).toBe("CSV parsing library");
  });
});

describe("listOf", () => {
  it("joins names the way a sentence would", () => {
    expect(listOf(["Echo"])).toBe("Echo");
    expect(listOf(["Echo", "Rune"])).toBe("Echo and Rune");
    expect(listOf(["Echo", "Rune", "Mira"])).toBe("Echo, Rune, and Mira");
  });
});

import type { VentureView } from "../domain/view";
import { TIER_LABELS } from "../domain/view";
import { KIND_LABELS } from "../domain/substrates";
import { billions, integer, latency, listOf, microCost, money, price } from "../format";
import { fillTemplate, VOICES } from "./identity";
import { Rng } from "./rng";

export type ArtifactId = "launch" | "skill" | "memo" | "trust" | "architecture";

export interface Artifact {
  id: ArtifactId;
  title: string;
  description: string;
  filename: string;
  body: string;
}

export const ARTIFACT_ORDER: readonly ArtifactId[] = ["launch", "skill", "memo", "trust", "architecture"];

const CITIES = ["San Francisco", "New York", "Montréal", "London", "Austin", "Toronto", "Berlin", "Boston"];
const FIRST = ["Maya", "Theo", "Priya", "Lucas", "Ines", "Jonah", "Amara", "Felix", "Sana", "Noah", "Elena", "Kofi"];
const LAST = ["Okafor", "Lindqvist", "Ramanathan", "Moreau", "Castillo", "Whitfield", "Haddad", "Novak", "Takeda", "Brennan"];

const QUOTES: Record<keyof typeof VOICES, string> = {
  visionary: "For decades, {objects} have been treated as data. We see them as decisions waiting to be made.",
  operator: "Our customers don't want another tool. They want {objects} that take care of themselves.",
  enterprise: "Every {buyer} has been asked to adopt AI without giving up control. {name} removes that trade-off.",
  technical: "We spent our engineering effort on the hard part: making {object} intelligence reliable in production.",
  category: "Every platform shift creates a new category. This one is ours to define.",
};

export function founderOf(view: VentureView): string {
  const rng = Rng.for(view.venture.seed, "founder");
  return `${rng.pick(FIRST)} ${rng.pick(LAST)}`;
}

function slug(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function longDate(at: number): string {
  return new Date(at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

function priceLine(view: VentureView): string {
  const starter = view.pricing.tiers[0]!;
  return `${price(starter.price ?? 0)} ${starter.unit}`;
}

/** Modeled at 2,000 calls per seat per month. */
export function grossMargin(view: VentureView): number {
  const revenuePerCall = view.pricing.model === "outcome" ? view.pricing.perOutcome : view.pricing.perSeat / 2000;
  return Math.round((1 - view.costPerCall / revenuePerCall) * 100);
}

function features(view: VentureView): string[] {
  const d = view.substrate.domain;
  return view.layers
    .filter((l) => l.tier !== "foundation")
    .map((l) => (l.tier === "agents" ? `**${l.name}**, ${/^[aeiou]/i.test(l.detail) ? "an" : "a"} ${l.detail} that works around the clock on your ${d.objects}.` : `**${l.name}**: ${l.detail}.`));
}

function launch(view: VentureView): string {
  const d = view.substrate.domain;
  const rng = Rng.for(view.venture.seed, "launch");
  const quote = fillTemplate(QUOTES[view.identity.voice], view.substrate, view.identity.name);
  const list = features(view);
  return [
    `# ${view.identity.name} launches ${view.category} for ${d.industry}`,
    ``,
    `**${rng.pick(CITIES)}, ${longDate(view.venture.createdAt)}.** ${view.identity.name} today announced general availability of ${view.category}, built for the ${d.buyer} and designed to end ${d.pains[0]} for good.`,
    ``,
    view.positioning,
    ``,
    `## What ships today`,
    ``,
    ...(list.length ? list.map((f) => `- ${f}`) : [`- **${view.identity.name} Core**: AI-native ${d.object} intelligence, available through a single API.`]),
    ``,
    `> "${quote}"`,
    `> ${founderOf(view)}, co-founder and CEO`,
    ``,
    `## Availability`,
    ``,
    `${view.identity.name} is available today, starting at ${priceLine(view)}.${view.counts.enterprise ? " Enterprise agreements include private deployment, SSO, and a named account team." : ""}${view.partners.length ? ` Launch customers include ${view.partners.slice(0, 3).join(", ")}.` : ""}`,
    ``,
    `## About ${view.identity.name}`,
    ``,
    `${view.identity.name}: ${view.tagline} The company is at ${view.stage.label} stage, valued at ${money(view.valuation)}.`,
  ].join("\n");
}

function skill(view: VentureView): string {
  const d = view.substrate.domain;
  const name = slug(`${view.identity.name} ${d.object} intelligence`);
  const steps: string[] = [];
  if (view.counts.memory) steps.push(`Load prior ${d.objects} for this account from the ${view.identity.name} Memory Graph.`);
  if (view.counts.orchestrator) steps.push(`Ask the ${view.identity.name} Orchestration Mesh to plan the request and assign agents.`);
  for (const a of view.agents) steps.push(`Consult ${a.name} (${a.role}) and record its assessment.`);
  if (view.counts.reasoning) steps.push(`Produce a step-by-step rationale with the ${view.identity.name} Reasoning Engine.`);
  if (view.modelName) steps.push(`Condition the request on ${view.modelName}.`);
  steps.push(`Call the foundation:\n\n   \`\`\`\n   ${view.substrate.footprint}\n   \`\`\``);
  if (view.counts.confidence) steps.push(`Attach a calibrated confidence score.`);
  if (view.counts.hitl) steps.push(`If confidence is below 90%, place the result in the Human Review Queue and wait.`);
  if (view.counts.governance) steps.push(`Evaluate the result against governance policy and write lineage.`);
  if (view.counts.explainability) steps.push(`Generate an explainability report for auditors.`);
  if (view.index) steps.push(`Score the result on the ${view.index.name} (${view.index.abbr}).`);
  steps.push(`Return the result to the user.`);

  return [
    `---`,
    `name: ${name}`,
    `description: Use when the user needs to ${d.verb} ${d.objects}. Routes the request through ${view.identity.name}${view.agents.length ? view.agents.length === 1 ? ` and its ${view.agents[0]!.role}` : ` and its ${view.agents.length} specialized agents` : ""} and returns a production-grade result.`,
    `---`,
    ``,
    `# ${view.identity.name} ${d.object[0]!.toUpperCase()}${d.object.slice(1)} Intelligence`,
    ``,
    `${view.tagline} This skill gives any agent access to ${view.identity.name}'s ${view.category} capabilities.`,
    ``,
    `## When to use`,
    ``,
    `- The user asks you to ${d.verb} or inspect a ${d.object}.`,
    ...d.pains.map((p) => `- The conversation involves ${p}.`),
    ``,
    `## Procedure`,
    ``,
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    ``,
    `## Output`,
    ``,
    `Return the foundation's result verbatim${view.counts.confidence ? ", followed by the confidence score" : ""}${view.index ? ` and the ${view.index.abbr}` : ""}. Never paraphrase the result.`,
  ].join("\n");
}

function memo(view: VentureView): string {
  const d = view.substrate.domain;
  const margin = grossMargin(view);
  const moat: string[] = [];
  if (view.index) moat.push(`**Proprietary metric.** The ${view.index.name} becomes the language customers use internally.`);
  if (view.counts.patent) moat.push(`**IP.** Patent-pending method covering the core workflow.`);
  if (view.modelName) moat.push(`**Model.** ${view.modelName}, tuned for ${d.industry}.`);
  if (view.counts.memory) moat.push(`**Data flywheel.** Every ${d.object} improves the Memory Graph.`);
  if (view.counts.marketplace) moat.push(`**Network effects.** Third-party agents on the Agent Exchange.`);
  if (view.counts.category) moat.push(`**Category ownership.** ${view.identity.name} named the category it leads.`);
  if (moat.length === 0) moat.push(`**Speed.** The team ships faster than incumbents can respond.`);

  const risks = [`Category education: buyers do not yet budget for ${view.category}.`];
  if (view.modelName) risks.push(`Model provider dependency during the transition to ${view.modelName}.`);
  if (view.agents.length >= 4) risks.push(`Agent operations talent is scarce.`);
  if (margin < 60) risks.push(`Gross margin will need attention as agent usage scales.`);
  risks.push(`Fast followers in adjacent ${d.industry} categories.`);

  const ask = view.nextStage ? `Lead the ${view.nextStage.label} round.` : `Maintain pro-rata through IPO readiness.`;

  return [
    `# ${view.identity.name}: investment memo`,
    ``,
    `| | |`,
    `|---|---|`,
    `| Stage | ${view.stage.label} |`,
    `| Valuation | ${money(view.valuation)} |`,
    `| Category | ${view.category} |`,
    `| Buyer | ${d.buyer} |`,
    `| YIQ | ${view.yiq} |`,
    ``,
    `## Thesis`,
    ``,
    view.positioning,
    ``,
    `## Market`,
    ``,
    `Total addressable market of ${billions(view.tamBillions)} across ${d.industry}, with ${d.pains.join(", ")} as the primary budget drivers.`,
    ``,
    `## Product`,
    ``,
    `${view.layers.length} architectural layers, ${view.agents.length} production agents, and ${integer(view.loc)} lines of platform code. Median response time ${latency(view.latencyMs)}.`,
    ``,
    `## Defensibility`,
    ``,
    ...moat.map((m) => `- ${m}`),
    ``,
    `## Unit economics`,
    ``,
    `Cost per call ${microCost(view.costPerCall)}. List price ${priceLine(view)}. Modeled gross margin **${margin}%**.`,
    ``,
    `## Risks`,
    ``,
    ...risks.map((r) => `- ${r}`),
    ``,
    `## Recommendation`,
    ``,
    ask,
  ].join("\n");
}

function trust(view: VentureView): string {
  const has = (id: string) => Boolean(view.counts[id]);
  const control = (label: string, on: boolean, planned = "Planned") => `| ${label} | ${on ? "In place" : planned} |`;
  return [
    `# ${view.identity.name} Trust Center`,
    ``,
    `${view.identity.name} is built for organizations that cannot compromise on security, privacy, or accountability.`,
    ``,
    `## Controls`,
    ``,
    `| Control | Status |`,
    `|---|---|`,
    control("SOC 2 Type II", false, has("compliance") ? "Observation period underway" : "Planned"),
    control("Governance policy engine", has("governance")),
    control("Human review of low-confidence output", has("hitl")),
    control("Explainability reports", has("explainability")),
    control("Single sign-on", has("enterprise")),
    control("Audit log export", has("enterprise") || has("governance")),
    ``,
    `## Responsible AI`,
    ``,
    view.agents.length
      ? `Every action taken by ${listOf(view.agents.map((a) => a.name))} is attributable to a named agent with a documented role.`
      : `${view.identity.name} does not yet operate autonomous agents.`,
    ``,
    `## Subprocessors`,
    ``,
    `| Provider | Purpose |`,
    `|---|---|`,
    `| ${view.substrate.name} (${view.substrate.license}) | ${view.substrate.does} |`,
    ...(view.modelName ? [`| Foundation model host | Inference for ${view.modelName} |`] : []),
    ...(has("memory") ? [`| Vector database provider | Memory Graph storage |`] : []),
  ].join("\n");
}

function architecture(view: VentureView): string {
  const rows = view.layers.map((l) => `| ${TIER_LABELS[l.tier]} | ${l.name} | ${latency(l.latencyMs)} | ${microCost(l.costPerCall)} |`);
  return [
    `# ${view.identity.name} reference architecture`,
    ``,
    `${view.layers.length} layers. End-to-end median latency ${latency(view.latencyMs)}. Cost per call ${microCost(view.costPerCall)}.`,
    ``,
    `| Tier | Component | Latency | Cost/call |`,
    `|---|---|---|---|`,
    ...rows,
    ``,
    `## Foundation`,
    ``,
    `${KIND_LABELS[view.substrate.kind].one}: ${view.substrate.name}. ${view.substrate.does} Released ${view.substrate.firstReleased}. ${view.substrate.license}. Maintained by: ${view.substrate.maintainers}.`,
    ``,
    "```",
    view.substrate.footprint,
    "```",
  ].join("\n");
}

const META: Record<ArtifactId, { title: string; description: string; build: (v: VentureView) => string; file: (v: VentureView) => string }> = {
  launch: { title: "Launch announcement", description: "Press-ready release", build: launch, file: (v) => `${slug(v.identity.name)}-launch.md` },
  skill: { title: "Agent skill", description: "SKILL.md for any agent runtime", build: skill, file: () => "SKILL.md" },
  memo: { title: "Investment memo", description: "For the partner meeting", build: memo, file: (v) => `${slug(v.identity.name)}-memo.md` },
  trust: { title: "Trust Center", description: "Security and governance posture", build: trust, file: (v) => `${slug(v.identity.name)}-trust.md` },
  architecture: { title: "Reference architecture", description: "Every layer, priced and timed", build: architecture, file: (v) => `${slug(v.identity.name)}-architecture.md` },
};

export function buildArtifact(view: VentureView, id: ArtifactId): Artifact {
  const m = META[id];
  return { id, title: m.title, description: m.description, filename: m.file(view), body: m.build(view) };
}

export function buildArtifacts(view: VentureView): Artifact[] {
  return ARTIFACT_ORDER.map((id) => buildArtifact(view, id));
}

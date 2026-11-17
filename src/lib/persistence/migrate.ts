import type { Venture, VentureEvent } from "../domain/types";
import { requireSubstrate } from "../domain/substrates";
import { abbreviate, generateAgents, indexAbbr } from "../generation/identity";
import { brandKey, generateName, isNameSafe } from "../generation/naming/naming";
import { legacyAgentOrder, legacyName, LEGACY_AGENT_NAMES, LEGACY_TERMS } from "../generation/naming/legacy";

type Rename = readonly [from: string, to: string];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rewrite(text: string, renames: readonly Rename[]): string {
  let out = text;
  for (const [from, to] of [...renames].sort((a, b) => b[0].length - a[0].length)) {
    if (from === to) continue;
    const before = /^\w/.test(from) ? "(?<![\\w.])" : "";
    const after = /\w$/.test(from) ? "(?!\\w)" : "";
    out = out.replace(new RegExp(`${before}${escapeRegExp(from)}${after}`, "g"), to);
  }
  return out;
}

const modelOf = (name: string) => `${name.replace(/\W.*$/, "")}-1`;
const legacyAbbr = (name: string, scoreNoun: string) => `(${abbreviate(name).slice(0, 1)}${abbreviate(scoreNoun)}I)`;

/** Terms derived from a brand that history entries quote: the name, its model, and its index abbreviation. */
function brandRenames(from: string, to: string, scoreNoun: string, abbrFrom: string): Rename[] {
  return [
    [from, to],
    [modelOf(from), modelOf(to)],
    [abbrFrom, `(${indexAbbr(to, scoreNoun)})`],
  ];
}

/**
 * Gives every venture a stored, safe, portfolio-unique name. Ventures saved before names
 * were stored get the name they were displayed with when it is still acceptable. Any
 * replaced name is rewritten in every history entry that quotes it. Ids, seeds, modules,
 * and timestamps are never touched.
 */
export function migrateNames(ventures: readonly Venture[]): Venture[] {
  const order = ventures.map((_, i) => i).sort((a, b) => ventures[a]!.createdAt - ventures[b]!.createdAt || b - a);
  const taken = new Set<string>();
  const shared: Rename[] = [];
  const own = new Map<number, Rename[]>();
  const out = ventures.slice();

  for (const i of order) {
    const v = ventures[i]!;
    const substrate = requireSubstrate(v.substrateId);
    const { scoreNoun } = substrate.domain;
    const stored = v.name.trim();
    const legacy = !stored;
    const current = stored || legacyName(v.substrateId, v.seed, v.rebrands) || "";
    const keep = current && isNameSafe(current) && !taken.has(brandKey(current));
    const name = keep ? current : generateName(substrate, v.seed, v.rebrands, { taken });
    taken.add(brandKey(name));

    const renames: Rename[] = [];
    if (current && (name !== current || legacy)) {
      if (name !== current) shared.push([current, name]);
      const abbrFrom = legacy ? legacyAbbr(current, scoreNoun) : `(${indexAbbr(current, scoreNoun)})`;
      renames.push(...brandRenames(current, name, scoreNoun, abbrFrom));
    }
    if (legacy) {
      for (let r = 0; r < v.rebrands; r++) {
        const old = legacyName(v.substrateId, v.seed, r);
        if (old && !isNameSafe(old)) shared.push([old, generateName(substrate, v.seed, r)]);
      }
      renames.push(...LEGACY_TERMS);
    }
    own.set(i, renames);
    out[i] = { ...v, name };
  }

  return out.map((v, i) => {
    const renames = [...own.get(i)!, ...shared];
    const agents = ventures[i]!.name.trim() ? null : agentRenames(v);
    if (!agents && renames.every(([from, to]) => from === to)) return v;
    const events: VentureEvent[] = v.events.map((e) => ({ ...e, text: rewrite(agents ? renameAgent(e.text, agents) : e.text, renames) }));
    return { ...v, events };
  });
}

/** A seed shuffles the old and new rosters into the same positions, so each agent keeps its seat. */
function agentRenames(v: Venture): Map<string, string> {
  const current = generateAgents(requireSubstrate(v.substrateId), v.seed, LEGACY_AGENT_NAMES.length);
  return new Map(legacyAgentOrder(v.seed).map((old, k) => [old, current[k]!.name]));
}

function renameAgent(text: string, agents: Map<string, string>): string {
  return text.replace(/^(Deployed|Retired) (\w+)(?=[,.])/, (all, verb: string, agent: string) => {
    const next = agents.get(agent);
    return next ? `${verb} ${next}` : all;
  });
}

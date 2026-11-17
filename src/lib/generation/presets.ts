import { Rng } from "./rng";

const ALWAYS = ["agent", "agent", "orchestrator"] as const;
const OPTIONAL = ["reasoning", "memory", "confidence", "governance", "score", "copilot", "dashboard", "compliance", "agent", "design-partners"] as const;

/** The packaging run a fresh venture receives on the landing-page line: a launch-ready stack. */
export function packagingRun(seed: number, extras = 4): string[] {
  const rng = Rng.for(seed, "packaging-run");
  return [...ALWAYS, ...rng.shuffle([...OPTIONAL]).slice(0, extras)];
}

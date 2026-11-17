import type { Portfolio } from "../domain/types";
import { loadPortfolio, savePortfolio, STORAGE_KEY } from "./storage";

type Listener = (p: Portfolio) => void;

let state: Portfolio | null = null;
const listeners = new Set<Listener>();
let lastSaveOk = true;

export function getPortfolio(): Portfolio {
  if (state === null) {
    state = loadPortfolio();
    // Pins names chosen during migration so later generator changes cannot move them.
    if (state.ventures.length) lastSaveOk = savePortfolio(state);
  }
  return state;
}

export function commit(update: (p: Portfolio) => Portfolio): Portfolio {
  state = update(getPortfolio());
  lastSaveOk = savePortfolio(state);
  listeners.forEach((fn) => fn(state!));
  return state;
}

export function persisted(): boolean {
  return lastSaveOk;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY && e.key !== null) return;
    state = loadPortfolio();
    listeners.forEach((fn) => fn(state!));
  });
}

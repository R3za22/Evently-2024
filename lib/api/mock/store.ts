import type { Category, EventDTO, OrderDTO } from "../types";
import { CATEGORIES, seedEvents, seedOrders } from "./fixtures";

export const STORE_KEY = "evently.mock.v1";
export const FAIL_KEY = "evently.mock.fail";

export type MockState = {
  version: 1;
  signedIn: boolean;
  categories: Category[];
  events: EventDTO[];
  orders: OrderDTO[];
  seq: number;
};

let memory: MockState | null = null;

function seed(now = new Date()): MockState {
  const events = seedEvents(now);
  return { version: 1, signedIn: true, categories: [...CATEGORIES], events, orders: seedOrders(events, now), seq: 100 };
}

function ls(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function load(): MockState {
  const s = ls();
  if (s) {
    try {
      const raw = s.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MockState;
        if (parsed?.version === 1) return parsed;
      }
    } catch {
      /* corrupted -> reseed */
    }
    const fresh = seed();
    save(fresh);
    return fresh;
  }
  return (memory ??= seed());
}

export function save(state: MockState) {
  memory = state;
  const s = ls();
  if (!s) return;
  try {
    s.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* quota or blocked: keep in memory */
  }
}

export function resetMock() {
  memory = null;
  const s = ls();
  try {
    s?.removeItem(STORE_KEY);
  } catch {
    /* ignore */
  }
  return load();
}

export function nextId(state: MockState, prefix: string) {
  state.seq += 1;
  return `${prefix}${state.seq}`;
}

let latency = true;
export const setMockLatency = (on: boolean) => {
  latency = on;
};
export async function simulate(kind?: string) {
  if (latency) await new Promise((r) => setTimeout(r, 40 + Math.random() * 60));
  const s = ls();
  const fail = s?.getItem(FAIL_KEY);
  if (fail && (fail === "1" || fail === "all" || fail === kind)) throw new Error("Something went wrong on our side. Please try again.");
}

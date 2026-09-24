import { useSyncExternalStore } from "react";
import { seedIncidents, type Incident } from "./mock-data";

let state: Incident[] = [...seedIncidents];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const incidentsStore = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  add: (i: Incident) => {
    state = [i, ...state];
    emit();
  },
  updateStatus: (id: string, status: Incident["status"]) => {
    state = state.map((i) => (i.id === id ? { ...i, status } : i));
    emit();
  },
};

export function useIncidents(): Incident[] {
  return useSyncExternalStore(
    incidentsStore.subscribe,
    incidentsStore.get,
    incidentsStore.get,
  );
}

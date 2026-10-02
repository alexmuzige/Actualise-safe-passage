import { useSyncExternalStore } from "react";
import { seedIncidents, type Incident } from "./mock-data";

// ---------- Incidents ----------

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

// ---------- Connexion / synchronisation ----------

const connectedAt = Date.now();

let uptimeSeconds = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;
const uptimeListeners = new Set<() => void>();

function tick() {
  uptimeSeconds = Math.max(0, Math.floor((Date.now() - connectedAt) / 1000));
  uptimeListeners.forEach((l) => l());
}

function startTicking() {
  if (intervalId !== null) return; // déjà démarré
  tick();
  intervalId = setInterval(tick, 1000);
}

function stopTicking() {
  if (intervalId === null) return;
  clearInterval(intervalId);
  intervalId = null;
}

const uptimeStore = {
  get: () => uptimeSeconds,
  subscribe: (l: () => void) => {
    uptimeListeners.add(l);
    startTicking(); // démarre un seul timer partagé, peu importe le nb d'abonnés
    return () => {
      uptimeListeners.delete(l);
      if (uptimeListeners.size === 0) stopTicking(); // coupe le timer si plus personne n'écoute
    };
  },
};

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Durée de connexion de l'utilisateur, mise à jour chaque seconde.
 * Un seul setInterval partagé est utilisé, même si le hook est
 * appelé dans plusieurs composants simultanément.
 */
export function useConnectionUptime(): {
  seconds: number;
  formatted: string;
  connectedAt: number;
} {
  const seconds = useSyncExternalStore(
    uptimeStore.subscribe,
    uptimeStore.get,
    uptimeStore.get,
  );

  return {
    seconds,
    formatted: formatDuration(seconds),
    connectedAt,
  };
}
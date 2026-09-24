import { api } from "./client";
import { endpoints } from "./endpoints";
import { API_MOCK_MODE } from "./config";
import { incidentsStore } from "@/lib/incidents-store";
import type { Incident } from "@/lib/mock-data";

export interface IncidentQuery {
  zone?: string;
  minSev?: number;
  since?: string;
  until?: string;
  q?: string;
}

/** Liste des incidents (base de données, ou store local en mode mock). */
export async function fetchIncidents(query: IncidentQuery = {}): Promise<Incident[]> {
  if (API_MOCK_MODE) return incidentsStore.get();
  return api.get<Incident[]>(endpoints.incidents.list(query as Record<string, string | number | undefined>));
}

export async function fetchIncident(id: string): Promise<Incident | undefined> {
  if (API_MOCK_MODE) return incidentsStore.get().find((i) => i.id === id);
  return api.get<Incident>(endpoints.incidents.detail(id));
}

export async function createIncident(payload: Omit<Incident, "id">): Promise<Incident> {
  if (API_MOCK_MODE) {
    const created = { ...payload, id: `r-${Date.now().toString().slice(-4)}` } as Incident;
    incidentsStore.add(created);
    return created;
  }
  return api.post<Incident>(endpoints.incidents.create(), payload);
}

export async function verifyIncident(id: string): Promise<void> {
  if (API_MOCK_MODE) return;
  await api.post(endpoints.incidents.verify(id));
}

/** Envoi de la file hors-ligne vers la base dès que le réseau revient. */
export async function syncIncidents(queue: Incident[]): Promise<{ synced: number }> {
  if (API_MOCK_MODE) return { synced: queue.length };
  return api.post<{ synced: number }>(endpoints.incidents.sync(), { incidents: queue });
}

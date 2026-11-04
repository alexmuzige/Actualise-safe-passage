import { API_MOCK_MODE } from "./config";
import { api, ApiError } from "./client";
import { endpoints } from "./endpoints";
import { incidentsStore } from "@/lib/incidents-store";

export type ServerIncidentType = "attaque" | "enlèvement" | "route_bloquée";
export type ServerRiskLevel = 1 | 2 | 3;

export interface CreateServerIncident {
  type: ServerIncidentType;
  risk_level: ServerRiskLevel;
  location_id: number;
  description: string;
}

function unavailable(message: string): never {
  throw new ApiError(message, 501);
}

export async function fetchIncidents(): Promise<unknown> {
  if (API_MOCK_MODE) return incidentsStore.get();
  return api.get<unknown>(endpoints.incidents.list());
}

export async function fetchIncident(id: number): Promise<unknown> {
  if (API_MOCK_MODE) {
    return unavailable("La consultation d'un incident serveur nécessite une connexion.");
  }
  return api.get<unknown>(endpoints.incidents.detail(id));
}

export async function createIncident(
  payload: CreateServerIncident,
  files: File[] = [],
): Promise<unknown> {
  if (API_MOCK_MODE) {
    return unavailable("La création d'un incident serveur nécessite une connexion.");
  }
  if (files.length > 0) {
    return unavailable("Le serveur ne publie pas encore d'API de téléversement de pièces jointes.");
  }

  const body = new URLSearchParams({
    type: payload.type,
    risk_level: String(payload.risk_level),
    location_id: String(payload.location_id),
    description: payload.description,
  });
  return api.post<unknown>(endpoints.incidents.create(), body);
}

export async function verifyIncident(_id: number): Promise<void> {
  unavailable("Le serveur ne publie pas de route de vérification des incidents.");
}

export async function syncIncidents(_queue: CreateServerIncident[]): Promise<never> {
  return unavailable("Le serveur ne publie pas de route de synchronisation hors ligne.");
}

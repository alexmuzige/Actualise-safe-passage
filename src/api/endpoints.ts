import { API_BASE_URL } from "./config";

/**
 * Catalogue unique de tous les liens vers la base de données.
 * Ajoutez ici toute nouvelle route : rien d'autre ne doit contenir d'URL.
 */
export const endpoints = {
  auth: {
    login: () => `${API_BASE_URL}/login`,
    signup: () => `${API_BASE_URL}/signup`,
    logout: () => `${API_BASE_URL}/logout`,
    session: () => `${API_BASE_URL}/session`,
  },
  profile: {
    me: () => `${API_BASE_URL}/profile/me`,
    update: () => `${API_BASE_URL}/profile/me`,
  },
  incidents: {
    list: (query?: Record<string, string | number | undefined>) =>
      withQuery(`${API_BASE_URL}/incidents`, query),
    detail: (id: string) => `${API_BASE_URL}/incidents/${id}`,
    create: () => `${API_BASE_URL}/incidents`,
    update: (id: string) => `${API_BASE_URL}/incidents/${id}`,
    verify: (id: string) => `${API_BASE_URL}/incidents/${id}/verify`,
    remove: (id: string) => `${API_BASE_URL}/incidents/${id}`,
    sync: () => `${API_BASE_URL}/incidents/sync`,
  },
  zones: {
    list: () => `${API_BASE_URL}/zones`,
    detail: (id: string) => `${API_BASE_URL}/zones/${id}`,
    scores: () => `${API_BASE_URL}/zones/scores`,
  },
  itineraries: {
    list: () => `${API_BASE_URL}/itineraries`,
    detail: (id: string) => `${API_BASE_URL}/itineraries/${id}`,
    analyze: (id: string) => `${API_BASE_URL}/itineraries/${id}/analyze`,
    segments: () => `${API_BASE_URL}/segments`,
  },
  admin: {
    features: () => `${API_BASE_URL}/admin/features`,
    setFeature: () => `${API_BASE_URL}/admin/features`,
    users: () => `${API_BASE_URL}/admin/users`,
  },
  exports: {
    incidentsXlsx: () => `${API_BASE_URL}/exports/incidents.xlsx`,
    zonesXlsx: () => `${API_BASE_URL}/exports/zones.xlsx`,
    itineraryXlsx: (id: string) => `${API_BASE_URL}/exports/itineraires/${id}.xlsx`,
  },
} as const;

export function withQuery(
  url: string,
  query?: Record<string, string | number | undefined>,
): string {
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

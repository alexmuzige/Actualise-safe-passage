import { API_BASE_URL } from "./config";

/**
 * Catalogue unique de tous les liens vers la base de données.
 * Ajoutez ici toute nouvelle route : rien d'autre ne doit contenir d'URL.
 */
export const endpoints = {
  auth: {
    login: () => `${API_BASE_URL}/login`,
    forgotPassword: (username: string) =>
      withQuery(`${API_BASE_URL}/auth/forgot-password`, { username }),
    resetPassword: (token: string, newPassword: string) =>
      withQuery(`${API_BASE_URL}/auth/reset-password`, { token, new_password: newPassword }),
  },
  actors: {
    list: (query?: { q?: string; code_parent?: string; type?: string }) =>
      withQuery(`${API_BASE_URL}/actors/list`, query),
    byParentCode: (codeParent: string) =>
      withQuery(`${API_BASE_URL}/actors/type`, { code_parent: codeParent }),
    create: () => `${API_BASE_URL}/actors/create`,
    update: (id: number) => `${API_BASE_URL}/actors/update/${id}`,
    remove: (id: number) => `${API_BASE_URL}/actors/delete/${id}`,
  },
  users: {
    list: (query?: { skip?: number; limit?: number; is_active?: boolean }) =>
      withQuery(`${API_BASE_URL}/user/list`, query),
    detail: (id: number) => `${API_BASE_URL}/user/${id}`,
    create: () => `${API_BASE_URL}/user/create`,
    update: (id: number) => `${API_BASE_URL}/user/update/${id}`,
    remove: (id: number) => `${API_BASE_URL}/user/delete/${id}`,
    roles: () => `${API_BASE_URL}/user/roles`,
  },
  identity: {
    genders: () => `${API_BASE_URL}/get/sexe/list`,
  },
  profiles: {
    list: () => `${API_BASE_URL}/profiles/`,
    create: () => `${API_BASE_URL}/profiles/create`,
    detail: (id: number) => `${API_BASE_URL}/profiles/${id}`,
    byIdentity: (id: number) => `${API_BASE_URL}/profiles/identity/${id}`,
    update: (id: number) => `${API_BASE_URL}/profiles/${id}`,
    remove: (id: number) => `${API_BASE_URL}/profiles/${id}`,
  },
  incidents: {
    list: () => `${API_BASE_URL}/incidents/stream`,
    detail: (id: number) => `${API_BASE_URL}/incidents/${id}`,
    create: () => `${API_BASE_URL}/incidents/create`,
  },
  permissions: {
    list: () => `${API_BASE_URL}/permissions`,
    create: () => `${API_BASE_URL}/permissions/create`,
    detail: (id: number) => `${API_BASE_URL}/permissions/${id}`,
    update: (id: number) => `${API_BASE_URL}/permissions/${id}`,
    sync: () => `${API_BASE_URL}/permissions/sync`,
    forRole: (role: string) =>
      `${API_BASE_URL}/permissions/roles/${encodeURIComponent(role)}/permissions`,
    forUser: (id: number) => `${API_BASE_URL}/permissions/users/${id}/permissions`,
  },
  analytics: {
    train: () => `${API_BASE_URL}/analytics/train`,
    simulateInference: () => `${API_BASE_URL}/analytics/simulate-inference`,
    confirmReport: (id: number) => `${API_BASE_URL}/analytics/reports/${id}/confirm`,
    overrideReport: (id: number) => `${API_BASE_URL}/analytics/reports/${id}/override`,
  },
} as const;

export function withQuery(
  url: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

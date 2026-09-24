import { api } from "./client";
import { endpoints } from "./endpoints";
import { API_MOCK_MODE } from "./config";
import type { UserProfile } from "@/lib/profile-store";
import type { FeatureId } from "@/lib/features-store";
import type { FieldRole } from "@/lib/profile-store";

export interface Credentials {
  email: string;
  password: string;
}

export async function login(credentials: Credentials) {
  if (API_MOCK_MODE) return { ok: true as const };
  return api.post<{ ok: boolean }>(endpoints.auth.login(), credentials);
}

export async function signup(payload: Credentials & { fullName: string; organization: string }) {
  if (API_MOCK_MODE) return { ok: true as const };
  return api.post<{ ok: boolean }>(endpoints.auth.signup(), payload);
}

export async function logout() {
  if (API_MOCK_MODE) return { ok: true as const };
  return api.post<{ ok: boolean }>(endpoints.auth.logout());
}

export async function fetchMyProfile(): Promise<UserProfile | null> {
  if (API_MOCK_MODE) return null;
  return api.get<UserProfile>(endpoints.profile.me());
}

export async function saveMyProfile(patch: Partial<UserProfile>) {
  if (API_MOCK_MODE) return { ok: true as const };
  return api.patch<{ ok: boolean }>(endpoints.profile.update(), patch);
}

/** Matrice des droits gérée depuis la page /admin. */
export async function fetchFeatureMatrix() {
  if (API_MOCK_MODE) return null;
  return api.get(endpoints.admin.features());
}

export async function saveFeature(id: FeatureId, role: FieldRole, enabled: boolean) {
  if (API_MOCK_MODE) return { ok: true as const };
  return api.post<{ ok: boolean }>(endpoints.admin.setFeature(), { id, role, enabled });
}

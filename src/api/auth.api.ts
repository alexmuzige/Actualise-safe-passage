import { api } from "./client";
import { endpoints } from "./endpoints";
import { API_MOCK_MODE } from "./config";
import type { CreateUserPayload, ServerUser } from "./users.api";

export interface Credentials {
  username: string;
  password: string;
}

export async function login(credentials: Credentials) {
  if (API_MOCK_MODE) throw new Error("La connexion nécessite une connexion au serveur.");
  return api.post<unknown>(endpoints.auth.login(), credentials);
}

export async function signup(payload: CreateUserPayload) {
  if (API_MOCK_MODE) throw new Error("La création d'un compte nécessite une connexion au serveur.");
  return api.post<ServerUser>(endpoints.users.create(), payload);
}

export async function requestPasswordReset(username: string) {
  return api.post<unknown>(endpoints.auth.forgotPassword(username));
}

export async function resetPassword(token: string, newPassword: string) {
  return api.post<unknown>(endpoints.auth.resetPassword(token, newPassword));
}

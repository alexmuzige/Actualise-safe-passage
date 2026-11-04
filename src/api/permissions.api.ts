import { api } from "./client";
import { endpoints } from "./endpoints";
import { API_MOCK_MODE } from "./config";

export interface Permission {
  id: number;
  name: string;
  description: string | null;
  roles?: string[];
}

export async function fetchPermissions(): Promise<Permission[]> {
  if (API_MOCK_MODE) return [];
  return api.get<Permission[]>(endpoints.permissions.list());
}

export async function createPermission(payload: {
  name: string;
  description?: string;
}): Promise<Permission> {
  return api.post<Permission>(endpoints.permissions.create(), payload);
}

export async function updatePermission(id: number, description: string): Promise<Permission> {
  return api.patch<Permission>(endpoints.permissions.update(id), { description });
}

export async function syncPermissions(): Promise<unknown> {
  return api.post(endpoints.permissions.sync());
}

export async function setRolePermissions(role: string, permissionIds: number[]): Promise<unknown> {
  const body = new URLSearchParams();
  for (const id of permissionIds) body.append("permission_ids", String(id));
  return api.post(endpoints.permissions.forRole(role), body);
}

export async function setUserPermissions(
  userId: number,
  permissionIds: number[],
): Promise<unknown> {
  const body = new URLSearchParams();
  for (const id of permissionIds) body.append("permission_ids", String(id));
  return api.post(endpoints.permissions.forUser(userId), body);
}

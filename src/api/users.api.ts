import { api } from "./client";
import { endpoints } from "./endpoints";
import { API_MOCK_MODE } from "./config";

export type UserRole =
  "administrateur" | "analyste" | "informateur" | "agent" | "coordonateur" | "acteur";

export type Gender = "Homme" | "Femme";

export interface UserIdentity {
  id?: number;
  nom: string;
  postnom: string;
  prenom: string;
  genre?: Gender | null;
  nationalite?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ServerUser {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  identity_id: number | null;
  actor_id: number | null;
  identity?: UserIdentity | null;
  actor?: {
    id: number;
    name: string;
    organization: string | null;
  } | null;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  role: UserRole;
  is_active?: boolean;
  identity?: UserIdentity;
  actor_id?: number | null;
}

export interface UpdateUserPayload {
  identity?: Partial<UserIdentity>;
  role?: UserRole;
  is_active?: boolean;
  password?: string;
  actor_id?: number | null;
}

export interface RegistrationForm {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  surname: string;
  gender: string;
  nationality: string;
  phone: string;
  email: string;
  actorId: number | null;
  role: string;
}

const registrationRoles: Record<string, UserRole> = {
  admin: "administrateur",
  administrateur: "administrateur",
  analyst: "analyste",
  analyste: "analyste",
  informant: "informateur",
  informateur: "informateur",
  agent: "agent",
  coordinator: "coordonateur",
  coordonateur: "coordonateur",
  actor: "acteur",
  acteur: "acteur",
};

export async function registerAccount(form: RegistrationForm): Promise<ServerUser> {
  const role = registrationRoles[form.role.trim().toLowerCase()];
  if (!role) throw new Error("Le rôle sélectionné n'est pas reconnu par le serveur.");
  if (!form.actorId || !Number.isInteger(form.actorId)) {
    throw new Error("Sélectionnez une organisation dans la liste pour l'associer au compte.");
  }

  return createUser({
    username: form.username,
    password: form.password,
    role,
    actor_id: form.actorId,
    identity: {
      nom: form.lastName,
      postnom: form.surname,
      prenom: form.firstName,
      genre: form.gender === "Masculin" ? "Homme" : form.gender === "Féminin" ? "Femme" : null,
      nationalite: form.nationality,
      phone: form.phone,
      email: form.email,
    },
  });
}

export async function createUser(payload: CreateUserPayload): Promise<ServerUser> {
  if (API_MOCK_MODE) throw new Error("La création d'un compte nécessite une connexion au serveur.");
  return api.post<ServerUser>(endpoints.users.create(), payload);
}

export async function fetchUsers(
  query: { skip?: number; limit?: number; is_active?: boolean } = {},
): Promise<ServerUser[]> {
  if (API_MOCK_MODE) return [];
  return api.get<ServerUser[]>(endpoints.users.list(query));
}

export async function fetchUser(id: number): Promise<ServerUser> {
  if (API_MOCK_MODE) throw new Error("La lecture d'un compte nécessite une connexion au serveur.");
  return api.get<ServerUser>(endpoints.users.detail(id));
}

export async function resolveAuthenticatedUser(
  response: unknown,
  username: string,
): Promise<ServerUser> {
  const record = findUserRecord(response);
  const id = readNumber(record?.id ?? record?.user_id);
  if (id === null) {
    throw new Error(
      "Le serveur a accepté la connexion, mais n'a pas renvoyé l'identifiant du compte. Demandez à l'administrateur de vérifier la réponse de /api/login.",
    );
  }

  const user = await fetchUser(id);
  if (user.username !== username) {
    throw new Error(
      "L'identifiant de compte renvoyé par le serveur ne correspond pas à l'utilisateur connecté.",
    );
  }
  return user;
}

export async function updateUser(id: number, patch: UpdateUserPayload): Promise<ServerUser> {
  return api.put<ServerUser>(endpoints.users.update(id), patch);
}

export async function saveUserIdentity(
  user: ServerUser,
  identity: Pick<UserIdentity, "nom" | "postnom" | "prenom">,
): Promise<ServerUser> {
  const updated = await updateUser(user.id, {
    identity: { ...user.identity, ...identity },
  });
  return {
    ...user,
    ...updated,
    identity: updated.identity ?? { ...user.identity, ...identity },
    actor: updated.actor ?? user.actor,
  };
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(endpoints.users.remove(id));
}

export async function fetchUserRoles(): Promise<UserRole[]> {
  if (API_MOCK_MODE) {
    return ["administrateur", "analyste", "informateur", "agent", "coordonateur", "acteur"];
  }
  return api.get<UserRole[]>(endpoints.users.roles());
}

export async function fetchGenders(): Promise<Gender[]> {
  if (API_MOCK_MODE) return ["Homme", "Femme"];
  return api.get<Gender[]>(endpoints.identity.genders());
}

function findUserRecord(value: unknown, depth = 0): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || depth > 3) return null;
  if (Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  if (readNumber(record.id ?? record.user_id) !== null) return record;

  for (const key of ["user", "account", "data", "result"]) {
    const nested = findUserRecord(record[key], depth + 1);
    if (nested) return nested;
  }
  return null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

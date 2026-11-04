import { api } from "./client";
import { endpoints } from "./endpoints";
import { API_MOCK_MODE } from "./config";

export type ActorType = "humanitaire" | "agence_voyage" | "privé";

export interface Actor {
  id: number;
  name: string;
  type: ActorType;
  organization: string | null;
  location_id: number | null;
  code_parent: string | null;
  logo: string | null;
}

export interface ActorQuery {
  q?: string;
  code_parent?: string;
  type?: ActorType;
}

export async function searchActors(query: ActorQuery): Promise<Actor[]> {
  if (API_MOCK_MODE) return [];
  return api.get<Actor[]>(endpoints.actors.list(query));
}

export async function fetchActorsByParentCode(codeParent: string): Promise<Actor> {
  if (API_MOCK_MODE) throw new Error("La recherche d'acteurs nécessite une connexion au serveur.");
  return api.get<Actor>(endpoints.actors.byParentCode(codeParent));
}

export type CreateActorPayload = Pick<Actor, "name" | "type"> &
  Partial<Pick<Actor, "organization" | "location_id" | "logo">>;

export async function createActor(payload: CreateActorPayload): Promise<Actor> {
  return api.post<Actor>(endpoints.actors.create(), payload);
}

export async function updateActor(id: number, patch: Partial<CreateActorPayload>): Promise<Actor> {
  return api.put<Actor>(endpoints.actors.update(id), patch);
}

export async function deleteActor(id: number): Promise<void> {
  await api.delete(endpoints.actors.remove(id));
}

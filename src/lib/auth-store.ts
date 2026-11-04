import { useSyncExternalStore } from "react";
import type { ServerUser } from "@/api/users.api";

const KEY = "humasafe-authenticated-user-v1";

let currentUser: ServerUser | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  const raw = localStorage.getItem(KEY);
  if (!raw) return;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      Number.isInteger((parsed as ServerUser).id) &&
      typeof (parsed as ServerUser).username === "string"
    ) {
      currentUser = parsed as ServerUser;
    } else {
      throw new Error("Données de session invalides.");
    }
  } catch (error) {
    console.error("Impossible de restaurer la session HUMASAFE depuis le stockage local.", error);
    localStorage.removeItem(KEY);
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

export const authStore = {
  get: () => {
    hydrate();
    return currentUser;
  },
  subscribe: (listener: () => void) => {
    hydrate();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setUser: (user: ServerUser) => {
    currentUser = user;
    localStorage.setItem(KEY, JSON.stringify(user));
    emit();
  },
  logout: () => {
    currentUser = null;
    localStorage.removeItem(KEY);
    emit();
  },
};

export function useAuth(): ServerUser | null {
  return useSyncExternalStore(authStore.subscribe, authStore.get, () => null);
}

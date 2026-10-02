import { useSyncExternalStore } from "react";

export type User = {
  name: string;
  role: string;
  email: string;
  initials: string;
};

const DEFAULT_USER: User = {
  name: "Utilisateur",
  role: "Agent terrain",
  email: "utilisateur@humasafe.org",
  initials: "U",
};

// Toujours un utilisateur valide par défaut : évite un écran vide
// si le store n'a pas encore été initialisé avec de vraies données.
let currentUser: User = { ...DEFAULT_USER };

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const authStore = {
  get: () => currentUser,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  updateProfile: (patch: Partial<User>) => {
    currentUser = { ...currentUser, ...patch };
    emit();
  },
  logout: () => {
    // Réinitialise sur l'utilisateur par défaut plutôt que null,
    // pour ne jamais casser l'affichage de la sidebar.
    currentUser = { ...DEFAULT_USER };
    emit();
    // TODO: brancher votre vraie déconnexion, ex:
    // await fetch("/api/logout", { method: "POST" });
  },
};

export function useAuth(): User {
  return useSyncExternalStore(
    authStore.subscribe,
    authStore.get,
    authStore.get,
  );
}
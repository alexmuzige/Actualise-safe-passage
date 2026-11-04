import { useSyncExternalStore } from "react";
import { authStore } from "./auth-store";
import { healthZones } from "./mock-data";
import type { ServerUser, UserRole } from "@/api/users.api";

export type FieldRole =
  | "analyste"
  | "coordinateur"
  | "informateur"
  | "logisticien"
  | "medecin"
  | "securite"
  | "administrateur"
  | "agent"
  | "acteur"
  | "coordonateur";

export const ROLE_LABEL: Record<FieldRole, string> = {
  analyste: "Analyste",
  coordinateur: "Coordinateur",
  informateur: "Informateur terrain",
  logisticien: "Logisticien",
  medecin: "Médecin / MedCoord",
  securite: "Officier sécurité",
  administrateur: "Administrateur",
  agent: "Agent",
  acteur: "Acteur",
  coordonateur: "Coordonnateur",
};

export type AlertChannel = "sms" | "email" | "radio" | "push";

export const CHANNEL_LABEL: Record<AlertChannel, string> = {
  sms: "SMS",
  email: "E-mail",
  radio: "Radio HF",
  push: "Notification app",
};

export interface UserProfile {
  fullName: string;
  initials: string;
  avatarColor: string;
  avatarImage: string | null;
  organization: string;
  role: FieldRole;
  baseCity: string;
  territory: string;
  zoneIds: string[];
  language: "fr" | "en" | "sw";
  offlineFirst: boolean;
  alertChannels: AlertChannel[];
  minAlertSeverity: 1 | 2 | 3 | 4 | 5;
}

const KEY = "humasafe-profile-v1";
type LocalPreferences = Pick<
  UserProfile,
  | "avatarColor"
  | "avatarImage"
  | "baseCity"
  | "territory"
  | "zoneIds"
  | "language"
  | "offlineFirst"
  | "alertChannels"
  | "minAlertSeverity"
>;

const defaultPreferences: LocalPreferences = {
  avatarColor: "#f59e0b",
  avatarImage: null,
  baseCity: "Goma",
  territory: "Nyiragongo",
  zoneIds: healthZones.slice(0, 3).map((zone) => zone.id),
  language: "fr",
  offlineFirst: true,
  alertChannels: ["push", "sms"],
  minAlertSeverity: 3,
};

function emptyProfile(): UserProfile {
  return {
    fullName: "Utilisateur",
    initials: "U",
    organization: "",
    role: "analyste",
    ...defaultPreferences,
  };
}

const anonymousProfile = emptyProfile();

function roleFromServer(role: UserRole): FieldRole {
  return role;
}

function accountKey(userId: number) {
  return `${KEY}:${userId}`;
}

function readPreferences(userId: number): Partial<UserProfile> {
  const raw = localStorage.getItem(accountKey(userId));
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("Préférences de profil invalides.");
    const preferences = parsed as Partial<UserProfile>;
    const avatarImage = preferences.avatarImage;
    return {
      ...preferences,
      avatarImage:
        typeof avatarImage === "string" &&
        avatarImage.length <= 750_000 &&
        /^data:image\/(?:png|jpeg|webp);base64,/.test(avatarImage)
          ? avatarImage
          : null,
    };
  } catch (error) {
    console.error("Impossible de restaurer les préférences HUMASAFE.", error);
    localStorage.removeItem(accountKey(userId));
    return {};
  }
}

function profileFromUser(user: ServerUser, preferences: Partial<UserProfile> = {}): UserProfile {
  const identity = user.identity;
  const identityName = identity
    ? [identity.prenom, identity.postnom, identity.nom].filter(Boolean).join(" ")
    : "";
  const fullName = identityName || user.username;
  const initials = computeInitials(fullName);
  return {
    ...emptyProfile(),
    ...preferences,
    fullName,
    initials,
    organization: user.actor?.organization || user.actor?.name || "",
    role: roleFromServer(user.role),
  };
}

let current: UserProfile = emptyProfile();
let activeUserId: number | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function hydrateForCurrentUser() {
  const user = authStore.get();
  const userId = user?.id ?? null;
  if (userId === activeUserId) return;

  activeUserId = userId;
  if (!user) {
    current = emptyProfile();
    return;
  }

  current = profileFromUser(user, readPreferences(user.id));
}

export function syncProfileFromServer(user: ServerUser) {
  authStore.setUser(user);
  activeUserId = user.id;
  current = profileFromUser(user, readPreferences(user.id));
  emit();
}

export function updateProfile(patch: Partial<UserProfile>) {
  hydrateForCurrentUser();
  const updated = { ...current, ...patch };
  if (patch.fullName) updated.initials = computeInitials(patch.fullName);

  const userId = authStore.get()?.id;
  if (userId !== undefined) {
    const {
      avatarColor,
      avatarImage,
      baseCity,
      territory,
      zoneIds,
      language,
      offlineFirst,
      alertChannels,
      minAlertSeverity,
    } = current;
    localStorage.setItem(
      accountKey(userId),
      JSON.stringify({
        avatarColor,
        avatarImage,
        baseCity,
        territory,
        zoneIds,
        language,
        offlineFirst,
        alertChannels,
        minAlertSeverity,
      }),
    );
  }
  current = updated;
  emit();
}

export function resetProfile() {
  const user = authStore.get();
  if (user) {
    localStorage.removeItem(accountKey(user.id));
    activeUserId = user.id;
    current = profileFromUser(user);
  } else {
    current = emptyProfile();
  }
  emit();
}

export function useProfile(): UserProfile {
  hydrateForCurrentUser();
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => anonymousProfile,
  );
}

export function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

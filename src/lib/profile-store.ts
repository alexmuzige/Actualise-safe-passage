import { useSyncExternalStore } from "react";
import { healthZones } from "./mock-data";

export type FieldRole =
  | "analyste"
  | "coordinateur"
  | "informateur"
  | "logisticien"
  | "medecin"
  | "securite";

export const ROLE_LABEL: Record<FieldRole, string> = {
  analyste: "Analyste",
  coordinateur: "Coordinateur",
  informateur: "Informateur terrain",
  logisticien: "Logisticien",
  medecin: "Médecin / MedCoord",
  securite: "Officier sécurité",
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

const defaultProfile: UserProfile = {
  fullName: "Analyste Kivu",
  initials: "AK",
  avatarColor: "#f59e0b",
  organization: "Cellule Coordination Humanitaire",
  role: "analyste",
  baseCity: "Goma",
  territory: "Nyiragongo",
  zoneIds: healthZones.slice(0, 3).map((z) => z.id),
  language: "fr",
  offlineFirst: true,
  alertChannels: ["push", "sms"],
  minAlertSeverity: 3,
};

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

let current: UserProfile = defaultProfile;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) current = { ...defaultProfile, ...JSON.parse(raw) };
  } catch {}
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {}
}

function emit() {
  listeners.forEach((l) => l());
}

export function updateProfile(patch: Partial<UserProfile>) {
  current = { ...current, ...patch };
  if (patch.fullName) current.initials = computeInitials(patch.fullName);
  persist();
  emit();
}

export function resetProfile() {
  current = defaultProfile;
  persist();
  emit();
}

export function useProfile(): UserProfile {
  hydrate();
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => defaultProfile,
  );
}

export { computeInitials };

import { useSyncExternalStore } from "react";

export type AnnouncementKind = "info" | "alerte" | "actualite";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  kind: AnnouncementKind;
  date: string; // ISO date (yyyy-mm-dd)
  published: boolean;
  /** Health zone id ("" = toutes les zones) */
  zoneId?: string;
}

export const KIND_LABEL: Record<AnnouncementKind, { fr: string; en: string }> = {
  info: { fr: "Information", en: "Information" },
  alerte: { fr: "Alerte", en: "Alert" },
  actualite: { fr: "Actualité", en: "News" },
};

export const KIND_COLOR: Record<AnnouncementKind, string> = {
  info: "var(--primary)",
  alerte: "var(--risk-critical)",
  actualite: "var(--risk-moderate)",
};

const defaults: Announcement[] = [
  {
    id: "a1",
    title: "Axe Rugari — Rutshuru sous surveillance renforcée",
    body: "Trois signaux critiques enregistrés en 48 h. Déviation recommandée par Kibumba jusqu'à nouvel ordre.",
    kind: "alerte",
    date: "2026-08-03",
    published: true,
    zoneId: "rut",
  },
  {
    id: "a2",
    title: "Nouvelle aire de santé intégrée à la cartographie",
    body: "L'aire de Kanyaruchinya est désormais encadrée sur la carte OpenStreetMap avec historique de risque.",
    kind: "actualite",
    date: "2026-08-01",
    published: true,
    zoneId: "gom",
  },
  {
    id: "a3",
    title: "Briefing hebdomadaire des informateurs",
    body: "Point de situation chaque lundi à 09h00 (heure de Goma) — participation en ligne possible.",
    kind: "info",
    date: "2026-07-28",
    published: true,
    zoneId: "",
  },
];

const KEY = "sitrep-nk-announcements-v1";

let current: Announcement[] = defaults;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Announcement[];
      if (Array.isArray(parsed)) current = parsed;
    }
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

function commit(next: Announcement[]) {
  current = next;
  persist();
  emit();
}

export function addAnnouncement(a: Omit<Announcement, "id">) {
  commit([{ ...a, id: `a-${Date.now().toString(36)}` }, ...current]);
}

export function updateAnnouncement(id: string, patch: Partial<Announcement>) {
  commit(current.map((a) => (a.id === id ? { ...a, ...patch } : a)));
}

export function removeAnnouncement(id: string) {
  commit(current.filter((a) => a.id !== id));
}

/** Move an announcement to a new index (drag & drop reordering). */
export function reorderAnnouncements(fromId: string, toId: string) {
  if (fromId === toId) return;
  const next = [...current];
  const from = next.findIndex((a) => a.id === fromId);
  const to = next.findIndex((a) => a.id === toId);
  if (from < 0 || to < 0) return;
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  commit(next);
}

export function resetAnnouncements() {
  commit(defaults);
}


export function useAnnouncements(): Announcement[] {
  hydrate();
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => defaults,
  );
}

export function usePublishedAnnouncements(): Announcement[] {
  return useAnnouncements().filter((a) => a.published);
}

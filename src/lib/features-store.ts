import { useSyncExternalStore } from "react";
import { useProfile, type FieldRole, ROLE_LABEL } from "./profile-store";

export type FeatureId =
  | "export_csv"
  | "export_excel"
  | "new_report"
  | "share_filters"
  | "map_filters"
  | "profile_edit";

export interface FeatureMeta {
  id: FeatureId;
  label: string;
  description: string;
  scope: string;
}

export const FEATURES: FeatureMeta[] = [
  {
    id: "export_csv",
    label: "Export CSV",
    description: "Télécharger l'historique des incidents au format CSV.",
    scope: "Incidents",
  },
  {
    id: "export_excel",
    label: "Export Excel",
    description: "Générer les classeurs .xlsx (incidents, zones, itinéraires).",
    scope: "Incidents · Zones · Itinéraires",
  },
  {
    id: "new_report",
    label: "Soumission de rapport",
    description: "Créer et envoyer un nouveau rapport terrain.",
    scope: "Nouveau rapport",
  },
  {
    id: "share_filters",
    label: "Partage de lien filtré",
    description: "Copier l'URL du tableau de bord avec les filtres actifs.",
    scope: "Tableau de bord",
  },
  {
    id: "map_filters",
    label: "Filtres carte",
    description: "Filtrer les pointages par zone, sévérité et période.",
    scope: "Tableau de bord",
  },
  {
    id: "profile_edit",
    label: "Édition du profil",
    description: "Modifier identité, zones d'affectation et préférences.",
    scope: "Profil",
  },
];

export const ROLES: FieldRole[] = [
  "analyste",
  "coordinateur",
  "informateur",
  "logisticien",
  "medecin",
  "securite",
];

export { ROLE_LABEL };

/** Le rôle qui dispose du panneau d'administration. */
export const SUPER_ADMIN_ROLE: FieldRole = "coordinateur";

export type FeatureMatrix = Record<FeatureId, Record<FieldRole, boolean>>;

function buildDefaults(): FeatureMatrix {
  const all = (v: boolean) =>
    Object.fromEntries(ROLES.map((r) => [r, v])) as Record<FieldRole, boolean>;

  const matrix = Object.fromEntries(
    FEATURES.map((f) => [f.id, all(true)]),
  ) as FeatureMatrix;

  // Valeurs par défaut plus restrictives pour les rôles terrain.
  matrix.export_csv.informateur = false;
  matrix.export_excel.informateur = false;
  matrix.export_excel.medecin = false;
  matrix.share_filters.informateur = false;
  return matrix;
}

const KEY = "sitrep-nk-features-v1";
const defaults = buildDefaults();

let current: FeatureMatrix = defaults;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FeatureMatrix>;
      const merged = buildDefaults();
      for (const f of FEATURES) {
        const row = parsed[f.id];
        if (row) merged[f.id] = { ...merged[f.id], ...row };
      }
      current = merged;
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

export function setFeature(id: FeatureId, role: FieldRole, enabled: boolean) {
  current = { ...current, [id]: { ...current[id], [role]: enabled } };
  persist();
  emit();
}

export function setFeatureForAll(id: FeatureId, enabled: boolean) {
  current = {
    ...current,
    [id]: Object.fromEntries(ROLES.map((r) => [r, enabled])) as Record<FieldRole, boolean>,
  };
  persist();
  emit();
}

export function resetFeatures() {
  current = buildDefaults();
  persist();
  emit();
}

export function useFeatureMatrix(): FeatureMatrix {
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

/** Le bouton est-il activé pour l'utilisateur courant ? */
export function useFeature(id: FeatureId): boolean {
  const matrix = useFeatureMatrix();
  const profile = useProfile();
  return matrix[id]?.[profile.role] ?? true;
}

export function useIsSuperAdmin(): boolean {
  const profile = useProfile();
  return profile.role === SUPER_ADMIN_ROLE;
}

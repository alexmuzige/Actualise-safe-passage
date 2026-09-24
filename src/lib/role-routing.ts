import { ADMIN_CONSOLE_URL } from "../api/config";

/** Routes internes de l'application vers lesquelles un rôle peut être redirigé. */
export type InternalRoute = "/role" | "/dashboard";

/** Cible de redirection après authentification. */
export type PostLoginTarget =
  { kind: "internal"; to: InternalRoute } | { kind: "external"; url: string };

/** Espace de repli quand le rôle est absent ou inconnu : l'utilisateur verse ses rapports. */
const DEFAULT_INTERNAL_ROUTE: InternalRoute = "/role";

/** Gestion globale du système — console d'administration déployée séparément. */
const ADMIN_KEYWORDS = ["admin", "administrat", "sysadmin", "superuser", "super-user", "root"];

/** Traitement et évaluation des risques — tableaux de bord et indicateurs. */
const DASHBOARD_KEYWORDS = [
  "analyst",
  "analyste",
  "analytics",
  "coordinator",
  "coordinat",
  "coordonn",
  "coord",
];

/** Saisie et consultation terrain — référentiel de documents et rapports. */
const STORAGE_KEYWORDS = [
  "informant",
  "informateur",
  "informator",
  "informatrice",
  "actor",
  "acteur",
  "logist",
  "medecin",
  "medcoord",
  "securit",
  "security",
  "safety",
];

/**
 * Normalise un rôle renvoyé par l'API (ou saisi localement) pour le comparer :
 * minuscules, accents retirés, espaces et séparateurs unifiés.
 */
function normalizeRole(role?: string | null): string {
  return (role ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}

function matchesAnyKeyword(normalizedRole: string, keywords: string[]): boolean {
  return keywords.some((keyword) => normalizedRole.includes(keyword));
}

/**
 * Détermine l'espace de destination d'un utilisateur à partir de son rôle.
 *
 * Les rôles sont reconnus dans leurs libellés français et anglais, avec ou sans
 * accents, afin de rester compatibles avec les valeurs renvoyées par le backend.
 */
export function resolvePostLoginTarget(role?: string | null): PostLoginTarget {
  const normalizedRole = normalizeRole(role);

  if (!normalizedRole) return { kind: "internal", to: DEFAULT_INTERNAL_ROUTE };

  if (matchesAnyKeyword(normalizedRole, ADMIN_KEYWORDS)) {
    return { kind: "external", url: ADMIN_CONSOLE_URL };
  }

  if (matchesAnyKeyword(normalizedRole, DASHBOARD_KEYWORDS)) {
    return { kind: "internal", to: "/dashboard" };
  }

  if (matchesAnyKeyword(normalizedRole, STORAGE_KEYWORDS)) {
    return { kind: "internal", to: "/role" };
  }

  return { kind: "internal", to: DEFAULT_INTERNAL_ROUTE };
}

/**
 * Extrait le rôle d'une réponse d'authentification.
 *
 * Le backend peut renvoyer `{ role }` ou `{ user: { role } }` selon la version.
 */
export function extractRoleFromAuthResponse(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  const directRole = record["role"];
  if (typeof directRole === "string" && directRole.trim()) return directRole;

  const user = record["user"];
  if (user && typeof user === "object") {
    const nestedRole = (user as Record<string, unknown>)["role"];
    if (typeof nestedRole === "string" && nestedRole.trim()) return nestedRole;
  }

  return null;
}

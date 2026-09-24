/**
 * Configuration centrale de l'accès à la base de données / API.
 *
 * En front-only, tout passe par `VITE_API_BASE_URL`. Quand le backend
 * (Lovable Cloud) sera branché, il suffira de changer cette valeur —
 * aucun composant ne connaît d'URL en dur.
 */

/** Serveur backend par défaut (surchargable via `VITE_API_BASE_URL`). */
//export const DEFAULT_API_BASE_URL = "https://safe-passage-navigator-1.onrender.com/api/";
export const DEFAULT_API_BASE_URL = "http://192.168.1.77:8000/api/";
export const API_BASE_URL: string = (
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? DEFAULT_API_BASE_URL
).replace(/\/$/, "");

/** Console d'administration par défaut (surchargable via `VITE_ADMIN_CONSOLE_URL`). */
//export const DEFAULT_ADMIN_CONSOLE_URL = "https://safe-passage-navigator-1.onrender.com/admin/";
export const DEFAULT_ADMIN_CONSOLE_URL = "http://192.168.1.77:8000/admin/";

/** Console d'administration où sont redirigés les comptes disposant du rôle « admin ». */
export const ADMIN_CONSOLE_URL: string =
  (import.meta.env["VITE_ADMIN_CONSOLE_URL"] as string | undefined) ?? DEFAULT_ADMIN_CONSOLE_URL;

/** Délai maximum d'une requête (ms) — terrain = réseau instable. */
export const API_TIMEOUT_MS = 12_000;

/** Nombre de tentatives en cas d'échec réseau (mode offline-first). */
export const API_RETRIES = 2;

/** false : un backend réel est configuré, les appels partent vers `API_BASE_URL`. */
export const API_MOCK_MODE = !API_BASE_URL;

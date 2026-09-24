/**
 * Lecture défensive des réponses de l'API d'authentification.
 *
 * Le backend peut renvoyer un corps JSON, du texte brut ou rien du tout
 * (204, erreur de proxy, coupure réseau) : aucune de ces formes ne doit
 * provoquer d'exception côté client.
 */

/** Récupère le corps JSON d'une réponse sans jamais lever d'exception. */
export async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

/** Extrait le message d'erreur renvoyé par l'API (`message`, `detail` ou `error`). */
export function getApiMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  for (const key of ["message", "detail", "error"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  return null;
}

import { API_RETRIES, API_TIMEOUT_MS } from "./config";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  retries?: number;
  timeoutMs?: number;
}

/** Client HTTP unique : timeout, retry réseau, erreurs typées. */
export async function apiFetch<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { body, retries = API_RETRIES, timeoutMs = API_TIMEOUT_MS, headers, ...rest } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...rest,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(headers ?? {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new ApiError(text || `Requête échouée (${res.status})`, res.status);
      }
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      // Pas de retry sur une erreur applicative (4xx).
      if (err instanceof ApiError && err.status < 500) break;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new ApiError("Base de données injoignable", 0);
}

export const api = {
  get: <T>(url: string, o?: RequestOptions) => apiFetch<T>(url, { ...o, method: "GET" }),
  post: <T>(url: string, body?: unknown, o?: RequestOptions) =>
    apiFetch<T>(url, { ...o, method: "POST", body }),
  patch: <T>(url: string, body?: unknown, o?: RequestOptions) =>
    apiFetch<T>(url, { ...o, method: "PATCH", body }),
  delete: <T>(url: string, o?: RequestOptions) => apiFetch<T>(url, { ...o, method: "DELETE" }),
};

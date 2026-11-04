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
  const { body, retries, timeoutMs = API_TIMEOUT_MS, headers, method = "GET", ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isUrlEncoded = body instanceof URLSearchParams;
  const requestBody: BodyInit | undefined =
    body === undefined ? undefined : isFormData || isUrlEncoded ? body : JSON.stringify(body);
  const retryCount =
    retries ?? (["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase()) ? API_RETRIES : 0);

  let lastError: unknown;
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...rest,
        method,
        signal: controller.signal,
        credentials: rest.credentials ?? "include",
        headers: {
          ...(!isFormData && !isUrlEncoded ? { "Content-Type": "application/json" } : {}),
          ...(headers ?? {}),
        },
        ...(requestBody !== undefined ? { body: requestBody } : {}),
      });

      if (!res.ok) {
        const text = await res.text();
        let message = text;
        try {
          const body = JSON.parse(text) as Record<string, unknown>;
          const detail = body.detail ?? body.message ?? body.error;
          if (typeof detail === "string") message = detail;
        } catch {
          // Keep the response text when the server does not return JSON.
        }
        throw new ApiError(message || `Requête échouée (${res.status})`, res.status);
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
  throw lastError instanceof Error ? lastError : new ApiError("Base de données injoignable", 0);
}

export const api = {
  get: <T>(url: string, o?: RequestOptions) => apiFetch<T>(url, { ...o, method: "GET" }),
  post: <T>(url: string, body?: unknown, o?: RequestOptions) =>
    apiFetch<T>(url, { ...o, method: "POST", body }),
  put: <T>(url: string, body?: unknown, o?: RequestOptions) =>
    apiFetch<T>(url, { ...o, method: "PUT", body }),
  patch: <T>(url: string, body?: unknown, o?: RequestOptions) =>
    apiFetch<T>(url, { ...o, method: "PATCH", body }),
  delete: <T>(url: string, o?: RequestOptions) => apiFetch<T>(url, { ...o, method: "DELETE" }),
};

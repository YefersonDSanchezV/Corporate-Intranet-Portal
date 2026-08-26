const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";
const DEFAULT_TIMEOUT_MS = 8000;
const PROBE_TIMEOUT_MS = 2500;

export const TOKEN_KEY = "intranet_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage no disponible
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage no disponible
  }
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearToken();
        window.dispatchEvent(new CustomEvent("auth:expired"));
      }
      let message = `HTTP ${response.status}`;
      try {
        const data = await response.json();
        message = data?.message || data?.error || message;
      } catch {
        // Respuesta sin cuerpo JSON
      }
      throw new ApiError(message, response.status);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const message =
      error instanceof DOMException && error.name === "AbortError"
        ? "La solicitud superó el tiempo máximo de espera"
        : "No se pudo conectar con el servidor";
    throw new ApiError(message, 0);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getJSON<T>(path: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  return apiFetch<T>(path, { timeoutMs });
}

export async function apiAvailable(timeoutMs = PROBE_TIMEOUT_MS): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE}/modules`, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
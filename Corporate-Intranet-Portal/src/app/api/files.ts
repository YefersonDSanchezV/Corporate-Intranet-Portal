import { apiFetch, getToken } from "./client";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

export const filesApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(`${API_BASE}/files`, { method: "POST", headers, body: form });
  },
  download: (id: string) => {
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(`${API_BASE}/files/${id}`, { headers });
  },
  remove: (id: string) => apiFetch<void>(`/files/${id}`, { method: "DELETE" }),
};
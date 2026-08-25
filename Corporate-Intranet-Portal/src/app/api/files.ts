import { apiFetch } from "./client";

const API_BASE = "/api";

export const filesApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API_BASE}/files`, { method: "POST", body: form });
  },
  download: (id: string) => fetch(`${API_BASE}/files/${id}`),
  remove: (id: string) => apiFetch<void>(`/files/${id}`, { method: "DELETE" }),
};
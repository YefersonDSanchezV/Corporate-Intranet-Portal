import { apiFetch } from "./client";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

export interface MuroMensaje {
  oid: number;
  autorOid: number | null;
  autorNombre: string;
  texto: string;
  fecha: string;
}

export interface MuroReporte {
  oid: number;
  fechaDia: string;
  totalMensajes: number;
  archivoOid: number | null;
  archivoNombre: string | null;
  fechaCreacion: string;
}

export const muroApi = {
  ultimos: () => apiFetch<MuroMensaje[]>("/muro/mensajes"),
  anteriores: (antesDeOid: number) =>
    apiFetch<MuroMensaje[]>(`/muro/mensajes?antesDeOid=${antesDeOid}`),
  nuevos: (desdeOid: number) =>
    apiFetch<MuroMensaje[]>(`/muro/mensajes/nuevos?desdeOid=${desdeOid}`),
  publicar: (texto: string, nombre?: string) =>
    apiFetch<MuroMensaje>("/muro/mensajes", { method: "POST", body: { texto, nombre: nombre ?? null } }),
  eliminar: (oid: number) => apiFetch<void>(`/muro/mensajes/${oid}`, { method: "DELETE" }),
  reportes: () => apiFetch<MuroReporte[]>("/muro/reportes"),
  streamUrl: () => `${API_BASE}/muro/stream`,
};

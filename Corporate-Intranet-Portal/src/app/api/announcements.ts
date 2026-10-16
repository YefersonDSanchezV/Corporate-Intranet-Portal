import type { Announcement } from "../contexts/AnnouncementsContext";
import { apiFetch } from "./client";
import {
  mapAnuncioToFE,
  mapAnuncioHistoryToFE,
  type BackendAnuncioResponse,
  type BackendAnuncioHistoryResponse,
} from "./mappers";
import { format } from "date-fns";

export interface AnnouncementType { id: string; name: string; }

export const announcementsApi = {
  list: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const data = await apiFetch<BackendAnuncioResponse[]>(`/announcements${query}`);
    return data.map(mapAnuncioToFE);
  },
  create: async (announcement: Omit<Announcement, "id" | "published" | "createdAt" | "codigo">, creadorOid?: string | number | null) => {
    const body: any = { titulo: announcement.title, descripcion: announcement.description, tipoOid: 1, fechaInicio: format(announcement.startDate, "yyyy-MM-dd'T'HH:mm:ss"), fechaFin: format(announcement.endDate, "yyyy-MM-dd'T'HH:mm:ss"), areaInforma: (announcement as any).areaInforma || null };
    const query = creadorOid ? `?creadorOid=${encodeURIComponent(String(creadorOid))}` : "";
    const dto = await apiFetch<BackendAnuncioResponse>(`/announcements${query}`, { method: "POST", body });
    return mapAnuncioToFE(dto);
  },
  update: async (id: string, updates: Partial<Announcement>) => {
    const body: Record<string, unknown> = {};
    if (updates.title) body.titulo = updates.title;
    if (updates.description !== undefined) body.descripcion = updates.description;
    if ((updates as any).areaInforma !== undefined) body.areaInforma = (updates as any).areaInforma;
    if (updates.startDate) body.fechaInicio = format(updates.startDate as Date, "yyyy-MM-dd'T'HH:mm:ss");
    if (updates.endDate) body.fechaFin = format(updates.endDate as Date, "yyyy-MM-dd'T'HH:mm:ss");
    // mantener tipoOid requerido por backend
    (body as any).tipoOid = 1;
    const dto = await apiFetch<BackendAnuncioResponse>(`/announcements/${id}`, { method: "PUT", body });
    return mapAnuncioToFE(dto);
  },
  remove: (id: string) => apiFetch<void>(`/announcements/${id}`, { method: "DELETE" }),
  publish: (id: string) => apiFetch<BackendAnuncioResponse>(`/announcements/${id}/publish`, { method: "POST" }),
  reject: (id: string, observation: string) => apiFetch<BackendAnuncioResponse>(`/announcements/${id}/reject`, { method: "POST", body: { observation } }),
  types: () => apiFetch<AnnouncementType[]>("/announcement-types"),
  history: async (id: string) => {
    const data = await apiFetch<BackendAnuncioHistoryResponse[]>(`/announcements/${id}/history`);
    return data.map(mapAnuncioHistoryToFE);
  },
};
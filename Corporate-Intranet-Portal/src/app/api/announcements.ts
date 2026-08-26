import type { Announcement } from "../contexts/AnnouncementsContext";
import { apiFetch } from "./client";
import { mapAnuncioToFE, type BackendAnuncioResponse } from "./mappers";

export interface AnnouncementType { id: string; name: string; }

export const announcementsApi = {
  list: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const data = await apiFetch<BackendAnuncioResponse[]>(`/announcements${query}`);
    return data.map(mapAnuncioToFE);
  },
  create: async (announcement: Omit<Announcement, "id" | "published" | "createdAt">) => {
    const body = { titulo: announcement.title, descripcion: announcement.description, tipoOid: 1, fechaInicio: announcement.startDate.toISOString(), fechaFin: announcement.endDate.toISOString() };
    const dto = await apiFetch<BackendAnuncioResponse>("/announcements", { method: "POST", body });
    return mapAnuncioToFE(dto);
  },
  update: async (id: string, updates: Partial<Announcement>) => {
    const body: Record<string, unknown> = {};
    if (updates.title) body.titulo = updates.title;
    if (updates.description) body.descripcion = updates.description;
    if (updates.startDate) body.fechaInicio = (updates.startDate as Date).toISOString();
    if (updates.endDate) body.fechaFin = (updates.endDate as Date).toISOString();
    const dto = await apiFetch<BackendAnuncioResponse>(`/announcements/${id}`, { method: "PUT", body });
    return mapAnuncioToFE(dto);
  },
  remove: (id: string) => apiFetch<void>(`/announcements/${id}`, { method: "DELETE" }),
  publish: (id: string) => apiFetch<void>(`/announcements/${id}/publish`, { method: "POST" }),
  types: () => apiFetch<AnnouncementType[]>("/announcement-types"),
};
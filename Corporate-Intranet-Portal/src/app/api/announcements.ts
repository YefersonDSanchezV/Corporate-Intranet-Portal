import type { Announcement } from "../contexts/AnnouncementsContext";
import { apiFetch } from "./client";

export interface AnnouncementType {
  id: string;
  name: string;
}

export const announcementsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiFetch<Announcement[]>(`/announcements${query}`);
  },
  create: (announcement: Omit<Announcement, "id" | "published" | "createdAt">) =>
    apiFetch<Announcement>("/announcements", { method: "POST", body: announcement }),
  update: (id: string, updates: Partial<Announcement>) =>
    apiFetch<Announcement>(`/announcements/${id}`, { method: "PUT", body: updates }),
  remove: (id: string) => apiFetch<void>(`/announcements/${id}`, { method: "DELETE" }),
  publish: (id: string) => apiFetch<void>(`/announcements/${id}/publish`, { method: "POST" }),
  types: () => apiFetch<AnnouncementType[]>("/announcement-types"),
};
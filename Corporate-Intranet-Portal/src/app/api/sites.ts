import type { RedirectSite } from "../contexts/SystemContext";
import { apiFetch } from "./client";

export interface PortalModule {
  id: string;
  name: string;
}

export const sitesApi = {
  modules: () => apiFetch<PortalModule[]>("/modules"),
  list: (moduleId?: string) =>
    apiFetch<RedirectSite[]>(`/sites${moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : ""}`),
  create: (site: Omit<RedirectSite, "id" | "active">) =>
    apiFetch<RedirectSite>("/sites", { method: "POST", body: site }),
  update: (site: RedirectSite) =>
    apiFetch<RedirectSite>(`/sites/${site.id}`, { method: "PUT", body: site }),
  remove: (id: string) => apiFetch<void>(`/sites/${id}`, { method: "DELETE" }),
  toggleActive: (id: string) =>
    apiFetch<RedirectSite>(`/sites/${id}/active`, { method: "PATCH" }),
};
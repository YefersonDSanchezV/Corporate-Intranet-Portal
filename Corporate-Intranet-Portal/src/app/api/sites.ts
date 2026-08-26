import type { RedirectSite } from "../contexts/SystemContext";
import { apiFetch } from "./client";
import { mapSitioToFE, type BackendModuloResponse, type BackendSitioResponse } from "./mappers";

export interface PortalModule { id: string; name: string; }

function mapModulo(dto: BackendModuloResponse): PortalModule {
  return { id: String(dto.oid), name: dto.nombre };
}

export const sitesApi = {
  modules: async () => {
    const data = await apiFetch<BackendModuloResponse[]>("/modules");
    return data.map(mapModulo);
  },
  list: async (moduleId?: string) => {
    const data = await apiFetch<BackendSitioResponse[]>(`/sites${moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : ""}`);
    return data.map(mapSitioToFE);
  },
  create: async (site: Omit<RedirectSite, "id" | "active">) => {
    // resolver moduloOid por nombre (moduleId es nombre del módulo)
    const modules = await apiFetch<BackendModuloResponse[]>("/modules");
    const mod = modules.find(m => m.nombre === site.moduleId || String(m.oid) === site.moduleId);
    const moduloOid = mod ? mod.oid : (modules[0]?.oid ?? 1);
    const body = { nombre: site.title, url: site.url, moduloOid, icono: site.ref || "Globe" };
    const dto = await apiFetch<BackendSitioResponse>("/sites", { method: "POST", body });
    return mapSitioToFE(dto);
  },
  update: async (site: RedirectSite) => {
    const modules = await apiFetch<BackendModuloResponse[]>("/modules");
    const mod = modules.find(m => m.nombre === site.moduleId || String(m.oid) === site.moduleId);
    const moduloOid = mod ? mod.oid : (modules[0]?.oid ?? 1);
    const body = { nombre: site.title, url: site.url, moduloOid, icono: site.ref || "Globe" };
    const dto = await apiFetch<BackendSitioResponse>(`/sites/${site.id}`, { method: "PUT", body });
    return mapSitioToFE(dto);
  },
  remove: (id: string) => apiFetch<void>(`/sites/${id}`, { method: "DELETE" }),
  toggleActive: async (id: string) => {
    const dto = await apiFetch<BackendSitioResponse>(`/sites/${id}/active`, { method: "PATCH" });
    return mapSitioToFE(dto);
  },
};
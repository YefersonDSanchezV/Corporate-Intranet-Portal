import type { RedirectSite } from "../contexts/SystemContext";
import { ApiError, apiFetch } from "./client";
import { mapSitioToFE, type BackendModuloResponse, type BackendSitioResponse } from "./mappers";

export interface PortalModule { id: string; name: string; }

function mapModulo(dto: BackendModuloResponse): PortalModule {
  return { id: String(dto.oid), name: dto.nombre };
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .trim();
}

function resolveModuleOid(siteModuleId: string, modules: BackendModuloResponse[]): number {
  const normalizedSiteModule = normalize(siteModuleId);
  const module = modules.find(
    (item) => normalize(item.nombre) === normalizedSiteModule || String(item.oid) === siteModuleId,
  );
  if (!module) {
    throw new ApiError("No existe un módulo válido para asociar el sitio. Configure módulos base en backend.", 400);
  }
  return module.oid;
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
    const modules = await apiFetch<BackendModuloResponse[]>("/modules");
    const moduloOid = resolveModuleOid(site.moduleId, modules);
    const body = { nombre: site.title, url: site.url, moduloOid, icono: site.ref || "Globe" };
    const dto = await apiFetch<BackendSitioResponse>("/sites", { method: "POST", body });
    return mapSitioToFE(dto);
  },
  update: async (site: RedirectSite) => {
    const modules = await apiFetch<BackendModuloResponse[]>("/modules");
    const moduloOid = resolveModuleOid(site.moduleId, modules);
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
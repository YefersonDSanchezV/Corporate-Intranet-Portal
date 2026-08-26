import type { DirectoryEntry, InstitutionEmail } from "../contexts/SystemContext";
import { ApiError, apiFetch } from "./client";
import { mapExtensionToFE, mapCorreoToFE, type BackendExtensionResponse, type BackendCorreoResponse } from "./mappers";

export const directoryApi = {
  extensions: async () => {
    const data = await apiFetch<BackendExtensionResponse[]>("/directory/extensions");
    return data.map(mapExtensionToFE);
  },
  createExtension: async (entry: Omit<DirectoryEntry, "id" | "active">) => {
    const body = await buildExtensionBody(entry);
    const dto = await apiFetch<BackendExtensionResponse>("/directory/extensions", { method: "POST", body });
    return mapExtensionToFE(dto);
  },
  updateExtension: async (entry: DirectoryEntry) => {
    const body = await buildExtensionBody(entry);
    const dto = await apiFetch<BackendExtensionResponse>(`/directory/extensions/${entry.id}`, { method: "PUT", body });
    return mapExtensionToFE(dto);
  },
  deleteExtension: (id: string) => apiFetch<void>(`/directory/extensions/${id}`, { method: "DELETE" }),
  emails: async () => {
    const data = await apiFetch<BackendCorreoResponse[]>("/directory/emails");
    return data.map(mapCorreoToFE);
  },
  createEmail: async (email: Omit<InstitutionEmail, "id">) => {
    const body = await buildCorreoBody(email);
    const dto = await apiFetch<BackendCorreoResponse>("/directory/emails", { method: "POST", body });
    return mapCorreoToFE(dto);
  },
  updateEmail: async (email: InstitutionEmail) => {
    const body = await buildCorreoBody(email);
    const dto = await apiFetch<BackendCorreoResponse>(`/directory/emails/${email.id}`, { method: "PUT", body });
    return mapCorreoToFE(dto);
  },
  deleteEmail: (id: string) => apiFetch<void>(`/directory/emails/${id}`, { method: "DELETE" }),
  floors: async () => {
    const data = await apiFetch<{ oid: number; nombre: string }[]>("/directory/floors");
    return (data as unknown as { nombre: string }[]).map(d => (d as unknown as { nombre: string }).nombre ?? String((d as unknown as { oid: number }).oid));
  },
  areas: async () => {
    const data = await apiFetch<{ oid: number; nombre: string }[]>("/directory/areas");
    return (data as unknown as { nombre: string }[]).map(d => (d as unknown as { nombre: string }).nombre ?? String((d as unknown as { oid: number }).oid));
  },
};

async function buildExtensionBody(entry: DirectoryEntry | Omit<DirectoryEntry, "id" | "active">) {
  const [areas, floors] = await Promise.all([
    apiFetch<{ oid: number; nombre: string }[]>("/directory/areas").catch(() => [] as { oid: number; nombre: string }[]),
    apiFetch<{ oid: number; nombre: string }[]>("/directory/floors").catch(() => [] as { oid: number; nombre: string }[]),
  ]);
  if (areas.length === 0 || floors.length === 0) {
    throw new ApiError("No hay áreas o pisos configurados en backend para guardar extensiones.", 400);
  }
  const areaOid = (areas as unknown as { oid: number; nombre: string }[]).find(a => a.nombre === (entry as DirectoryEntry).area)?.oid ?? (areas as unknown as { oid: number }[])[0].oid;
  const floorName = (entry as DirectoryEntry).floor?.[0] || "";
  const pisoOid = (floors as unknown as { oid: number; nombre: string }[]).find(f => f.nombre === floorName)?.oid ?? (floors as unknown as { oid: number }[])[0].oid;
  return { nombre: (entry as DirectoryEntry).name, extension: (entry as DirectoryEntry).extension, areaOid, pisoOid, soporte: !!(entry as DirectoryEntry).isSupport };
}
async function buildCorreoBody(email: InstitutionEmail | Omit<InstitutionEmail, "id">) {
  const [areas, floors] = await Promise.all([
    apiFetch<{ oid: number; nombre: string }[]>("/directory/areas").catch(() => [] as { oid: number; nombre: string }[]),
    apiFetch<{ oid: number; nombre: string }[]>("/directory/floors").catch(() => [] as { oid: number; nombre: string }[]),
  ]);
  if (areas.length === 0 || floors.length === 0) {
    throw new ApiError("No hay áreas o pisos configurados en backend para guardar correos.", 400);
  }
  const areaOid = (areas as unknown as { oid: number; nombre: string }[]).find(a => a.nombre === (email as InstitutionEmail).area)?.oid ?? (areas as unknown as { oid: number }[])[0].oid;
  const pisoOid = (floors as unknown as { oid: number; nombre: string }[]).find(f => f.nombre === (email as InstitutionEmail).floor)?.oid ?? (floors as unknown as { oid: number }[])[0].oid;
  return { nombre: (email as InstitutionEmail).employeeName, correo: (email as InstitutionEmail).email, areaOid, pisoOid, soporte: false };
}
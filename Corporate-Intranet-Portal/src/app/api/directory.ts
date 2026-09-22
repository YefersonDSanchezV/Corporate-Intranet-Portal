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

function normalizeName(v: string | undefined | null): string {
  return (v || "").trim().toLowerCase();
}
async function buildExtensionBody(entry: DirectoryEntry | Omit<DirectoryEntry, "id" | "active">) {
  const [areas, floors] = await Promise.all([
    apiFetch<{ oid: number; nombre: string }[]>("/directory/areas").catch(() => [] as { oid: number; nombre: string }[]),
    apiFetch<{ oid: number; nombre: string }[]>("/directory/floors").catch(() => [] as { oid: number; nombre: string }[]),
  ]);
  if (areas.length === 0 || floors.length === 0) {
    throw new ApiError("No hay áreas o pisos configurados en backend para guardar extensiones.", 400);
  }
  const areaNorm = normalizeName((entry as DirectoryEntry).area);
  const matchedArea = (areas as unknown as { oid: number; nombre: string }[]).find(a => normalizeName(a.nombre) === areaNorm);
  const areaOid = matchedArea?.oid ?? (areas as unknown as { oid: number }[])[0].oid;
  if (!matchedArea && areaNorm) console.warn(`[directory] Area "${(entry as DirectoryEntry).area}" no encontrada, usando fallback "${(areas as any)[0]?.nombre}"`);
  const floorName = (entry as DirectoryEntry).floor?.[0] || "";
  const floorNorm = normalizeName(floorName);
  const matchedFloor = (floors as unknown as { oid: number; nombre: string }[]).find(f => normalizeName(f.nombre) === floorNorm);
  const pisoOid = matchedFloor?.oid ?? (floors as unknown as { oid: number }[])[0].oid;
  if (!matchedFloor && floorNorm) console.warn(`[directory] Piso "${floorName}" no encontrado, usando fallback "${(floors as any)[0]?.nombre}"`);
  const extNum = Number.parseInt(String((entry as DirectoryEntry).extension).replace(/\D/g, ""), 10);
  if (Number.isNaN(extNum) || extNum <= 0) throw new ApiError("La extensión debe ser un número positivo.", 400);
  return { nombre: (entry as DirectoryEntry).name, extension: extNum, areaOid, pisoOid, soporte: !!(entry as DirectoryEntry).isSupport, tipo: (entry as DirectoryEntry).type || "administrativo" };
}
async function buildCorreoBody(email: InstitutionEmail | Omit<InstitutionEmail, "id">) {
  const [areas, floors] = await Promise.all([
    apiFetch<{ oid: number; nombre: string }[]>("/directory/areas").catch(() => [] as { oid: number; nombre: string }[]),
    apiFetch<{ oid: number; nombre: string }[]>("/directory/floors").catch(() => [] as { oid: number; nombre: string }[]),
  ]);
  if (areas.length === 0 || floors.length === 0) {
    throw new ApiError("No hay áreas o pisos configurados en backend para guardar correos.", 400);
  }
  const areaNorm = normalizeName((email as InstitutionEmail).area);
  const matchedArea = (areas as unknown as { oid: number; nombre: string }[]).find(a => normalizeName(a.nombre) === areaNorm);
  const areaOid = matchedArea?.oid ?? (areas as unknown as { oid: number }[])[0].oid;
  if (!matchedArea && areaNorm) console.warn(`[directory] Correo area "${(email as InstitutionEmail).area}" no encontrada, usando fallback`);
  const floorVal = (email as InstitutionEmail).floor || "";
  const floorNorm = normalizeName(floorVal);
  const matchedFloor = (floors as unknown as { oid: number; nombre: string }[]).find(f => normalizeName(f.nombre) === floorNorm);
  let pisoOid: number;
  if (matchedFloor) {
    pisoOid = matchedFloor.oid;
  } else if (!floorVal.trim()) {
    // Piso vacío en correos es opcional: usar primero pero sin warning ruidoso
    pisoOid = (floors as unknown as { oid: number }[])[0].oid;
  } else {
    console.warn(`[directory] Correo piso "${floorVal}" no encontrado, usando fallback`);
    pisoOid = (floors as unknown as { oid: number }[])[0].oid;
  }
  return { nombre: (email as InstitutionEmail).employeeName, correo: (email as InstitutionEmail).email, areaOid, pisoOid, soporte: !!(email as InstitutionEmail).isSupport, cargo: (email as InstitutionEmail).position || null };
}
import type { RedirectSite, DirectoryEntry, InstitutionEmail, Task, Achievement } from "../contexts/SystemContext";
import type { Announcement } from "../contexts/AnnouncementsContext";

// --- Backend DTOs (shape from Java) ---
export interface BackendSitioResponse { oid: number; nombre: string; url: string; moduloOid: number; moduloNombre: string; icono: string; }
export interface BackendSitioRequest { nombre: string; url: string; moduloOid: number; icono: string; }
export interface BackendModuloResponse { oid: number; nombre: string; estado: boolean; }
export interface BackendExtensionResponse { oid: number; nombre: string; extension: string; areaOid: number; areaNombre: string; pisoOid: number; pisoNombre: string; soporte: boolean; }
export interface BackendCorreoResponse { oid: number; nombre: string; correo: string; areaOid: number; areaNombre: string; pisoOid: number; pisoNombre: string; soporte: boolean; }
export interface BackendAnuncioResponse { oid: number; titulo: string; descripcion: string; tipoOid: number; tipoNombre: string; fechaInicio: string; fechaFin: string; creadorOid: number | null; creadorNombre: string | null; estado: string; fechaCreacion: string; fechaVencimiento: string | null; eliminado: boolean; }
export interface BackendTareaResponse { oid: number; titulo: string; descripcion: string; asignadaAOid: number | null; asignadaANombre: string | null; asignadaPorOid: number | null; asignadaPorNombre: string | null; estado: string; fechaInicio: string | null; fechaLimite: string | null; prioridad: string; }
export interface BackendLogroResponse { oid: number; titulo: string; descripcion: string; urlImagen: string | null; fechaCreacion: string; }

// --- Sites ---
export function mapSitioToFE(dto: BackendSitioResponse): RedirectSite {
  return {
    id: String(dto.oid),
    title: dto.nombre,
    url: dto.url,
    type: "icon",
    ref: dto.icono || "Globe",
    moduleId: dto.moduloNombre || String(dto.moduloOid),
    active: true,
  };
}
export function mapSitioToBE(fe: Omit<RedirectSite, "id" | "active">, moduloOid: number): BackendSitioRequest {
  return { nombre: fe.title, url: fe.url, moduloOid, icono: fe.ref || "Globe" };
}

// --- Directory ---
export function mapExtensionToFE(dto: BackendExtensionResponse): DirectoryEntry {
  return {
    id: String(dto.oid),
    name: dto.nombre,
    extension: dto.extension,
    floor: dto.pisoNombre ? [dto.pisoNombre] : [],
    area: dto.areaNombre || undefined,
    isSupport: dto.soporte,
    type: "administrativo",
    active: true,
  };
}
export function mapCorreoToFE(dto: BackendCorreoResponse): InstitutionEmail {
  return {
    id: String(dto.oid),
    employeeName: dto.nombre,
    position: dto.areaNombre || "",
    email: dto.correo,
    area: dto.areaNombre || "",
    floor: dto.pisoNombre || "",
  };
}

// --- Announcements ---
export function mapAnuncioToFE(dto: BackendAnuncioResponse): Announcement {
  return {
    id: String(dto.oid),
    title: dto.titulo,
    description: dto.descripcion,
    startDate: dto.fechaInicio ? new Date(dto.fechaInicio) : new Date(dto.fechaCreacion),
    endDate: dto.fechaFin ? new Date(dto.fechaFin) : new Date(Date.now() + 7*24*60*60*1000),
    createdBy: dto.creadorNombre || "",
    published: dto.estado === "PUBLICADO",
    createdAt: new Date(dto.fechaCreacion),
  };
}
export function mapAnuncioToBE(fe: Omit<Announcement, "id" | "published" | "createdAt">): Record<string, unknown> {
  return {
    titulo: fe.title,
    descripcion: fe.description,
    tipoOid: 1,
    fechaInicio: fe.startDate.toISOString(),
    fechaFin: fe.endDate.toISOString(),
  };
}

// --- Tasks ---
export function mapTareaToFE(dto: BackendTareaResponse): Task {
  return {
    id: String(dto.oid),
    title: dto.titulo,
    description: dto.descripcion || "",
    assignedTo: dto.asignadaANombre || "",
    registeredBy: dto.asignadaPorNombre || "",
    observations: [],
    completed: dto.estado === "COMPLETADA",
    createdAt: dto.fechaInicio || new Date().toISOString(),
  };
}

// --- Achievements ---
export function mapLogroToFE(dto: BackendLogroResponse): Achievement {
  return {
    id: String(dto.oid),
    title: dto.titulo,
    description: dto.descripcion || "",
    image: dto.urlImagen || "",
    date: dto.fechaCreacion,
    level: "",
    active: true,
  };
}

// --- Users ---
import type { User } from "../contexts/AuthContext";
export interface BackendUsuarioResponse { oid: number; username: string; identificacion: number; nombreCompleto: string; fechaNacimiento: string; correoInstitucional: string; cargoOid: number | null; cargoNombre: string | null; estado: boolean; fechaCreacion: string; }
export function mapUsuarioToFE(dto: BackendUsuarioResponse): User {
  return {
    id: String(dto.oid),
    username: dto.username,
    fullName: dto.nombreCompleto,
    identification: String(dto.identificacion),
    email: dto.correoInstitucional,
    position: dto.cargoNombre ?? "",
    department: "",
    role: (dto.cargoNombre?.toLowerCase().replace(/\s+/g, "_") as User["role"]) || "admin",
    status: dto.estado ? "active" : "inactive",
    createdDate: dto.fechaCreacion,
    birthDate: dto.fechaNacimiento,
  };
}

// --- Logs ---
export interface BackendLogResponse { oid: number; usuarioOid: number | null; username: string | null; accion: string; valorAnterior: string | null; valorNuevo: string | null; fechaCambio: string; ip: string | null; tabla: string | null; registro: string | null; }
export interface FrontendLogEntry { id: string; username: string; action: string; table?: string; detail?: string; timestamp: string; ip?: string; }
export function mapLogToFE(dto: BackendLogResponse): FrontendLogEntry {
  return {
    id: String(dto.oid),
    username: dto.username || "sistema",
    action: dto.accion,
    table: dto.tabla || undefined,
    detail: dto.registro || dto.valorNuevo || "",
    timestamp: dto.fechaCambio,
    ip: dto.ip || undefined,
  };
}

import type { AccessRequest, PasswordResetRequest, User } from "../contexts/AuthContext";
import { apiFetch, getToken } from "./client";
import { mapUsuarioToFE, type BackendUsuarioResponse } from "./mappers";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

export interface BackendCumpleanosResponse {
  oid: number;
  username: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  fechaCumpleanos: string;
  edadQueCumple: number;
  cargoOid: number | null;
  cargoNombre: string | null;
  estado: boolean;
}

export interface BackendCumpleanosManualResponse {
  oid: number;
  nombreCompleto: string;
  fechaNacimiento: string;
  cargo: string;
  fechaCreacion: string;
  fotoArchivoOid?: number | null;
}

export interface ManualBirthdayBody {
  nombreCompleto: string;
  fechaNacimiento: string;
  cargo: string;
  fotoArchivoOid?: number | null;
}

export const usersApi = {
  list: async () => {
    const data = await apiFetch<BackendUsuarioResponse[]>("/users");
    return data.map(mapUsuarioToFE);
  },
  create: async (user: Omit<User, "id" | "status" | "createdDate">) => {
    let cargoOid = 1;
    try {
      const cargos = await apiFetch<{ oid: number; nombre: string }[]>("/cargos");
      const roleName = (user.role || "").toLowerCase();
      const found = (cargos as unknown as { oid: number; nombre: string }[]).find(c => c.nombre.toLowerCase() === roleName);
      if (found) cargoOid = found.oid;
    } catch { /* fallback 1 */ }
    const body = {
      username: user.username,
      password: user.password || user.identification || "Temp2024**",
      identificacion: Number(user.identification) || 99999999,
      nombreCompleto: user.fullName,
      fechaNacimiento: (user as User).birthDate || "1990-01-01",
      correoInstitucional: user.email || `${user.username}@icvc.local`,
      telefono: (user as any).phone || user.phone || "",
      cargoOid,
    };
    const dto = await apiFetch<BackendUsuarioResponse>("/users", { method: "POST", body });
    return mapUsuarioToFE(dto);
  },
  update: async (user: User) => {
    let cargoOid = 1;
    try {
      const cargos = await apiFetch<{ oid: number; nombre: string }[]>("/cargos");
      const roleName = ((user as User).role || "").toLowerCase();
      const found = (cargos as unknown as { oid: number; nombre: string }[]).find(c => c.nombre.toLowerCase() === roleName);
      if (found) cargoOid = found.oid;
    } catch {}
    const body: Record<string, unknown> = { nombreCompleto: user.fullName, correoInstitucional: user.email, telefono: (user as any).phone || user.phone || "", cargoOid, estado: user.status === "active" };
    if ((user as User).birthDate) body.fechaNacimiento = (user as User).birthDate;
    const dto = await apiFetch<BackendUsuarioResponse>(`/users/${user.username}`, { method: "PUT", body });
    return mapUsuarioToFE(dto);
  },
  toggleStatus: async (username: string, currentStatus: User["status"]) => {
    const nuevoEstado = currentStatus === "active" ? false : true;
    const dto = await apiFetch<BackendUsuarioResponse>(`/users/${username}/status`, { method: "PATCH", body: { estado: nuevoEstado } });
    return mapUsuarioToFE(dto);
  },
  resetPassword: (id: string, newPassword?: string) => apiFetch<void>(`/users/${id}/password`, { method: "PATCH", body: { password: newPassword ?? null } }),
  /** Calendario automático desde el backend (fecha de nacimiento validada). */
  birthdays: (mes?: number) => {
    const qs = mes ? `?mes=${mes}` : "";
    return apiFetch<BackendCumpleanosResponse[]>(`/users/cumpleanos${qs}`);
  },
  /** Cumpleaños manuales (cargo en texto libre). */
  manualBirthdays: {
    list: () => apiFetch<BackendCumpleanosManualResponse[]>("/cumpleanos-manuales"),
    create: (body: ManualBirthdayBody) =>
      apiFetch<BackendCumpleanosManualResponse>("/cumpleanos-manuales", { method: "POST", body }),
    update: (id: number, body: ManualBirthdayBody) =>
      apiFetch<BackendCumpleanosManualResponse>(`/cumpleanos-manuales/${id}`, { method: "PUT", body }),
    remove: (id: number) => apiFetch<void>(`/cumpleanos-manuales/${id}`, { method: "DELETE" }),
    /** Sube la foto obligatoria (JPG/PNG). Requiere permiso calendario-cumpleanios:grabar. */
    uploadFoto: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const headers: Record<string, string> = {};
      const token = getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return fetch(`${API_BASE}/cumpleanos-manuales/foto`, { method: "POST", headers, body: form });
    },
  },
  accessRequests: () => apiFetch<any[]>("/access-requests"),
  createAccessRequest: (request: Omit<AccessRequest, "id" | "requestDate" | "status">) =>
    apiFetch<AccessRequest>("/access-requests", { method: "POST", body: request }),
  createAccessRequestRaw: (payload: { primerNombre: string; segundoNombre?: string | null; primerApellido: string; segundoApellido: string; identificacion: number; correo: string; celular: string; cargo: string; fechaNacimiento: string }) =>
    apiFetch<any>("/access-requests", { method: "POST", body: payload }),
  approveAccessRequest: (id: string, motivo?: string) => apiFetch<void>(`/access-requests/${id}/approve`, { method: "POST", body: motivo ? { observaciones: motivo } : {} }),
  rejectAccessRequest: (id: string, motivo?: string) => apiFetch<void>(`/access-requests/${id}/reject`, { method: "POST", body: motivo ? { observaciones: motivo } : {} }),
  passwordResetRequests: () => apiFetch<PasswordResetRequest[]>("/password-reset-requests"),
  createPasswordResetRequest: (request: Omit<PasswordResetRequest, "id" | "requestDate" | "status">) =>
    apiFetch<PasswordResetRequest>("/password-reset-requests", { method: "POST", body: request }),
  completePasswordReset: (id: string) => apiFetch<void>(`/password-reset-requests/${id}/complete`, { method: "POST" }),
};
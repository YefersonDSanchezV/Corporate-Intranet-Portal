import type { AccessRequest, PasswordResetRequest, User } from "../contexts/AuthContext";
import { apiFetch } from "./client";
import { mapUsuarioToFE, type BackendUsuarioResponse } from "./mappers";

export const usersApi = {
  list: async () => {
    const data = await apiFetch<BackendUsuarioResponse[]>("/users");
    return data.map(mapUsuarioToFE);
  },
  create: async (user: Omit<User, "id" | "status" | "createdDate">) => {
    let cargoOid = 1;
    try {
      const cargos = await apiFetch<{ oid: number; nombre: string }[]>("/cargos");
      const found = (cargos as unknown as { oid: number; nombre: string }[]).find(c => c.nombre.toLowerCase() === (user.position || user.role || "").toLowerCase());
      if (found) cargoOid = found.oid;
    } catch { /* fallback 1 */ }
    const body = {
      username: user.username,
      password: user.password || user.identification || "Temp2024**",
      identificacion: Number(user.identification) || 99999999,
      nombreCompleto: user.fullName,
      fechaNacimiento: (user as User).birthDate || "1990-01-01",
      correoInstitucional: user.email || `${user.username}@icvc.local`,
      cargoOid,
    };
    const dto = await apiFetch<BackendUsuarioResponse>("/users", { method: "POST", body });
    return mapUsuarioToFE(dto);
  },
  update: async (user: User) => {
    let cargoOid = 1;
    try {
      const cargos = await apiFetch<{ oid: number; nombre: string }[]>("/cargos");
      const cargoName = (user.position || (user as User).role || "").toLowerCase();
      const found = (cargos as unknown as { oid: number; nombre: string }[]).find(c => c.nombre.toLowerCase() === cargoName);
      if (found) cargoOid = found.oid;
    } catch {}
    const body: Record<string, unknown> = { nombreCompleto: user.fullName, correoInstitucional: user.email, cargoOid, estado: user.status === "active" };
    if ((user as User).birthDate) body.fechaNacimiento = (user as User).birthDate;
    const dto = await apiFetch<BackendUsuarioResponse>(`/users/${user.username}`, { method: "PUT", body });
    return mapUsuarioToFE(dto);
  },
  toggleStatus: async (username: string, currentStatus: User["status"]) => {
    const nuevoEstado = currentStatus === "active" ? false : true;
    const dto = await apiFetch<BackendUsuarioResponse>(`/users/${username}/status`, { method: "PATCH", body: { estado: nuevoEstado } });
    return mapUsuarioToFE(dto);
  },
  resetPassword: (id: string) => apiFetch<void>(`/users/${id}/password`, { method: "PATCH", body: { password: null } }),
  accessRequests: () => apiFetch<AccessRequest[]>("/access-requests"),
  createAccessRequest: (request: Omit<AccessRequest, "id" | "requestDate" | "status">) =>
    apiFetch<AccessRequest>("/access-requests", { method: "POST", body: request }),
  approveAccessRequest: (id: string) => apiFetch<void>(`/access-requests/${id}/approve`, { method: "POST" }),
  rejectAccessRequest: (id: string) => apiFetch<void>(`/access-requests/${id}/reject`, { method: "POST" }),
  passwordResetRequests: () => apiFetch<PasswordResetRequest[]>("/password-reset-requests"),
  createPasswordResetRequest: (request: Omit<PasswordResetRequest, "id" | "requestDate" | "status">) =>
    apiFetch<PasswordResetRequest>("/password-reset-requests", { method: "POST", body: request }),
  completePasswordReset: (id: string) => apiFetch<void>(`/password-reset-requests/${id}/complete`, { method: "POST" }),
};
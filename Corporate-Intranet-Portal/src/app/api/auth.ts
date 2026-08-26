import type { User, UserRole } from "../contexts/AuthContext";
import { apiFetch, setToken, clearToken } from "./client";

// Respuesta cruda del backend: { usuario, token, roles, mensaje }
export interface BackendUsuario {
  oid: number;
  username: string;
  identificacion: number;
  nombreCompleto: string;
  fechaNacimiento: string;
  correoInstitucional: string;
  cargoOid: number | null;
  cargoNombre: string | null;
  estado: boolean;
  fechaCreacion: string;
}

export interface BackendLoginResponse {
  usuario: BackendUsuario;
  token: string;
  roles: string[];
  mensaje: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  roles: string[];
}

function mapBackendUsuario(u: BackendUsuario): User {
  return {
    id: String(u.oid),
    username: u.username,
    fullName: u.nombreCompleto,
    identification: String(u.identificacion),
    email: u.correoInstitucional,
    position: u.cargoNombre ?? "",
    department: "",
    role: "admin" as UserRole,
    status: u.estado ? "active" : "inactive",
    createdDate: u.fechaCreacion,
  };
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const res = await apiFetch<BackendLoginResponse>("/auth/login", {
      method: "POST",
      body: { username, password },
    });
    if (res.token) setToken(res.token);
    return { user: mapBackendUsuario(res.usuario), token: res.token, roles: res.roles ?? [] };
  },
  logout: async () => {
    try {
      await apiFetch<void>("/auth/logout", { method: "POST" });
    } finally {
      clearToken();
    }
  },
  me: async (): Promise<User> => {
    const u = await apiFetch<BackendUsuario>("/me");
    return mapBackendUsuario(u);
  },
  cargos: () => apiFetch<UserRole[]>("/cargos"),
  areas: () => apiFetch<string[]>("/areas"),
};
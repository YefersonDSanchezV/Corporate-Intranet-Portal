import type { User, UserRole } from "../contexts/AuthContext";
import { apiFetch } from "./client";

export interface LoginResponse {
  user: User;
  token?: string;
}

export const authApi = {
  login: (username: string, password: string) =>
    apiFetch<LoginResponse>("/auth/login", { method: "POST", body: { username, password } }),
  logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),
  me: () => apiFetch<User>("/me"),
  cargos: () => apiFetch<UserRole[]>("/cargos"),
  areas: () => apiFetch<string[]>("/areas"),
};
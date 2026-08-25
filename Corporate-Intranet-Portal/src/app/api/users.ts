import type { AccessRequest, PasswordResetRequest, User } from "../contexts/AuthContext";
import { apiFetch } from "./client";

export const usersApi = {
  list: () => apiFetch<User[]>("/users"),
  create: (user: Omit<User, "id" | "status" | "createdDate">) =>
    apiFetch<User>("/users", { method: "POST", body: user }),
  update: (user: User) =>
    apiFetch<User>(`/users/${user.username}`, { method: "PUT", body: user }),
  toggleStatus: (username: string) =>
    apiFetch<User>(`/users/${username}/status`, { method: "PATCH" }),
  resetPassword: (id: string) =>
    apiFetch<void>(`/users/${id}/password`, { method: "PATCH" }),
  accessRequests: () => apiFetch<AccessRequest[]>("/access-requests"),
  createAccessRequest: (request: Omit<AccessRequest, "id" | "requestDate" | "status">) =>
    apiFetch<AccessRequest>("/access-requests", { method: "POST", body: request }),
  approveAccessRequest: (id: string) =>
    apiFetch<void>(`/access-requests/${id}/approve`, { method: "POST" }),
  rejectAccessRequest: (id: string) =>
    apiFetch<void>(`/access-requests/${id}/reject`, { method: "POST" }),
  passwordResetRequests: () => apiFetch<PasswordResetRequest[]>("/password-reset-requests"),
  createPasswordResetRequest: (request: Omit<PasswordResetRequest, "id" | "requestDate" | "status">) =>
    apiFetch<PasswordResetRequest>("/password-reset-requests", { method: "POST", body: request }),
  completePasswordReset: (id: string) =>
    apiFetch<void>(`/password-reset-requests/${id}/complete`, { method: "POST" }),
};
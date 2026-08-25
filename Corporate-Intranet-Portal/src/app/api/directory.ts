import type { DirectoryEntry, InstitutionEmail } from "../contexts/SystemContext";
import { apiFetch } from "./client";

export const directoryApi = {
  extensions: () => apiFetch<DirectoryEntry[]>("/directory/extensions"),
  createExtension: (entry: Omit<DirectoryEntry, "id" | "active">) =>
    apiFetch<DirectoryEntry>("/directory/extensions", { method: "POST", body: entry }),
  updateExtension: (entry: DirectoryEntry) =>
    apiFetch<DirectoryEntry>(`/directory/extensions/${entry.id}`, { method: "PUT", body: entry }),
  deleteExtension: (id: string) =>
    apiFetch<void>(`/directory/extensions/${id}`, { method: "DELETE" }),
  emails: () => apiFetch<InstitutionEmail[]>("/directory/emails"),
  createEmail: (email: Omit<InstitutionEmail, "id">) =>
    apiFetch<InstitutionEmail>("/directory/emails", { method: "POST", body: email }),
  updateEmail: (email: InstitutionEmail) =>
    apiFetch<InstitutionEmail>(`/directory/emails/${email.id}`, { method: "PUT", body: email }),
  deleteEmail: (id: string) =>
    apiFetch<void>(`/directory/emails/${id}`, { method: "DELETE" }),
  floors: () => apiFetch<string[]>("/directory/floors"),
  areas: () => apiFetch<string[]>("/directory/areas"),
};
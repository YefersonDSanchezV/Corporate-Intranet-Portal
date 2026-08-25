import { apiFetch } from "./client";

export interface LogEntry {
  id: string;
  username: string;
  action: string;
  table?: string;
  detail?: string;
  timestamp: string;
  ip?: string;
}

export const logsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiFetch<LogEntry[]>(`/logs${query}`);
  },
  create: (entry: Omit<LogEntry, "id" | "timestamp">) =>
    apiFetch<LogEntry>("/logs", { method: "POST", body: entry }),
};
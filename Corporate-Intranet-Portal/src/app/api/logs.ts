import { apiFetch } from "./client";
import { mapLogToFE, type BackendLogResponse, type FrontendLogEntry } from "./mappers";

export type LogEntry = FrontendLogEntry;

export const logsApi = {
  list: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const data = await apiFetch<BackendLogResponse[]>(`/logs${query}`);
    return data.map(mapLogToFE);
  },
  create: (entry: Omit<LogEntry, "id" | "timestamp">) =>
    apiFetch<LogEntry>("/logs", { method: "POST", body: entry }),
};
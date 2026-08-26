import type { Task } from "../contexts/SystemContext";
import { apiFetch } from "./client";
import { mapTareaToFE, type BackendTareaResponse } from "./mappers";

export interface TaskComment { text: string; author: string; }

export const tasksApi = {
  list: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const data = await apiFetch<BackendTareaResponse[]>(`/tasks${query}`);
    return data.map(mapTareaToFE);
  },
  create: async (task: Omit<Task, "id" | "createdAt" | "completed" | "observations">) => {
    const body = { titulo: task.title, descripcion: task.description, prioridad: "MEDIA" };
    const dto = await apiFetch<BackendTareaResponse>("/tasks", { method: "POST", body });
    return mapTareaToFE(dto);
  },
  update: async (task: Task) => {
    const body = { titulo: task.title, descripcion: task.description };
    const dto = await apiFetch<BackendTareaResponse>(`/tasks/${task.id}`, { method: "PUT", body });
    return mapTareaToFE(dto);
  },
  complete: (id: string) => apiFetch<void>(`/tasks/${id}/complete`, { method: "POST" }),
  addComment: (id: string, comment: TaskComment) => apiFetch<void>(`/tasks/${id}/comments`, { method: "POST", body: comment }),
};
import type { Task } from "../contexts/SystemContext";
import { apiFetch } from "./client";

export interface TaskComment {
  text: string;
  author: string;
}

export const tasksApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiFetch<Task[]>(`/tasks${query}`);
  },
  create: (task: Omit<Task, "id" | "createdAt" | "completed" | "observations">) =>
    apiFetch<Task>("/tasks", { method: "POST", body: task }),
  update: (task: Task) =>
    apiFetch<Task>(`/tasks/${task.id}`, { method: "PUT", body: task }),
  complete: (id: string) => apiFetch<void>(`/tasks/${id}/complete`, { method: "POST" }),
  addComment: (id: string, comment: TaskComment) =>
    apiFetch<void>(`/tasks/${id}/comments`, { method: "POST", body: comment }),
};
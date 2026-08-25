import type { Achievement } from "../contexts/SystemContext";
import { apiFetch } from "./client";

export const achievementsApi = {
  list: () => apiFetch<Achievement[]>("/achievements"),
  create: (achievement: Omit<Achievement, "id">) =>
    apiFetch<Achievement>("/achievements", { method: "POST", body: achievement }),
  update: (achievement: Achievement) =>
    apiFetch<Achievement>(`/achievements/${achievement.id}`, { method: "PUT", body: achievement }),
  remove: (id: string) => apiFetch<void>(`/achievements/${id}`, { method: "DELETE" }),
};
import type { Achievement } from "../contexts/SystemContext";
import { apiFetch } from "./client";
import { mapLogroToFE, type BackendLogroResponse } from "./mappers";

export const achievementsApi = {
  list: async () => {
    const data = await apiFetch<BackendLogroResponse[]>("/achievements");
    return data.map(mapLogroToFE);
  },
  create: async (achievement: Omit<Achievement, "id">) => {
    const body = { titulo: achievement.title, descripcion: achievement.description, urlImagen: achievement.image };
    const dto = await apiFetch<BackendLogroResponse>("/achievements", { method: "POST", body });
    return mapLogroToFE(dto);
  },
  update: async (achievement: Achievement) => {
    const body = { titulo: achievement.title, descripcion: achievement.description, urlImagen: achievement.image };
    const dto = await apiFetch<BackendLogroResponse>(`/achievements/${achievement.id}`, { method: "PUT", body });
    return mapLogroToFE(dto);
  },
  remove: (id: string) => apiFetch<void>(`/achievements/${id}`, { method: "DELETE" }),
};
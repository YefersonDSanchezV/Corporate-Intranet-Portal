import { apiFetch } from "./client";

export interface Parametro {
  clave: string;
  valor: string;
  descripcion?: string | null;
}

export const parametrosApi = {
  list: () => apiFetch<Parametro[]>("/parametros"),
  get: (clave: string) => apiFetch<Parametro>(`/parametros/${encodeURIComponent(clave)}`),
  update: (clave: string, valor: string) =>
    apiFetch<Parametro>(`/parametros/${encodeURIComponent(clave)}`, {
      method: "PUT",
      body: { valor },
    }),
};

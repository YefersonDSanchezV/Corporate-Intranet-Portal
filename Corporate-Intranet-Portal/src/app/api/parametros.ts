import { apiFetch } from "./client";

export interface Parametro {
  clave: string;
  valor: string;
  descripcion?: string | null;
}

export interface ProbarMinioResult {
  ok: boolean;
  mensaje: string;
}

export const parametrosApi = {
  list: () => apiFetch<Parametro[]>("/parametros"),
  get: (clave: string) => apiFetch<Parametro>(`/parametros/${encodeURIComponent(clave)}`),
  update: (clave: string, valor: string) =>
    apiFetch<Parametro>(`/parametros/${encodeURIComponent(clave)}`, {
      method: "PUT",
      body: { valor },
    }),
  probarMinio: (payload: { endpoint?: string; accessKey?: string; secretKey?: string; bucket?: string }) =>
    apiFetch<ProbarMinioResult>("/parametros/probar-minio", {
      method: "POST",
      body: payload,
      timeoutMs: 15000,
    }),
};

import { apiFetch, getToken } from "./client";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

/** Tipos de contenido admitidos por el catálogo de carpetas. */
export type TipoCarpeta = "DOCUMENTOS" | "IMAGENES" | "VIDEOS" | "OTROS";

export const TIPOS_CARPETA: Array<{ id: TipoCarpeta; label: string }> = [
  { id: "DOCUMENTOS", label: "Documentos" },
  { id: "IMAGENES", label: "Imágenes" },
  { id: "VIDEOS", label: "Videos" },
  { id: "OTROS", label: "Otros" },
];

export interface CarpetaAlmacen {
  oid: number;
  nombre: string;
  descripcion?: string | null;
  tipo: TipoCarpeta;
  /** Bucket físico de MinIO (nunca credenciales). */
  bucket: string;
  /** Prefijo lógico dentro del bucket, terminado en "/". */
  prefijo: string;
  activo: boolean;
  archivos: number;
  fechaCreacion?: string | null;
}

export interface CarpetaAlmacenPayload {
  nombre: string;
  descripcion?: string | null;
  tipo: TipoCarpeta;
  bucket: string;
  prefijo: string;
  activo: boolean;
}

export interface ArchivoCarpeta {
  oid?: number | null;
  nombre: string;
  tipo?: string | null;
  tamano?: number | null;
  fecha?: string | null;
  /** Clave del objeto dentro del bucket (sin credenciales). */
  key: string;
  /** true si existe físicamente en MinIO. */
  enMinio: boolean;
  /** Categoría de vista previa: IMAGEN, VIDEO, PDF, TEXTO, OTRO. */
  vista: "IMAGEN" | "VIDEO" | "PDF" | "TEXTO" | "OTRO";
}

export const carpetasAlmacenApi = {
  list: (filtros?: { busqueda?: string; tipo?: string; activo?: boolean }) => {
    const params = new URLSearchParams();
    if (filtros?.busqueda) params.set("busqueda", filtros.busqueda);
    if (filtros?.tipo) params.set("tipo", filtros.tipo);
    if (filtros?.activo !== undefined) params.set("activo", String(filtros.activo));
    const qs = params.toString();
    return apiFetch<CarpetaAlmacen[]>(`/carpetas-almacen${qs ? `?${qs}` : ""}`);
  },
  create: (payload: CarpetaAlmacenPayload) =>
    apiFetch<CarpetaAlmacen>("/carpetas-almacen", { method: "POST", body: payload }),
  update: (oid: number, payload: CarpetaAlmacenPayload) =>
    apiFetch<CarpetaAlmacen>(`/carpetas-almacen/${oid}`, { method: "PUT", body: payload }),
  setEstado: (oid: number, activo: boolean) =>
    apiFetch<CarpetaAlmacen>(`/carpetas-almacen/${oid}/estado`, { method: "PATCH", body: { activo } }),
  remove: (oid: number) => apiFetch<void>(`/carpetas-almacen/${oid}`, { method: "DELETE" }),
  archivos: (oid: number) => apiFetch<ArchivoCarpeta[]>(`/carpetas-almacen/${oid}/archivos`),
  /** URL de vista previa/descarga del objeto (no expone credenciales). */
  contenidoUrl: (oid: number, key: string) =>
    `/carpetas-almacen/${oid}/contenido?key=${encodeURIComponent(key)}`,
  /** Descarga autenticada del contenido del objeto (para vista previa con blob). */
  contenido: (oid: number, key: string) => {
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(
      `${API_BASE}/carpetas-almacen/${oid}/contenido?key=${encodeURIComponent(key)}`,
      { headers },
    );
  },
};


import { ApiError, apiFetch, getToken } from "./client";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

/** Posición y tamaño de la foto dentro de la plantilla, en porcentaje (0-100). */
export interface PosicionFoto {
  px: number;
  py: number;
  ancho: number;
  alto: number;
  redondo: boolean;
}

export interface PlantillaCumpleanios {
  oid: number;
  nombre: string;
  archivoOid: number;
  nombreOriginal?: string | null;
  tipo?: string | null;
  tamano?: number | null;
  fechaCreacion?: string | null;
  foto?: PosicionFoto | null;
}

/** Posición por defecto al crear una plantilla nueva (centro, 26% del ancho). */
export const POSICION_DEFECTO: PosicionFoto = { px: 50, py: 34, ancho: 26, alto: 26, redondo: true };

export interface PlantillaUpload {
  file: File;
  nombre: string;
  posicion: PosicionFoto;
}

export const plantillasCumpleaniosApi = {
  list: () => apiFetch<PlantillaCumpleanios[]>("/plantillas-cumpleanios"),

  upload: async ({ file, nombre, posicion }: PlantillaUpload): Promise<PlantillaCumpleanios> => {
    const form = new FormData();
    form.append("file", file);
    if (nombre.trim()) form.append("nombre", nombre.trim());
    form.append("fotoPx", String(posicion.px));
    form.append("fotoPy", String(posicion.py));
    form.append("fotoAncho", String(posicion.ancho));
    form.append("fotoAlto", String(posicion.alto));
    form.append("fotoRedondo", String(posicion.redondo));
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}/plantillas-cumpleanios`, {
      method: "POST",
      headers,
      body: form,
    });
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      let data: any = null;
      try {
        data = await response.json();
        message = data?.message || data?.error || message;
      } catch {
        // Respuesta sin cuerpo JSON
      }
      throw new ApiError(message, response.status, data);
    }
    return (await response.json()) as PlantillaCumpleanios;
  },

  remove: (id: number) =>
    apiFetch<void>(`/plantillas-cumpleanios/${id}`, { method: "DELETE" }),
};

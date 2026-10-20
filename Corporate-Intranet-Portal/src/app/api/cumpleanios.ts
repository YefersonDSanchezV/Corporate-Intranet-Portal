import { apiFetch, getToken } from "./client";
import type { PosicionFoto } from "./plantillas";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

/**
 * Registros del módulo de Cumpleaños: automáticos (usuarios del sistema,
 * nombre y fecha de nacimiento del perfil) y manuales.
 */
export interface CumpleaniosRegistro {
  id: string;
  origen: "sistema" | "manual";
  /** Oid del usuario (sistema) o del registro manual. */
  oid: number;
  /** Username del usuario del sistema; en manuales viene vacío. */
  codigo?: string | null;
  usuarioOid?: number | null;
  nombreCompleto: string;
  fechaNacimiento: string;
  fechaCumpleanos: string;
  edad: number;
  cargo?: string | null;
  fotoArchivoOid?: number | null;
  plantillaOid?: number | null;
  plantillaNombre?: string | null;
  plantillaArchivoOid?: number | null;
  posicion?: PosicionFoto | null;
}

/** Datos configurables de la tarjeta: foto y plantilla con la posición de la foto. */
export interface CumpleanioTarjetaBody {
  fotoArchivoOid?: number | null;
  plantillaOid?: number | null;
  fotoPx?: number | null;
  fotoPy?: number | null;
  fotoAncho?: number | null;
  fotoAlto?: number | null;
  fotoRedondo?: boolean | null;
}

export const cumpleaniosApi = {
  list: () => apiFetch<CumpleaniosRegistro[]>("/cumpleanios"),

  updateTarjeta: (oid: number, body: CumpleanioTarjetaBody) =>
    apiFetch<CumpleaniosRegistro>(`/cumpleanios/${oid}`, { method: "PUT", body }),

  /**
   * Sube la imagen de la tarjeta (JPG/PNG). Usa el endpoint del módulo de cumpleaños,
   * que valida tipo/tamaño con los parámetros FOTOS_CUMPLE_*.
   */
  uploadFoto: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(`${API_BASE}/cumpleanos-manuales/foto`, { method: "POST", headers, body: form });
  },
};

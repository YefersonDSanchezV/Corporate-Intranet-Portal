import { apiFetch } from "./client";

/**
 * Agente de IA opcional para la composición de la tarjeta de cumpleaños.
 *
 * <p>El agente <b>no</b> dibuja nada ni decide por su cuenta: recibe la estructura ya
 * medida por el motor determinista (tamaños reales, líneas, obstáculos) y devuelve
 * ajustes numéricos. La aplicación los valida de nuevo con el motor antes de
 * aceptarlos, así que si el proveedor no está disponible —o se equivoca— la tarjeta
 * sigue funcionando igual y nunca se aplica una superposición.</p>
 *
 * <p>Las credenciales y la URL del proveedor viven solo en el backend; el navegador
 * únicamente habla con el endpoint de la intranet.</p>
 */

/** Ajuste sugerido para un campo de texto. Todos los valores son % del lienzo. */
export interface AjusteAgente {
  campo: "nombre" | "cargo" | "fecha";
  x?: number;
  y?: number;
  ancho?: number;
  fuente?: number;
  /** Por qué el agente propone este cambio. */
  motivo?: string;
}

export interface RespuestAgente {
  origen: "ia" | "determinista";
  explicacion: string;
  ajustes: AjusteAgente[];
  observaciones?: string[];
}

/** Estructura medida que se envía al agente: nunca incluye el texto de las personas. */
export interface EntradaAgente {
  ancho: number;
  alto: number;
  campos: Array<{
    campo: string;
    /** Longitud del contenido, para razonar sobre el ajuste sin enviar datos personales. */
    caracteres: number;
    palabras: number;
    x: number;
    y: number;
    ancho: number;
    fuente: number;
    lineas: number;
    /** Ancho de la línea más larga, % del lienzo. */
    anchoMaxLinea: number;
    noCabe: boolean;
  }>;
  obstaculos: Array<{
    nombre: string;
    forma: string;
    x: number;
    y: number;
    ancho: number;
    alto: number;
  }>;
}

export const agenteLayoutApi = {
  /** Indica si la intranet tiene configurado un proveedor de IA. */
  disponibilidad: () => apiFetch<{ disponible: boolean; proveedor?: string }>("/layout-cumple/agente"),

  /**
   * Pide una sugerencia. Devuelve `null` cuando no hay proveedor configurado (el
   * backend responde 204) para que la interfaz use la reorganización determinista.
   */
  sugerir: async (entrada: EntradaAgente): Promise<RespuestAgente | null> => {
    const respuesta = await apiFetch<RespuestAgente | undefined>("/layout-cumple/sugerencia", {
      method: "POST",
      body: entrada,
    });
    return respuesta ?? null;
  },
};

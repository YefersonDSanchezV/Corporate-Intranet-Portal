import { ApiError, apiFetch, getToken } from "./client";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

/**
 * Posición de la foto dentro de la tarjeta.
 *
 * `px/py/ancho/alto` describen el marco (círculo o recuadro) del arte donde va la
 * foto. `zoom` y `offsetX/offsetY` permiten reencuadrar la foto **dentro** de ese
 * marco sin moverlo; el tamaño real lo define la plantilla.
 */
export interface PosicionFoto {
  px: number;
  py: number;
  ancho: number;
  alto: number;
  redondo: boolean;
  /** Factor de acercamiento (1 = ajuste automático). */
  zoom?: number;
  /** Desplazamiento horizontal, % del ancho del marco. */
  offsetX?: number;
  /** Desplazamiento vertical, % del alto del marco. */
  offsetY?: number;
}

export type AlineacionTexto = "left" | "center" | "right";
export type FamiliaTexto = "sans" | "serif" | "script";
export type FormaMarco = "circulo" | "rectangulo" | "redondeado";

/**
 * Campo de texto dinámico sobre la plantilla. Las coordenadas y el tamaño de
 * fuente son porcentajes sobre el tamaño real de la imagen, de modo que el texto
 * se ve igual en cualquier resolución (la capa se dibuja como SVG vectorial).
 */
export interface CampoTarjeta {
  visible: boolean;
  /** Centro horizontal del campo, % del ancho. */
  x: number;
  /** Centro vertical del campo, % del alto. */
  y: number;
  /** Ancho disponible para el texto, % del ancho. */
  ancho: number;
  /** Tamaño de fuente preferido, % del alto de la plantilla. */
  fuente: number;
  color: string;
  alineacion: AlineacionTexto;
  negrita: boolean;
  cursiva: boolean;
  mayusculas: boolean;
  familia: FamiliaTexto;
  /**
   * Interlineado relativo al tamaño de fuente. 1.18 es el valor histórico con el que
   * se dibujaban las tarjetas antes de que fuera configurable.
   */
  interlineado?: number;
  /**
   * Si está activo (por defecto), el texto reduce su tamaño —hasta `fuenteMin`—
   * cuando no cabe en `ancho`, en lugar de desbordarse sobre el arte.
   */
  autoAjustar?: boolean;
  /** Tamaño de fuente mínimo, % del alto, al que puede bajar el ajuste automático. */
  fuenteMin?: number;
  /** Tamaño de fuente máximo, % del alto. */
  fuenteMax?: number;
}

/** Zona del arte donde se inserta automáticamente la foto del funcionario. */
export interface FotoMarco {
  visible: boolean;
  forma: FormaMarco;
  /** Centro horizontal, % del ancho. */
  x: number;
  /** Centro vertical, % del alto. */
  y: number;
  /** Ancho, % del ancho de la plantilla. */
  ancho: number;
  /** Alto, % del alto de la plantilla. */
  alto: number;
  borde: boolean;
  colorBorde: string;
  /** Grosor del borde, % del lado menor del marco. */
  grosorBorde: number;
}

/**
 * Recuadro donde se dibuja la capa frontal (el adorno que va encima de la foto, por
 * ejemplo el gorro navideño). La imagen completa se dibuja dentro respetando su
 * proporción, así que el administrador puede moverla y cambiar su tamaño con el
 * cualquier PNG, sin tener que prepararlo a medida.
 */
export interface FrenteMarco {
  visible: boolean;
  /** Centro horizontal, % del ancho. */
  x: number;
  /** Centro vertical, % del alto. */
  y: number;
  /** Ancho, % del ancho de la plantilla. */
  ancho: number;
  /** Alto, % del alto de la plantilla. */
  alto: number;
}

/** Datos variables de la tarjeta; el resto del arte de la plantilla es fijo. */
export interface ConfigTarjeta {
  nombre: CampoTarjeta;
  cargo: CampoTarjeta;
  fecha: CampoTarjeta;
  /** Obligatorio al guardar: sin marco no se sabe dónde va la foto. */
  fotoMarco: FotoMarco | null;
  /**
   * Partes del arte que ningún dato dinámico puede tapar: el gorro navideño, un logo,
   * un marco ilustrado. El motor las trata como obstáculos y recoloca los textos en
   * lugar de superponerse a ellas.
   */
  zonasProtegidas?: ZonaProtegida[];
  /** Dónde y con qué tamaño se dibuja la capa frontal; si no se informa, ocupa todo el lienzo. */
  frenteMarco?: FrenteMarco | null;
}

/** Parte del arte que debe quedar siempre visible. Coordenadas en % de la plantilla. */
export interface ZonaProtegida {
  id: string;
  nombre: string;
  /** Centro horizontal, % del ancho. */
  x: number;
  /** Centro vertical, % del alto. */
  y: number;
  ancho: number;
  alto: number;
  forma: FormaZona;
  /** Si está desactivada se ignora, pero no se borra. */
  activa?: boolean;
  /** La dedujo el sistema de la capa frontal, no el administrador. */
  automatica?: boolean;
}

export type FormaZona = "rectangulo" | "circulo";

/** Etiquetas de los campos configurables, en orden de dibujo. */
export const CAMPOS_TARJETA = [
  { key: "nombre", label: "Nombre" },
  { key: "cargo", label: "Cargo" },
  { key: "fecha", label: "Fecha de cumpleaños" },
] as const;

export const CONFIG_DEFECTO: ConfigTarjeta = {
  nombre: {
    visible: true,
    x: 50,
    y: 72,
    ancho: 80,
    fuente: 4.6,
    color: "#0B5E8A",
    alineacion: "center",
    negrita: true,
    cursiva: false,
    mayusculas: false,
    familia: "serif",
    interlineado: 1.18,
    autoAjustar: true,
    fuenteMin: 2.76,
    fuenteMax: 4.6,
  },
  cargo: {
    visible: true,
    x: 50,
    y: 79,
    ancho: 80,
    fuente: 3,
    color: "#334155",
    alineacion: "center",
    negrita: false,
    cursiva: false,
    mayusculas: false,
    familia: "sans",
    interlineado: 1.18,
    autoAjustar: true,
    fuenteMin: 1.8,
    fuenteMax: 3,
  },
  fecha: {
    visible: true,
    x: 50,
    y: 86,
    ancho: 80,
    fuente: 3,
    color: "#0B5E8A",
    alineacion: "center",
    negrita: false,
    cursiva: true,
    mayusculas: false,
    familia: "script",
    interlineado: 1.18,
    autoAjustar: true,
    fuenteMin: 1.8,
    fuenteMax: 3,
  },
  fotoMarco: null,
  zonasProtegidas: [],
  /** La capa frontal ocupa el lienzo completo hasta que se la coloca a mano. */
  frenteMarco: { visible: true, x: 50, y: 50, ancho: 100, alto: 100 },
};

/**
 * Marco por defecto al marcar la zona de la foto. Coincide con el círculo de las
 * plantillas institucionales (lado derecho, algo por encima del centro).
 */
export const MARCO_DEFECTO: FotoMarco = {
  visible: true,
  forma: "circulo",
  x: 76,
  y: 38.5,
  ancho: 35,
  alto: 35,
  borde: false,
  colorBorde: "#FFFFFF",
  grosorBorde: 2,
};

/** Copia profunda de la configuración por defecto (sin marco marcado). */
export function configPorDefecto(): ConfigTarjeta {
  return JSON.parse(JSON.stringify(CONFIG_DEFECTO)) as ConfigTarjeta;
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
  config?: ConfigTarjeta | null;
  /** Meses (1..12) en que aplica; vacío = todo el año. */
  meses?: number[];
  /** PDF o IMAGEN. */
  origen?: string | null;
  /**
   * Archivo PNG de la capa frontal que se dibuja por encima de la foto (adornos del
   * arte, por ejemplo el gorro navideño); `null` si la plantilla no tiene.
   */
  frenteArchivoOid?: number | null;
  frenteNombreOriginal?: string | null;
}

/** Posición por defecto al crear una plantilla nueva (centro, 26% del ancho). */
export const POSICION_DEFECTO: PosicionFoto = {
  px: 50,
  py: 34,
  ancho: 26,
  alto: 26,
  redondo: true,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

export const MESES_CORTOS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export interface PlantillaUpload {
  file: File;
  /**
   * Opcional: PNG (con transparencia) del arte que debe quedar **por encima** de la
   * foto y por debajo de los textos, por ejemplo el gorro de una tarjeta navideña.
   */
  frente?: File | null;
  nombre: string;
  posicion: PosicionFoto;
  config: ConfigTarjeta;
  /** Meses (1..12); vacío = todo el año. */
  meses: number[];
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function parseError(response: Response): Promise<never> {
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

export const plantillasCumpleaniosApi = {
  /** Lista las plantillas; si se indica un mes, las que aplican a ese mes van primero. */
  list: (mes?: number) =>
    apiFetch<PlantillaCumpleanios[]>(
      mes == null ? "/plantillas-cumpleanios" : `/plantillas-cumpleanios?mes=${mes}`,
    ),

  upload: async ({ file, frente, nombre, posicion, config, meses }: PlantillaUpload): Promise<PlantillaCumpleanios> => {
    const form = new FormData();
    form.append("file", file);
    if (frente) form.append("frente", frente);
    if (nombre.trim()) form.append("nombre", nombre.trim());
    form.append("fotoPx", String(posicion.px));
    form.append("fotoPy", String(posicion.py));
    form.append("fotoAncho", String(posicion.ancho));
    form.append("fotoAlto", String(posicion.alto));
    form.append("fotoRedondo", String(posicion.redondo));
    form.append("config", JSON.stringify(config));
    if (meses.length > 0) form.append("meses", meses.join(","));
    const response = await fetch(`${API_BASE}/plantillas-cumpleanios`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
    if (!response.ok) await parseError(response);
    return (await response.json()) as PlantillaCumpleanios;
  },

  /**
   * Convierte un PDF en la imagen de fondo que se usará como plantilla, para poder
   * ajustar los campos antes de guardarla. Es el mismo rasterizado que hace el
   * servidor al guardar, así que la vista previa coincide con el resultado final.
   */
  previsualizarPdf: async (file: File): Promise<Blob> => {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${API_BASE}/plantillas-cumpleanios/previsualizar`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
    if (!response.ok) await parseError(response);
    return await response.blob();
  },

  remove: (id: number) =>
    apiFetch<void>(`/plantillas-cumpleanios/${id}`, { method: "DELETE" }),

  /**
   * Añade o reemplaza la capa frontal de una plantilla ya creada (PNG con
   * transparencia). Evita tener que borrar y volver a cargar la plantilla, cosa que
   * además se bloquea cuando ya está asignada a algún cumpleaños.
   */
  subirFrente: async (id: number, file: File): Promise<PlantillaCumpleanios> => {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${API_BASE}/plantillas-cumpleanios/${id}/frente`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
    if (!response.ok) await parseError(response);
    return (await response.json()) as PlantillaCumpleanios;
  },

  quitarFrente: (id: number) =>
    apiFetch<void>(`/plantillas-cumpleanios/${id}/frente`, { method: "DELETE" }),

  /**
   * Guarda la composición (marco, textos y zonas protegidas) de una plantilla ya
   * creada, sin volver a subir el arte. Es lo que permite proteger el adorno de una
   * plantilla que ya está en uso.
   */
  actualizarConfig: (id: number, config: ConfigTarjeta) =>
    apiFetch<PlantillaCumpleanios>(`/plantillas-cumpleanios/${id}/config`, {
      method: "PUT",
      body: { config: JSON.stringify(config) },
    }),
};

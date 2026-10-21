import type { CampoTarjeta, FamiliaTexto, FotoMarco, ZonaProtegida } from "../../../../api/plantillas";

/**
 * Motor de composición de los textos de la tarjeta de cumpleaños.
 *
 * <p>Antes el ajuste de líneas se hacía con una estimación por número de caracteres
 * (`ancho / (fuente * factor)`), que se equivocaba con los nombres y cargos largos y
 * dejaba que el texto se desbordara sobre el arte o sobre otros elementos. Este módulo
 * mide el ancho <b>real</b> de cada línea (con las mismas fuentes que usa el SVG) y,
 * si el contenido no cabe, reduce el tamaño de fuente hasta el mínimo configurado en
 * lugar de salirse de su caja.</p>
 *
 * <p>El módulo es puro y determinista: la medición entra como parámetro, así que se
 * puede probar sin navegador. También funciona con la capa frontal o el marco de la
 * foto, que no intervienen aquí.</p>
 */

/** Familias tipográficas: deben coincidir con las que usa el SVG de la tarjeta. */
export const FUENTES: Record<FamiliaTexto, string> = {
  sans: "'Segoe UI', system-ui, -apple-system, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  script: "'Segoe Script', 'Brush Script MT', 'Lucida Handwriting', cursive",
};

/** Interlineado histórico, el que se usaba antes de poder configurarlo. */
export const INTERLINEADO_DEFECTO = 1.18;
/** Por defecto el ajuste automático deja bajar al 60% del tamaño preferido. */
export const RATIO_FUENTE_MIN_DEFECTO = 0.6;
export const FUENTE_MIN_ABSOLUTA = 0.8;
export const FUENTE_MAX_ABSOLUTA = 20;
/** Interlineado admisible (igual que en el backend). */
export const INTERLINEADO_MIN = 0.8;
export const INTERLINEADO_MAX = 2.5;

/** Pasos del ajuste automático: a más pasos, menos salto visible al reducir. */
const PASOS_AJUSTE = 24;
/** Fracción del tamaño de fuente que se suma a la primera línea de base (ascendente). */
const FACTOR_ASCENDENTE = 0.82;
/** Tolerancia en px para no reducir por diferencias de redondeo. */
const TOLERANCIA_PX = 0.5;

/** Mide el ancho de un texto en píxeles del lienzo con un tamaño de fuente dado. */
export type Medidor = (texto: string, tamanoPx: number, campo: CampoTarjeta) => number;

/** Campo con todos los valores derivados resueltos (nunca `undefined`). */
export interface CampoResuelto extends CampoTarjeta {
  interlineado: number;
  autoAjustar: boolean;
  fuenteMin: number;
  fuenteMax: number;
}

export interface LineaTexto {
  texto: string;
  ancho: number;
}

/** Campos de texto que llevan las tarjetas de cumpleaños. */
export type ClaveCampoTexto = "nombre" | "cargo" | "fecha";

/**
 * Problema detectado al componer la tarjeta. Se muestran al administrador en lugar de
 * dejar que el texto se superponga en silencio.
 */
export interface AvisoLayout {
  campo: ClaveCampoTexto | "foto" | "zona";
  tipo: TipoAviso;
  mensaje: string;
  /** Recuadro implicado, en px del lienzo, para resaltarlo en el editor. */
  caja?: CajaTexto;
  /** Elemento con el que choca, si el aviso es de colisión. */
  con?: string;
}

export type TipoAviso = "no-cabe" | "fuera-tarjeta" | "colision-foto" | "colision-zona" | "colision-texto";

export interface CajaTexto {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface DisposicionTexto {
  lineas: LineaTexto[];
  /** Tamaño de fuente efectivo, % del alto de la plantilla. */
  tamanoPct: number;
  /** Tamaño de fuente efectivo, px del lienzo. */
  tamanoPx: number;
  /** Tamaño de fuente preferido, % del alto. */
  tamanoPreferidoPct: number;
  altoLinea: number;
  altoTotal: number;
  /** Anclaje horizontal del texto, en px del lienzo. */
  x: number;
  ancla: "start" | "middle" | "end";
  /** Coordenada y de la primera línea de base, en px. */
  primeraBase: number;
  /** Caja ocupada por el bloque, en px. Se usa para detectar superposiciones. */
  caja: CajaTexto;
  /** Ancho de la línea más larga, en px. */
  anchoMaxLinea: number;
  /** `true` si hubo que reducir el tamaño para que cupiera. */
  ajustado: boolean;
  /** `true` si ni con el tamaño mínimo el contenido cabe. */
  noCabe: boolean;
}

export interface OpcionesDisposicion {
  texto: string;
  campo: CampoTarjeta;
  /** Ancho del lienzo (imagen de la plantilla), en px. */
  anchoLienzo: number;
  /** Alto del lienzo (imagen de la plantilla), en px. */
  altoLienzo: number;
  medir: Medidor;
  /**
   * Alto máximo disponible, en px. Si no se indica, se deduce del alto del lienzo
   * para que el bloque quede siempre dentro de la tarjeta.
   */
  altoMaxPx?: number;
}

function acotar(valor: number, min: number, max: number): number {
  if (!Number.isFinite(valor)) return min;
  return Math.min(max, Math.max(min, valor));
}

/** Completa los valores de ajuste con sus equivalentes por defecto. */
export function resolverCampo(campo: CampoTarjeta): CampoResuelto {
  const fuente = acotar(campo.fuente, FUENTE_MIN_ABSOLUTA, FUENTE_MAX_ABSOLUTA);
  const fuenteMax = acotar(campo.fuenteMax ?? fuente, FUENTE_MIN_ABSOLUTA, FUENTE_MAX_ABSOLUTA);
  let fuenteMin = acotar(
    campo.fuenteMin ?? Math.max(FUENTE_MIN_ABSOLUTA, fuente * RATIO_FUENTE_MIN_DEFECTO),
    FUENTE_MIN_ABSOLUTA,
    FUENTE_MAX_ABSOLUTA,
  );
  if (fuenteMin > fuenteMax) fuenteMin = fuenteMax;
  return {
    ...campo,
    fuente: acotar(fuente, fuenteMin, fuenteMax),
    interlineado: acotar(campo.interlineado ?? INTERLINEADO_DEFECTO, INTERLINEADO_MIN, INTERLINEADO_MAX),
    autoAjustar: campo.autoAjustar ?? true,
    fuenteMin,
    fuenteMax,
  };
}

/** Obstáculo vertical situado por encima o por debajo de un campo, en px del lienzo. */
export interface VecinoVertical {
  centroY: number;
  /** Media altura del obstáculo alrededor de su centro. */
  medioAlto: number;
}

export interface CajaEfectiva {
  /** Centro horizontal efectivo del bloque, % del ancho del lienzo. */
  centroX: number;
  /** Ancho disponible real, % del ancho del lienzo. */
  ancho: number;
}

/**
 * Ancho que puede ocupar realmente un campo dentro de la tarjeta.
 *
 * <p>El ancho configurado es un máximo, no una excusa para salirse: si la caja del
 * texto se saliera del arte, la parte de fuera no se vería nunca. Por eso se recorta
 * contra los bordes del lienzo guardando el punto de anclaje que eligió el
 * administrador (el centro del campo, o su borde en los alineados a izquierda/derecha).</p>
 */
export function cajaHorizontal(campo: CampoTarjeta): CajaEfectiva {
  const izquierda = acotar(campo.x - campo.ancho / 2, 0, 100);
  const derecha = acotar(campo.x + campo.ancho / 2, 0, 100);
  const disponible = derecha - izquierda;

  if (campo.alineacion === "left") {
    const ancho = Math.max(1, Math.min(disponible, 100 - izquierda));
    return { centroX: izquierda + ancho / 2, ancho };
  }
  if (campo.alineacion === "right") {
    const ancho = Math.max(1, Math.min(disponible, derecha));
    return { centroX: derecha - ancho / 2, ancho };
  }
  // Centrado: el texto se reparte alrededor de X, así que no puede ser más ancho que
  // el doble de la distancia al borde más cercano.
  const ancho = Math.max(1, Math.min(disponible, 2 * Math.min(campo.x, 100 - campo.x)));
  return { centroX: campo.x, ancho };
}

/**
 * Alto máximo que puede ocupar un campo sin invadir a sus vecinos verticales (otros
 * textos, la foto o una zona protegida) ni salirse del lienzo.
 *
 * <p>La referencia es el <b>borde</b> del obstáculo (no su centro), de modo que el
 * ajuste solo recorta lo que realmente se solaparía. Si se usara el centro, un nombre
 * de dos líneas se encogería mucho más de lo necesario.</p>
 */
export function altoDisponiblePx(centroY: number, altoLienzo: number, vecinos: VecinoVertical[]): number {
  let disponible = 2 * Math.min(centroY, altoLienzo - centroY);
  for (const vecino of vecinos) {
    const medioAlto = Math.max(0, vecino.medioAlto);
    const holgura =
      vecino.centroY > centroY
        ? vecino.centroY - medioAlto - centroY
        : centroY - (vecino.centroY + medioAlto);
    disponible = Math.min(disponible, 2 * Math.max(0, holgura));
  }
  return Math.max(altoLienzo * 0.04, disponible);
}

/**
 * Reparte el texto en líneas midiendo el ancho real de cada candidata.
 *
 * Si una sola palabra es más ancha que el espacio disponible se deja en su propia
 * línea (no se parte por la mitad) y la disposición lo marca como `noCabe`, para que
 * el administrador lo vea en lugar de que el texto se salga en silencio.
 */
export function envolverTexto(
  texto: string,
  anchoMaxPx: number,
  tamanoPx: number,
  campo: CampoTarjeta,
  medir: Medidor,
): LineaTexto[] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const lineas: LineaTexto[] = [];
  const anchoDe = (t: string) => medir(t, tamanoPx, campo);
  let actual = "";
  for (const palabra of palabras) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (!actual || anchoDe(candidata) <= anchoMaxPx) {
      actual = candidata;
    } else {
      lineas.push({ texto: actual, ancho: anchoDe(actual) });
      actual = palabra;
    }
  }
  if (actual) {
    lineas.push({ texto: actual, ancho: anchoDe(actual) });
  }
  return lineas;
}

/**
 * Calcula la disposición final de un campo: líneas, tamaño de fuente efectivo y
 * posición. Reduce el tamaño de fuente —dentro del rango configurado— sólo cuando el
 * texto no cabe con el tamaño preferido.
 */
export function disponerTexto(opciones: OpcionesDisposicion): DisposicionTexto {
  const campo = resolverCampo(opciones.campo);
  const { anchoLienzo, altoLienzo, medir } = opciones;
  const texto = campo.mayusculas ? opciones.texto.toLocaleUpperCase("es") : opciones.texto;

  const cajaPct = cajaHorizontal(campo);
  const centroX = (cajaPct.centroX / 100) * anchoLienzo;
  const centroY = (campo.y / 100) * altoLienzo;
  const anchoDisponible = Math.max(1, (cajaPct.ancho / 100) * anchoLienzo);
  const altoDisponible = Math.max(
    altoLienzo * 0.01,
    opciones.altoMaxPx ?? 2 * Math.min(centroY, altoLienzo - centroY),
  );

  const intento = (tamanoPct: number) => {
    const tamanoPx = (tamanoPct / 100) * altoLienzo;
    const lineas = envolverTexto(texto, anchoDisponible, tamanoPx, campo, medir);
    const anchoMaxLinea = lineas.reduce((max, linea) => Math.max(max, linea.ancho), 0);
    const altoTotal = lineas.length * tamanoPx * campo.interlineado;
    const cabe =
      anchoMaxLinea <= anchoDisponible + TOLERANCIA_PX && altoTotal <= altoDisponible + TOLERANCIA_PX;
    return { tamanoPx, lineas, anchoMaxLinea, altoTotal, cabe };
  };

  const base = intento(campo.fuente);
  let usado = base;
  if (!base.cabe && campo.autoAjustar && campo.fuenteMin < campo.fuente) {
    for (let paso = 1; paso <= PASOS_AJUSTE; paso += 1) {
      const tamanoPct = campo.fuente - ((campo.fuente - campo.fuenteMin) * paso) / PASOS_AJUSTE;
      const prueba = intento(tamanoPct);
      usado = prueba;
      if (prueba.cabe) break;
    }
  }

  const altoLinea = usado.tamanoPx * campo.interlineado;
  const altoTotal = usado.lineas.length * altoLinea;
  const primeraBase = centroY - altoTotal / 2 + usado.tamanoPx * FACTOR_ASCENDENTE;

  let x = centroX;
  let ancla: "start" | "middle" | "end" = "middle";
  if (campo.alineacion === "left") {
    x = centroX - anchoDisponible / 2;
    ancla = "start";
  } else if (campo.alineacion === "right") {
    x = centroX + anchoDisponible / 2;
    ancla = "end";
  }

  return {
    lineas: usado.lineas,
    tamanoPct: (usado.tamanoPx / altoLienzo) * 100,
    tamanoPx: usado.tamanoPx,
    tamanoPreferidoPct: campo.fuente,
    altoLinea,
    altoTotal,
    x,
    ancla,
    primeraBase,
    caja: {
      x: centroX - anchoDisponible / 2,
      y: centroY - altoTotal / 2,
      ancho: anchoDisponible,
      alto: altoTotal,
    },
    anchoMaxLinea: usado.anchoMaxLinea,
    ajustado: usado.tamanoPx < (campo.fuente / 100) * altoLienzo - 0.01,
    noCabe: !usado.cabe,
  };
}

/** Cómo se llama cada campo en los mensajes, con su artículo correcto. */
const ETIQUETAS_CAMPO: Record<ClaveCampoTexto, string> = {
  nombre: "el nombre",
  cargo: "el cargo",
  fecha: "la fecha",
};

/** "El nombre", "La fecha": para empezar una frase. */
export function nombreCampo(clave: ClaveCampoTexto): string {
  const texto = ETIQUETAS_CAMPO[clave] ?? "el texto";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "al nombre", "a la fecha": para el complemento directo. */
export function aCampo(clave: ClaveCampoTexto): string {
  const texto = ETIQUETAS_CAMPO[clave] ?? "el texto";
  return texto === "la fecha" ? "a la fecha" : "al " + texto;
}

/**
 * Resume en avisos legibles los problemas de composición detectados. Hoy solo hay uno
 * posible: el contenido no cabe ni con el tamaño mínimo configurado.
 */
export function avisosDe(disposiciones: Partial<Record<ClaveCampoTexto, DisposicionTexto>>): AvisoLayout[] {  const avisos: AvisoLayout[] = [];
  (Object.keys(disposiciones) as ClaveCampoTexto[]).forEach((clave) => {
    const disposicion = disposiciones[clave];
    if (disposicion && disposicion.lineas.length > 0 && disposicion.noCabe) {
      avisos.push({
        campo: clave,
        tipo: "no-cabe",
        mensaje:
          `${nombreCampo(clave)} no cabe ni con el tamaño mínimo (${disposicion.tamanoPct.toFixed(2)}% del alto). ` +
          "Amplíe el ancho del texto, suba el tamaño mínimo o acorte el contenido.",
      });
    }
  });
  return avisos;
}

// --------------------------------------------------------------- medición real

let contextoMedicion: CanvasRenderingContext2D | null | undefined;
const cacheMedidas = new Map<string, number>();
const MAX_CACHE = 8000;

function contexto(): CanvasRenderingContext2D | null {
  if (contextoMedicion !== undefined) {
    return contextoMedicion;
  }
  try {
    contextoMedicion =
      typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  } catch {
    contextoMedicion = null;
  }
  return contextoMedicion;
}

/**
 * Mide el ancho real del texto con la misma tipografía con la que lo dibuja el SVG.
 * Si el canvas no está disponible (pruebas en Node) cae a una estimación por
 * caracteres, para que la tarjeta nunca deje de renderizarse.
 */
export const medirConCanvas: Medidor = (texto, tamanoPx, campo) => {
  const familia = FUENTES[campo.familia] ?? FUENTES.sans;
  const estilo = campo.cursiva ? "italic" : "normal";
  const peso = campo.negrita ? "700" : "400";
  const clave = `${estilo}|${peso}|${Math.round(tamanoPx * 100)}|${familia}|${texto}`;
  const guardada = cacheMedidas.get(clave);
  if (guardada !== undefined) {
    return guardada;
  }

  const ctx = contexto();
  let ancho: number;
  if (ctx && tamanoPx > 0) {
    ctx.font = `${estilo} ${peso} ${tamanoPx}px ${familia}`;
    ancho = ctx.measureText(texto).width;
  } else {
    ancho = texto.length * Math.max(1, tamanoPx) * (campo.familia === "sans" ? 0.53 : 0.5);
  }

  if (cacheMedidas.size > MAX_CACHE) {
    cacheMedidas.clear();
  }
  cacheMedidas.set(clave, ancho);
  return ancho;
};

/**
 * Medidor de apoyo: supone que cada carácter ocupa la mitad del tamaño de fuente.
 * Sirve para pruebas y como último recurso, pero no sustituye a la medición real.
 */
export function crearMedidorAproximado(factor = 0.5): Medidor {
  return (texto, tamanoPx) => texto.length * tamanoPx * factor;
}

// ============================================ obstáculos, composición y colisiones

export const CLAVES_CAMPO_TEXTO: ClaveCampoTexto[] = ["nombre", "cargo", "fecha"];

/** Elemento del arte que la composición no puede tapar (foto o zona protegida). */
export interface Obstaculo {
  nombre: string;
  forma: "rectangulo" | "circulo";
  /** Caja en px del lienzo, origen en la esquina superior izquierda. */
  caja: CajaTexto;
}

function cajaDeCentro(
  x: number,
  y: number,
  ancho: number,
  alto: number,
  anchoLienzo: number,
  altoLienzo: number,
): CajaTexto {
  const anchoPx = (ancho / 100) * anchoLienzo;
  const altoPx = (alto / 100) * altoLienzo;
  return {
    x: (x / 100) * anchoLienzo - anchoPx / 2,
    y: (y / 100) * altoLienzo - altoPx / 2,
    ancho: anchoPx,
    alto: altoPx,
  };
}

/** Zonas protegidas que deben tenerse en cuenta (activas y con superficie). */
export function zonasActivas(zonas?: ZonaProtegida[] | null): ZonaProtegida[] {
  return (zonas ?? []).filter(
    (zona) => zona && zona.activa !== false && Number(zona.ancho) > 0 && Number(zona.alto) > 0,
  );
}

/** Obstáculos de la tarjeta: el marco de la foto y las zonas protegidas. */
export function obstaculosDe(
  marco: FotoMarco | null | undefined,
  zonas: ZonaProtegida[] | null | undefined,
  anchoLienzo: number,
  altoLienzo: number,
): Obstaculo[] {
  const obstaculos: Obstaculo[] = [];
  if (marco && marco.visible !== false) {
    obstaculos.push({
      nombre: "la foto",
      forma: marco.forma === "circulo" ? "circulo" : "rectangulo",
      caja: cajaDeCentro(marco.x, marco.y, marco.ancho, marco.alto, anchoLienzo, altoLienzo),
    });
  }
  for (const zona of zonasActivas(zonas)) {
    obstaculos.push({
      nombre: zona.nombre || "una zona protegida",
      forma: zona.forma === "circulo" ? "circulo" : "rectangulo",
      caja: cajaDeCentro(zona.x, zona.y, zona.ancho, zona.alto, anchoLienzo, altoLienzo),
    });
  }
  return obstaculos;
}

/** `true` si dos rectángulos se tocan (o están a menos de `margen` px). */
export function rectangulosSeTocan(a: CajaTexto, b: CajaTexto, margen = 0): boolean {
  return (
    a.x < b.x + b.ancho + margen &&
    b.x < a.x + a.ancho + margen &&
    a.y < b.y + b.alto + margen &&
    b.y < a.y + a.alto + margen
  );
}

/**
 * `true` si la caja choca con el obstáculo. Los obstáculos circulares se tratan como
 * elipses, para no marcar como colisión las esquinas vacías de la foto redonda.
 */
export function tocaObstaculo(caja: CajaTexto, obstaculo: Obstaculo, margen = 0): boolean {
  if (obstaculo.forma !== "circulo") {
    return rectangulosSeTocan(caja, obstaculo.caja, margen);
  }
  const centroX = obstaculo.caja.x + obstaculo.caja.ancho / 2;
  const centroY = obstaculo.caja.y + obstaculo.caja.alto / 2;
  const radioX = Math.max(0.5, obstaculo.caja.ancho / 2 + margen);
  const radioY = Math.max(0.5, obstaculo.caja.alto / 2 + margen);
  const cercaX = Math.min(Math.max(centroX, caja.x), caja.x + caja.ancho);
  const cercaY = Math.min(Math.max(centroY, caja.y), caja.y + caja.alto);
  const dx = (cercaX - centroX) / radioX;
  const dy = (cercaY - centroY) / radioY;
  return dx * dx + dy * dy <= 1;
}

export interface EntradaComposicion {
  /** Ancho del lienzo en px. */
  ancho: number;
  /** Alto del lienzo en px. */
  alto: number;
  campos: Record<ClaveCampoTexto, CampoTarjeta>;
  textos: Record<ClaveCampoTexto, string>;
  marco?: FotoMarco | null;
  zonas?: ZonaProtegida[] | null;
  medir?: Medidor;
}

export interface ComposicionTarjeta {
  ancho: number;
  alto: number;
  disposiciones: Partial<Record<ClaveCampoTexto, DisposicionTexto>>;
  avisos: AvisoLayout[];
}

/**
 * Compone la tarjeta completa: mide y ajusta cada texto respetando la foto, las zonas
 * protegidas, los textos vecinos y los bordes, y devuelve los avisos de lo que no se
 * pudo resolver. Es la única fuente de verdad: la usan la vista previa, el editor y
 * las pruebas, así lo que se ve es exactamente lo que se valida.
 */
export function componerTarjeta(entrada: EntradaComposicion): ComposicionTarjeta {
  const medir = entrada.medir ?? medirConCanvas;
  const { ancho, alto } = entrada;
  const obstaculos = obstaculosDe(entrada.marco, entrada.zonas, ancho, alto);
  const activos = CLAVES_CAMPO_TEXTO.filter(
    (clave) => entrada.campos[clave]?.visible !== false && (entrada.textos[clave] ?? "").trim() !== "",
  );

  const disposiciones: Partial<Record<ClaveCampoTexto, DisposicionTexto>> = {};
  for (const clave of activos) {
    const campo = entrada.campos[clave];
    const resuelto = resolverCampo(campo);
    const caja = cajaHorizontal(campo);
    const desde = ((caja.centroX - caja.ancho / 2) / 100) * ancho;
    const hasta = ((caja.centroX + caja.ancho / 2) / 100) * ancho;

    const vecinos: VecinoVertical[] = [];
    for (const otra of activos) {
      if (otra === clave) continue;
      const vecino = resolverCampo(entrada.campos[otra]);
      vecinos.push({
        centroY: (vecino.y / 100) * alto,
        medioAlto: ((vecino.fuente / 100) * alto) / 2,
      });
    }
    // La foto y las zonas protegidas también recortan el alto disponible, pero solo
    // cuando se cruzan con el texto en horizontal: si están a un lado, no estorban.
    for (const obstaculo of obstaculos) {
      if (obstaculo.caja.x < hasta && obstaculo.caja.x + obstaculo.caja.ancho > desde) {
        vecinos.push({
          centroY: obstaculo.caja.y + obstaculo.caja.alto / 2,
          medioAlto: obstaculo.caja.alto / 2,
        });
      }
    }

    disposiciones[clave] = disponerTexto({
      texto: entrada.textos[clave],
      campo,
      anchoLienzo: ancho,
      altoLienzo: alto,
      medir,
      altoMaxPx: altoDisponiblePx((resuelto.y / 100) * alto, alto, vecinos),
    });
  }

  return {
    ancho,
    alto,
    disposiciones,
    avisos: avisosDeComposicion(disposiciones, obstaculos, ancho, alto, entrada.campos),
  };
}

/**
 * Avisos de la composición: además de los textos que no caben, detecta superposiciones
 * con la foto, con las zonas protegidas y entre textos.
 */
export function avisosDeComposicion(
  disposiciones: Partial<Record<ClaveCampoTexto, DisposicionTexto>>,
  obstaculos: Obstaculo[],
  ancho: number,
  alto: number,
  campos: Record<ClaveCampoTexto, CampoTarjeta>,
): AvisoLayout[] {
  const avisos: AvisoLayout[] = [...avisosDe(disposiciones)];
  const colocados = CLAVES_CAMPO_TEXTO.filter(
    (clave) => disposiciones[clave] && campos[clave]?.visible !== false,
  ).map((clave) => ({ clave, disp: disposiciones[clave] as DisposicionTexto }));

  for (const { clave, disp } of colocados) {
    if (disp.caja.y < -0.5) {
      avisos.push({
        campo: clave,
        tipo: "fuera-tarjeta",
        caja: disp.caja,
        mensaje: `${nombreCampo(clave)} se sale por arriba de la tarjeta.`,
      });
    } else if (disp.caja.y + disp.caja.alto > alto + 0.5) {
      avisos.push({
        campo: clave,
        tipo: "fuera-tarjeta",
        caja: disp.caja,
        mensaje: `${nombreCampo(clave)} se sale por abajo de la tarjeta.`,
      });
    }
  }

  for (const { clave, disp } of colocados) {
    for (const obstaculo of obstaculos) {
      if (!tocaObstaculo(disp.caja, obstaculo, -0.5)) continue;
      const esFoto = obstaculo.nombre === "la foto";
      avisos.push({
        campo: clave,
        tipo: esFoto ? "colision-foto" : "colision-zona",
        caja: disp.caja,
        con: obstaculo.nombre,
        mensaje: esFoto
          ? `${nombreCampo(clave)} se superpone a la foto. Use «Reorganizar» o mueva el texto.`
          : `${nombreCampo(clave)} tapa ${obstaculo.nombre}. Use «Reorganizar» o mueva el texto.`,
      });
    }
  }

  for (let i = 0; i < colocados.length; i += 1) {
    for (let j = i + 1; j < colocados.length; j += 1) {
      if (!rectangulosSeTocan(colocados[i].disp.caja, colocados[j].disp.caja, -0.5)) continue;
      avisos.push({
        campo: colocados[i].clave,
        tipo: "colision-texto",
        caja: colocados[i].disp.caja,
        con: colocados[j].clave,
        mensaje: `${nombreCampo(colocados[i].clave)} se superpone ${aCampo(colocados[j].clave)}.`,
      });
    }
  }

  return avisos;
}

// ======================================================= reorganización automática

/** Valores propuestos para un campo, en % del lienzo. */
export interface CampoPropuesto {
  x: number;
  y: number;
  ancho: number;
  fuente: number;
}

export interface PropuestaLayout {
  /** Solo los campos que cambian. */
  cambios: Partial<Record<ClaveCampoTexto, CampoPropuesto>>;
  /** Explicación en lenguaje natural de cada cambio, para revisarlos antes de aplicar. */
  explicaciones: string[];
  /** Composición resultante, ya validada con el motor. */
  composicion: ComposicionTarjeta;
  /** `true` si la propuesta no deja ningún aviso. */
  valida: boolean;
}

export interface OpcionesReorganizar {
  /** Separación mínima entre elementos, % del lado menor del lienzo. */
  margenPct?: number;
  medir?: Medidor;
}

/** Paso vertical de la búsqueda de hueco, en % del alto. */
const PASO_BUSQUEDA_Y = 2;
/** Anchura mínima que merece la pena considerar como hueco, % del ancho. */
const ANCHO_MINIMO_HUECO = 8;

/**
 * Reorganiza los textos de forma determinista para que no tapen la foto ni las zonas
 * protegidas (el gorro navideño, un logo, un marco ilustrado) y no se salgan de la
 * tarjeta.
 *
 * <p>Primero intenta conservar el tamaño de letra que eligió el administrador y solo
 * mueve el texto al hueco libre más cercano; si eso no alcanza, acepta reducir la letra
 * hasta el mínimo configurado. Lo que no consigue, lo explica: nunca deja una
 * superposición silenciosa.</p>
 */
export function reorganizarComposicion(
  entrada: EntradaComposicion,
  opciones: OpcionesReorganizar = {},
): PropuestaLayout {
  const medir = opciones.medir ?? entrada.medir ?? medirConCanvas;
  const margenPct = Math.max(0, opciones.margenPct ?? 1.2);
  const { ancho, alto } = entrada;
  const margenPx = (margenPct / 100) * Math.min(ancho, alto);
  const separacion = Math.max(0.5, margenPx * 0.5);
  const obstaculos = obstaculosDe(entrada.marco, entrada.zonas, ancho, alto);
  const activos = CLAVES_CAMPO_TEXTO.filter(
    (clave) => entrada.campos[clave]?.visible !== false && (entrada.textos[clave] ?? "").trim() !== "",
  );

  const cambios: Partial<Record<ClaveCampoTexto, CampoPropuesto>> = {};
  const explicaciones: string[] = [];
  const ocupadas: CajaTexto[] = [];

  const cajaValida = (caja: CajaTexto): boolean => {
    if (caja.x < -0.5 || caja.x + caja.ancho > ancho + 0.5) return false;
    if (caja.y < margenPx - 0.5 || caja.y + caja.alto > alto - margenPx + 0.5) return false;
    for (const obstaculo of obstaculos) {
      if (tocaObstaculo(caja, obstaculo, separacion)) return false;
    }
    for (const otra of ocupadas) {
      if (rectangulosSeTocan(caja, otra, separacion)) return false;
    }
    return true;
  };

  /** Huecos horizontales libres a la altura indicada, en px. */
  const huecosEn = (yPx: number): Array<[number, number]> => {
    const bloqueados: Array<[number, number]> = [];
    const estorba = (caja: CajaTexto) =>
      yPx >= caja.y - separacion && yPx <= caja.y + caja.alto + separacion;
    for (const obstaculo of obstaculos) {
      if (estorba(obstaculo.caja)) {
        bloqueados.push([obstaculo.caja.x - separacion, obstaculo.caja.x + obstaculo.caja.ancho + separacion]);
      }
    }
    for (const otra of ocupadas) {
      if (estorba(otra)) bloqueados.push([otra.x - separacion, otra.x + otra.ancho + separacion]);
    }
    bloqueados.sort((a, b) => a[0] - b[0]);

    const libres: Array<[number, number]> = [];
    let cursor = 0;
    for (const [desde, hasta] of bloqueados) {
      if (desde > cursor) libres.push([cursor, desde]);
      cursor = Math.max(cursor, hasta);
    }
    if (cursor < ancho) libres.push([cursor, ancho]);
    return libres.filter(([desde, hasta]) => hasta - desde >= (ANCHO_MINIMO_HUECO / 100) * ancho);
  };

  /** Ordena los huecos: primero el que contiene el texto actual, luego el más ancho. */
  const ordenarHuecos = (huecos: Array<[number, number]>, centroPx: number) =>
    [...huecos].sort((a, b) => {
      const contieneA = a[0] <= centroPx && centroPx <= a[1] ? 1 : 0;
      const contieneB = b[0] <= centroPx && centroPx <= b[1] ? 1 : 0;
      if (contieneA !== contieneB) return contieneB - contieneA;
      return b[1] - b[0] - (a[1] - a[0]);
    });

  /**
   * Posiciones candidatas dentro de un hueco: primero conservando el ancho que eligió
   * el administrador, después aprovechando todo el hueco si con ese ancho no cabe.
   */
  const candidatosEn = (
    hueco: [number, number],
    campo: CampoResuelto,
  ): Array<{ x: number; y: number; ancho: number }> => {
    const desdePct = (hueco[0] / ancho) * 100;
    const hastaPct = (hueco[1] / ancho) * 100;
    const anchoHueco = hastaPct - desdePct;
    const anchoPreferido = Math.max(1, Math.min(campo.ancho, anchoHueco));
    const xPreferido = Math.min(
      Math.max(campo.x, desdePct + anchoPreferido / 2),
      hastaPct - anchoPreferido / 2,
    );
    const candidatos = [{ x: xPreferido, ancho: anchoPreferido }];
    if (anchoHueco > anchoPreferido + 1) {
      candidatos.push({ x: (desdePct + hastaPct) / 2, ancho: anchoHueco });
    }
    return candidatos;
  };

  const desplazamientos: number[] = [];
  for (let paso = 0; paso <= 50; paso += PASO_BUSQUEDA_Y) {
    desplazamientos.push(paso);
  }

  // Fase 1: conservar el tamaño de letra preferido.
  const pendientes: ClaveCampoTexto[] = [];
  for (const clave of activos) {
    const campo = resolverCampo(entrada.campos[clave]);
    const texto = entrada.textos[clave];
    let resuelto = false;

    for (const paso of desplazamientos) {
      for (const signo of paso === 0 ? [0] : [1, -1]) {
        const yPct = campo.y + signo * paso;
        if (yPct < margenPct || yPct > 100 - margenPct) continue;
        const huecos = ordenarHuecos(huecosEn((yPct / 100) * alto), (campo.x / 100) * ancho);

        for (const hueco of huecos) {
          for (const candidato of candidatosEn(hueco, campo)) {
            const disposicion = disponerTexto({
              texto,
              campo: { ...entrada.campos[clave], ...candidato, y: yPct, autoAjustar: false },
              anchoLienzo: ancho,
              altoLienzo: alto,
              medir,
            });
            if (disposicion.noCabe || disposicion.lineas.length === 0) continue;
            if (!cajaValida(disposicion.caja)) continue;

            ocupadas.push(disposicion.caja);
            resuelto = true;
            // Solo se propone lo que realmente cambia: así «Aplicar» no toca nada
            // cuando la composición ya era válida.
            const seMueve =
              Math.abs(yPct - campo.y) >= 0.01 ||
              Math.abs(candidato.x - campo.x) >= 0.01 ||
              Math.abs(candidato.ancho - campo.ancho) >= 0.01;
            if (seMueve) {
              cambios[clave] = { ...candidato, y: yPct, fuente: campo.fuente };
              explicaciones.push(
                `${nombreCampo(clave)} se movió para no tapar la foto ni los adornos y conserva el tamaño de letra.`,
              );
            } else {
              explicaciones.push(
                `${nombreCampo(clave)} ya estaba en un hueco libre; se mantiene tal como está.`,
              );
            }
            break;
          }
          if (resuelto) break;
        }
        if (resuelto) break;
      }
      if (resuelto) break;
    }

    if (!resuelto) pendientes.push(clave);
  }

  // Fase 2: aceptar reducir la letra hasta el mínimo, eligiendo el sitio que la deje
  // lo más grande posible.
  for (const clave of pendientes) {
    const campo = resolverCampo(entrada.campos[clave]);
    const texto = entrada.textos[clave];
    let mejor: { propuesta: CampoPropuesto; caja: CajaTexto } | null = null;

    for (const paso of desplazamientos) {
      for (const signo of paso === 0 ? [0] : [1, -1]) {
        const yPct = campo.y + signo * paso;
        if (yPct < margenPct || yPct > 100 - margenPct) continue;
        const huecos = ordenarHuecos(huecosEn((yPct / 100) * alto), (campo.x / 100) * ancho);

        for (const hueco of huecos) {
          for (const candidato of candidatosEn(hueco, campo)) {
            const disposicion = disponerTexto({
              texto,
              campo: { ...entrada.campos[clave], ...candidato, y: yPct, autoAjustar: true },
              anchoLienzo: ancho,
              altoLienzo: alto,
              medir,
            });
            if (disposicion.noCabe || disposicion.lineas.length === 0) continue;
            if (!cajaValida(disposicion.caja)) continue;
            if (!mejor || disposicion.tamanoPct > mejor.propuesta.fuente + 0.001) {
              mejor = {
                propuesta: { ...candidato, y: yPct, fuente: disposicion.tamanoPct },
                caja: disposicion.caja,
              };
            }
          }
        }
      }
    }

    if (mejor) {
      cambios[clave] = mejor.propuesta;
      ocupadas.push(mejor.caja);
      explicaciones.push(
        `${nombreCampo(clave)} se redujo a ${mejor.propuesta.fuente.toFixed(2)}% del alto para caber sin superponerse.`,
      );
    } else {
      explicaciones.push(
        `No se encontró un sitio válido para ${ETIQUETAS_CAMPO[clave] ?? "el texto"}: acorte el texto, amplíe la zona o mueva el campo a mano.`,
      );
    }
  }

  const camposFinales: Record<ClaveCampoTexto, CampoTarjeta> = {
    nombre: { ...entrada.campos.nombre },
    cargo: { ...entrada.campos.cargo },
    fecha: { ...entrada.campos.fecha },
  };
  for (const clave of Object.keys(cambios) as ClaveCampoTexto[]) {
    camposFinales[clave] = { ...camposFinales[clave], ...cambios[clave] };
  }

  const composicion = componerTarjeta({ ...entrada, campos: camposFinales, medir });
  return { cambios, explicaciones, composicion, valida: composicion.avisos.length === 0 };
}

// ============================================ zona protegida de la capa frontal

/** Rectángulo en % del lienzo, sin identificador: lo que se deduce de una imagen. */
export interface ZonaSugerida {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/**
 * Lo que se sabe de la capa frontal: el recuadro de su contenido visible (en % de la
 * propia imagen) y su tamaño natural en píxeles.
 */
export interface ZonaCapaFrontal extends ZonaSugerida {
  /** Tamaño natural de la imagen, en px. */
  anchoPx: number;
  altoPx: number;
  /** `false` si la imagen no tiene nada visible (por ejemplo, es totalmente transparente). */
  visible: boolean;
}

/** Recuadro donde se dibuja la capa frontal, en % del lienzo. */
export interface MarcoFrente {
  visible: boolean;
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/** Recuadro por defecto de la capa frontal: ocupa el lienzo completo. */
export const FRENTE_DEFECTO: MarcoFrente = { visible: true, x: 50, y: 50, ancho: 100, alto: 100 };

/**
 * Caja en px donde se dibuja la imagen de la capa frontal. La imagen completa se
 * coloca dentro del recuadro respetando su proporción y centrada, de modo que el
 * administrador puede mover el recuadro y cambiar su tamaño con cualquier PNG.
 */
export function encuadreFrente(
  marco: MarcoFrente | null | undefined,
  anchoImagen: number,
  altoImagen: number,
  anchoLienzo: number,
  altoLienzo: number,
): CajaTexto {
  const m = marco ?? FRENTE_DEFECTO;
  const rect = {
    x: ((m.x - m.ancho / 2) / 100) * anchoLienzo,
    y: ((m.y - m.alto / 2) / 100) * altoLienzo,
    ancho: Math.max(1, (m.ancho / 100) * anchoLienzo),
    alto: Math.max(1, (m.alto / 100) * altoLienzo),
  };
  if (!anchoImagen || !altoImagen) return rect;
  const escala = Math.min(rect.ancho / anchoImagen, rect.alto / altoImagen);
  const ancho = anchoImagen * escala;
  const alto = altoImagen * escala;
  return {
    x: rect.x + (rect.ancho - ancho) / 2,
    y: rect.y + (rect.alto - alto) / 2,
    ancho,
    alto,
  };
}

/**
 * Traduce el recuadro de la capa frontal (en % de la imagen) al lienzo de la tarjeta,
 * teniendo en cuenta dónde y con qué tamaño se dibuja. Es la zona que ningún texto
 * puede tapar.
 */
export function zonaCapaFrontalEnLienzo(
  zona: ZonaCapaFrontal | null | undefined,
  marco: MarcoFrente | null | undefined,
  anchoLienzo: number,
  altoLienzo: number,
): ZonaSugerida | null {
  if (!zona || !zona.visible) return null;
  const caja = encuadreFrente(marco, zona.anchoPx, zona.altoPx, anchoLienzo, altoLienzo);
  // El centro del adorno dentro de la imagen se traslada al centro dentro del recuadro.
  const x = caja.x + (zona.x / 100) * caja.ancho;
  const y = caja.y + (zona.y / 100) * caja.alto;
  return {
    x: (x / anchoLienzo) * 100,
    y: (y / altoLienzo) * 100,
    ancho: (zona.ancho / 100) * caja.ancho * (100 / anchoLienzo),
    alto: (zona.alto / 100) * caja.alto * (100 / altoLienzo),
  };
}

const MAX_ZONAS_CACHE = 24;
const zonasCache = new Map<string, ZonaCapaFrontal | null>();

/**
 * Deduce la zona que ocupa el contenido visible de la capa frontal (por ejemplo el
 * gorro navideño) leyendo el canal alfa de la imagen. Así el sistema sabe qué parte
 * del arte no puede tapar ningún dato, sin que el administrador tenga que marcarla.
 *
 * <p>Devuelve `null` si la imagen no se puede cargar. Si la imagen es transparente o
 * si ocupa casi toda la tarjeta (en ese caso no es un adorno puntual y protegerla
 * entera dejaría la tarjeta sin sitio para los textos), la zona viene vacía. Solo
 * funciona en el navegador; en las pruebas se prueba el resto del motor.</p>
 */
export async function zonaDeCapaFrontal(src: string, ladoMaximo = 320): Promise<ZonaCapaFrontal | null> {
  if (!src) return null;
  if (zonasCache.has(src)) return zonasCache.get(src) ?? null;
  const zona = await calcularZonaDeImagen(src, ladoMaximo);
  if (zonasCache.size >= MAX_ZONAS_CACHE) zonasCache.clear();
  zonasCache.set(src, zona);
  return zona;
}

async function calcularZonaDeImagen(src: string, ladoMaximo: number): Promise<ZonaCapaFrontal | null> {
  try {
    const imagen = await cargarImagen(src);
    if (!imagen || !imagen.naturalWidth || !imagen.naturalHeight) return null;
    const anchoPx = imagen.naturalWidth;
    const altoPx = imagen.naturalHeight;

    const escala = Math.min(1, ladoMaximo / Math.max(anchoPx, altoPx));
    const ancho = Math.max(1, Math.round(anchoPx * escala));
    const alto = Math.max(1, Math.round(altoPx * escala));
    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const contexto = canvas.getContext("2d", { willReadFrequently: true });
    if (!contexto) return null;
    contexto.drawImage(imagen, 0, 0, ancho, alto);

    const datos = contexto.getImageData(0, 0, ancho, alto).data;
    let minX = ancho;
    let minY = alto;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < alto; y += 1) {
      for (let x = 0; x < ancho; x += 1) {
        if (datos[(y * ancho + x) * 4 + 3] <= 8) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) {
      // La imagen no tiene nada visible: se conoce su tamaño, pero no hay zona.
      return { x: 0, y: 0, ancho: 0, alto: 0, anchoPx, altoPx, visible: false };
    }

    const anchoPct = ((maxX - minX + 1) / ancho) * 100;
    const altoPct = ((maxY - minY + 1) / alto) * 100;
    // Una capa que ocupa casi toda la tarjeta no es un adorno: protegerla entera
    // dejaría la tarjeta sin sitio para los textos.
    if (anchoPct * altoPct > 55 * 55) {
      return { x: 0, y: 0, ancho: 0, alto: 0, anchoPx, altoPx, visible: false };
    }

    return {
      x: (((minX + maxX + 1) / 2) / ancho) * 100,
      y: (((minY + maxY + 1) / 2) / alto) * 100,
      ancho: anchoPct,
      alto: altoPct,
      anchoPx,
      altoPx,
      visible: true,
    };
  } catch {
    return null;
  }
}

function cargarImagen(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolver) => {
    if (typeof Image === "undefined") {
      resolver(null);
      return;
    }
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = () => resolver(null);
    imagen.src = src;
  });
}

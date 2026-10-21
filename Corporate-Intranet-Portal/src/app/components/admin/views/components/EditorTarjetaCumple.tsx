import { useCallback, useEffect, useRef, useState } from "react";
import {
  Frame,
  Image as ImageIcon,
  Layers,
  MousePointer2,
  Plus,
  RotateCcw,
  Shield,
  Sparkles,
  Trash2,
  TriangleAlert,
  Wand2,
} from "lucide-react";
import {
  CAMPOS_TARJETA,
  CONFIG_DEFECTO,
  MARCO_DEFECTO,
  POSICION_DEFECTO,
  configPorDefecto,
  type CampoTarjeta,
  type ConfigTarjeta,
  type FotoMarco,
  type FormaMarco,
  type FrenteMarco,
  type PosicionFoto,
  type ZonaProtegida,
} from "../../../../api/plantillas";
import { agenteLayoutApi, type AjusteAgente, type EntradaAgente } from "../../../../api/agenteLayout";
import { TarjetaCumplePreview, type DiagnosticoTarjeta } from "./TarjetaCumplePreview";
import { acotarOffset, limiteOffset } from "./tarjetaFoto";
import {
  FRENTE_DEFECTO,
  FUENTE_MAX_ABSOLUTA,
  FUENTE_MIN_ABSOLUTA,
  INTERLINEADO_MAX,
  INTERLINEADO_MIN,
  componerTarjeta,
  obstaculosDe,
  reorganizarComposicion,
  resolverCampo,
  type AvisoLayout,
  type CampoPropuesto,
  type DisposicionTexto,
  type EntradaComposicion,
  type PropuestaLayout,
} from "./tarjetaLayout";

// Se siguen reexportando para no romper a quien ya las importaba desde el editor.
export { acotarOffset, limiteOffset };

type CampoTextoKey = "nombre" | "cargo" | "fecha";
/** "foto" solo aplica al asignar la plantilla; "marco", "zona" y "frente" solo al crearla. */
type Seleccion = "foto" | "marco" | "zona" | "frente" | CampoTextoKey;

interface Props {
  /** Plantilla guardada (archivo del fondo). */
  plantillaArchivoOid?: number | null;
  /** Plantilla recién elegida y aún no guardada (vista local). */
  plantillaLocal?: string;
  /** Posición de la foto. */
  posicion?: PosicionFoto | null;
  /** Estilo de los campos de texto y marco de la plantilla. */
  config?: ConfigTarjeta | null;
  /** Foto del cumpleañero ya cargada (archivo del backend o vista local). */
  fotoArchivoOid?: number | null;
  fotoLocal?: string;
  /** Capa frontal de la plantilla (PNG sobre la foto); archivo del backend o vista local. */
  frenteArchivoOid?: number | null;
  frenteLocal?: string;
  nombre: string;
  fechaCumpleanos?: string;
  edad?: number;
  cargo?: string | null;
  disabled?: boolean;
  onPosicionChange?: (posicion: PosicionFoto) => void;
  /** Si se informa, el operador está diseñando la plantilla (marco y textos). */
  onConfigChange?: (config: ConfigTarjeta) => void;
}

const ETIQUETAS: Record<Seleccion, string> = {
  foto: "Foto",
  marco: "Marco de la foto",
  zona: "Zona protegida",
  frente: "Capa frontal",
  nombre: "Nombre",
  cargo: "Cargo",
  fecha: "Fecha",
};

/** Aplica los cambios propuestos a los campos, sin tocar lo que no se indicó. */
function aplicarCambios(
  campos: Record<CampoTextoKey, CampoTarjeta>,
  cambios: Partial<Record<CampoTextoKey, CampoPropuesto>>,
): Record<CampoTextoKey, CampoTarjeta> {
  const resultado: Record<CampoTextoKey, CampoTarjeta> = { ...campos };
  for (const clave of Object.keys(cambios) as CampoTextoKey[]) {
    const cambio = cambios[clave];
    if (!cambio) continue;
    resultado[clave] = { ...resultado[clave], ...cambio };
  }
  return resultado;
}

/** Radio en % del lado menor, para dibujar la zona del marco en HTML. */
function radioHtml(forma: FormaMarco): string {
  if (forma === "circulo") return "9999px";
  if (forma === "redondeado") return "12%";
  return "0.375rem";
}

/**
 * Editor visual de la tarjeta de cumpleaños.
 *
 * <p>Tiene dos modos:</p>
 * <ul>
 *   <li><b>Diseño de la plantilla</b> ({@code onConfigChange} informado): se marca el
 *   marco donde irá la foto y se sitúan y estilizan el nombre, el cargo y la fecha.</li>
 *   <li><b>Asignación a un cumpleaños</b>: el marco ya viene fijado por la plantilla y
 *   solo se reencuadra la foto dentro de él (arrastrar y acercar), sin poder salirse.</li>
 * </ul>
 */
export function EditorTarjetaCumple({
  plantillaArchivoOid,
  plantillaLocal,
  posicion,
  config,
  fotoArchivoOid,
  fotoLocal,
  frenteArchivoOid,
  frenteLocal,
  nombre,
  fechaCumpleanos,
  edad,
  cargo,
  disabled = false,
  onPosicionChange,
  onConfigChange,
}: Props) {
  const base = posicion ?? POSICION_DEFECTO;
  const cfg = config ?? configPorDefecto();
  const modoDiseno = Boolean(onConfigChange) && !disabled;
  const editableTexto = modoDiseno;

  const contenedorRef = useRef<HTMLDivElement>(null);
  // Cuadrícula auxiliar superpuesta sobre la tarjeta (solo modo diseño, solo vista).
  const gridSVG = useMemo(() => {
    if (!modoDiseno) return null;
    const size = 50; // px
    const opacity = 0.12;
    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <pattern id="grid-pattern" width={size} height={size} patternUnits="userSpaceOnUse">
            <path d="M {size} 0 L 0 0 0 {size}" stroke="currentColor" strokeWidth={1} opacity={opacity} />
            <path d="M 0 {size} L {size} {size} {size} 0" stroke="currentColor" strokeWidth={1} opacity={opacity} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
    );
  }, [modoDiseno]);
  const arrastre = useRef<{
    tipo: Seleccion | "marco-resize" | "zona-resize" | "frente-resize";
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    frameAncho: number;
    frameAlto: number;
    /** Zona que se está manipulando, cuando `tipo` es "zona" o "zona-resize". */
    zonaId?: string;
    zonaForma?: ZonaProtegida["forma"];
  } | null>(null);
  const [seleccion, setSeleccion] = useState<Seleccion>(onConfigChange ? "marco" : "foto");
  const [zonaSel, setZonaSel] = useState<string | null>(null);
  // Composición real (medidas del lienzo y avisos) que reporta la vista previa.
  const [diagnostico, setDiagnostico] = useState<DiagnosticoTarjeta | null>(null);
  const alDiagnosticar = useCallback((d: DiagnosticoTarjeta) => setDiagnostico(d), []);

  // La plantilla puede tener una capa frontal (el adorno que va sobre la foto).
  const tieneFrente = Boolean(frenteArchivoOid || frenteLocal);
  // Recuadro donde se dibuja la capa frontal; el administrador lo mueve y lo ajusta.
  const frente: FrenteMarco = cfg.frenteMarco ?? FRENTE_DEFECTO;

  // Configuración con la que se abrió el editor: permite volver a la composición original.
  const original = useRef<ConfigTarjeta | null>(null);
  if (!original.current && config) original.current = config;

  // El marco definitivo lo define la plantilla. En plantillas antiguas (sin marco)
  // se usa la posición de foto guardada, igual que hace la vista previa.
  const marco: FotoMarco | null = cfg.fotoMarco ?? null;
  const forma: FormaMarco = marco?.forma ?? (base.redondo ? "circulo" : "rectangulo");
  const marcoX = marco?.x ?? base.px;
  const marcoY = marco?.y ?? base.py;
  const marcoAncho = marco?.ancho ?? base.ancho;
  const marcoAlto = marco?.alto ?? base.alto;

  // Al arrastrar la foto, "x/y" son su desplazamiento dentro del marco (no su centro).
  const valorX = (tipo: Seleccion) =>
    tipo === "marco" ? marcoX : tipo === "foto" ? (base.offsetX ?? 0) : cfg[tipo].x;
  const valorY = (tipo: Seleccion) =>
    tipo === "marco" ? marcoY : tipo === "foto" ? (base.offsetY ?? 0) : cfg[tipo].y;

  const setMarco = (cambios: Partial<FotoMarco>) => {
    if (!onConfigChange) return;
    const actual: FotoMarco = marco ?? { ...MARCO_DEFECTO, x: marcoX, y: marcoY, ancho: marcoAncho, alto: marcoAlto };
    onConfigChange({ ...cfg, fotoMarco: { ...actual, ...cambios } });
  };

  /** Mantiene el marco dentro del lienzo. */
  const centrarEnLienzo = (x: number, y: number, ancho: number, alto: number) => ({
    x: Math.min(100 - ancho / 2, Math.max(ancho / 2, x)),
    y: Math.min(100 - alto / 2, Math.max(alto / 2, y)),
  });

  const mover = (tipo: Seleccion | "marco-resize" | "zona-resize", x: number, y: number) => {
    // Las zonas protegidas y la capa frontal se mueven aparte: tienen su propio arrastre.
    if (tipo === "marco-resize" || tipo === "zona" || tipo === "zona-resize" || tipo === "frente") return;
    if (tipo === "marco") {
      const centro = centrarEnLienzo(x, y, marcoAncho, marcoAlto);
      setMarco(centro);
      return;
    }
    if (tipo === "foto") {
      // Arrastrar la foto ajusta su desplazamiento dentro del marco, con topes.
      const zoom = Math.max(1, base.zoom ?? 1);
      const maxX = limiteOffset(zoom);
      const maxY = limiteOffset(zoom);
      const nuevoX = Math.min(maxX, Math.max(-maxX, x));
      const nuevoY = Math.min(maxY, Math.max(-maxY, y));
      onPosicionChange?.({ ...base, offsetX: nuevoX, offsetY: nuevoY });
      return;
    }
    if (onConfigChange) {
      const px = Math.min(100, Math.max(0, x));
      const py = Math.min(100, Math.max(0, y));
      onConfigChange({ ...cfg, [tipo]: { ...cfg[tipo], x: px, y: py } });
    }
  };

  const iniciarArrastre = (tipo: Seleccion) => (evento: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (tipo === "marco" && !modoDiseno) return;
    if (tipo !== "marco" && tipo !== "foto" && !editableTexto) return;
    evento.preventDefault();
    evento.currentTarget.setPointerCapture(evento.pointerId);
    setSeleccion(tipo);
    arrastre.current = {
      tipo,
      startX: evento.clientX,
      startY: evento.clientY,
      baseX: valorX(tipo),
      baseY: valorY(tipo),
      frameAncho: marcoAncho,
      frameAlto: marcoAlto,
    };
  };

  const iniciarRedimension = (evento: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !modoDiseno) return;
    evento.preventDefault();
    evento.stopPropagation();
    evento.currentTarget.setPointerCapture(evento.pointerId);
    setSeleccion("marco");
    arrastre.current = {
      tipo: "marco-resize",
      startX: evento.clientX,
      startY: evento.clientY,
      baseX: marcoX,
      baseY: marcoY,
      frameAncho: marcoAncho,
      frameAlto: marcoAlto,
    };
  };

  const enMovimiento = (evento: React.PointerEvent<HTMLDivElement>) => {
    const datos = arrastre.current;
    const contenedor = contenedorRef.current;
    if (!datos || !contenedor) return;
    const caja = contenedor.getBoundingClientRect();
    if (caja.width === 0 || caja.height === 0) return;
    const dxPct = ((evento.clientX - datos.startX) / caja.width) * 100;
    const dyPct = ((evento.clientY - datos.startY) / caja.height) * 100;

    if (datos.tipo === "zona" || datos.tipo === "zona-resize") {
      const id = datos.zonaId;
      if (!id) return;
      if (datos.tipo === "zona") {
        const centro = centrarEnLienzo(
          datos.baseX + dxPct,
          datos.baseY + dyPct,
          datos.frameAncho,
          datos.frameAlto,
        );
        actualizarZona(id, centro);
      } else {
        const ancho = Math.min(100, Math.max(2, datos.frameAncho + dxPct * 2));
        const alto =
          datos.zonaForma === "circulo" ? ancho : Math.min(100, Math.max(2, datos.frameAlto + dyPct * 2));
        const centro = centrarEnLienzo(datos.baseX, datos.baseY, ancho, alto);
        actualizarZona(id, { ancho, alto, ...centro });
      }
      return;
    }

    if (datos.tipo === "frente" || datos.tipo === "frente-resize") {
      if (datos.tipo === "frente") {
        const centro = centrarEnLienzo(
          datos.baseX + dxPct,
          datos.baseY + dyPct,
          datos.frameAncho,
          datos.frameAlto,
        );
        setFrente(centro);
      } else {
        const ancho = Math.min(100, Math.max(2, datos.frameAncho + dxPct * 2));
        const alto = Math.min(100, Math.max(2, datos.frameAlto + dyPct * 2));
        const centro = centrarEnLienzo(datos.baseX, datos.baseY, ancho, alto);
        setFrente({ ancho, alto, ...centro });
      }
      return;
    }

    if (datos.tipo === "marco-resize") {
      const ancho = Math.min(100, Math.max(5, datos.frameAncho + dxPct * 2));
      const alto = forma === "circulo"
        ? ancho
        : Math.min(100, Math.max(5, datos.frameAlto + dyPct * 2));
      const centro = centrarEnLienzo(datos.baseX, datos.baseY, ancho, alto);
      setMarco({ ancho, alto, ...centro });
      return;
    }

    if (datos.tipo === "foto") {
      // El desplazamiento se guarda en % del marco, no del lienzo.
      const nuevoX = datos.baseX + dxPct * (100 / Math.max(1, datos.frameAncho));
      const nuevoY = datos.baseY + dyPct * (100 / Math.max(1, datos.frameAlto));
      mover("foto", nuevoX, nuevoY);
      return;
    }

    mover(datos.tipo, datos.baseX + dxPct, datos.baseY + dyPct);
  };

  const terminarArrastre = () => {
    arrastre.current = null;
  };

  const actualizarCampo = (campo: CampoTextoKey, cambios: Partial<CampoTarjeta>) => {
    if (!onConfigChange) return;
    onConfigChange({ ...cfg, [campo]: { ...cfg[campo], ...cambios } });
  };

  const restablecerFoto = () => {
    onPosicionChange?.({ ...base, zoom: 1, offsetX: 0, offsetY: 0 });
  };

  const marcarMarco = () => {
    setSeleccion("marco");
    setMarco({ ...MARCO_DEFECTO });
  };

  const quitarMarco = () => {
    if (!onConfigChange) return;
    onConfigChange({ ...cfg, fotoMarco: null });
  };

  // --------------------------------------------------------- zonas protegidas
  const zonas = cfg.zonasProtegidas ?? [];
  const zonaActual = zonas.find((zona) => zona.id === zonaSel) ?? null;

  const setZonas = (siguientes: ZonaProtegida[]) => {
    if (!onConfigChange) return;
    onConfigChange({ ...cfg, zonasProtegidas: siguientes });
  };

  const actualizarZona = (id: string, cambios: Partial<ZonaProtegida>) => {
    setZonas(zonas.map((zona) => (zona.id === id ? { ...zona, ...cambios } : zona)));
  };

  const agregarZona = () => {
    const nueva: ZonaProtegida = {
      id: `zona-${Date.now().toString(36)}`,
      nombre: `Zona protegida ${zonas.length + 1}`,
      forma: "rectangulo",
      x: 50,
      y: 50,
      ancho: 20,
      alto: 15,
      activa: true,
      automatica: false,
    };
    setZonas([...zonas, nueva]);
    setZonaSel(nueva.id);
    setSeleccion("zona");
  };

  const eliminarZona = (id: string) => {
    setZonas(zonas.filter((zona) => zona.id !== id));
    if (zonaSel === id) {
      setZonaSel(null);
      setSeleccion("marco");
    }
  };

  const iniciarArrastreZona = (zona: ZonaProtegida) => (evento: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !modoDiseno) return;
    evento.preventDefault();
    evento.stopPropagation();
    evento.currentTarget.setPointerCapture(evento.pointerId);
    setSeleccion("zona");
    setZonaSel(zona.id);
    arrastre.current = {
      tipo: "zona",
      startX: evento.clientX,
      startY: evento.clientY,
      baseX: zona.x,
      baseY: zona.y,
      frameAncho: zona.ancho,
      frameAlto: zona.alto,
      zonaId: zona.id,
      zonaForma: zona.forma,
    };
  };

  const iniciarRedimensionZona = (zona: ZonaProtegida) => (evento: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !modoDiseno) return;
    evento.preventDefault();
    evento.stopPropagation();
    evento.currentTarget.setPointerCapture(evento.pointerId);
    setSeleccion("zona");
    setZonaSel(zona.id);
    arrastre.current = {
      tipo: "zona-resize",
      startX: evento.clientX,
      startY: evento.clientY,
      baseX: zona.x,
      baseY: zona.y,
      frameAncho: zona.ancho,
      frameAlto: zona.alto,
      zonaId: zona.id,
      zonaForma: zona.forma,
    };
  };

  // ------------------------------------------------------ composición automática
  const setFrente = (cambios: Partial<FrenteMarco>) => {
    if (!onConfigChange) return;
    onConfigChange({ ...cfg, frenteMarco: { ...frente, ...cambios } });
  };

  const iniciarArrastreFrente = (evento: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !modoDiseno || !tieneFrente) return;
    evento.preventDefault();
    evento.stopPropagation();
    evento.currentTarget.setPointerCapture(evento.pointerId);
    setSeleccion("frente");
    arrastre.current = {
      tipo: "frente",
      startX: evento.clientX,
      startY: evento.clientY,
      baseX: frente.x,
      baseY: frente.y,
      frameAncho: frente.ancho,
      frameAlto: frente.alto,
    };
  };

  const iniciarRedimensionFrente = (evento: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !modoDiseno || !tieneFrente) return;
    evento.preventDefault();
    evento.stopPropagation();
    evento.currentTarget.setPointerCapture(evento.pointerId);
    setSeleccion("frente");
    arrastre.current = {
      tipo: "frente-resize",
      startX: evento.clientX,
      startY: evento.clientY,
      baseX: frente.x,
      baseY: frente.y,
      frameAncho: frente.ancho,
      frameAlto: frente.alto,
    };
  };

  const entradaComposicion = (): EntradaComposicion | null => {
    if (!diagnostico) return null;
    return {
      ancho: diagnostico.ancho,
      alto: diagnostico.alto,
      campos: { nombre: cfg.nombre, cargo: cfg.cargo, fecha: cfg.fecha },
      textos: diagnostico.textos,
      marco: cfg.fotoMarco ?? null,
      zonas: diagnostico.zonas,
    };
  };

  /** Aplica una propuesta y ajusta el mínimo de letra si hubo que reducirla. */
  const aplicarPropuesta = (cambios: Partial<Record<CampoTextoKey, CampoPropuesto>>) => {
    if (!onConfigChange) return;
    const siguiente: ConfigTarjeta = { ...cfg };
    for (const clave of Object.keys(cambios) as CampoTextoKey[]) {
      const cambio = cambios[clave];
      if (!cambio) continue;
      const actual = resolverCampo(cfg[clave]);
      siguiente[clave] = {
        ...cfg[clave],
        x: cambio.x,
        y: cambio.y,
        ancho: cambio.ancho,
        fuente: cambio.fuente,
        fuenteMin: Math.min(actual.fuenteMin, cambio.fuente),
        fuenteMax: Math.max(actual.fuenteMax, cambio.fuente),
      };
    }
    onConfigChange(siguiente);
  };

  /** Devuelve los textos a las posiciones y tamaños con los que se abrió el editor. */
  const restablecerComposicion = () => {
    const inicial = original.current;
    if (!inicial || !onConfigChange) return;
    const siguiente: ConfigTarjeta = { ...cfg };
    for (const clave of CAMPOS_TARJETA.map(({ key }) => key)) {
      const antes = inicial[key];
      siguiente[key] = {
        ...cfg[key],
        x: antes.x,
        y: antes.y,
        ancho: antes.ancho,
        fuente: antes.fuente,
      };
    }
    onConfigChange(siguiente);
  };

  const cajaCampo = (campo: CampoTextoKey) => {
    const c = cfg[campo];
    return {
      left: `${c.x - c.ancho / 2}%`,
      top: `${c.y - c.fuente * 0.7}%`,
      width: `${c.ancho}%`,
      height: `${c.fuente * 1.4}%`,
    };
  };

  const cajaMarco = {
    left: `${marcoX - marcoAncho / 2}%`,
    top: `${marcoY - marcoAlto / 2}%`,
    width: `${marcoAncho}%`,
    height: `${marcoAlto}%`,
  };

  const zoomActual = Math.max(1, base.zoom ?? 1);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div>
        <div className="relative" ref={contenedorRef}>
          {gridSVG}
          <TarjetaCumplePreview
            data={{
              nombreCompleto: nombre || "Nombre del funcionario",
              fechaCumpleanos: fechaCumpleanos ?? "",
              edad: edad ?? 0,
              cargo,
              fotoArchivoOid,
            }}
            plantillaArchivoOid={plantillaArchivoOid}
            plantillaLocal={plantillaLocal}
            posicion={base}
            config={cfg}
            frenteArchivoOid={frenteArchivoOid}
            frenteLocal={frenteLocal}
            onDiagnostico={alDiagnosticar}
            mostrarZonas={modoDiseno && (diagnostico?.zonas.length ?? 0) > 0}
            emptyLabel="Cargue el arte de la plantilla para ver la tarjeta"
          />

          {!plantillaLocal && !plantillaArchivoOid && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-300" />
            </div>
          )}

          {/* Zonas de arrastre: invisibles, sobre los elementos reales del SVG. */}
          <div
            className="absolute inset-0"
            onPointerMove={enMovimiento}
            onPointerUp={terminarArrastre}
            onPointerCancel={terminarArrastre}
          >
            {modoDiseno ? (
              <div
                onPointerDown={iniciarArrastre("marco")}
                title="Marco de la foto"
                className={`absolute touch-none ring-2 ring-inset transition-colors ${
                  modoDiseno ? "cursor-move" : "cursor-default"
                } ${
                  seleccion === "marco" ? "ring-[#0778AC] bg-[#0778AC]/5" : "ring-transparent hover:ring-[#0778AC]/50"
                }`}
                style={{ ...cajaMarco, borderRadius: radioHtml(forma) }}
              >
                {seleccion === "marco" && (
                  <div
                    onPointerDown={iniciarRedimension}
                    title="Cambiar tamaño del marco"
                    className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize touch-none rounded-sm border-2 border-white bg-[#0778AC] shadow"
                  />
                )}
              </div>
            ) : (
              <div
                onPointerDown={iniciarArrastre("foto")}
                title="Arrastre para reencuadrar la foto dentro del marco"
                className={`absolute cursor-move touch-none ring-2 ring-inset transition-colors ${
                  seleccion === "foto" ? "ring-[#0778AC] bg-[#0778AC]/5" : "ring-transparent hover:ring-[#0778AC]/50"
                }`}
                style={{ ...cajaMarco, borderRadius: radioHtml(forma) }}
              />
            )}

            {CAMPOS_TARJETA.map(({ key }) => (
              <div
                key={key}
                onPointerDown={iniciarArrastre(key)}
                title={ETIQUETAS[key]}
                className={`absolute touch-none rounded ${
                  editableTexto ? "cursor-move" : "cursor-default"
                } ring-2 ring-inset transition-colors ${
                  seleccion === key ? "ring-[#0778AC] bg-[#0778AC]/5" : "ring-transparent hover:ring-[#0778AC]/40"
                }`}
                style={cajaCampo(key)}
              />
            ))}

            {/* Capa frontal: el adorno que va sobre la foto. Se puede mover y
                cambiar de tamaño como cualquier otro elemento. Solo intercepta el
                arrastre cuando está seleccionada, para no estorbar a los textos. */}
            {modoDiseno && tieneFrente && frente.visible !== false && seleccion === "frente" && (
              <div
                onPointerDown={iniciarArrastreFrente}
                title="Capa frontal (adorno sobre la foto)"
                className={`absolute touch-none ring-2 ring-inset transition-colors ${
                  seleccion === "frente"
                    ? "ring-emerald-500 bg-emerald-400/10"
                    : "ring-transparent hover:ring-emerald-400/60"
                }`}
                style={{
                  left: `${frente.x - frente.ancho / 2}%`,
                  top: `${frente.y - frente.alto / 2}%`,
                  width: `${frente.ancho}%`,
                  height: `${frente.alto}%`,
                }}
              >
                {seleccion === "frente" && (
                  <div
                    onPointerDown={iniciarRedimensionFrente}
                    title="Cambiar el tamaño de la capa frontal"
                    className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize touch-none rounded-sm border-2 border-white bg-emerald-500 shadow"
                  />
                )}
              </div>
            )}

            {/* Zonas protegidas: se dibujan encima para poder ajustarlas sin estorbar. */}
            {modoDiseno &&
              zonas.map((zona) => (
                <div
                  key={zona.id}
                  onPointerDown={iniciarArrastreZona(zona)}
                  title={`${zona.nombre} (no se puede tapar)`}
                  className={`absolute touch-none ring-2 ring-inset transition-colors ${
                    seleccion === "zona" && zonaSel === zona.id
                      ? "ring-amber-500 bg-amber-400/10"
                      : "ring-transparent hover:ring-amber-400/60"
                  }`}
                  style={{
                    left: `${zona.x - zona.ancho / 2}%`,
                    top: `${zona.y - zona.alto / 2}%`,
                    width: `${zona.ancho}%`,
                    height: `${zona.alto}%`,
                    borderRadius: zona.forma === "circulo" ? "9999px" : "0.25rem",
                    opacity: zona.activa === false ? 0.4 : 1,
                  }}
                >
                  {seleccion === "zona" && zonaSel === zona.id && (
                    <div
                      onPointerDown={iniciarRedimensionZona(zona)}
                      title="Cambiar tamaño de la zona protegida"
                      className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize touch-none rounded-sm border-2 border-white bg-amber-500 shadow"
                    />
                  )}
                </div>
              ))}
          </div>

          {modoDiseno && !marco && (
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-semibold text-white shadow">
                <Frame className="h-3.5 w-3.5" /> Marque el marco donde irá la foto
              </span>
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1 font-semibold text-gray-600">
            <MousePointer2 className="h-3.5 w-3.5" /> Arrastre sobre la tarjeta
          </span>
          <span>
            Elemento seleccionado: <strong className="text-[#0778AC]">{ETIQUETAS[seleccion]}</strong>
          </span>
          {modoDiseno ? (
            <span className="text-gray-400">· El marco es obligatorio: sin él no se puede guardar</span>
          ) : (
            <span className="text-gray-400">· La foto se mueve solo dentro del marco</span>
          )}
        </div>

        {diagnostico && diagnostico.avisos.length > 0 && (
          <div className="mt-2 space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-2.5">
            {diagnostico.avisos.map((aviso, indice) => (
              <p
                key={`${aviso.campo}-${aviso.tipo}-${aviso.con ?? indice}`}
                className="flex items-start gap-1.5 text-[11px] text-amber-800"
              >
                <TriangleAlert className="mt-px h-3.5 w-3.5 flex-shrink-0" />
                <span>{aviso.mensaje}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5">
        {modoDiseno && (
          <PanelComposicion
            cfg={cfg}
            diagnostico={diagnostico}
            zonas={zonas}
            zonaSel={zonaSel}
            tieneFrente={tieneFrente}
            disabled={disabled}
            onSeleccionarFrente={() => setSeleccion("frente")}
            onSeleccionarZona={(id) => {
              setZonaSel(id);
              setSeleccion("zona");
            }}
            onAgregarZona={agregarZona}
            onEliminarZona={eliminarZona}
            onAplicar={aplicarPropuesta}
            onRestablecer={restablecerComposicion}
          />
        )}

        {modoDiseno ? (
          seleccion === "marco" ? (
            <ControlesMarco
              marco={marco}
              forma={forma}
              onCambio={setMarco}
              onMarcar={marcarMarco}
              onQuitar={quitarMarco}
              disabled={disabled}
            />
          ) : seleccion === "zona" ? (
            <ControlesZona
              zona={zonaActual}
              disabled={disabled}
              onCambio={(cambios) => {
                if (zonaActual) actualizarZona(zonaActual.id, cambios);
              }}
              onEliminar={() => {
                if (zonaActual) eliminarZona(zonaActual.id);
              }}
            />
          ) : seleccion === "frente" ? (
            <ControlesFrente
              frente={frente}
              tieneFrente={tieneFrente}
              disabled={disabled}
              onCambio={setFrente}
              onRestablecer={() => setFrente({ ...FRENTE_DEFECTO })}
            />
          ) : seleccion === "foto" ? (
            <ControlesFoto
              base={base}
              disabled={disabled}
              onPosicionChange={onPosicionChange}
              onRestablecer={restablecerFoto}
            />
          ) : (
            <ControlesTexto
              campo={seleccion}
              valor={cfg[seleccion]}
              editable={editableTexto}
              disposicion={diagnostico?.disposiciones[seleccion]}
              aviso={diagnostico?.avisos.find((a) => a.campo === seleccion) ?? null}
              onCambio={(cambios) => actualizarCampo(seleccion, cambios)}
              onRestablecer={() => actualizarCampo(seleccion, CONFIG_DEFECTO[seleccion])}
            />
          )
        ) : seleccion === "foto" ? (
          <ControlesReencuadre
            base={base}
            zoom={zoomActual}
            disabled={disabled}
            onPosicionChange={onPosicionChange}
            onRestablecer={restablecerFoto}
          />
        ) : (
          <ControlesTexto
            campo={seleccion}
            valor={cfg[seleccion]}
            editable={editableTexto}
            disposicion={diagnostico?.disposiciones[seleccion]}
            aviso={diagnostico?.avisos.find((a) => a.campo === seleccion) ?? null}
            onCambio={(cambios) => actualizarCampo(seleccion, cambios)}
            onRestablecer={() => actualizarCampo(seleccion, CONFIG_DEFECTO[seleccion])}
          />
        )}
      </div>
    </div>
  );
}

/** Datos medidos que se envían al agente: nunca incluye el texto de las personas. */
function entradaParaAgente(datos: EntradaComposicion): EntradaAgente {
  const composicion = componerTarjeta(datos);
  const campos = (Object.keys(datos.campos) as CampoTextoKey[])
    .filter((clave) => datos.campos[clave].visible && (datos.textos[clave] ?? "").trim() !== "")
    .map((clave) => {
      const campo = resolverCampo(datos.campos[clave]);
      const texto = datos.textos[clave].trim();
      const disposicion = composicion.disposiciones[clave];
      return {
        campo: clave,
        caracteres: texto.length,
        palabras: texto.split(/\s+/).filter(Boolean).length,
        x: campo.x,
        y: campo.y,
        ancho: campo.ancho,
        fuente: campo.fuente,
        lineas: disposicion?.lineas.length ?? 0,
        anchoMaxLinea: disposicion ? (disposicion.anchoMaxLinea / datos.ancho) * 100 : 0,
        noCabe: Boolean(disposicion?.noCabe),
      };
    });

  const obstaculos = obstaculosDe(datos.marco, datos.zonas, datos.ancho, datos.alto).map((obstaculo) => ({
    nombre: obstaculo.nombre,
    forma: obstaculo.forma,
    x: (obstaculo.caja.x / datos.ancho) * 100,
    y: (obstaculo.caja.y / datos.alto) * 100,
    ancho: (obstaculo.caja.ancho / datos.ancho) * 100,
    alto: (obstaculo.caja.alto / datos.alto) * 100,
  }));

  return { ancho: datos.ancho, alto: datos.alto, campos, obstaculos };
}

/**
 * Panel de composición: reorganización automática, sugerencias opcionales del agente de
 * IA y gestión de las zonas protegidas. Las propuestas se muestran <b>antes</b> de
 * aplicarse y siempre las valida el motor determinista.
 */
function PanelComposicion({
  cfg,
  diagnostico,
  zonas,
  zonaSel,
  tieneFrente,
  disabled,
  onSeleccionarFrente,
  onSeleccionarZona,
  onAgregarZona,
  onEliminarZona,
  onAplicar,
  onRestablecer,
}: {
  cfg: ConfigTarjeta;
  diagnostico: DiagnosticoTarjeta | null;
  zonas: ZonaProtegida[];
  zonaSel: string | null;
  tieneFrente: boolean;
  disabled?: boolean;
  onSeleccionarFrente: () => void;
  onSeleccionarZona: (id: string) => void;
  onAgregarZona: () => void;
  onEliminarZona: (id: string) => void;
  onAplicar: (cambios: Partial<Record<CampoTextoKey, CampoPropuesto>>) => void;
  onRestablecer: () => void;
}) {
  const [propuesta, setPropuesta] = useState<PropuestaLayout | null>(null);
  const [sugerencia, setSugerencia] = useState<{
    explicacion: string;
    observaciones: string[];
    ajustes: AjusteAgente[];
    cambios: Partial<Record<CampoTextoKey, CampoPropuesto>>;
    avisos: AvisoLayout[];
  } | null>(null);
  const [disponible, setDisponible] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [error, setError] = useState("");

  // Si el servidor no tiene proveedor de IA, el botón ni aparece.
  useEffect(() => {
    let vigente = true;
    agenteLayoutApi
      .disponibilidad()
      .then((respuesta) => {
        if (vigente) setDisponible(Boolean(respuesta?.disponible));
      })
      .catch(() => {
        if (vigente) setDisponible(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  const entrada = (): EntradaComposicion | null =>
    diagnostico
      ? {
          ancho: diagnostico.ancho,
          alto: diagnostico.alto,
          campos: { nombre: cfg.nombre, cargo: cfg.cargo, fecha: cfg.fecha },
          textos: diagnostico.textos,
          marco: cfg.fotoMarco ?? null,
          zonas: diagnostico.zonas,
        }
      : null;

  const reorganizar = () => {
    const datos = entrada();
    if (!datos) return;
    setError("");
    setSugerencia(null);
    setPropuesta(reorganizarComposicion(datos));
  };

  const consultarIa = async () => {
    const datos = entrada();
    if (!datos) return;
    setError("");
    setPropuesta(null);
    setConsultando(true);
    try {
      const respuesta = await agenteLayoutApi.sugerir(entradaParaAgente(datos));
      if (!respuesta) {
        setError("El servidor no tiene un proveedor de IA configurado: use la reorganización automática.");
        return;
      }
      const cambios: Partial<Record<CampoTextoKey, CampoPropuesto>> = {};
      for (const ajuste of respuesta.ajustes ?? []) {
        const actual = datos.campos[ajuste.campo] ? resolverCampo(datos.campos[ajuste.campo]) : null;
        if (!actual) continue;
        cambios[ajuste.campo] = {
          x: ajuste.x ?? actual.x,
          y: ajuste.y ?? actual.y,
          ancho: ajuste.ancho ?? actual.ancho,
          // La IA no puede agrandar la letra por encima de lo que eligió el administrador.
          fuente: Math.min(ajuste.fuente ?? actual.fuente, actual.fuente),
        };
      }
      if (Object.keys(cambios).length === 0) {
        setError(respuesta.explicacion || "El agente no propuso cambios.");
        return;
      }
      const comprobacion = componerTarjeta({
        ...datos,
        campos: aplicarCambios(datos.campos, cambios),
      });
      setSugerencia({
        explicacion: respuesta.explicacion ?? "",
        observaciones: respuesta.observaciones ?? [],
        ajustes: respuesta.ajustes ?? [],
        cambios,
        avisos: comprobacion.avisos,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo consultar el agente.");
    } finally {
      setConsultando(false);
    }
  };

  const sinCambios = propuesta ? Object.keys(propuesta.cambios).length === 0 : true;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-gray-800">Composición</h4>
        <span className="text-[10px] text-gray-400">Foto, adornos y textos</span>
      </div>

      <div className="grid gap-1.5">
        <button
          type="button"
          disabled={disabled || !diagnostico}
          onClick={reorganizar}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0778AC] px-3 py-2 text-xs font-semibold text-white hover:bg-[#065a87] disabled:opacity-40"
        >
          <Wand2 className="h-3.5 w-3.5" /> Reorganizar automáticamente
        </button>
        {disponible && (
          <button
            type="button"
            disabled={disabled || !diagnostico || consultando}
            onClick={consultarIa}
            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-fuchsia-300 bg-fuchsia-50 px-3 py-2 text-xs font-semibold text-fuchsia-700 hover:bg-fuchsia-100 disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {consultando ? "Consultando al agente…" : "Sugerir con IA"}
          </button>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={onRestablecer}
          className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#0778AC] hover:underline disabled:opacity-40"
        >
          <RotateCcw className="h-3 w-3" /> Restablecer composición original
        </button>
      </div>

      {error && <p className="text-[11px] leading-snug text-red-600">{error}</p>}

      {propuesta && (
        <div className="space-y-2 rounded-lg border border-[#0778AC]/30 bg-[#0778AC]/5 p-2.5">
          <p className="text-[11px] font-semibold text-[#0778AC]">Propuesta · sin aplicar</p>
          <ul className="space-y-1">
            {propuesta.explicaciones.map((linea, indice) => (
              <li key={indice} className="text-[11px] leading-snug text-gray-600">
                · {linea}
              </li>
            ))}
          </ul>
          {propuesta.composicion.avisos.length > 0 && (
            <div className="space-y-0.5 rounded border border-amber-300 bg-amber-50 p-1.5">
              {propuesta.composicion.avisos.map((aviso, indice) => (
                <p key={indice} className="text-[10px] leading-snug text-amber-800">
                  {aviso.mensaje}
                </p>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              disabled={disabled || sinCambios}
              onClick={() => {
                onAplicar(propuesta.cambios);
                setPropuesta(null);
              }}
              className="rounded-lg bg-[#0778AC] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#065a87] disabled:opacity-40"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={() => setPropuesta(null)}
              className="rounded-lg border-2 border-gray-200 px-3 py-1 text-[11px] font-semibold text-gray-600 hover:border-gray-300"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {sugerencia && (
        <div className="space-y-2 rounded-lg border border-fuchsia-300 bg-fuchsia-50 p-2.5">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-fuchsia-700">
            <Sparkles className="h-3.5 w-3.5" /> Sugerencia de IA · sin aplicar
          </p>
          {sugerencia.explicacion && (
            <p className="text-[11px] leading-snug text-gray-700">{sugerencia.explicacion}</p>
          )}
          <ul className="space-y-0.5">
            {sugerencia.ajustes.map((ajuste, indice) => (
              <li key={indice} className="text-[11px] leading-snug text-gray-600">
                · {ETIQUETAS[ajuste.campo]}
                {ajuste.motivo ? `: ${ajuste.motivo}` : ""}
              </li>
            ))}
            {sugerencia.observaciones.map((observacion, indice) => (
              <li key={`obs-${indice}`} className="text-[11px] leading-snug text-gray-500">
                · {observacion}
              </li>
            ))}
          </ul>
          {sugerencia.avisos.length > 0 ? (
            <div className="space-y-0.5 rounded border border-red-300 bg-red-50 p-1.5">
              <p className="text-[10px] font-semibold text-red-700">
                No supera la validación del motor; no se puede aplicar:
              </p>
              {sugerencia.avisos.map((aviso, indice) => (
                <p key={indice} className="text-[10px] leading-snug text-red-700">
                  {aviso.mensaje}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-[10px] font-semibold text-emerald-700">
              Validada por el motor: no deja superposiciones.
            </p>
          )}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              disabled={disabled || sugerencia.avisos.length > 0}
              onClick={() => {
                onAplicar(sugerencia.cambios);
                setSugerencia(null);
              }}
              className="rounded-lg bg-fuchsia-700 px-3 py-1 text-[11px] font-semibold text-white hover:bg-fuchsia-800 disabled:opacity-40"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={() => setSugerencia(null)}
              className="rounded-lg border-2 border-gray-200 px-3 py-1 text-[11px] font-semibold text-gray-600 hover:border-gray-300"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      <details className="rounded-lg border-2 border-gray-200 p-2.5">
        <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-gray-700">
          <Layers className="h-3.5 w-3.5" /> Capa frontal
        </summary>
        <p className="mt-1 text-[10px] leading-snug text-gray-500">
          {tieneFrente
            ? "El adorno que se dibuja encima de la foto. Puede moverlo y cambiar su tamaño con cualquier PNG."
            : "Esta plantilla no tiene capa frontal. Puede añadirla desde el listado de plantillas."}
        </p>
        <button
          type="button"
          disabled={disabled || !tieneFrente}
          onClick={onSeleccionarFrente}
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0778AC] hover:underline disabled:opacity-40"
        >
          <MousePointer2 className="h-3 w-3" /> Colocar la capa frontal
        </button>
      </details>

      <details className="rounded-lg border-2 border-gray-200 p-2.5">
        <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-gray-700">
          <Shield className="h-3.5 w-3.5" /> Zonas protegidas ({zonas.length})
        </summary>
        <p className="mt-1 text-[10px] leading-snug text-gray-500">
          Partes del arte que ningún dato puede tapar: el gorro navideño, un logo, un marco ilustrado. La capa frontal
          se protege sola.
        </p>
        <div className="mt-1.5 space-y-1">
          {zonas.map((zona) => (
            <div
              key={zona.id}
              className={`flex items-center gap-1 rounded border px-1.5 py-1 ${
                zonaSel === zona.id ? "border-amber-400 bg-amber-50" : "border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={() => onSeleccionarZona(zona.id)}
                className="flex-1 truncate text-left text-[11px] font-semibold text-gray-700"
              >
                {zona.nombre}
                {zona.activa === false && <span className="ml-1 text-[10px] font-normal text-gray-400">(inactiva)</span>}
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onEliminarZona(zona.id)}
                title="Eliminar zona"
                className="text-red-500 hover:text-red-700 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {zonas.length === 0 && <p className="text-[10px] text-gray-400">Sin zonas manuales.</p>}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onAgregarZona}
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0778AC] hover:underline disabled:opacity-40"
        >
          <Plus className="h-3 w-3" /> Añadir zona protegida
        </button>
      </details>
    </div>
  );
}

function ControlesFrente({
  frente,
  tieneFrente,
  disabled,
  onCambio,
  onRestablecer,
}: {
  frente: FrenteMarco;
  tieneFrente: boolean;
  disabled?: boolean;
  onCambio: (cambios: Partial<FrenteMarco>) => void;
  onRestablecer: () => void;
}) {
  if (!tieneFrente) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-800">Capa frontal</h4>
        <p className="text-[11px] leading-snug text-gray-500">
          Esta plantilla no tiene capa frontal. Puede añadirla desde el listado de plantillas, con la acción
          «Añadir capa frontal»: es el PNG transparente que se dibuja encima de la foto (por ejemplo, el gorro
          navideño).
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-800">Capa frontal</h4>
      <p className="text-[11px] leading-snug text-gray-500">
        El adorno que se dibuja <strong>encima de la foto</strong> (por ejemplo, el gorro). La imagen completa se
        coloca dentro del recuadro respetando su proporción: arrastre el recuadro para moverlo y use el punto de la
        esquina para cambiar su tamaño.
      </p>

      <Numero
        label="Posición horizontal (X %)"
        valor={frente.x}
        min={0}
        max={100}
        disabled={disabled}
        onChange={(x) => onCambio({ x })}
      />
      <Numero
        label="Posición vertical (Y %)"
        valor={frente.y}
        min={0}
        max={100}
        disabled={disabled}
        onChange={(y) => onCambio({ y })}
      />
      <Numero
        label="Ancho (%)"
        valor={frente.ancho}
        min={2}
        max={100}
        disabled={disabled}
        onChange={(ancho) => onCambio({ ancho })}
      />
      <Numero
        label="Alto (%)"
        valor={frente.alto}
        min={2}
        max={100}
        disabled={disabled}
        onChange={(alto) => onCambio({ alto })}
      />

      <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
        <input
          type="checkbox"
          checked={frente.visible !== false}
          disabled={disabled}
          onChange={(e) => onCambio({ visible: e.target.checked })}
          className="h-4 w-4 accent-[#0778AC]"
        />
        Mostrar la capa frontal
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={onRestablecer}
        className="text-xs font-semibold text-[#0778AC] hover:underline disabled:opacity-40"
      >
        Volver al tamaño completo
      </button>
    </div>
  );
}

function ControlesZona({
  zona,
  disabled,
  onCambio,
  onEliminar,
}: {
  zona: ZonaProtegida | null;
  disabled?: boolean;
  onCambio: (cambios: Partial<ZonaProtegida>) => void;
  onEliminar: () => void;
}) {
  if (!zona) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-800">Zona protegida</h4>
        <p className="text-[11px] text-gray-500">
          Seleccione una zona sobre la tarjeta o añada una nueva desde el panel de composición.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-800">Zona protegida</h4>
      <p className="text-[11px] text-gray-500">
        Los textos y la foto evitarán esta parte del arte. Arrástrela para moverla y use el punto para cambiar su tamaño.
      </p>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">Nombre</label>
        <input
          value={zona.nombre}
          disabled={disabled}
          maxLength={60}
          onChange={(e) => onCambio({ nombre: e.target.value })}
          className="w-full rounded-lg border-2 border-gray-200 p-1.5 text-xs focus:border-[#0778AC] focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">Forma</label>
        <div className="grid grid-cols-2 gap-1">
          {(["rectangulo", "circulo"] as const).map((forma) => (
            <button
              key={forma}
              type="button"
              disabled={disabled}
              onClick={() => onCambio(forma === "circulo" ? { forma, alto: zona.ancho } : { forma })}
              className={`rounded-lg border-2 px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                zona.forma === forma
                  ? "border-[#0778AC] bg-[#0778AC]/10 text-[#0778AC]"
                  : "border-gray-200 text-gray-500 hover:border-[#0778AC]/40"
              } disabled:opacity-50`}
            >
              {forma === "circulo" ? "Círculo" : "Rectángulo"}
            </button>
          ))}
        </div>
      </div>

      <Numero label="Posición horizontal (X %)" valor={zona.x} min={0} max={100} disabled={disabled} onChange={(x) => onCambio({ x })} />
      <Numero label="Posición vertical (Y %)" valor={zona.y} min={0} max={100} disabled={disabled} onChange={(y) => onCambio({ y })} />
      <Numero
        label="Ancho (%)"
        valor={zona.ancho}
        min={2}
        max={100}
        disabled={disabled}
        onChange={(ancho) => onCambio(zona.forma === "circulo" ? { ancho, alto: ancho } : { ancho })}
      />
      <Numero
        label="Alto (%)"
        valor={zona.alto}
        min={2}
        max={100}
        disabled={disabled || zona.forma === "circulo"}
        onChange={(alto) => onCambio({ alto })}
      />

      <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
        <input
          type="checkbox"
          checked={zona.activa !== false}
          disabled={disabled}
          onChange={(e) => onCambio({ activa: e.target.checked })}
          className="h-4 w-4 accent-[#0778AC]"
        />
        Zona activa
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={onEliminar}
        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
      >
        Eliminar zona
      </button>
    </div>
  );
}

function Numero({
  label,
  valor,
  min,
  max,
  step = 0.5,
  disabled,
  onChange,
}: {
  label: string;
  valor: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (valor: number) => void;
}) {
  const limitar = (numero: number) => {
    if (!Number.isFinite(numero)) return valor;
    return Math.min(max, Math.max(min, numero));
  };
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={valor}
          disabled={disabled}
          onChange={(e) => onChange(limitar(Number(e.target.value)))}
          className="flex-1 accent-[#0778AC] disabled:opacity-40"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number(valor.toFixed(2))}
          disabled={disabled}
          onChange={(e) => onChange(limitar(Number(e.target.value)))}
          className="w-[74px] rounded-lg border-2 border-gray-200 p-1.5 text-xs focus:border-[#0778AC] focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>
    </div>
  );
}

function ControlesMarco({
  marco,
  forma,
  disabled,
  onCambio,
  onMarcar,
  onQuitar,
}: {
  marco: FotoMarco | null;
  forma: FormaMarco;
  disabled?: boolean;
  onCambio: (cambios: Partial<FotoMarco>) => void;
  onMarcar: () => void;
  onQuitar: () => void;
}) {
  if (!marco) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-800">Marco de la foto</h4>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
          Toda plantilla debe tener un marco: es el círculo o recuadro del arte donde el sistema insertará
          automáticamente la foto del funcionario.
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onMarcar}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0778AC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#065a87] disabled:opacity-40"
        >
          <Frame className="h-4 w-4" /> Marcar marco de foto
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-800">Marco de la foto</h4>
      <p className="text-[11px] text-gray-500">
        Ajuste el círculo o recuadro sobre la zona del arte donde va la foto. Arrástrelo para moverlo y use el punto
        azul de la esquina para cambiar su tamaño.
      </p>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">Forma</label>
        <div className="grid grid-cols-3 gap-1">
          {(["circulo", "redondeado", "rectangulo"] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              disabled={disabled}
              onClick={() =>
                onCambio(
                  opcion === "circulo"
                    ? { forma: opcion, alto: marco.ancho }
                    : { forma: opcion },
                )
              }
              className={`rounded-lg border-2 px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                forma === opcion
                  ? "border-[#0778AC] bg-[#0778AC]/10 text-[#0778AC]"
                  : "border-gray-200 text-gray-500 hover:border-[#0778AC]/40"
              } disabled:opacity-50`}
            >
              {opcion === "circulo" ? "Círculo" : opcion === "redondeado" ? "Redondeado" : "Rectángulo"}
            </button>
          ))}
        </div>
      </div>

      <Numero
        label="Posición horizontal (X %)"
        valor={marco.x}
        min={0}
        max={100}
        disabled={disabled}
        onChange={(x) => onCambio({ x })}
      />
      <Numero
        label="Posición vertical (Y %)"
        valor={marco.y}
        min={0}
        max={100}
        disabled={disabled}
        onChange={(y) => onCambio({ y })}
      />
      <Numero
        label="Ancho (%)"
        valor={marco.ancho}
        min={5}
        max={100}
        disabled={disabled}
        onChange={(ancho) => onCambio(forma === "circulo" ? { ancho, alto: ancho } : { ancho })}
      />
      <Numero
        label="Alto (%)"
        valor={marco.alto}
        min={5}
        max={100}
        disabled={disabled || forma === "circulo"}
        onChange={(alto) => onCambio({ alto })}
      />

      <label className="flex items-center gap-2 pt-1 text-xs font-semibold text-gray-600">
        <input
          type="checkbox"
          checked={marco.borde}
          disabled={disabled}
          onChange={(e) => onCambio({ borde: e.target.checked })}
          className="h-4 w-4 accent-[#0778AC]"
        />
        Dibujar un borde sobre la foto
      </label>
      {marco.borde && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={marco.colorBorde}
              disabled={disabled}
              onChange={(e) => onCambio({ colorBorde: e.target.value.toUpperCase() })}
              className="h-8 w-12 cursor-pointer rounded border-2 border-gray-200 bg-white p-0.5 disabled:opacity-40"
            />
            <input
              value={marco.colorBorde}
              disabled={disabled}
              onChange={(e) => onCambio({ colorBorde: e.target.value })}
              maxLength={7}
              className="w-24 rounded-lg border-2 border-gray-200 p-1.5 text-xs uppercase focus:border-[#0778AC] focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div className="flex-1">
            <Numero
              label="Grosor (%)"
              valor={marco.grosorBorde}
              min={0}
              max={15}
              step={0.2}
              disabled={disabled}
              onChange={(grosorBorde) => onCambio({ grosorBorde })}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={onQuitar}
        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
      >
        Quitar marco (no se podrá guardar)
      </button>
    </div>
  );
}

function ControlesReencuadre({
  base,
  zoom,
  disabled,
  onPosicionChange,
  onRestablecer,
}: {
  base: PosicionFoto;
  zoom: number;
  disabled?: boolean;
  onPosicionChange?: (posicion: PosicionFoto) => void;
  onRestablecer: () => void;
}) {
  const set = (cambios: Partial<PosicionFoto>) => onPosicionChange?.({ ...base, ...cambios });
  const setZoom = (nuevo: number) => {
    const z = Math.min(5, Math.max(1, nuevo));
    set({
      zoom: z,
      offsetX: acotarOffset(base.offsetX ?? 0, z),
      offsetY: acotarOffset(base.offsetY ?? 0, z),
    });
  };
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-800">Reencuadrar foto</h4>
      <p className="text-[11px] text-gray-500">
        La foto se coloca sola dentro del marco. Arrástrela sobre la tarjeta para moverla y acérquela con el zoom; no
        puede salirse del marco.
      </p>
      <Numero label="Zoom" valor={zoom} min={1} max={5} step={0.05} disabled={disabled} onChange={setZoom} />
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-[11px] text-gray-500">
        Desplazamiento actual: X {Number((base.offsetX ?? 0).toFixed(1))}% · Y{" "}
        {Number((base.offsetY ?? 0).toFixed(1))}%
        <br />
        Con este zoom puede moverse hasta ±{limiteOffset(zoom).toFixed(1)}% dentro del marco.
      </div>
      <BotonRestablecer label="Centrar y quitar zoom" onClick={onRestablecer} disabled={disabled} />
    </div>
  );
}

function ControlesFoto({
  base,
  disabled,
  onPosicionChange,
  onRestablecer,
}: {
  base: PosicionFoto;
  disabled?: boolean;
  onPosicionChange?: (posicion: PosicionFoto) => void;
  onRestablecer: () => void;
}) {
  const set = (cambios: Partial<PosicionFoto>) => onPosicionChange?.({ ...base, ...cambios });
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-800">Foto</h4>
      <Numero label="Posición horizontal (X %)" valor={base.px} min={0} max={100} disabled={disabled} onChange={(px) => set({ px })} />
      <Numero label="Posición vertical (Y %)" valor={base.py} min={0} max={100} disabled={disabled} onChange={(py) => set({ py })} />
      <Numero label="Ancho (%)" valor={base.ancho} min={1} max={100} disabled={disabled} onChange={(ancho) => set({ ancho })} />
      <Numero label="Alto (%)" valor={base.alto} min={1} max={100} disabled={disabled} onChange={(alto) => set({ alto })} />
      <label className="flex items-center gap-2 pt-1 text-xs font-semibold text-gray-600">
        <input
          type="checkbox"
          checked={base.redondo}
          disabled={disabled}
          onChange={(e) => set({ redondo: e.target.checked })}
          className="h-4 w-4 accent-[#0778AC]"
        />
        Foto redonda
      </label>
      <BotonRestablecer label="Restablecer posición" onClick={onRestablecer} disabled={disabled} />
    </div>
  );
}

function ControlesTexto({
  campo,
  valor,
  editable,
  disposicion,
  aviso,
  onCambio,
  onRestablecer,
}: {
  campo: CampoTextoKey;
  valor: CampoTarjeta;
  editable: boolean;
  /** Composición real del texto calculada por el motor con el lienzo ya cargado. */
  disposicion?: DisposicionTexto;
  /** Problema detectado por el motor para este campo, si lo hay. */
  aviso?: AvisoLayout | null;
  onCambio: (cambios: Partial<CampoTarjeta>) => void;
  onRestablecer: () => void;
}) {
  const etiqueta = ETIQUETAS[campo];
  const resuelto = resolverCampo(valor);

  // El tamaño preferido nunca puede quedar fuera del rango [mínimo, máximo].
  const cambiarFuente = (fuente: number) =>
    onCambio({
      fuente,
      fuenteMin: Math.min(resuelto.fuenteMin, fuente),
      fuenteMax: Math.max(resuelto.fuenteMax, fuente),
    });

  const lineas = disposicion?.lineas.length ?? 0;
  const ajustado = Boolean(disposicion?.ajustado);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800">Texto · {etiqueta}</h4>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
          <input
            type="checkbox"
            checked={valor.visible}
            disabled={!editable}
            onChange={(e) => onCambio({ visible: e.target.checked })}
            className="h-3.5 w-3.5 accent-[#0778AC]"
          />
          Visible
        </label>
      </div>
      <Numero label="Posición horizontal (X %)" valor={valor.x} min={0} max={100} disabled={!editable} onChange={(x) => onCambio({ x })} />
      <Numero label="Posición vertical (Y %)" valor={valor.y} min={0} max={100} disabled={!editable} onChange={(y) => onCambio({ y })} />
      <Numero label="Ancho del texto (%)" valor={valor.ancho} min={5} max={100} disabled={!editable} onChange={(ancho) => onCambio({ ancho })} />
      <Numero
        label="Tamaño de letra (%)"
        valor={resuelto.fuente}
        min={FUENTE_MIN_ABSOLUTA}
        max={FUENTE_MAX_ABSOLUTA}
        step={0.1}
        disabled={!editable}
        onChange={cambiarFuente}
      />

      {aviso && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-2 text-[11px] leading-snug text-red-700">
          {aviso.mensaje}
        </div>
      )}

      {disposicion && lineas > 0 && (
        <div
          className={`rounded-lg border p-2 text-[11px] leading-snug ${
            ajustado ? "border-amber-300 bg-amber-50 text-amber-800" : "border-gray-200 bg-gray-50 text-gray-600"
          }`}
        >
          {ajustado
            ? `No cabía con ${disposicion.tamanoPreferidoPct.toFixed(2)}%: se redujo a ${disposicion.tamanoPct.toFixed(2)}%.`
            : `Tamaño efectivo: ${disposicion.tamanoPct.toFixed(2)}%.`}{" "}
          {lineas === 1 ? "1 línea." : `${lineas} líneas.`}
        </div>
      )}

      <div className="rounded-lg border-2 border-gray-200 p-2.5">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
          <input
            type="checkbox"
            checked={resuelto.autoAjustar}
            disabled={!editable}
            onChange={(e) => onCambio({ autoAjustar: e.target.checked })}
            className="h-3.5 w-3.5 accent-[#0778AC]"
          />
          Ajustar automáticamente si no cabe
        </label>
        <p className="mt-1 text-[10px] leading-snug text-gray-500">
          Si el texto no cabe en el ancho, reduce la letra hasta el tamaño mínimo en lugar de salirse del arte.
        </p>
        <div className="mt-2">
          <Numero
            label="Tamaño mínimo de letra (%)"
            valor={resuelto.fuenteMin}
            min={FUENTE_MIN_ABSOLUTA}
            max={FUENTE_MAX_ABSOLUTA}
            step={0.1}
            disabled={!editable || !resuelto.autoAjustar}
            onChange={(fuenteMin) => onCambio({ fuenteMin: Math.min(fuenteMin, resuelto.fuente) })}
          />
        </div>
      </div>

      <Numero
        label="Interlineado (veces el tamaño)"
        valor={resuelto.interlineado}
        min={INTERLINEADO_MIN}
        max={INTERLINEADO_MAX}
        step={0.02}
        disabled={!editable}
        onChange={(interlineado) => onCambio({ interlineado })}
      />

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">Alineación</label>
        <div className="grid grid-cols-3 gap-1">
          {(["left", "center", "right"] as const).map((alineacion) => (
            <button
              key={alineacion}
              type="button"
              disabled={!editable}
              onClick={() => onCambio({ alineacion })}
              className={`rounded-lg border-2 px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                valor.alineacion === alineacion
                  ? "border-[#0778AC] bg-[#0778AC]/10 text-[#0778AC]"
                  : "border-gray-200 text-gray-500 hover:border-[#0778AC]/40"
              } disabled:opacity-50`}
            >
              {alineacion === "left" ? "Izquierda" : alineacion === "center" ? "Centro" : "Derecha"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">Tipografía</label>
        <select
          value={valor.familia}
          disabled={!editable}
          onChange={(e) => onCambio({ familia: e.target.value as CampoTarjeta["familia"] })}
          className="w-full rounded-lg border-2 border-gray-200 p-2 text-xs focus:border-[#0778AC] focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="sans">Sans serif (moderna)</option>
          <option value="serif">Serif (clásica)</option>
          <option value="script">Manuscrita</option>
        </select>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
          <input type="checkbox" checked={valor.negrita} disabled={!editable} onChange={(e) => onCambio({ negrita: e.target.checked })} className="h-3.5 w-3.5 accent-[#0778AC]" />
          Negrita
        </label>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
          <input type="checkbox" checked={valor.cursiva} disabled={!editable} onChange={(e) => onCambio({ cursiva: e.target.checked })} className="h-3.5 w-3.5 accent-[#0778AC]" />
          Cursiva
        </label>
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
          <input type="checkbox" checked={valor.mayusculas} disabled={!editable} onChange={(e) => onCambio({ mayusculas: e.target.checked })} className="h-3.5 w-3.5 accent-[#0778AC]" />
          Mayúsculas
        </label>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={valor.color}
            disabled={!editable}
            onChange={(e) => onCambio({ color: e.target.value.toUpperCase() })}
            className="h-8 w-12 cursor-pointer rounded border-2 border-gray-200 bg-white p-0.5 disabled:opacity-40"
          />
          <input
            value={valor.color}
            disabled={!editable}
            onChange={(e) => onCambio({ color: e.target.value })}
            maxLength={7}
            className="w-24 rounded-lg border-2 border-gray-200 p-1.5 text-xs uppercase focus:border-[#0778AC] focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>
      </div>

      <BotonRestablecer label="Restablecer este texto" onClick={onRestablecer} disabled={!editable} />
    </div>
  );
}

function BotonRestablecer({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="text-xs font-semibold text-[#0778AC] hover:underline disabled:opacity-40"
    >
      {label}
    </button>
  );
}

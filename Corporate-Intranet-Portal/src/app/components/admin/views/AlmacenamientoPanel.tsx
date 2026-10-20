import {
  Archive,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Film,
  FolderPlus,
  HardDrive,
  Image,
  Loader2,
  MoreVertical,
  Pencil,
  Power,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "../../../api/client";
import {
  carpetasAlmacenApi,
  TIPOS_CARPETA,
  type ArchivoCarpeta,
  type CarpetaAlmacen,
  type CarpetaAlmacenPayload,
  type TipoCarpeta,
} from "../../../api/carpetasAlmacen";

/**
 * Administrador dinámico de carpetas de almacenamiento.
 *
 * Separación clave: el "bucket" es el contenedor FÍSICO de MinIO (se crea de forma
 * idempotente y solo si hace falta) y la "ubicación" es la carpeta LÓGICA (prefijo de
 * objeto). Crear una carpeta nueva NO crea un bucket nuevo. Nunca se exponen credenciales.
 *
 * Reutiliza la identidad visual del módulo: blanco, gris claro, azul #0778AC y rojo #CF3438.
 */

const TIPO_META: Record<TipoCarpeta, { label: string; icon: typeof Image }> = {
  DOCUMENTOS: { label: "Documentos", icon: FileText },
  IMAGENES: { label: "Imágenes", icon: Image },
  VIDEOS: { label: "Videos", icon: Film },
  OTROS: { label: "Otros", icon: Archive },
};

function metaTipo(tipo: string) {
  return TIPO_META[tipo as TipoCarpeta] ?? TIPO_META.OTROS;
}

function formatearTamano(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "—";
  const unidades = ["B", "KB", "MB", "GB"];
  let valor = bytes;
  let i = 0;
  while (valor >= 1024 && i < unidades.length - 1) {
    valor /= 1024;
    i += 1;
  }
  return `${valor.toFixed(i === 0 ? 0 : 1)} ${unidades[i]}`;
}

/**
 * Sugiere un prefijo a partir del nombre, sin imponerlo: el operador puede ajustarlo.
 * Se recorta a un slug seguro (minúsculas, sin acentos ni caracteres problemáticos).
 */
function prefijoSugerido(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function AlmacenamientoPanel({ puedeEditar, motivoSinPermiso }: {
  puedeEditar: boolean;
  motivoSinPermiso?: string;
}) {
  const [carpetas, setCarpetas] = useState<CarpetaAlmacen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"" | TipoCarpeta>("");

  const [modal, setModal] = useState<{ modo: "crear" | "editar"; carpeta?: CarpetaAlmacen } | null>(null);
  const [archivosDe, setArchivosDe] = useState<CarpetaAlmacen | null>(null);
  const [confirmar, setConfirmar] = useState<{ tipo: "estado" | "eliminar"; carpeta: CarpetaAlmacen } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCarpetas(await carpetasAlmacenApi.list());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudieron cargar las carpetas de almacenamiento.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return carpetas.filter((c) => {
      if (filtroTipo && c.tipo !== filtroTipo) return false;
      if (!texto) return true;
      return (
        c.nombre.toLowerCase().includes(texto) ||
        (c.descripcion ?? "").toLowerCase().includes(texto) ||
        c.prefijo.toLowerCase().includes(texto)
      );
    });
  }, [carpetas, busqueda, filtroTipo]);

  const ejecutar = async (accion: () => Promise<void>, exito: string) => {
    setOcupado(true);
    setError("");
    setNotice("");
    try {
      await accion();
      setNotice(exito);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo completar la operación.");
    } finally {
      setOcupado(false);
    }
  };

  const guardarCarpeta = async (payload: CarpetaAlmacenPayload, oid?: number) => {
    await ejecutar(
      async () => {
        if (oid) {
          await carpetasAlmacenApi.update(oid, payload);
        } else {
          await carpetasAlmacenApi.create(payload);
        }
        await cargar();
      },
      oid ? "Carpeta actualizada correctamente." : "Carpeta creada correctamente.",
    );
  };

  return (
    <section className="rounded-xl border border-gray-100 bg-gray-50/40 p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="bg-[#0778AC]/10 p-2 rounded-lg">
            <HardDrive className="w-4 h-4 text-[#0778AC]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0778AC] uppercase tracking-wide">
              Almacenamiento de archivos
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Administra los contenedores y organiza los archivos del portal
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModal({ modo: "crear" })}
          disabled={!puedeEditar}
          title={puedeEditar ? "Crear una carpeta nueva" : motivoSinPermiso}
          className="inline-flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          <FolderPlus className="w-4 h-4" />
          Crear carpeta
        </button>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, descripción o ubicación"
            aria-label="Buscar carpetas"
            className="w-full border-2 border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0778AC]"
          />
        </div>
        <div className="relative">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as "" | TipoCarpeta)}
            aria-label="Filtrar por categoría"
            className="border-2 border-gray-200 rounded-lg pl-3 pr-9 py-2 text-sm bg-white focus:outline-none focus:border-[#0778AC] appearance-none cursor-pointer"
          >
            <option value="">Todas las categorías</option>
            {TIPOS_CARPETA.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {notice && (
        <div className="mb-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando carpetas...
        </div>
      ) : carpetas.length === 0 ? (
        <div className="py-10 text-center">
          <HardDrive className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-3">Todavía no hay carpetas de almacenamiento.</p>
          <button
            type="button"
            onClick={() => setModal({ modo: "crear" })}
            disabled={!puedeEditar}
            title={puedeEditar ? "Crear la primera carpeta" : motivoSinPermiso}
            className="inline-flex items-center gap-2 border-2 border-[#0778AC]/30 text-[#0778AC] hover:bg-[#0778AC]/5 disabled:opacity-40 px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <FolderPlus className="w-4 h-4" />
            Crear la primera carpeta
          </button>
        </div>
      ) : visibles.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">
          No hay carpetas que coincidan con la búsqueda o el filtro.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((c) => {
            const Icono = metaTipo(c.tipo).icon;
            return (
              <article
                key={c.oid}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-[#0778AC]/10 p-2 rounded-lg flex-shrink-0">
                    <Icono className="w-4 h-4 text-[#0778AC]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-gray-800 text-sm truncate" title={c.nombre}>
                      {c.nombre}
                    </h4>
                    <p className="text-[11px] text-gray-500 line-clamp-2 min-h-[2em]">
                      {c.descripcion || "Sin descripción"}
                    </p>
                  </div>
                  <AccionesMenu
                    carpeta={c}
                    puedeEditar={puedeEditar}
                    motivoSinPermiso={motivoSinPermiso}
                    onEditar={() => setModal({ modo: "editar", carpeta: c })}
                    onEstado={() => setConfirmar({ tipo: "estado", carpeta: c })}
                    onEliminar={() => setConfirmar({ tipo: "eliminar", carpeta: c })}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
                  <span className="bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                    {metaTipo(c.tipo).label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      c.activo ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {c.activo ? "Activo" : "Inactivo"}
                  </span>
                  <span className="bg-[#0778AC]/10 text-[#0778AC] rounded-full px-2 py-0.5">
                    {c.archivos} archivo{c.archivos === 1 ? "" : "s"}
                  </span>
                </div>

                <p className="text-[10px] text-gray-400 font-mono truncate" title={`${c.bucket}/${c.prefijo}`}>
                  {c.bucket}/{c.prefijo}
                </p>

                <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => setArchivosDe(c)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0778AC] hover:bg-[#0778AC]/5 rounded-lg px-2.5 py-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver archivos
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ modo: "editar", carpeta: c })}
                    disabled={!puedeEditar}
                    title={puedeEditar ? "Editar carpeta" : motivoSinPermiso}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 rounded-lg px-2.5 py-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modal && (
        <ModalCarpeta
          modo={modal.modo}
          carpeta={modal.carpeta}
          bucketsSugeridos={Array.from(new Set(carpetas.map((c) => c.bucket)))}
          ocupado={ocupado}
          onCerrar={() => setModal(null)}
          onGuardar={async (payload) => {
            await guardarCarpeta(payload, modal.carpeta?.oid);
            setModal(null);
          }}
        />
      )}

      {archivosDe && (
        <ModalArchivos carpeta={archivosDe} onCerrar={() => setArchivosDe(null)} />
      )}

      {confirmar && (
        <ModalConfirmacion
          tipo={confirmar.tipo}
          carpeta={confirmar.carpeta}
          ocupado={ocupado}
          onCerrar={() => setConfirmar(null)}
          onConfirmar={async () => {
            const { tipo, carpeta } = confirmar;
            if (tipo === "estado") {
              await ejecutar(
                async () => {
                  await carpetasAlmacenApi.setEstado(carpeta.oid, !carpeta.activo);
                  await cargar();
                },
                carpeta.activo
                  ? "Carpeta desactivada. Sus archivos se conservan y siguen descargables."
                  : "Carpeta activada correctamente.",
              );
            } else {
              await ejecutar(
                async () => {
                  await carpetasAlmacenApi.remove(carpeta.oid);
                  await cargar();
                },
                "Carpeta eliminada correctamente.",
              );
            }
            setConfirmar(null);
          }}
        />
      )}
    </section>
  );
}

/** Menú de acciones adicionales (activar/inactivar, eliminar). */
function AccionesMenu({
  carpeta,
  puedeEditar,
  motivoSinPermiso,
  onEditar,
  onEstado,
  onEliminar,
}: {
  carpeta: CarpetaAlmacen;
  puedeEditar: boolean;
  motivoSinPermiso?: string;
  onEditar: () => void;
  onEstado: () => void;
  onEliminar: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, [abierto]);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Más acciones para ${carpeta.nombre}`}
        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {abierto && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-40 bg-white rounded-lg border border-gray-100 shadow-lg py-1 z-20"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAbierto(false);
              onEditar();
            }}
            disabled={!puedeEditar}
            title={puedeEditar ? undefined : motivoSinPermiso}
            className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-2"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAbierto(false);
              onEstado();
            }}
            disabled={!puedeEditar}
            title={puedeEditar ? undefined : motivoSinPermiso}
            className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-2"
          >
            <Power className="w-3.5 h-3.5" />
            {carpeta.activo ? "Desactivar" : "Activar"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAbierto(false);
              onEliminar();
            }}
            disabled={!puedeEditar}
            title={puedeEditar ? undefined : motivoSinPermiso}
            className="w-full text-left px-3 py-2 text-xs text-[#CF3438] hover:bg-red-50 disabled:opacity-40 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

/** Formulario único reutilizable para crear y editar carpetas. */
function ModalCarpeta({
  modo,
  carpeta,
  bucketsSugeridos,
  ocupado,
  onCerrar,
  onGuardar,
}: {
  modo: "crear" | "editar";
  carpeta?: CarpetaAlmacen;
  bucketsSugeridos: string[];
  ocupado: boolean;
  onCerrar: () => void;
  onGuardar: (payload: CarpetaAlmacenPayload) => Promise<void>;
}) {
  const [nombre, setNombre] = useState(carpeta?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(carpeta?.descripcion ?? "");
  const [tipo, setTipo] = useState<TipoCarpeta>((carpeta?.tipo as TipoCarpeta) ?? "DOCUMENTOS");
  const [bucket, setBucket] = useState(carpeta?.bucket ?? "documentos");
  const [prefijo, setPrefijo] = useState(carpeta?.prefijo ?? "");
  const [activo, setActivo] = useState(carpeta?.activo ?? true);
  const [prefijoTocado, setPrefijoTocado] = useState(Boolean(carpeta));

  // En modo crear el prefijo sigue al nombre hasta que el operador lo edite a mano.
  const prefijoEfectivo = prefijoTocado ? prefijo : prefijoSugerido(nombre);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modo === "crear" ? "Crear carpeta" : "Editar carpeta"}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">
            {modo === "crear" ? "Crear carpeta" : "Editar carpeta"}
          </h3>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label htmlFor="carpeta-nombre" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nombre
            </label>
            <input
              id="carpeta-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="avances-proyectos"
              className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC]"
            />
          </div>

          <div>
            <label htmlFor="carpeta-desc" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Descripción
            </label>
            <input
              id="carpeta-desc"
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Para qué se usa esta carpeta"
              className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC]"
            />
          </div>

          <div>
            <label htmlFor="carpeta-tipo" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tipo de contenido
            </label>
            <select
              id="carpeta-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoCarpeta)}
              className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:border-[#0778AC]"
            >
              {TIPOS_CARPETA.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-4 space-y-3">
            <p className="text-xs font-bold text-[#0778AC] uppercase tracking-wide">Ubicación de almacenamiento</p>
            <div>
              <label htmlFor="carpeta-bucket" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Bucket físico
              </label>
              <input
                id="carpeta-bucket"
                type="text"
                list="buckets-sugeridos"
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                placeholder="documentos"
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:border-[#0778AC]"
              />
              <datalist id="buckets-sugeridos">
                {Array.from(new Set([...bucketsSugeridos, "documentos", "imagenes", "videos"])).map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              <p className="text-[11px] text-gray-400 mt-1">
                Contenedor físico. Si no existe, se crea automáticamente al guardar.
              </p>
            </div>
            <div>
              <label htmlFor="carpeta-prefijo" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Carpeta lógica dentro del bucket
              </label>
              <input
                id="carpeta-prefijo"
                type="text"
                value={prefijoEfectivo}
                onChange={(e) => {
                  setPrefijoTocado(true);
                  setPrefijo(e.target.value);
                }}
                placeholder="avances-proyectos"
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm font-mono bg-white focus:outline-none focus:border-[#0778AC]"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Ruta lógica: se almacenará en <span className="font-mono">{bucket}/{prefijoEfectivo || "…"}/</span>
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-4 h-4 accent-[#0778AC]"
            />
            <span className="text-sm text-gray-700">Carpeta activa (admite cargas nuevas)</span>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={ocupado || !nombre.trim() || !bucket.trim()}
            onClick={() =>
              onGuardar({
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || null,
                tipo,
                bucket: bucket.trim(),
                prefijo: (prefijoEfectivo || prefijoSugerido(nombre)).trim(),
                activo,
              })
            }
            className="inline-flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-semibold"
          >
            {ocupado && <Loader2 className="w-4 h-4 animate-spin" />}
            {modo === "crear" ? "Crear carpeta" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Icono y color por categoría de vista previa. */
const VISTA_META: Record<ArchivoCarpeta["vista"], { icon: typeof Image; color: string; label: string }> = {
  IMAGEN: { icon: Image, color: "text-[#0778AC] bg-[#0778AC]/10", label: "Imagen" },
  VIDEO: { icon: Film, color: "text-[#CF3438] bg-[#CF3438]/10", label: "Video" },
  PDF: { icon: FileText, color: "text-[#CF3438] bg-[#CF3438]/10", label: "PDF" },
  TEXTO: { icon: FileText, color: "text-gray-500 bg-gray-100", label: "Texto" },
  OTRO: { icon: Archive, color: "text-gray-500 bg-gray-100", label: "Archivo" },
};

/**
 * Lista los archivos reales de la carpeta (bucket + prefijo) y permite hacer clic
 * en cualquiera para verlo en un modal: imagen, video, PDF o texto. La descarga se
 * hace con el token (blob), de modo que nunca se expone una URL pública ni credenciales.
 */
function ModalArchivos({ carpeta, onCerrar }: { carpeta: CarpetaAlmacen; onCerrar: () => void }) {
  const [archivos, setArchivos] = useState<ArchivoCarpeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seleccionado, setSeleccionado] = useState<ArchivoCarpeta | null>(null);

  useEffect(() => {
    let activo = true;
    (async () => {
      setLoading(true);
      try {
        const data = await carpetasAlmacenApi.archivos(carpeta.oid);
        if (activo) setArchivos(data);
      } catch (e) {
        if (activo) setError(e instanceof ApiError ? e.message : "No se pudieron cargar los archivos.");
      } finally {
        if (activo) setLoading(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [carpeta.oid]);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Archivos de ${carpeta.nombre}`}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-800">Archivos de {carpeta.nombre}</h3>
              <p className="text-[11px] text-gray-400 font-mono">{carpeta.bucket}/{carpeta.prefijo}</p>
            </div>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="py-10 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando archivos...
              </div>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : archivos.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">Esta carpeta todavía no tiene archivos.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {archivos.map((a) => {
                  const meta = VISTA_META[a.vista] ?? VISTA_META.OTRO;
                  const Icono = meta.icon;
                  return (
                    <li key={a.key}>
                      <button
                        type="button"
                        onClick={() => setSeleccionado(a)}
                        title="Ver archivo"
                        className="w-full flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                      >
                        <span className={`p-2 rounded-lg flex-shrink-0 ${meta.color}`}>
                          <Icono className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-gray-700 truncate" title={a.nombre}>
                            {a.nombre}
                          </span>
                          <span className="block text-[11px] text-gray-400">
                            {meta.label}
                            {a.tipo ? ` · ${a.tipo}` : ""}
                            {!a.enMinio ? " · solo registro" : ""}
                          </span>
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
                          {formatearTamano(a.tamano)}
                        </span>
                        <Eye className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {seleccionado && (
        <ModalVistaArchivo carpeta={carpeta} archivo={seleccionado} onCerrar={() => setSeleccionado(null)} />
      )}
    </>
  );
}

/** Vista previa del archivo seleccionado, descargado con el token (blob). */
function ModalVistaArchivo({
  carpeta,
  archivo,
  onCerrar,
}: {
  carpeta: CarpetaAlmacen;
  archivo: ArchivoCarpeta;
  onCerrar: () => void;
}) {
  const [url, setUrl] = useState("");
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    let objectUrl = "";
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await carpetasAlmacenApi.contenido(carpeta.oid, archivo.key);
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? "El archivo no está disponible en el almacenamiento."
              : "No se pudo abrir el archivo.",
          );
        }
        if (archivo.vista === "TEXTO") {
          const contenido = await res.text();
          if (activo) setTexto(contenido);
        } else {
          const blob = await res.blob();
          objectUrl = URL.createObjectURL(blob);
          if (activo) setUrl(objectUrl);
        }
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : "No se pudo abrir el archivo.");
      } finally {
        if (activo) setLoading(false);
      }
    })();
    return () => {
      activo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [carpeta.oid, archivo.key, archivo.vista]);

  const descargar = async () => {
    try {
      const res = await carpetasAlmacenApi.contenido(carpeta.oid, archivo.key);
      if (!res.ok) return;
      const blob = await res.blob();
      const enlace = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      enlace.href = objectUrl;
      enlace.download = archivo.nombre;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // descarga no disponible
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Vista previa de ${archivo.nombre}`}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 truncate" title={archivo.nombre}>
              {archivo.nombre}
            </h3>
            <p className="text-[11px] text-gray-400">
              {VISTA_META[archivo.vista]?.label ?? "Archivo"}
              {archivo.tipo ? ` · ${archivo.tipo}` : ""}
              {archivo.tamano ? ` · ${formatearTamano(archivo.tamano)}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={descargar}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0778AC] hover:bg-[#0778AC]/5 rounded-lg px-2.5 py-1.5"
            >
              <Download className="w-4 h-4" />
              Descargar
            </button>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-auto flex-1 bg-gray-50/60 flex items-center justify-center min-h-[240px]">
          {loading ? (
            <div className="py-10 text-sm text-gray-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Abriendo archivo...
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 text-center">{error}</p>
          ) : archivo.vista === "IMAGEN" ? (
            <img src={url} alt={archivo.nombre} className="max-h-[70vh] max-w-full object-contain rounded-lg" />
          ) : archivo.vista === "VIDEO" ? (
            <video src={url} controls className="max-h-[70vh] max-w-full rounded-lg bg-black">
              Tu navegador no puede reproducir este video.
            </video>
          ) : archivo.vista === "PDF" ? (
            <iframe src={url} title={archivo.nombre} className="w-full h-[70vh] rounded-lg border border-gray-100" />
          ) : archivo.vista === "TEXTO" ? (
            <pre className="w-full max-h-[70vh] overflow-auto bg-white border border-gray-100 rounded-lg p-4 text-xs text-gray-700 whitespace-pre-wrap break-words text-left">
              {texto || "(archivo vacío)"}
            </pre>
          ) : (
            <div className="text-center py-10">
              <Archive className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Este tipo de archivo no tiene vista previa.</p>
              <button
                type="button"
                onClick={descargar}
                className="mt-3 inline-flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <Download className="w-4 h-4" />
                Descargar archivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Confirmación para operaciones sensibles (desactivar/eliminar). */
function ModalConfirmacion({
  tipo,
  carpeta,
  ocupado,
  onCerrar,
  onConfirmar,
}: {
  tipo: "estado" | "eliminar";
  carpeta: CarpetaAlmacen;
  ocupado: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
}) {
  const desactivar = tipo === "estado" && carpeta.activo;
  const titulo = tipo === "eliminar" ? "Eliminar carpeta" : desactivar ? "Desactivar carpeta" : "Activar carpeta";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{titulo}</h3>
        </div>
        <div className="px-6 py-5 text-sm text-gray-600">
          {tipo === "eliminar" ? (
            <>
              ¿Eliminar la carpeta <span className="font-semibold">{carpeta.nombre}</span>? Solo se permite si no
              tiene archivos. Esta acción no se puede deshacer.
            </>
          ) : desactivar ? (
            <>
              ¿Desactivar <span className="font-semibold">{carpeta.nombre}</span>? Dejará de admitir cargas nuevas,
              pero <span className="font-semibold">sus archivos se conservan y siguen descargables</span>.
            </>
          ) : (
            <>
              ¿Activar <span className="font-semibold">{carpeta.nombre}</span> para que admita cargas nuevas?
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={ocupado}
            className={`inline-flex items-center gap-2 disabled:opacity-40 text-white px-5 py-2.5 rounded-lg text-sm font-semibold ${
              tipo === "eliminar" ? "bg-[#CF3438] hover:bg-[#a8282b]" : "bg-[#0778AC] hover:bg-[#065a87]"
            }`}
          >
            {ocupado && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

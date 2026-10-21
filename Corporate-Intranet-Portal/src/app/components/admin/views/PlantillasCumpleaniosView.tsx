import { CalendarRange, FileText, Image as ImageIcon, Layers, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ApiError } from "../../../api/client";
import { filesApi } from "../../../api/files";
import {
  MESES_CORTOS,
  MESES_LARGOS,
  POSICION_DEFECTO,
  configPorDefecto,
  plantillasCumpleaniosApi,
  type ConfigTarjeta,
  type PlantillaCumpleanios,
  type PosicionFoto,
} from "../../../api/plantillas";
import { noPermissionReason } from "../AccessGate";
import { useAdminAccess } from "../useAdminAccess";
import { EditorTarjetaCumple } from "./components/EditorTarjetaCumple";

const MAX_MB = 5;
const TIPOS_VALIDOS = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

const TABS = [
  { id: "cargar", label: "Cargar plantilla" },
  { id: "listado", label: "Plantillas cargadas" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function formatFecha(fecha?: string | null): string {
  if (!fecha) return "-";
  try {
    return format(new Date(fecha), "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es });
  } catch {
    return "-";
  }
}

function esPdf(file: File): boolean {
  return file.type.toLowerCase() === "application/pdf" || /\.pdf$/i.test(file.name);
}

/** La capa frontal admite solo imágenes (nunca PDF): es un PNG/JPG sobre la foto. */
function esImagenFrente(file: File): boolean {
  const tipo = file.type.toLowerCase();
  return (
    tipo === "image/png" ||
    tipo === "image/jpeg" ||
    tipo === "image/jpg" ||
    /\.(jpe?g|png)$/i.test(file.name)
  );
}

/** "Todo el año", "Diciembre" o "Enero, Julio y Diciembre". */
function describirMeses(meses?: number[] | null): string {
  if (!meses || meses.length === 0) return "Todo el año";
  const nombres = [...meses].sort((a, b) => a - b).map((m) => MESES_LARGOS[m - 1] ?? String(m));
  const unidos = nombres.length === 1
    ? nombres[0]
    : `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
  return unidos.charAt(0).toUpperCase() + unidos.slice(1);
}

export function PlantillasCumpleaniosView() {
  const { can } = useAdminAccess();
  const canGrabar = can("plantillas-cumpleanios", "grabar");
  const canEliminar = can("plantillas-cumpleanios", "eliminar");

  const [tab, setTab] = useState<TabId>("cargar");
  const [plantillas, setPlantillas] = useState<PlantillaCumpleanios[]>([]);
  const [imagenes, setImagenes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [nombre, setNombre] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [frente, setFrente] = useState<File | null>(null);
  const [frentePreview, setFrentePreview] = useState("");
  const [frenteError, setFrenteError] = useState("");
  const [posicion, setPosicion] = useState<PosicionFoto>({ ...POSICION_DEFECTO });
  const [config, setConfig] = useState<ConfigTarjeta>(configPorDefecto());
  // Textos de prueba: permiten comprobar sobre la tarjeta cómo se ajustan los nombres
  // y cargos largos antes de guardar la plantilla.
  const [nombreEjemplo, setNombreEjemplo] = useState("María Pérez");
  const [cargoEjemplo, setCargoEjemplo] = useState("Profesional de enfermería");
  const [meses, setMeses] = useState<number[]>([]);
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previsualizando, setPrevisualizando] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [frenteEnProceso, setFrenteEnProceso] = useState<number | null>(null);
  // Plantilla cuya composición se está editando (el arte no se vuelve a subir).
  const [editando, setEditando] = useState<PlantillaCumpleanios | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const frenteInputRef = useRef<HTMLInputElement>(null);
  const frenteInputRefCarga = useRef<HTMLInputElement>(null);
  const frenteObjetivoRef = useRef<number | null>(null);
  const imagenesRef = useRef<Record<number, string>>({});
  imagenesRef.current = imagenes;
  const previewRef = useRef("");
  previewRef.current = preview;
  const frentePreviewRef = useRef("");
  frentePreviewRef.current = frentePreview;

  const revocar = (url: string) => {
    if (url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // noop
      }
    }
  };

  const revocarTodas = (mapa: Record<number, string>) => {
    Object.keys(mapa).forEach((clave) => revocar(mapa[Number(clave)]));
  };

  useEffect(() => {
    return () => {
      revocarTodas(imagenesRef.current);
      if (previewRef.current) revocar(previewRef.current);
      if (frentePreviewRef.current) revocar(frentePreviewRef.current);
    };
  }, []);

  const cargarImagenes = async (items: PlantillaCumpleanios[]) => {
    const entradas = await Promise.all(
      items.map(async (plantilla) => {
        try {
          const res = await filesApi.download(String(plantilla.archivoOid));
          if (!res.ok) return null;
          const blob = await res.blob();
          return [plantilla.oid, URL.createObjectURL(blob)] as const;
        } catch {
          return null;
        }
      }),
    );
    setImagenes((prev) => {
      revocarTodas(prev);
      return Object.fromEntries(entradas.filter((e): e is readonly [number, string] => Boolean(e)));
    });
  };

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await plantillasCumpleaniosApi.list();
      setPlantillas(data);
      void cargarImagenes(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudieron cargar las plantillas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const limpiarFormulario = () => {
    setFile(null);
    setFrente(null);
    setNombre("");
    setPosicion({ ...POSICION_DEFECTO });
    setConfig(configPorDefecto());
    setMeses([]);
    setPreview((prev) => {
      if (prev) revocar(prev);
      return "";
    });
    setFrentePreview((prev) => {
      if (prev) revocar(prev);
      return "";
    });
    setFrenteError("");
    if (inputRef.current) inputRef.current.value = "";
    if (frenteInputRefCarga.current) frenteInputRefCarga.current.value = "";
  };

  const handleFileChange = async (seleccionado: File | null) => {
    setFormError("");
    if (!seleccionado) return;
    const extOk = /\.(pdf|jpe?g|png)$/i.test(seleccionado.name);
    if (!TIPOS_VALIDOS.includes(seleccionado.type.toLowerCase()) && !extOk) {
      setFormError("La plantilla debe ser un PDF o una imagen JPG/PNG.");
      return;
    }
    if (seleccionado.size > MAX_MB * 1024 * 1024) {
      setFormError(`La plantilla no puede superar ${MAX_MB}MB.`);
      return;
    }

    const urlOriginal = URL.createObjectURL(seleccionado);
    if (esPdf(seleccionado)) {
      // Un PDF no se puede mostrar en <img>: se rasteriza en el servidor con el
      // mismo proceso que se usará al guardar, para que la vista previa sea fiel.
      setPrevisualizando(true);
      setFile(null);
      try {
        const blob = await plantillasCumpleaniosApi.previsualizarPdf(seleccionado);
        const urlPng = URL.createObjectURL(blob);
        setPreview((prev) => {
          if (prev) revocar(prev);
          return urlPng;
        });
        setFile(seleccionado);
      } catch (e) {
        revocar(urlOriginal);
        setFormError(e instanceof ApiError ? e.message : "No se pudo leer el PDF de la plantilla.");
      } finally {
        revocar(urlOriginal);
        setPrevisualizando(false);
      }
      return;
    }

    setFile(seleccionado);
    setPreview((prev) => {
      if (prev) revocar(prev);
      return urlOriginal;
    });
  };

  /** Capa frontal opcional de la plantilla que se está cargando (PNG sobre la foto). */
  const handleFrenteCargaChange = (seleccionado: File | null) => {
    setFrenteError("");
    setFrentePreview((prev) => {
      if (prev) revocar(prev);
      return "";
    });
    setFrente(null);
    if (!seleccionado) return;
    if (!esImagenFrente(seleccionado)) {
      setFrenteError("La capa frontal debe ser una imagen PNG o JPG.");
      if (frenteInputRefCarga.current) frenteInputRefCarga.current.value = "";
      return;
    }
    if (seleccionado.size > MAX_MB * 1024 * 1024) {
      setFrenteError(`La capa frontal no puede superar ${MAX_MB}MB.`);
      if (frenteInputRefCarga.current) frenteInputRefCarga.current.value = "";
      return;
    }
    setFrente(seleccionado);
    const url = URL.createObjectURL(seleccionado);
    setFrentePreview((prev) => {
      if (prev) revocar(prev);
      return url;
    });
  };

  const alternarMes = (mes: number) => {
    setMeses((prev) => (prev.includes(mes) ? prev.filter((m) => m !== mes) : [...prev, mes].sort((a, b) => a - b)));
  };

  const handleUpload = async () => {
    setFormError("");
    setNotice("");
    if (!file) {
      setFormError("Seleccione el archivo de la plantilla (PDF, JPG o PNG).");
      return;
    }
    if (!config.fotoMarco) {
      setFormError("Marque el marco sobre el arte: es donde el sistema insertará la foto del funcionario.");
      return;
    }
    setUploading(true);
    try {
      const creada = await plantillasCumpleaniosApi.upload({ file, frente, nombre, posicion, config, meses });
      setNotice(`Plantilla "${creada.nombre}" cargada correctamente.`);
      limpiarFormulario();
      await cargar();
      setTab("listado");
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "No se pudo cargar la plantilla.");
    } finally {
      setUploading(false);
    }
  };

  /**
   * Abre el editor para corregir la composición de una plantilla ya cargada (marco,
   * textos y zonas protegidas). El arte no se vuelve a subir: se usa el que ya está
   * guardado, de modo que una plantilla en uso se puede ajustar sin recrearla.
   */
  const iniciarEdicion = (plantilla: PlantillaCumpleanios) => {
    setFormError("");
    setNotice("");
    setEditando(plantilla);
    setConfig(plantilla.config ?? configPorDefecto());
    setPosicion(plantilla.foto ?? { ...POSICION_DEFECTO });
    setTab("cargar");
  };

  const cancelarEdicion = () => {
    setEditando(null);
    limpiarFormulario();
    setTab("listado");
  };

  const handleGuardarComposicion = async () => {
    if (!editando) return;
    setFormError("");
    setNotice("");
    if (!config.fotoMarco) {
      setFormError("Marque el marco de la foto: es donde el sistema insertará la foto del funcionario.");
      return;
    }
    setUploading(true);
    try {
      await plantillasCumpleaniosApi.actualizarConfig(editando.oid, config);
      setNotice(`Composición de "${editando.nombre}" guardada correctamente.`);
      setEditando(null);
      await cargar();
      setTab("listado");
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "No se pudo guardar la composición de la plantilla.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (plantilla: PlantillaCumpleanios) => {
    if (!window.confirm(`¿Eliminar la plantilla "${plantilla.nombre}"?`)) return;
    setDeleting(plantilla.oid);
    setError("");
    setNotice("");
    try {
      await plantillasCumpleaniosApi.remove(plantilla.oid);
      setNotice(`Plantilla "${plantilla.nombre}" eliminada correctamente.`);
      await cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo eliminar la plantilla.");
    } finally {
      setDeleting(null);
    }
  };

  /**
   * Cambia la capa frontal de una plantilla ya guardada. Se hace desde el listado
   * porque, para añadir el adorno a una plantilla existente, borrarla y volver a
   * cargarla no sirve: el borrado se bloquea si ya está asignada a un cumpleaños.
   */
  const abrirSelectorFrente = (plantilla: PlantillaCumpleanios) => {
    frenteObjetivoRef.current = plantilla.oid;
    const input = frenteInputRef.current;
    if (input) {
      input.value = "";
      input.click();
    }
  };

  const handleFrenteExistente = async (seleccionado: File | null) => {
    const oid = frenteObjetivoRef.current;
    frenteObjetivoRef.current = null;
    if (!seleccionado || oid == null) return;
    if (!esImagenFrente(seleccionado)) {
      setError("La capa frontal debe ser una imagen PNG o JPG.");
      return;
    }
    if (seleccionado.size > MAX_MB * 1024 * 1024) {
      setError(`La capa frontal no puede superar ${MAX_MB}MB.`);
      return;
    }
    setFrenteEnProceso(oid);
    setError("");
    setNotice("");
    try {
      await plantillasCumpleaniosApi.subirFrente(oid, seleccionado);
      setNotice("Capa frontal actualizada correctamente.");
      await cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo cargar la capa frontal.");
    } finally {
      setFrenteEnProceso(null);
    }
  };

  const handleQuitarFrente = async (plantilla: PlantillaCumpleanios) => {
    if (!window.confirm(`¿Quitar la capa frontal de "${plantilla.nombre}"?`)) return;
    setFrenteEnProceso(plantilla.oid);
    setError("");
    setNotice("");
    try {
      await plantillasCumpleaniosApi.quitarFrente(plantilla.oid);
      setNotice("Capa frontal quitada correctamente.");
      await cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo quitar la capa frontal.");
    } finally {
      setFrenteEnProceso(null);
    }
  };

  const canGrabarTitle = canGrabar ? undefined : noPermissionReason("Plantillas de Cumpleaños", "grabar");

  return (
    <div className="mx-auto max-w-[1500px] p-6">
      {/* Selector compartido para cambiar la capa frontal desde el listado. */}
      <input
        ref={frenteInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => void handleFrenteExistente(e.target.files?.[0] ?? null)}
      />
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-[#0778AC]">Plantillas de Cumpleaños</h1>
        <p className="text-sm text-gray-600">
          Cargue el arte de la tarjeta en PDF, JPG o PNG. El diseño queda fijo y solo cambian la foto, el nombre, el
          cargo y la fecha de cumpleaños; aquí mismo define dónde y con qué estilo se dibuja cada dato.
        </p>
      </div>

      {notice && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-1 border-b border-gray-100 bg-gray-50/60 px-4 pt-3">
          {TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`-mb-px rounded-t-lg border-b-2 px-5 py-2.5 text-sm font-semibold transition-colors ${
                tab === item.id
                  ? "border-[#0778AC] bg-white text-[#0778AC]"
                  : "border-transparent text-gray-500 hover:text-[#0778AC]"
              }`}
            >
              {item.label}
              {item.id === "listado" && (
                <span className="ml-2 text-[11px] font-bold text-gray-400">{plantillas.length}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "cargar" ? (
          <div className="p-6">
            {editando && (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#0778AC]/30 bg-[#0778AC]/5 px-4 py-3">
                <p className="text-sm text-[#0778AC]">
                  Editando la composición de <strong>{editando.nombre}</strong>. El arte y la capa frontal no se
                  modifican; solo la posición de los datos y las zonas protegidas.
                </p>
                <button
                  onClick={cancelarEdicion}
                  disabled={uploading}
                  className="rounded-lg border-2 border-[#0778AC]/30 px-3 py-1.5 text-xs font-semibold text-[#0778AC] hover:bg-white disabled:opacity-40"
                >
                  Cancelar
                </button>
              </div>
            )}
            {!editando && (
            <>
            <div className="mb-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Nombre de la plantilla</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={120}
                  disabled={!canGrabar}
                  title={canGrabarTitle}
                  placeholder="Ej. Tarjeta navideña institucional"
                  className="w-full rounded-lg border-2 border-gray-200 p-2.5 text-sm focus:border-[#0778AC] focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                />
                <p className="mt-1 text-[11px] text-gray-400">Si se deja vacío se usa el nombre del archivo.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Archivo de la plantilla</label>
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
                  disabled={!canGrabar || previsualizando}
                  title={canGrabarTitle}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#0778AC] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-[#065a87] disabled:opacity-40"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  PDF, JPG o PNG, máximo {MAX_MB}MB (configurable en Parámetros › Comunicaciones › MinIO).
                </p>
                {previsualizando && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0778AC]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Convirtiendo el PDF para la vista previa...
                  </p>
                )}
                {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}
              </div>
            </div>

            <div className="mb-5 rounded-lg border border-gray-100 bg-gray-50/40 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#0778AC]" />
                <h3 className="text-sm font-semibold text-gray-800">Capa frontal de la foto (opcional)</h3>
              </div>
              <p className="mb-3 text-xs text-gray-500">
                Si el arte tiene adornos que deben quedar <strong>encima</strong> de la foto (por ejemplo, el gorro de
                una tarjeta navideña), súbalos aquí como un <strong>PNG con fondo transparente</strong>. Se dibujan sobre
                la foto y por debajo del nombre, el cargo y la fecha. Deje este campo vacío si no aplica.
              </p>
              <input
                ref={frenteInputRefCarga}
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => handleFrenteCargaChange(e.target.files?.[0] ?? null)}
                disabled={!canGrabar || !file}
                title={canGrabar ? (file ? "Capa frontal de la foto" : "Seleccione primero el archivo de la plantilla") : canGrabarTitle}
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#0778AC] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-[#065a87] disabled:opacity-40"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                PNG (recomendado) o JPG, máximo {MAX_MB}MB. Debe tener el mismo lienzo que la plantilla.
              </p>
              {frenteError && <p className="mt-2 text-xs text-red-600">{frenteError}</p>}
              {frente && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0778AC]">
                  <Layers className="h-3.5 w-3.5" /> {frente.name}
                </p>
              )}
            </div>

            <div className="mb-5 rounded-lg border border-gray-100 bg-gray-50/40 p-4">
              <div className="mb-2 flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-[#0778AC]" />
                <h3 className="text-sm font-semibold text-gray-800">¿En qué meses aplica?</h3>
              </div>
              <p className="mb-3 text-xs text-gray-500">
                Sirve para tener una plantilla temática: por ejemplo, una navideña solo para diciembre. Si no marca
                ninguno, la plantilla está disponible todo el año.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setMeses([])}
                  disabled={!canGrabar}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                    meses.length === 0
                      ? "border-[#0778AC] bg-[#0778AC] text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-[#0778AC]/50"
                  } disabled:opacity-50`}
                >
                  Todo el año
                </button>
                {MESES_CORTOS.map((mes, indice) => {
                  const numero = indice + 1;
                  const activo = meses.includes(numero);
                  return (
                    <button
                      key={mes}
                      type="button"
                      onClick={() => alternarMes(numero)}
                      disabled={!canGrabar}
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                        activo
                          ? "border-[#0778AC] bg-[#0778AC] text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#0778AC]/50"
                      } disabled:opacity-50`}
                    >
                      {mes}
                    </button>
                  );
                })}
              </div>
            </div>
            </>
            )}

            <div className="rounded-lg border border-gray-100 bg-gray-50/40 p-5">
              <h3 className="mb-1 text-sm font-semibold text-gray-800">Datos dinámicos de la tarjeta</h3>
              <p className="mb-4 text-xs text-gray-500">
                El arte de la plantilla no se modifica. Primero marque el <strong>marco de la foto</strong> (obligatorio)
                sobre la zona del arte; luego elija el nombre, el cargo o la fecha y arrástrelos sobre la imagen. A la
                derecha ajusta el tamaño, el color y la tipografía. El resto de textos y adornos quedan fijos.
              </p>
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                <strong>Importante:</strong> el archivo debe ser el arte limpio, sin el nombre, el cargo, la fecha ni la
                foto del funcionario ya impresos. El sistema superpone esos cuatro datos; si vienen incluidos en la
                imagen, se verán duplicados.
              </div>
              {!config.fotoMarco && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                  <strong>Falta el marco de la foto.</strong> Seleccione «Marco de la foto» en la tarjeta y pulse
                  «Marcar marco de foto»; sin él no se puede guardar la plantilla.
                </div>
              )}
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Nombre de prueba</label>
                  <input
                    value={nombreEjemplo}
                    disabled={!canGrabar}
                    onChange={(e) => setNombreEjemplo(e.target.value)}
                    placeholder="Ej. un nombre largo"
                    className="w-full rounded-lg border-2 border-gray-200 p-2 text-xs focus:border-[#0778AC] focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Cargo de prueba</label>
                  <input
                    value={cargoEjemplo}
                    disabled={!canGrabar}
                    onChange={(e) => setCargoEjemplo(e.target.value)}
                    placeholder="Ej. un cargo largo"
                    className="w-full rounded-lg border-2 border-gray-200 p-2 text-xs focus:border-[#0778AC] focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <p className="text-[11px] text-gray-500 sm:col-span-2">
                  Escriba aquí un nombre y un cargo largos para comprobar que se acomodan en la tarjeta. No se guardan:
                  solo sirven para la vista previa.
                </p>
              </div>
              <EditorTarjetaCumple
                plantillaArchivoOid={editando?.archivoOid ?? null}
                frenteArchivoOid={editando?.frenteArchivoOid ?? null}
                plantillaLocal={editando ? undefined : preview || undefined}
                frenteLocal={editando ? undefined : frentePreview || undefined}
                posicion={posicion}
                config={config}
                nombre={nombreEjemplo}
                fechaCumpleanos={new Date().toISOString().slice(0, 10)}
                edad={30}
                cargo={cargoEjemplo}
                disabled={!canGrabar}
                onPosicionChange={setPosicion}
                onConfigChange={setConfig}
              />
              {!preview && !editando && (
                <p className="mt-3 text-[11px] text-gray-400">
                  Cargue el archivo para previsualizar la tarjeta; mientras tanto se muestra un ejemplo.
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
              {editando ? (
                <>
                  <button
                    onClick={cancelarEdicion}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:border-gray-300 disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => void handleGuardarComposicion()}
                    disabled={!canGrabar || uploading || !config.fotoMarco}
                    title={
                      !canGrabar
                        ? canGrabarTitle
                        : !config.fotoMarco
                          ? "Marque el marco de la foto para poder guardar"
                          : "Guardar composición"
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0778AC] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#065a87] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                    {uploading ? "Guardando..." : "Guardar composición"}
                  </button>
                </>
              ) : (
                <>
                  {!config.fotoMarco && file && (
                    <span className="text-xs font-semibold text-red-600">Falta marcar el marco de la foto.</span>
                  )}
                  <button
                    onClick={() => void handleUpload()}
                    disabled={!canGrabar || uploading || !file || previsualizando || !config.fotoMarco}
                    title={
                      !canGrabar
                        ? canGrabarTitle
                        : !config.fotoMarco
                          ? "Marque el marco de la foto para poder guardar"
                          : "Cargar plantilla"
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0778AC] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#065a87] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "Cargando..." : "Cargar plantilla"}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            {loading ? (
              <p className="py-8 text-center text-sm text-gray-400">Cargando plantillas...</p>
            ) : plantillas.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No hay plantillas registradas todavía.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {plantillas.map((plantilla) => (
                  <div key={plantilla.oid} className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
                    <div className="flex h-40 items-center justify-center overflow-hidden bg-gray-50">
                      {imagenes[plantilla.oid] ? (
                        <img src={imagenes[plantilla.oid]} alt={plantilla.nombre} className="h-full w-full object-contain" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-semibold text-gray-800" title={plantilla.nombre}>
                        {plantilla.nombre}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">{formatFecha(plantilla.fechaCreacion)}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#0778AC]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0778AC]">
                          <CalendarRange className="h-3 w-3" />
                          {describirMeses(plantilla.meses)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                          <FileText className="h-3 w-3" />
                          {plantilla.origen === "PDF" ? "PDF convertido" : "Imagen"}
                        </span>
                        {plantilla.frenteArchivoOid && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600"
                            title={plantilla.frenteNombreOriginal ?? undefined}
                          >
                            <Layers className="h-3 w-3" />
                            Capa frontal
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <button
                          onClick={() => iniciarEdicion(plantilla)}
                          disabled={!canGrabar}
                          title={
                            canGrabar
                              ? "Editar la posición de los datos y las zonas protegidas de esta plantilla"
                              : canGrabarTitle
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0778AC] hover:text-[#065a87] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar composición
                        </button>
                        <button
                          onClick={() => abrirSelectorFrente(plantilla)}
                          disabled={!canGrabar || frenteEnProceso === plantilla.oid}
                          title={
                            canGrabar
                              ? plantilla.frenteArchivoOid
                                ? "Cambiar el PNG que se dibuja sobre la foto"
                                : "Añadir el PNG que se dibuja sobre la foto"
                              : canGrabarTitle
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0778AC] hover:text-[#065a87] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {frenteEnProceso === plantilla.oid ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Layers className="h-3.5 w-3.5" />
                          )}
                          {plantilla.frenteArchivoOid ? "Cambiar capa frontal" : "Añadir capa frontal"}
                        </button>
                        {plantilla.frenteArchivoOid && (
                          <button
                            onClick={() => void handleQuitarFrente(plantilla)}
                            disabled={!canGrabar || frenteEnProceso === plantilla.oid}
                            title="Quitar la capa frontal"
                            className="text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Quitar capa
                          </button>
                        )}
                        <button
                          onClick={() => void handleDelete(plantilla)}
                          disabled={!canEliminar || deleting === plantilla.oid}
                          title={canEliminar ? "Eliminar plantilla" : noPermissionReason("Plantillas de Cumpleaños", "eliminar")}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {deleting === plantilla.oid ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

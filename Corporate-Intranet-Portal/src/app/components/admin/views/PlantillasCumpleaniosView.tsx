import { Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ApiError } from "../../../api/client";
import { filesApi } from "../../../api/files";
import {
  POSICION_DEFECTO,
  plantillasCumpleaniosApi,
  type PlantillaCumpleanios,
  type PosicionFoto,
} from "../../../api/plantillas";
import { noPermissionReason } from "../AccessGate";
import { useAdminAccess } from "../useAdminAccess";
import { EditorTarjetaCumple } from "./components/EditorTarjetaCumple";

const MAX_MB = 5;
const TIPOS_VALIDOS = ["image/jpeg", "image/jpg", "image/png"];

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
  const [posicion, setPosicion] = useState<PosicionFoto>({ ...POSICION_DEFECTO });
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const imagenesRef = useRef<Record<number, string>>({});
  imagenesRef.current = imagenes;
  const previewRef = useRef("");
  previewRef.current = preview;

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
    setNombre("");
    setPosicion({ ...POSICION_DEFECTO });
    setPreview((prev) => {
      if (prev) revocar(prev);
      return "";
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileChange = (seleccionado: File | null) => {
    setFormError("");
    if (!seleccionado) return;
    const extOk = /\.(jpe?g|png)$/i.test(seleccionado.name);
    if (!TIPOS_VALIDOS.includes(seleccionado.type.toLowerCase()) && !extOk) {
      setFormError("La plantilla debe ser una imagen JPG o PNG.");
      return;
    }
    if (seleccionado.size > MAX_MB * 1024 * 1024) {
      setFormError(`La plantilla no puede superar ${MAX_MB}MB.`);
      return;
    }
    setFile(seleccionado);
    setPreview((prev) => {
      if (prev) revocar(prev);
      return URL.createObjectURL(seleccionado);
    });
  };

  const handleUpload = async () => {
    setFormError("");
    setNotice("");
    if (!file) {
      setFormError("Seleccione la imagen de la plantilla (JPG o PNG).");
      return;
    }
    setUploading(true);
    try {
      const creada = await plantillasCumpleaniosApi.upload({ file, nombre, posicion });
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

  const canGrabarTitle = canGrabar ? undefined : noPermissionReason("Plantillas de Cumpleaños", "grabar");

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Plantillas de Cumpleaños</h1>
        <p className="text-gray-600 text-sm">
          Imágenes de tarjeta (JPG o PNG) que se usan en el módulo de Cumpleaños. Cada plantilla queda
          almacenada en MinIO y define dónde se ubica la foto del funcionario.
        </p>
      </div>

      {notice && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2.5">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-gray-100 bg-gray-50/60">
          {TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg -mb-px border-b-2 transition-colors ${
                tab === item.id
                  ? "border-[#0778AC] text-[#0778AC] bg-white"
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
            <div className="grid gap-5 md:grid-cols-2 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de la plantilla</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  maxLength={120}
                  disabled={!canGrabar}
                  title={canGrabarTitle}
                  placeholder="Ej. Tarjeta azul institucional"
                  className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC] disabled:bg-gray-50 disabled:text-gray-400"
                />
                <p className="text-[11px] text-gray-400 mt-1">Si se deja vacío se usa el nombre del archivo.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Imagen de la plantilla</label>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  disabled={!canGrabar}
                  title={canGrabarTitle}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#0778AC] file:px-4 file:py-2 file:text-white file:text-xs file:font-semibold hover:file:bg-[#065a87] disabled:opacity-40"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  JPG o PNG, máximo {MAX_MB}MB (configurable en Parámetros › Comunicaciones › MinIO).
                </p>
                {formError && <p className="text-xs text-red-600 mt-2">{formError}</p>}
              </div>
            </div>

            <div className="border border-gray-100 rounded-lg p-5 bg-gray-50/40">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Posición de la foto del funcionario</h3>
              <p className="text-xs text-gray-500 mb-4">
                Ajuste dónde queda la foto sobre la plantilla. Estos valores se usan como punto de partida al asignar
                la plantilla a un cumpleaños.
              </p>
              <EditorTarjetaCumple
                plantillaArchivoOid={null}
                fotoLocal={preview}
                posicion={posicion}
                nombre="María Pérez"
                fechaCumpleanos={new Date().toISOString().slice(0, 10)}
                edad={30}
                cargo="Ejemplo de cargo"
                disabled={!canGrabar}
                onPosicionChange={setPosicion}
              />
              {preview ? null : (
                <p className="text-[11px] text-gray-400 mt-3">
                  Cargue una imagen para previsualizar la tarjeta; mientras tanto se muestra solo la foto de ejemplo.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-gray-100">
              <button
                onClick={handleUpload}
                disabled={!canGrabar || uploading || !file}
                title={canGrabar ? "Cargar plantilla" : canGrabarTitle}
                className="inline-flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Cargando..." : "Cargar plantilla"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {loading ? (
              <p className="text-sm text-gray-400 py-8 text-center">Cargando plantillas...</p>
            ) : plantillas.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No hay plantillas registradas todavía.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {plantillas.map((plantilla) => (
                  <div key={plantilla.oid} className="border border-gray-100 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                      {imagenes[plantilla.oid] ? (
                        <img src={imagenes[plantilla.oid]} alt={plantilla.nombre} className="h-full w-full object-contain" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-800 truncate" title={plantilla.nombre}>
                        {plantilla.nombre}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatFecha(plantilla.fechaCreacion)}</p>
                      {plantilla.foto && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Foto: X {plantilla.foto.px}% · Y {plantilla.foto.py}% · {plantilla.foto.ancho}%×
                          {plantilla.foto.alto}%
                        </p>
                      )}
                      <button
                        onClick={() => handleDelete(plantilla)}
                        disabled={!canEliminar || deleting === plantilla.oid}
                        title={
                          canEliminar ? "Eliminar plantilla" : noPermissionReason("Plantillas de Cumpleaños", "eliminar")
                        }
                        className="mt-3 inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold"
                      >
                        {deleting === plantilla.oid ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Eliminar
                      </button>
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

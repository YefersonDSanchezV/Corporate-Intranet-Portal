import { Cake, Pencil, Save, Search, Trash2, Users, X, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBirthdays } from "../../../hooks/useBirthdays";
import { useAdminAccess } from "../useAdminAccess";
import { noPermissionReason } from "../AccessGate";
import { EDAD_MAXIMA, EDAD_MINIMA, isValidBirthDate, type BirthdayInfo } from "../../../utils/birthdays";
import { filesApi } from "../../../api/files";
import { usersApi } from "../../../api/users";
import { cumpleaniosApi } from "../../../api/cumpleanios";
import { MESES_CORTOS, plantillasCumpleaniosApi, POSICION_DEFECTO, type PlantillaCumpleanios, type PosicionFoto } from "../../../api/plantillas";
import { EditorTarjetaCumple } from "./components/EditorTarjetaCumple";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function previewCumpleanos(fechaNacimiento: string): { edad: number; fecha: Date } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaNacimiento ?? "");
  if (!m) return null;
  const year = new Date().getFullYear();
  let dia = Number(m[3]);
  const mes = Number(m[2]);
  if (mes === 2 && dia === 29 && new Date(year, 1, 29).getMonth() !== 1) dia = 28;
  return { edad: year - Number(m[1]), fecha: new Date(year, mes - 1, dia) };
}

export function CalendarioCumpleaniosView() {
  const { can } = useAdminAccess();
  const canActualizar = can("calendario-cumpleanios", "actualizar");
  const canEliminar = can("calendario-cumpleanios", "eliminar");

  const { birthdays, loading, desdeBackend, addManual, updateManual, removeManual } = useBirthdays();
  const hoy = new Date();
  const [mes, setMes] = useState<number>(hoy.getMonth());
  const [busqueda, setBusqueda] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BirthdayInfo | null>(null);
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [cargo, setCargo] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [fotoArchivoOid, setFotoArchivoOid] = useState<number | null>(null);
  const [fotoError, setFotoError] = useState("");
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Plantilla y posición de la foto dentro de la tarjeta
  const [plantillas, setPlantillas] = useState<PlantillaCumpleanios[]>([]);
  const [plantillaOid, setPlantillaOid] = useState<number | null>(null);
  const [posicion, setPosicion] = useState<PosicionFoto>({ ...POSICION_DEFECTO });

  useEffect(() => {
    void (async () => {
      try {
        setPlantillas(await plantillasCumpleaniosApi.list());
      } catch {
        setPlantillas([]);
      }
    })();
  }, []);

  const revokePreview = (url: string) => {
    if (url.startsWith("blob:")) {
      try { URL.revokeObjectURL(url); } catch { /* noop */ }
    }
  };

  const handleFotoChange = (file: File | null) => {
    setFotoError("");
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png"];
    const extOk = /\.(jpe?g|png)$/i.test(file.name);
    if (!validTypes.includes(file.type) && !extOk) {
      setFotoError("La foto debe ser JPG o PNG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFotoError("La foto no puede superar 2MB.");
      return;
    }
    setFotoFile(file);
    setFotoPreview((prev) => {
      if (prev) revokePreview(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleQuitarFoto = () => {
    setFotoFile(null);
    setFotoPreview((prev) => {
      if (prev) revokePreview(prev);
      return "";
    });
    setFotoArchivoOid(null);
    setFotoError("");
    if (fotoInputRef.current) fotoInputRef.current.value = "";
  };

  const fotoPreviewRef = useRef("");
  fotoPreviewRef.current = fotoPreview;
  useEffect(() => {
    return () => {
      const u = fotoPreviewRef.current;
      if (u && u.startsWith("blob:")) {
        try { URL.revokeObjectURL(u); } catch { /* noop */ }
      }
    };
  }, []);

  const loadFotoPreview = async (oid: number) => {
    try {
      const res = await filesApi.download(String(oid));
      if (!res.ok) return;
      const blob = await res.blob();
      setFotoPreview((prev) => {
        if (prev) revokePreview(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      // sin preview: se conserva el oid hasta cambiar
    }
  };

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return birthdays.filter((b) => {
      const f = parseISO(b.fechaCumpleanos);
      if (f.getMonth() !== mes) return false;
      if (!q) return true;
      return (
        b.nombreCompleto.toLowerCase().includes(q) ||
        (b.area ?? "").toLowerCase().includes(q)
      );
    });
  }, [birthdays, mes, busqueda]);

  const delMes = birthdays.filter((b) => parseISO(b.fechaCumpleanos).getMonth() === hoy.getMonth());
  const deHoy = birthdays.filter((b) => b.esHoy);
  const proximos = birthdays
    .filter((b) => b.diasRestantes > 0 && b.diasRestantes <= 7)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  const openEdit = (b: BirthdayInfo) => {
    setEditing(b);
    setNombre(b.nombreCompleto);
    setFechaNacimiento(b.fechaNacimiento);
    setCargo(b.area);
    setFormError("");
    setFotoFile(null);
    setFotoError("");
    setFotoArchivoOid(b.fotoArchivoOid ?? null);
    setPlantillaOid(null);
    setPosicion({ ...POSICION_DEFECTO });
    setFotoPreview((prev) => {
      if (prev) revokePreview(prev);
      return "";
    });
    if (fotoInputRef.current) fotoInputRef.current.value = "";
    if (b.fotoArchivoOid != null) void loadFotoPreview(b.fotoArchivoOid);
    void cargarTarjeta(b);
  };

  /**
   * Precarga la plantilla y la posición guardadas del cumpleaños (endpoint /cumpleanios).
   * Los automáticos y los manuales comparten la misma configuración de tarjeta.
   */
  const cargarTarjeta = async (b: BirthdayInfo) => {
    try {
      const registros = await cumpleaniosApi.list();
      const registro = registros.find((r) => r.id === b.id);
      if (registro) {
        setPlantillaOid(registro.plantillaOid ?? null);
        const dePlantilla = plantillas.find((p) => p.oid === registro.plantillaOid)?.foto;
        setPosicion(
          registro.posicion ? { ...registro.posicion } : dePlantilla ? { ...dePlantilla } : { ...POSICION_DEFECTO },
        );
      }
    } catch {
      // sin plantilla asignada todavía
    } finally {
      setShowForm(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setNotice("");
    const automatico = editing?.origen === "sistema";
    if (!automatico) {
      if (!nombre.trim()) {
        setFormError("El nombre completo es obligatorio.");
        return;
      }
      if (!isValidBirthDate(fechaNacimiento)) {
        setFormError(`Fecha de nacimiento inválida: debe ser anterior a hoy y la edad estar entre ${EDAD_MINIMA} y ${EDAD_MAXIMA} años.`);
        return;
      }
      if (!cargo.trim()) {
        setFormError("El cargo es obligatorio. Escríbelo libremente.");
        return;
      }
      if (cargo.trim().length > 255) {
        setFormError("El cargo no puede exceder 255 caracteres.");
        return;
      }
      if (!fotoFile && fotoArchivoOid == null) {
        setFotoError("La foto es obligatoria.");
        setFormError("Debe adjuntar una foto (JPG/PNG, máximo 2MB).");
        return;
      }
    }
    setSaving(true);
    let fotoOid = fotoArchivoOid;
    try {
      if (fotoFile) {
        const res = await usersApi.manualBirthdays.uploadFoto(fotoFile);
        if (!res.ok) throw new Error(`No se pudo subir la foto (${res.status})`);
        let oid: number | null = null;
        try {
          const data = await res.json();
          const raw = data?.oid ?? data?.archivoOid ?? data?.id ?? data?.fileOid ?? data?.data?.oid;
          const n = Number(raw);
          if (Number.isFinite(n)) oid = n;
        } catch {
          oid = null;
        }
        if (oid == null) throw new Error("El servidor no devolvió el identificador de la foto.");
        fotoOid = oid;
        setFotoArchivoOid(oid);
      }
    } catch (e) {
      setSaving(false);
      const msg = e instanceof Error ? e.message : "No se pudo subir la foto.";
      setFotoError(msg);
      setFormError(msg);
      return;
    }

    // Los usuarios del sistema conservan nombre, fecha y cargo del perfil: solo se
    // guardan la foto y la plantilla en el módulo Cumpleaños.
    if (automatico) {
      if (!editing) {
        setSaving(false);
        return;
      }
      try {
        await cumpleaniosApi.updateTarjeta(editing.oid, {
          fotoArchivoOid: fotoOid,
          plantillaOid,
          fotoPx: posicion.px,
          fotoPy: posicion.py,
          fotoAncho: posicion.ancho,
          fotoAlto: posicion.alto,
          fotoRedondo: posicion.redondo,
          fotoZoom: posicion.zoom ?? 1,
          fotoOffsetX: posicion.offsetX ?? 0,
          fotoOffsetY: posicion.offsetY ?? 0,
        });
      } catch (e) {
        setSaving(false);
        setFormError(e instanceof Error ? e.message : "No se pudo guardar la tarjeta.");
        return;
      }
      setSaving(false);
      setShowForm(false);
      setEditing(null);
      setNotice("Foto y plantilla del cumpleaños actualizadas correctamente.");
      return;
    }

    const body = {
      nombreCompleto: nombre.trim(),
      fechaNacimiento,
      cargo: cargo.trim(),
      fotoArchivoOid: fotoOid,
      plantillaOid,
      fotoPx: posicion.px,
      fotoPy: posicion.py,
      fotoAncho: posicion.ancho,
      fotoAlto: posicion.alto,
      fotoRedondo: posicion.redondo,
      fotoZoom: posicion.zoom ?? 1,
      fotoOffsetX: posicion.offsetX ?? 0,
      fotoOffsetY: posicion.offsetY ?? 0,
    };
    const res = editing ? await updateManual(editing, body) : await addManual(body);
    setSaving(false);
    if (!res.ok) {
      setFormError(res.error || "No se pudo guardar el cumpleaños.");
      return;
    }
    setNombre("");
    setFechaNacimiento("");
    setCargo("");
    setFotoFile(null);
    setFotoArchivoOid(null);
    setFotoError("");
    setPlantillaOid(null);
    setPosicion({ ...POSICION_DEFECTO });
    setFotoPreview((prev) => {
      if (prev) revokePreview(prev);
      return "";
    });
    if (fotoInputRef.current) fotoInputRef.current.value = "";
    closeForm();
    setNotice(editing ? "Cumpleaños actualizado correctamente." : "Cumpleaños registrado correctamente.");
  };

  const handleDelete = async (b: BirthdayInfo) => {
    if (!window.confirm(`¿Eliminar el cumpleaños de ${b.nombreCompleto}?`)) return;
    const res = await removeManual(b);
    setNotice(res.ok ? "Cumpleaños eliminado correctamente." : res.error || "No se pudo eliminar.");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormError("");
  };

  const vista = previewCumpleanos(fechaNacimiento);

  /** Las plantillas temáticas del mes del cumpleaños aparecen primero. */
  const plantillasOrdenadas = useMemo(() => {
    const mesCumple = vista ? vista.fecha.getMonth() + 1 : null;
    const aplica = (p: PlantillaCumpleanios) =>
      !p.meses || p.meses.length === 0 || (mesCumple != null && p.meses.includes(mesCumple));
    return [...plantillas].sort((a, b) => {
      const diferencia = Number(aplica(b)) - Number(aplica(a));
      return diferencia !== 0 ? diferencia : a.nombre.localeCompare(b.nombre, "es");
    });
  }, [plantillas, vista]);

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Calendario de Cumpleaños</h1>
          <p className="text-gray-600 text-sm">
            Automáticos desde la fecha de nacimiento validada de cada usuario activo
            + manuales. Los registros nuevos, las fotos y las plantillas se administran en
            Comunicaciones › Cumpleaños.
            {desdeBackend ? " Fuente: servidor." : " Fuente: usuarios sincronizados."}
          </p>
        </div>
      </div>

      {notice && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2.5 flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Cerrar aviso"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Modal flotante Registrar/Editar cumpleaños - mismo estilo que Crear Usuario */}
      {showForm && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Cake className="w-5 h-5" /> Editar cumpleaños
                </h3>
                <p className="text-white/70 text-xs mt-0.5">
                  {editing?.origen === "sistema"
                    ? "El nombre, la fecha y el cargo provienen del usuario; aquí se asignan la foto y la plantilla de la tarjeta."
                    : "Actualice los datos del cumpleaños y asigne la plantilla de la tarjeta."}
                </p>
              </div>
              <button onClick={closeForm} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-6 overflow-y-auto">
              <FormField label="Nombre completo *" value={nombre} onChange={setNombre} required readOnly={editing?.origen === "sistema"} placeholder="Ej: María Pérez Gómez" />
              <FormField label="Fecha de nacimiento *" value={fechaNacimiento} onChange={setFechaNacimiento} type="date" required readOnly={editing?.origen === "sistema"} max={format(new Date(), "yyyy-MM-dd")} />
              <div className="lg:col-span-2">
                <FormField label="Cargo *" value={cargo} onChange={setCargo} required readOnly={editing?.origen === "sistema"} maxLength={255} placeholder="Escríbelo libremente, ej: Contratista - Aseo turno noche" />
                <p className="text-[11px] text-gray-400 mt-1">
                  {editing?.origen === "sistema"
                    ? "El nombre, la fecha y el cargo se administran en el perfil del usuario."
                    : "Texto libre, independiente del cargo registrado en el sistema."}
                </p>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Foto {editing?.origen === "sistema" ? "" : "*"}
                </label>
                <div className="flex items-center gap-4">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Foto del cumpleañero" className="w-24 h-24 rounded-full object-cover border-2 border-[#0778AC]/20" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-semibold border-2 border-dashed border-gray-200">
                      Sin foto
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fotoInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => handleFotoChange(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      onClick={() => fotoInputRef.current?.click()}
                      className="px-4 py-2 rounded-lg border border-[#0778AC]/30 text-[#0778AC] text-xs font-semibold hover:bg-[#0778AC]/5"
                    >
                      {fotoPreview ? "Cambiar" : "Seleccionar foto"}
                    </button>
                    {fotoPreview && (
                      <button
                        type="button"
                        onClick={handleQuitarFoto}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  JPG o PNG, máximo 2MB.{editing?.origen === "sistema" ? "" : " Obligatoria."}
                </p>
                {fotoError && <p className="text-xs text-red-600 mt-1">{fotoError}</p>}
              </div>
              {vista && isValidBirthDate(fechaNacimiento) && (
                <div className="lg:col-span-2 bg-[#0778AC]/5 border border-[#0778AC]/20 rounded-lg px-4 py-2.5 text-sm text-[#0778AC] font-semibold">
                  Cumplirá {vista.edad} años el {format(vista.fecha, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </div>
              )}
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Plantilla de cumpleaños</label>
                <select
                  value={plantillaOid ?? ""}
                  onChange={(e) => {
                    const valor = e.target.value ? Number(e.target.value) : null;
                    setPlantillaOid(valor);
                    const plantilla = plantillas.find((p) => p.oid === valor);
                    if (plantilla?.foto) {
                      // Al cambiar de plantilla se reinicia el reencuadre: la foto vuelve
                      // a centrarse automáticamente dentro del nuevo marco.
                      setPosicion({ ...plantilla.foto, zoom: 1, offsetX: 0, offsetY: 0 });
                    } else {
                      setPosicion({ ...POSICION_DEFECTO });
                    }
                  }}
                  className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC]"
                >
                  <option value="">Sin plantilla</option>
                  {plantillasOrdenadas.map((p) => (
                    <option key={p.oid} value={p.oid}>
                      {p.nombre}
                      {p.meses && p.meses.length > 0
                        ? ` · ${p.meses.map((m) => MESES_CORTOS[m - 1] ?? m).join(", ")}`
                        : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Se administran en Comunicaciones › Cumpleaños › Plantillas de Cumpleaños.
                </p>
              </div>
              {(plantillaOid != null || fotoArchivoOid != null) && (
                <div className="lg:col-span-2 border border-gray-100 rounded-lg p-5 bg-gray-50/40">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">Vista previa de la tarjeta</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    La foto se inserta automáticamente dentro del marco de la plantilla. Arrástrela para reencuadrarla
                    y use el zoom si necesita acercarla: siempre queda dentro del marco.
                  </p>
                  <EditorTarjetaCumple
                    plantillaArchivoOid={plantillas.find((p) => p.oid === plantillaOid)?.archivoOid ?? null}
                    posicion={posicion}
                    config={plantillas.find((p) => p.oid === plantillaOid)?.config ?? null}
                    frenteArchivoOid={plantillas.find((p) => p.oid === plantillaOid)?.frenteArchivoOid ?? null}
                    fotoArchivoOid={fotoArchivoOid}
                    fotoLocal={fotoPreview}
                    nombre={nombre}
                    fechaCumpleanos={vista ? format(vista.fecha, "yyyy-MM-dd") : undefined}
                    edad={vista?.edad ?? 0}
                    cargo={cargo}
                    disabled={!canActualizar}
                    onPosicionChange={setPosicion}
                  />
                </div>
              )}
              {formError && (
                <div className="lg:col-span-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">
                  {formError}
                </div>
              )}
              <div className="lg:col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !canActualizar}
                  title={canActualizar ? undefined : noPermissionReason("Calendario de Cumpleanos", "actualizar")}
                  className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Guardando..." : "Grabar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="bg-[#0778AC]/10 p-2.5 rounded-full"><Cake className="w-5 h-5 text-[#0778AC]" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{deHoy.length}</p>
            <p className="text-xs text-gray-500">Cumplen hoy</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="bg-[#CF3438]/10 p-2.5 rounded-full"><Cake className="w-5 h-5 text-[#CF3438]" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{proximos.length}</p>
            <p className="text-xs text-gray-500">Próximos 7 días</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="bg-gray-100 p-2.5 rounded-full"><Users className="w-5 h-5 text-gray-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{delMes.length}</p>
            <p className="text-xs text-gray-500">En {format(hoy, "MMMM", { locale: es })}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o cargo..."
            className="flex-1 border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC]"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {MESES.map((nombreMes, i) => (
            <button
              key={nombreMes}
              onClick={() => setMes(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                mes === i ? "bg-[#0778AC] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {nombreMes.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Cumpleaños del mes */}
      <div className="mb-6">
        <h2 className="font-bold text-[#0778AC] mb-3 flex items-center gap-2">
          <Cake className="w-5 h-5" /> Cumpleaños de {MESES[mes]} ({filtrados.length})
        </h2>
        {filtrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtrados.map((b) => (
              <div
                key={b.id}
                className={`bg-white rounded-lg border p-4 shadow-sm flex items-center justify-between ${
                  b.esHoy ? "border-[#CF3438]/40 ring-1 ring-[#CF3438]/30" : "border-gray-100"
                }`}
              >
                <div>
                  <p className="font-bold text-gray-800 text-sm">
                    {b.nombreCompleto}
                    {b.origen === "manual" && (
                      <span className="ml-2 text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold align-middle">MANUAL</span>
                    )}
                  </p>
                  <p className="text-xs text-[#CF3438] font-bold">
                    {format(parseISO(b.fechaCumpleanos), "dd 'de' MMMM", { locale: es })} · Cumple {b.edad} años
                    {b.esHoy ? " · ¡Hoy!" : b.diasRestantes > 0 ? ` · en ${b.diasRestantes}d` : ""}
                  </p>
                  {b.area && <p className="text-[10px] text-gray-400 mt-0.5">{b.area}</p>}
                </div>
                <CumpleFoto b={b} className="w-11 h-11" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-100 text-center py-8 text-gray-400 text-sm">
            {loading ? "Cargando cumpleaños..." : `No hay cumpleaños registrados para ${MESES[mes]}.`}
          </div>
        )}
      </div>

      {/* Tabla de consulta */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-700 text-sm">
            Todos los registros — {MESES[mes]} ({filtrados.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-sm font-semibold text-gray-600">Foto</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Nombre completo</th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center">Edad</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Fecha de cumpleaños</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Fecha de nacimiento</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Cargo</th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((b) => (
                <tr key={b.id} className={`hover:bg-gray-50 ${b.esHoy ? "bg-red-50/50" : ""}`}>
                  <td className="p-3">
                    <CumpleFoto b={b} className="w-10 h-10" />
                  </td>
                  <td className="p-3 font-semibold text-sm">
                    {b.nombreCompleto}
                    {b.esHoy && (
                      <span className="ml-2 text-[10px] bg-[#CF3438] text-white px-2 py-0.5 rounded-full font-bold">HOY</span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-center">
                    <span className="inline-block bg-[#0778AC]/10 text-[#0778AC] font-bold px-2.5 py-1 rounded-full text-xs">
                      {b.edad} años
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    {format(parseISO(b.fechaCumpleanos), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </td>
                  <td className="p-3 text-sm">{format(parseISO(b.fechaNacimiento), "dd/MM/yyyy")}</td>
                  <td className="p-3 text-sm">{b.area || "-"}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(b)}
                        disabled={!canActualizar}
                        title={canActualizar ? "Editar" : noPermissionReason("Calendario de Cumpleanos", "actualizar")}
                        aria-label="Editar cumpleaños"
                        className="p-1.5 bg-blue-50 text-[#0778AC] hover:bg-blue-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {b.origen === "manual" && (
                        <button
                          onClick={() => handleDelete(b)}
                          disabled={!canEliminar}
                          title={canEliminar ? "Eliminar" : noPermissionReason("Calendario de Cumpleanos", "eliminar")}
                          aria-label="Eliminar cumpleaños"
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400 text-sm">
                    {loading ? "Cargando..." : "Sin resultados para este filtro."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CumpleFoto({ b, className = "w-11 h-11" }: { b: BirthdayInfo; className?: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    let url = "";
    if (b.fotoArchivoOid == null) {
      setSrc("");
      return;
    }
    (async () => {
      try {
        const res = await filesApi.download(String(b.fotoArchivoOid));
        if (!res.ok || !active) return;
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        if (active) setSrc(url);
      } catch {
        if (active) setSrc("");
      }
    })();
    return () => {
      active = false;
      if (url) {
        try { URL.revokeObjectURL(url); } catch { /* noop */ }
      }
    };
  }, [b.fotoArchivoOid]);

  if (src) {
    return (
      <img
        src={src}
        alt={`Foto de ${b.nombreCompleto}`}
        className={`${className} rounded-full object-cover shrink-0 border border-gray-200`}
      />
    );
  }
  return (
    <div className={`bg-[#0778AC]/10 rounded-full ${className} flex items-center justify-center shrink-0`}>
      <span className="text-[#0778AC] font-bold text-sm">{b.edad}</span>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", required = false, placeholder, max, maxLength, readOnly = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  max?: string;
  maxLength?: number;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        max={max}
        maxLength={maxLength}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border-2 rounded-lg p-3 text-sm focus:outline-none focus:border-[#0778AC] ${
          readOnly ? "border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed" : "border-gray-200"
        }`}
      />
    </div>
  );
}

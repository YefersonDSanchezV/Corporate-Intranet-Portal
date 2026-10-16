import { Cake, Download, FileText, Pencil, Plus, Save, Search, Trash2, Users, X, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useBirthdays } from "../../../hooks/useBirthdays";
import { useAdminAccess } from "../useAdminAccess";
import { noPermissionReason } from "../AccessGate";
import { EDAD_MAXIMA, EDAD_MINIMA, isValidBirthDate, type BirthdayInfo } from "../../../utils/birthdays";
import { muroApi, type MuroReporte } from "../../../api/muro";
import { filesApi } from "../../../api/files";
import { apiAvailable } from "../../../api/client";

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
  const canGrabar = can("calendario-cumpleanios", "grabar");
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

  const [showReportes, setShowReportes] = useState(false);
  const [reportes, setReportes] = useState<MuroReporte[]>([]);
  const [loadingReportes, setLoadingReportes] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);

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

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setFechaNacimiento("");
    setCargo("");
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (b: BirthdayInfo) => {
    setEditing(b);
    setNombre(b.nombreCompleto);
    setFechaNacimiento(b.fechaNacimiento);
    setCargo(b.area);
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setNotice("");
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
    setSaving(true);
    const body = { nombreCompleto: nombre.trim(), fechaNacimiento, cargo: cargo.trim() };
    const res = editing ? await updateManual(editing, body) : await addManual(body);
    setSaving(false);
    if (!res.ok) {
      setFormError(res.error || "No se pudo guardar el cumpleaños.");
      return;
    }
    setNombre("");
    setFechaNacimiento("");
    setCargo("");
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

  const openReportes = async () => {
    setShowReportes(true);
    setLoadingReportes(true);
    try {
      if (await apiAvailable()) {
        setReportes(await muroApi.reportes());
      } else {
        setReportes([]);
      }
    } catch {
      setReportes([]);
    } finally {
      setLoadingReportes(false);
    }
  };

  const downloadReporte = async (r: MuroReporte) => {
    if (r.archivoOid == null || downloading != null) return;
    setDownloading(r.oid);
    try {
      const res = await filesApi.download(String(r.archivoOid));
      if (!res.ok) throw new Error(`No se pudo descargar (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.archivoNombre || `chat-cumpleanos-${r.fechaDia}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "No se pudo descargar el archivo.");
    } finally {
      setDownloading(null);
    }
  };

  const vista = previewCumpleanos(fechaNacimiento);

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Calendario de Cumpleaños</h1>
          <p className="text-gray-600 text-sm">
            Automáticos desde la fecha de nacimiento validada de cada usuario activo
            + manuales del botón Nuevo cumpleaños.
            {desdeBackend ? " Fuente: servidor." : " Fuente: usuarios sincronizados."}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={openReportes}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border-2 border-[#0778AC]/30 text-[#0778AC] px-5 py-2.5 rounded-lg font-semibold shadow-md"
          >
            <FileText className="w-4 h-4" /> Registros de Chat cumpleaños
          </button>
          <button
            onClick={openCreate}
            disabled={!canGrabar}
            title={canGrabar ? undefined : noPermissionReason("Calendario de Cumpleanos", "grabar")}
            className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-semibold shadow-md"
          >
            <Plus className="w-4 h-4" /> Nuevo cumpleaños
          </button>
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
                  <Cake className="w-5 h-5" /> {editing ? "Editar cumpleaños" : "Registrar cumpleaños"}
                </h3>
                <p className="text-white/70 text-xs mt-0.5">
                  {editing
                    ? "Actualice los datos del cumpleaños manual"
                    : "Complete los datos del nuevo cumpleaños. La edad y la fecha de cumpleaños se calculan solas"}
                </p>
              </div>
              <button onClick={closeForm} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-6 overflow-y-auto">
              <FormField label="Nombre completo *" value={nombre} onChange={setNombre} required placeholder="Ej: María Pérez Gómez" />
              <FormField label="Fecha de nacimiento *" value={fechaNacimiento} onChange={setFechaNacimiento} type="date" required max={format(new Date(), "yyyy-MM-dd")} />
              <div className="lg:col-span-2">
                <FormField label="Cargo *" value={cargo} onChange={setCargo} required maxLength={255} placeholder="Escríbelo libremente, ej: Contratista - Aseo turno noche" />
                <p className="text-[11px] text-gray-400 mt-1">
                  Texto libre, independiente del cargo registrado en el sistema.
                </p>
              </div>
              {vista && isValidBirthDate(fechaNacimiento) && (
                <div className="lg:col-span-2 bg-[#0778AC]/5 border border-[#0778AC]/20 rounded-lg px-4 py-2.5 text-sm text-[#0778AC] font-semibold">
                  Cumplirá {vista.edad} años el {format(vista.fecha, "dd 'de' MMMM 'de' yyyy", { locale: es })}
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
                  disabled={saving || (editing ? !canActualizar : !canGrabar)}
                  title={editing
                    ? (canActualizar ? undefined : noPermissionReason("Calendario de Cumpleanos", "actualizar"))
                    : (canGrabar ? undefined : noPermissionReason("Calendario de Cumpleanos", "grabar"))}
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

      {/* Modal Registros de Chat cumpleaños - CSV generados al cierre del día */}
      {showReportes && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Registros de Chat cumpleaños
                </h3>
                <p className="text-white/70 text-xs mt-0.5">
                  CSV con todos los mensajes del día, generado automáticamente a las 23:59
                </p>
              </div>
              <button onClick={() => setShowReportes(false)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {loadingReportes ? (
                <p className="text-gray-400 text-center py-8 text-sm italic">Cargando registros...</p>
              ) : reportes.length === 0 ? (
                <p className="text-gray-400 text-center py-8 text-sm italic">
                  Aún no hay registros generados. El primero se crea al cierre del día.
                </p>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-lg">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 text-sm font-semibold text-gray-600">Fecha</th>
                        <th className="p-3 text-sm font-semibold text-gray-600 text-center">Mensajes</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Archivo</th>
                        <th className="p-3 text-sm font-semibold text-gray-600 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reportes.map((r) => (
                        <tr key={r.oid} className="hover:bg-gray-50">
                          <td className="p-3 text-sm font-semibold">
                            {format(parseISO(r.fechaDia), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                          </td>
                          <td className="p-3 text-sm text-center">
                            <span className="inline-block bg-[#0778AC]/10 text-[#0778AC] font-bold px-2.5 py-1 rounded-full text-xs">
                              {r.totalMensajes}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-500">{r.archivoNombre || "-"}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => downloadReporte(r)}
                              disabled={r.archivoOid == null || downloading === r.oid}
                              className="inline-flex items-center gap-1.5 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-xs font-semibold"
                            >
                              <Download className="w-3.5 h-3.5" />
                              {downloading === r.oid ? "Descargando..." : "Descargar"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowReportes(false)}
                  className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
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
                <div className="bg-[#0778AC]/10 rounded-full w-11 h-11 flex items-center justify-center shrink-0">
                  <span className="text-[#0778AC] font-bold text-sm">{b.edad}</span>
                </div>
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
                    {b.origen === "manual" ? (
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
                        <button
                          onClick={() => handleDelete(b)}
                          disabled={!canEliminar}
                          title={canEliminar ? "Eliminar" : noPermissionReason("Calendario de Cumpleanos", "eliminar")}
                          aria-label="Eliminar cumpleaños"
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-semibold">Automático</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400 text-sm">
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

function FormField({ label, value, onChange, type = "text", required = false, placeholder, max, maxLength }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  max?: string;
  maxLength?: number;
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
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#0778AC]"
      />
    </div>
  );
}

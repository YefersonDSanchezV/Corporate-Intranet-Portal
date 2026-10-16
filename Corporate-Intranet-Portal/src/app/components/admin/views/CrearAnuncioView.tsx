import { Plus, X, Eye, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminAccess } from "../useAdminAccess";
import { noPermissionReason } from "../AccessGate";
import { useState, useMemo } from "react";
import { useAnnouncements } from "../../../contexts/AnnouncementsContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useAdminAuth } from "../../../contexts/AdminAuthContext";
import { AnnouncementHistory } from "../../AnnouncementHistory";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function CrearAnuncioView() {
  const { can } = useAdminAccess();
  const canGrabar = can("crear-anuncio", "grabar");
  const { announcements, addAnnouncement } = useAnnouncements();
  const { user } = useAuth();
  const { adminUser } = useAdminAuth();
  const effectiveUser = adminUser || user;
  const [showModal, setShowModal] = useState(false);
  const [selectedAnn, setSelectedAnn] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [areaInforma, setAreaInforma] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("12:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("23:59");
  const [dateError, setDateError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const totalPages = Math.max(1, Math.ceil(announcements.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => announcements.slice((safePage - 1) * pageSize, safePage * pageSize),
    [announcements, safePage, pageSize]
  );
  const [dateErrorField, setDateErrorField] = useState<"start" | "end" | "both" | null>(null);

  // Clase para resaltar en rojo el campo de fecha/hora donde está el error.
  const dateInputClass = (field: "start" | "end") =>
    `w-full border-2 rounded-lg p-3 text-sm focus:outline-none transition-all ${
      dateErrorField === field || dateErrorField === "both"
        ? "border-[#CF3438] focus:border-[#CF3438] ring-2 ring-[#CF3438]/20"
        : "border-gray-200"
    }`;

  const clearDateError = () => {
    if (dateError) {
      setDateError("");
      setDateErrorField(null);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAreaInforma("");
    setStartDate("");
    setStartTime("12:00");
    setEndDate("");
    setEndTime("23:59");
    setDateError("");
    setDateErrorField(null);
  };

  // Mismas reglas que RegisterAnnouncementModal, replicadas aquí porque este formulario
  // tiene su propio submit y el backend no valida el rango de fechas.
  const validateDates = (): boolean => {
    const startObj = new Date(`${startDate}T${startTime || "00:00"}`);
    const endObj = new Date(`${endDate}T${endTime || "23:59"}`);

    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
      setDateError("Ingrese fechas y horas válidas.");
      setDateErrorField("both");
      return false;
    }
    // La fecha y hora de inicio no puede ser anterior a la fecha y hora actual del sistema.
    if (startObj.getTime() < Date.now()) {
      setDateError("La fecha y hora de inicio no puede ser anterior a la fecha y hora actual.");
      setDateErrorField("start");
      return false;
    }
    if (endObj <= startObj) {
      setDateError("La fecha y hora de fin debe ser posterior a la de inicio.");
      setDateErrorField("end");
      return false;
    }
    setDateError("");
    setDateErrorField(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !areaInforma.trim() || !startDate || !endDate) return;
    if (!validateDates()) return;

    const ann: any = {
      title: title.trim(),
      description: description.trim(),
      areaInforma: areaInforma.trim() || undefined,
      startDate: new Date(`${startDate}T${startTime}:00`),
      endDate: new Date(`${endDate}T${endTime}:00`),
      createdBy: effectiveUser?.fullName || user?.fullName || "Administrador",
    };

    try {
      await addAnnouncement(ann, effectiveUser?.id || user?.id || null);
      resetForm();
      setShowModal(false);
      toast.success("Anuncio creado correctamente.");
    } catch (err: any) {
      // No se cierra el modal ni se limpia el formulario: el usuario no pierde lo escrito.
      toast.error(`No se pudo crear el anuncio: ${err?.message || "error desconocido"}`);
    }
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Crear Anuncio</h1>
          <p className="text-gray-600 text-sm">Cree y publique anuncios institucionales.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={!canGrabar}
          title={canGrabar ? undefined : noPermissionReason("Crear Anuncio", "grabar")}
          className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" />
          Crear Anuncio
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-100">
                <th className="p-3 text-xs font-semibold text-gray-600">Código</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Título</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Área informa</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Descripción</th>
                <th className="p-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Fecha/Hora Inicio</th>
                <th className="p-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Fecha/Hora Final</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Creador</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Estado</th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((ann) => (
                <tr key={ann.id} className="hover:bg-gray-50">
                  <td className="p-3 text-xs font-mono font-semibold text-[#0778AC] whitespace-nowrap" title={(ann as any).codigo}>{(ann as any).codigo || "—"}</td>
                  <td className="p-3 text-sm font-semibold text-gray-800 max-w-[160px] truncate" title={ann.title}>{ann.title}</td>
                  <td className="p-3 text-sm text-gray-600 max-w-[120px] truncate" title={(ann as any).areaInforma}>{(ann as any).areaInforma || "—"}</td>
                  <td className="p-3 text-sm text-gray-600 max-w-[200px] truncate" title={ann.description}>{ann.description || "—"}</td>
                  <td className="p-3 text-xs text-gray-600 whitespace-nowrap">{format(ann.startDate, "dd/MM/yyyy HH:mm", { locale: es })}</td>
                  <td className="p-3 text-xs text-gray-600 whitespace-nowrap">{format(ann.endDate, "dd/MM/yyyy HH:mm", { locale: es })}</td>
                  <td className="p-3 text-sm text-gray-600 max-w-[110px] truncate">{ann.createdBy}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${ann.estado === "PUBLICADO" ? "bg-green-100 text-green-700" : ann.estado === "RECHAZADO" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {ann.estado === "PUBLICADO" ? "Publicado" : ann.estado === "RECHAZADO" ? "Rechazado" : "Pendiente"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => setSelectedAnn(ann)} title="Consultar" className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400 text-sm">No hay anuncios registrados. Use “Crear Anuncio”.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Mostrar</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="border border-gray-300 rounded-md px-2 py-1 bg-white text-xs font-semibold">
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
            </select>
            <span>por página</span>
            <span className="ml-2 text-gray-500 hidden sm:inline">{announcements.length > 0 ? `${(safePage - 1) * pageSize + 1}-${Math.min(safePage * pageSize, announcements.length)} de ${announcements.length}` : "0 de 0"}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, safePage - 3), Math.min(totalPages, safePage + 2)).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`min-w-[32px] h-8 rounded-md text-xs font-semibold border ${p === safePage ? "bg-[#0778AC] text-white border-[#0778AC]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedAnn && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2"><Eye className="w-5 h-5" /> Consultar Anuncio</h3>
              <button onClick={() => setSelectedAnn(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Código</div>
                  <div className="text-sm font-mono font-semibold text-[#0778AC] mt-1">{(selectedAnn as any).codigo || "—"}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Área que informa</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">{(selectedAnn as any).areaInforma || "—"}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 md:col-span-2">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Título</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">{selectedAnn.title}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 md:col-span-2">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Descripción</div>
                  <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{selectedAnn.description || "—"}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Creado por</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">{selectedAnn.createdBy}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Estado</div>
                  <div className={`inline-block mt-1 text-[10px] font-bold px-2 py-1 rounded ${selectedAnn.estado === "PUBLICADO" ? "bg-green-100 text-green-700" : selectedAnn.estado === "RECHAZADO" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {selectedAnn.estado === "PUBLICADO" ? "Publicado" : selectedAnn.estado === "RECHAZADO" ? "Rechazado" : "Pendiente"}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Fecha inicio</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">{format(selectedAnn.startDate, "dd/MM/yyyy HH:mm", { locale: es })}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Fecha fin</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">{format(selectedAnn.endDate, "dd/MM/yyyy HH:mm", { locale: es })}</div>
                </div>
              </div>
              <AnnouncementHistory announcementId={selectedAnn.id} />
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button onClick={() => setSelectedAnn(null)} className="px-5 py-2.5 rounded-lg bg-[#0778AC] hover:bg-[#065a87] text-white text-sm font-semibold">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-white text-lg">Crear Anuncio</h3>
                <p className="text-white/70 text-xs mt-0.5">Complete los datos para registrar el anuncio</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 p-6 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Título del anuncio *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="Ej: Nuevo horario de atencion" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Área que informa *</label>
                <input value={areaInforma} onChange={(e) => setAreaInforma(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="Ej: Talento Humano, Comunicaciones, Gerencia" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm resize-none" placeholder="Descripción del anuncio..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de inicio *</label>
                  <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); clearDateError(); }} required min={format(new Date(), "yyyy-MM-dd")} className={dateInputClass("start")} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hora de inicio</label>
                  <input type="time" value={startTime} onChange={(e) => { setStartTime(e.target.value); clearDateError(); }} className={dateInputClass("start")} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de fin *</label>
                  <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); clearDateError(); }} required min={startDate || format(new Date(), "yyyy-MM-dd")} className={dateInputClass("end")} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hora de fin</label>
                  <input type="time" value={endTime} onChange={(e) => { setEndTime(e.target.value); clearDateError(); }} className={dateInputClass("end")} />
                </div>
              </div>
              {dateError && (
                <p className="text-sm text-[#CF3438] font-medium">⚠ {dateError}</p>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => { resetForm(); }} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">
                  Limpiar
                </button>
                <button
                  type="submit"
                  disabled={!canGrabar}
                  title={canGrabar ? undefined : noPermissionReason("Crear Anuncio", "grabar")}
                  className="flex items-center gap-2 bg-[#CF3438] hover:bg-[#a01f24] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

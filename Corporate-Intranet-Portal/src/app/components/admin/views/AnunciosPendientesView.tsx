import { Eye, Send, X, Pencil, Save, XCircle, Building2, User, Calendar } from "lucide-react";
import { useAdminAccess } from "../useAdminAccess";
import { noPermissionReason } from "../AccessGate";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAnnouncements } from "../../../contexts/AnnouncementsContext";
import { AnnouncementHistory } from "../../AnnouncementHistory";
import { toast } from "sonner";

export function AnunciosPendientesView() {
  const { can } = useAdminAccess();
  const canActualizar = can("anuncios-pendientes", "actualizar");
  const { announcements, publishAnnouncement, updateAnnouncement, rejectAnnouncement } = useAnnouncements() as any;
  const [selectedAnn, setSelectedAnn] = useState<any | null>(null);
  const [editingAnn, setEditingAnn] = useState<any | null>(null);
  const [rejectAnn, setRejectAnn] = useState<any | null>(null);
  const [rejectObs, setRejectObs] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("12:00");
  const [editEndDate, setEditEndDate] = useState("");
  const [editEndTime, setEditEndTime] = useState("23:59");
  const [editDateError, setEditDateError] = useState("");
  const [editErrorField, setEditErrorField] = useState<"start" | "end" | "both" | null>(null);

  // Clase para resaltar en rojo el campo de fecha/hora donde está el error.
  const editDateInputClass = (field: "start" | "end") =>
    `w-full border-2 rounded-lg p-3 text-sm focus:outline-none transition-all ${
      editErrorField === field || editErrorField === "both"
        ? "border-[#CF3438] focus:border-[#CF3438] ring-2 ring-[#CF3438]/20"
        : "border-gray-200"
    }`;

  const clearEditDateError = () => {
    if (editDateError) {
      setEditDateError("");
      setEditErrorField(null);
    }
  };

  // Formatea una fecha usando la hora local (evita el desfase de zona horaria de toISOString).
  const toLocalDateInput = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const openEdit = (ann: any) => {
    setEditingAnn(ann);
    setEditTitle(ann.title);
    setEditDescription(ann.description || "");
    setEditArea((ann as any).areaInforma || "");
    const s = new Date(ann.startDate);
    const e = new Date(ann.endDate);
    setEditStartDate(toLocalDateInput(s));
    setEditStartTime(s.toTimeString().slice(0,5));
    setEditEndDate(toLocalDateInput(e));
    setEditEndTime(e.toTimeString().slice(0,5));
    setEditDateError("");
    setEditErrorField(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn || !editTitle.trim() || !editDescription.trim() || !editStartDate || !editEndDate) return;

    const start = new Date(`${editStartDate}T${editStartTime}:00`);
    const end = new Date(`${editEndDate}T${editEndTime}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setEditDateError("Ingrese fechas y horas válidas.");
      setEditErrorField("both");
      return;
    }
    if (start.getTime() < Date.now()) {
      setEditDateError("La fecha y hora de inicio no puede ser anterior a la fecha y hora actual.");
      setEditErrorField("start");
      return;
    }
    if (end <= start) {
      setEditDateError("La fecha y hora de fin debe ser posterior a la de inicio.");
      setEditErrorField("end");
      return;
    }
    setEditDateError("");
    setEditErrorField(null);

    try {
      await updateAnnouncement(editingAnn.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        startDate: start,
        endDate: end,
        areaInforma: editArea.trim() || undefined,
      } as any);
      setEditingAnn(null);
      toast.success("Anuncio actualizado correctamente.");
    } catch (err: any) {
      // El modal permanece abierto para no perder los cambios del usuario.
      toast.error(`No se pudo actualizar el anuncio: ${err?.message || "error desconocido"}`);
    }
  };

  const handlePublish = async (id: string, onDone?: () => void) => {
    // Solo se puede publicar si la fecha y hora de inicio es igual o mayor a la actual.
    const ann = announcements.find((a: any) => a.id === id);
    if (ann) {
      const startTime = new Date(ann.startDate).getTime();
      if (!isNaN(startTime) && startTime < Date.now()) {
        toast.error(`El anuncio con código ${(ann as any).codigo || "—"}, no se puede publicar porque la fecha y hora es menor a la fecha y hora actual.`);
        return;
      }
    }
    try {
      await publishAnnouncement(id);
      toast.success("Anuncio publicado.");
      onDone?.();
    } catch (err: any) {
      toast.error(`No se pudo publicar el anuncio: ${err?.message || "error desconocido"}`);
    }
  };

  const handleReject = async (id: string, observation: string) => {
    try {
      await rejectAnnouncement(id, observation);
      setRejectAnn(null);
      setRejectObs("");
      toast.success("Anuncio rechazado.");
    } catch (err: any) {
      toast.error(`No se pudo rechazar el anuncio: ${err?.message || "error desconocido"}`);
    }
  };

  const pending = announcements.filter(a => a.estado === "PENDIENTE");

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Anuncios Pendientes</h1>
        <p className="text-gray-600 text-sm">Revise y apruebe los anuncios pendientes de publicacion.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-100">
                <th className="p-3 text-xs font-semibold text-gray-600">Código</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Titulo</th>
                <th className="p-3 text-xs font-semibold text-gray-600">Área informa</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Creado por</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Fecha inicio</th>
                <th className="p-3 text-sm font-semibold text-gray-600">Fecha fin</th>
                <th className="p-3 text-sm font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pending.length > 0 ? pending.map(ann => (
                <tr key={ann.id} className="hover:bg-gray-50">
                  <td className="p-3 text-xs font-mono font-semibold text-[#0778AC] whitespace-nowrap">{(ann as any).codigo || "—"}</td>
                  <td className="p-3 font-semibold text-sm max-w-[160px] truncate" title={ann.title}>{ann.title}</td>
                  <td className="p-3 text-xs text-gray-600 max-w-[120px] truncate" title={(ann as any).areaInforma}>{(ann as any).areaInforma || "—"}</td>
                  <td className="p-3 text-sm text-gray-600">{ann.createdBy}</td>
                  <td className="p-3 text-sm">{format(ann.startDate, "dd/MM/yyyy HH:mm", { locale: es })}</td>
                  <td className="p-3 text-sm">{format(ann.endDate, "dd/MM/yyyy HH:mm", { locale: es })}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => setSelectedAnn(ann)} className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg" title="Ver detalle">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(ann)}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        title={canActualizar ? "Editar" : noPermissionReason("Anuncios Pendientes", "actualizar")}
                        aria-label="Editar anuncio"
                        disabled={!canActualizar}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePublish(ann.id)}
                        className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        title={canActualizar ? "Publicar" : noPermissionReason("Anuncios Pendientes", "actualizar")}
                        aria-label="Publicar anuncio"
                        disabled={!canActualizar}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setRejectAnn(ann); setRejectObs(""); }}
                        className="p-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        title={canActualizar ? "Rechazar" : noPermissionReason("Anuncios Pendientes", "actualizar")}
                        aria-label="Rechazar anuncio"
                        disabled={!canActualizar}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">No hay anuncios pendientes de aprobacion.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAnn && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold text-white flex items-center gap-2"><Eye className="w-5 h-5" /> Consultar Anuncio</h3>
              <button onClick={() => setSelectedAnn(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Código</div>
                  <div className="text-sm font-mono font-semibold text-[#0778AC] mt-1">{(selectedAnn as any).codigo || "—"}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Área que informa</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1 flex items-center gap-1"><Building2 className="w-4 h-4 text-[#0778AC]" /> {(selectedAnn as any).areaInforma || "—"}</div>
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
                  <div className="text-sm font-semibold text-gray-800 mt-1 flex items-center gap-1"><User className="w-4 h-4" /> {selectedAnn.createdBy}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Estado</div>
                  <div className="inline-block mt-1 text-[10px] font-bold px-2 py-1 rounded bg-amber-100 text-amber-700">Pendiente</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Fecha/Hora Inicio</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">{format(selectedAnn.startDate, "dd/MM/yyyy HH:mm", { locale: es })}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Fecha/Hora Final</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">{format(selectedAnn.endDate, "dd/MM/yyyy HH:mm", { locale: es })}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Vigencia</div>
                  <div className="text-xs text-gray-600 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(selectedAnn.startDate, "dd/MM/yyyy HH:mm", { locale: es })} → {format(selectedAnn.endDate, "dd/MM/yyyy HH:mm", { locale: es })}</div>
                </div>
              </div>
              <AnnouncementHistory announcementId={selectedAnn.id} />
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handlePublish(selectedAnn.id, () => setSelectedAnn(null))}
                  disabled={!canActualizar}
                  title={canActualizar ? undefined : noPermissionReason("Anuncios Pendientes", "actualizar")}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold text-sm"
                >
                  Publicar anuncio
                </button>
                <button onClick={() => setSelectedAnn(null)} className="flex-1 bg-[#0778AC] hover:bg-[#065a87] text-white py-2.5 rounded-lg text-sm font-semibold">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingAnn && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <h3 className="font-bold text-white flex items-center gap-2"><Pencil className="w-5 h-5" /> Editar Anuncio</h3>
              <button onClick={() => setEditingAnn(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 gap-5 p-6 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Título del anuncio *</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Área que informa</label>
                <input value={editArea} onChange={e => setEditArea(e.target.value)} placeholder="Ej: Talento Humano" className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={4} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de inicio *</label>
                  <input type="date" value={editStartDate} onChange={e => { setEditStartDate(e.target.value); clearEditDateError(); }} required className={editDateInputClass("start")} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hora de inicio</label>
                  <input type="time" value={editStartTime} onChange={e => { setEditStartTime(e.target.value); clearEditDateError(); }} className={editDateInputClass("start")} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de fin *</label>
                  <input type="date" value={editEndDate} onChange={e => { setEditEndDate(e.target.value); clearEditDateError(); }} required className={editDateInputClass("end")} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hora de fin</label>
                  <input type="time" value={editEndTime} onChange={e => { setEditEndTime(e.target.value); clearEditDateError(); }} className={editDateInputClass("end")} />
                </div>
              </div>
              {editDateError && (
                <p className="text-sm text-[#CF3438] font-medium">⚠ {editDateError}</p>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={!canActualizar}
                  title={canActualizar ? undefined : noPermissionReason("Anuncios Pendientes", "actualizar")}
                  className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
                ><Save className="w-4 h-4" /> Guardar</button>

              </div>
            </form>
          </div>
        </div>
      )}

      {rejectAnn && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#CF3438] px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2"><XCircle className="w-5 h-5" /> Rechazar Anuncio</h3>
              <button onClick={() => setRejectAnn(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Anuncio: <span className="font-semibold">{rejectAnn.title}</span> <span className="font-mono text-xs text-[#0778AC]">({(rejectAnn as any).codigo})</span></p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Observación *</label>
                <textarea value={rejectObs} onChange={e => setRejectObs(e.target.value)} rows={4} placeholder="Indique el motivo del rechazo..." required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[#CF3438]" />
                <p className="text-xs text-gray-400 mt-1">{rejectObs.length}/500</p>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button onClick={() => setRejectAnn(null)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">Cancelar</button>
                <button
                  onClick={() => { if (!rejectObs.trim()) return; handleReject(rejectAnn.id, rejectObs.trim()); }}
                  disabled={!rejectObs.trim() || !canActualizar}
                  title={canActualizar ? undefined : noPermissionReason("Anuncios Pendientes", "actualizar")}
                  className="bg-[#CF3438] hover:bg-[#a01f24] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
                >Rechazar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
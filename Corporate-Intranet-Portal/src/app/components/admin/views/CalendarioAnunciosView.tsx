import { Calendar as CalendarIcon, Eye, X, Building2, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "../../ui/calendar";
import { useAnnouncements } from "../../../contexts/AnnouncementsContext";
import { useAuth } from "../../../contexts/AuthContext";

export function CalendarioAnunciosView() {
  const { announcements } = useAnnouncements();
  const { users } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [previewAnn, setPreviewAnn] = useState<(typeof announcements)[number] | null>(null);

  const stripDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayAnnouncementsAll = announcements.filter(ann => {
    if (!date) return false;
    const start = new Date(ann.startDate);
    const end = new Date(ann.endDate);
    const t = stripDate(date);
    return t >= stripDate(start) && t <= stripDate(end);
  });
  // Solo 4 más recientes visibles, resto con scroll
  const dayAnnouncements = [...dayAnnouncementsAll].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const sortedUpcoming = useMemo(() => {
    return [...announcements].filter(a => a.published).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [announcements]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(sortedUpcoming.length / pageSize));
  const paginatedUpcoming = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedUpcoming.slice(start, start + pageSize);
  }, [sortedUpcoming, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Calendario de Anuncios</h1>
        <p className="text-gray-600 text-sm">Visualice los anuncios programados por fecha.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex flex-col min-h-[440px] lg:min-h-[420px] justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md w-full p-1"
            classNames={{
              months: "flex flex-col w-full",
              month: "flex flex-col w-full gap-1",
              table: "w-full border-collapse",
              head_row: "flex w-full",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[13px] h-8 flex items-center justify-center flex-1",
              row: "flex w-full mt-1",
              cell: "relative p-0 text-center text-sm flex-1 flex items-center justify-center [&:has([aria-selected])]:bg-accent",
              day: "size-9 p-0 font-medium text-[14px] aria-selected:opacity-100",
              caption_label: "text-[15px] font-semibold",
              nav_button: "size-8 bg-transparent p-0 opacity-60 hover:opacity-100",
            }}
          />
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-lg p-5 shadow-sm flex flex-col min-h-[440px] lg:min-h-[420px]">
          <h2 className="font-bold text-[#0778AC] flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Anuncios por fechas
          </h2>
          <p className="text-xs text-gray-500 mb-4">{date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: es }) : "Seleccione una fecha"}</p>
          {dayAnnouncements.length > 0 ? (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {dayAnnouncements.map(ann => (
                <div key={ann.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-sm">{ann.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${ann.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {ann.published ? "Publicado" : "Pendiente"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ann.description}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 mt-2">
                    <span className="inline-flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Inicio: {format(new Date(ann.startDate), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                    <span className="inline-flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Fin: {format(new Date(ann.endDate), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8 flex-1 flex items-center justify-center">No hay anuncios para esta fecha.</p>
          )}
        </div>
      </div>

      {/* Lista inferior con todos los anuncios próximos */}
      <div className="mt-8 bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-[#0778AC]">Próximos anuncios en panel público</h2>
          <p className="text-xs text-gray-500 mt-1">Todos los anuncios registrados aparecerán aquí con vista previa de cómo se verán en el panel de anuncios.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-3 text-xs font-semibold text-gray-600">Título</th>
                <th className="p-3 text-xs font-semibold text-gray-600">Creado por</th>
                <th className="p-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Fecha/Hora Inicio</th>
                <th className="p-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Fecha/Hora Final</th>
                <th className="p-3 text-xs font-semibold text-gray-600">Estado</th>
                <th className="p-3 text-xs font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedUpcoming.map(ann => (
                <tr key={ann.id} className="hover:bg-gray-50">
                  <td className="p-3 text-sm font-semibold text-gray-800 max-w-[200px] truncate" title={ann.title}>{ann.title}</td>
                  <td className="p-3 text-xs text-gray-700 max-w-[140px] truncate" title={ann.createdBy}>{ann.createdBy}</td>
                  <td className="p-3 text-xs text-gray-600 whitespace-nowrap">{format(new Date(ann.startDate), "dd/MM/yyyy HH:mm", { locale: es })}</td>
                  <td className="p-3 text-xs text-gray-600 whitespace-nowrap">{format(new Date(ann.endDate), "dd/MM/yyyy HH:mm", { locale: es })}</td>
                  <td className="p-3"><span className={`text-[10px] font-bold px-2 py-1 rounded ${ann.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{ann.published ? "Publicado" : "Pendiente"}</span></td>
                  <td className="p-3 text-center">
                    <button onClick={() => setPreviewAnn(ann)} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-[#0778AC] px-3 py-1.5 rounded-lg text-xs font-semibold">
                      <Eye className="w-3.5 h-3.5" /> Vista previa
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedUpcoming.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">No hay anuncios registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Mostrar</span>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="border border-gray-300 rounded-md px-2 py-1 bg-white text-xs font-semibold">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
            <span>por página</span>
            <span className="ml-2 text-gray-500 hidden sm:inline">{sortedUpcoming.length > 0 ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, sortedUpcoming.length)} de ${sortedUpcoming.length}` : "0 de 0"}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2)).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`min-w-[32px] h-8 rounded-md text-xs font-semibold border ${p === page ? "bg-[#0778AC] text-white border-[#0778AC]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {previewAnn && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2"><Eye className="w-5 h-5" /> Vista previa - Panel público</h3>
              <button onClick={() => setPreviewAnn(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {/* Simulación de AnnouncementPanel card */}
              <div className="border-2 border-[#0778AC]/20 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${previewAnn.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{previewAnn.published ? "Publicado" : "Pendiente"}</span>
                  <span className="text-xs text-gray-500">{format(new Date(previewAnn.startDate), "dd 'de' MMMM yyyy", { locale: es })} - {format(new Date(previewAnn.endDate), "dd 'de' MMMM yyyy", { locale: es })}</span>
                </div>
                <h4 className="font-bold text-[#0778AC] text-lg mb-1">{previewAnn.title}</h4>
                {(previewAnn as any).areaInforma && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#0778AC] mb-2">
                    <Building2 className="w-3 h-3" />
                    <span>{(previewAnn as any).areaInforma}</span>
                  </div>
                )}
                <p className="text-sm text-gray-700 leading-relaxed">{previewAnn.description || "Sin descripción"}</p>
                {(() => {
                  const creator = users.find(u => u.fullName === previewAnn.createdBy || u.username === previewAnn.createdBy);
                  const cargo = (previewAnn as any).areaInforma || creator?.position || creator?.role || "";
                  return <p className="text-xs text-gray-500 mt-4 flex items-center gap-1.5"><User className="w-3 h-3" /> Creado por: {previewAnn.createdBy}{cargo ? ` — ${cargo}` : ""}</p>;
                })()}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">Así se verá en Inicio → Anuncios y Comunicados</p>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end border-t border-gray-100">
              <button onClick={() => setPreviewAnn(null)} className="px-5 py-2.5 rounded-lg bg-[#0778AC] hover:bg-[#065a87] text-white text-sm font-semibold">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
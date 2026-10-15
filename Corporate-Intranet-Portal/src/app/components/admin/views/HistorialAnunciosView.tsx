import { Eye, X, Building2, User, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAnnouncements } from "../../../contexts/AnnouncementsContext";

export function HistorialAnunciosView() {
  const { announcements } = useAnnouncements();
  const [selectedAnn, setSelectedAnn] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const sorted = useMemo(() => {
    return [...announcements].filter(a => a.estado === "PUBLICADO" || a.estado === "RECHAZADO").sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [announcements]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize]);

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Histórico de Anuncios</h1>
        <p className="text-gray-600 text-sm">Consulte el histórico de anuncios publicados y rechazados.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
<thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-3 text-xs font-semibold text-gray-600">Código</th>
              <th className="p-3 text-xs font-semibold text-gray-600">Título</th>
              <th className="p-3 text-xs font-semibold text-gray-600">Área informa</th>
              <th className="p-3 text-xs font-semibold text-gray-600">Creado por</th>
              <th className="p-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Fecha/Hora Inicio</th>
              <th className="p-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Fecha/Hora Final</th>
              <th className="p-3 text-xs font-semibold text-gray-600">Estado</th>
              <th className="p-3 text-xs font-semibold text-gray-600 text-center">Acciones</th>
            </tr>
          </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map(ann => (
                <tr key={ann.id} className="hover:bg-gray-50">
                  <td className="p-3 text-xs font-mono font-semibold text-[#0778AC] whitespace-nowrap">{(ann as any).codigo || "—"}</td>
                  <td className="p-3 text-sm font-semibold text-gray-800 max-w-[180px] truncate" title={ann.title}>{ann.title}</td>
                  <td className="p-3 text-xs text-gray-600 max-w-[120px] truncate" title={(ann as any).areaInforma}>{(ann as any).areaInforma || "—"}</td>
                  <td className="p-3 text-xs text-gray-700 max-w-[140px] truncate" title={ann.createdBy}>{ann.createdBy}</td>
                  <td className="p-3 text-xs text-gray-600 whitespace-nowrap">{format(new Date(ann.startDate), "dd/MM/yyyy HH:mm", { locale: es })}</td>
                  <td className="p-3 text-xs text-gray-600 whitespace-nowrap">{format(new Date(ann.endDate), "dd/MM/yyyy HH:mm", { locale: es })}</td>
                  <td className="p-3"><span className={`text-[10px] font-bold px-2 py-1 rounded ${ann.estado === "PUBLICADO" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{ann.estado === "PUBLICADO" ? "Publicado" : "Rechazado"}</span></td>
                  <td className="p-3 text-center">
                    <button onClick={() => setSelectedAnn(ann)} title="Consultar" className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-gray-400 text-sm">No hay histórico para mostrar.</td></tr>
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
            <span className="ml-2 text-gray-500 hidden sm:inline">{sorted.length > 0 ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, sorted.length)} de ${sorted.length}` : "0 de 0"}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2)).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`min-w-[32px] h-8 rounded-md text-xs font-semibold border ${p === page ? "bg-[#0778AC] text-white border-[#0778AC]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40">
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
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Código</div>
                  <div className="text-sm font-mono font-semibold text-[#0778AC] mt-1">{(selectedAnn as any).codigo || "—"}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Área informa</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1 flex items-center gap-1"><Building2 className="w-4 h-4 text-[#0778AC]" /> {(selectedAnn as any).areaInforma || "—"}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 md:col-span-2">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Título</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">{selectedAnn.title}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 md:col-span-2">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Descripción</div>
                  <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{selectedAnn.description || "—"}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Creado por</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1 flex items-center gap-1"><User className="w-4 h-4" /> {selectedAnn.createdBy}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Estado</div>
                  <div className={`inline-block mt-1 text-[10px] font-bold px-2 py-1 rounded ${selectedAnn.estado === "PUBLICADO" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{selectedAnn.estado === "PUBLICADO" ? "Publicado" : "Rechazado"}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Fecha/Hora Inicio</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">{format(new Date(selectedAnn.startDate), "dd/MM/yyyy HH:mm", { locale: es })}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Fecha/Hora Final</div>
                  <div className="text-sm font-semibold text-gray-800 mt-1">{format(new Date(selectedAnn.endDate), "dd/MM/yyyy HH:mm", { locale: es })}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-[11px] font-bold text-gray-500 uppercase">Vigencia</div>
                  <div className="text-xs text-gray-600 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(selectedAnn.startDate), "dd/MM/yyyy HH:mm", { locale: es })} → {format(new Date(selectedAnn.endDate), "dd/MM/yyyy HH:mm", { locale: es })}</div>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button onClick={() => setSelectedAnn(null)} className="px-5 py-2.5 rounded-lg bg-[#0778AC] hover:bg-[#065a87] text-white text-sm font-semibold">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

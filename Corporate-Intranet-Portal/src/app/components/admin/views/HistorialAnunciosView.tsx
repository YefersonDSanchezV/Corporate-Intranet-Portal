import { Search, Filter } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAnnouncements } from "../../../contexts/AnnouncementsContext";

export function HistorialAnunciosView() {
  const { announcements } = useAnnouncements();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "pending">("all");

  const filtered = announcements.filter(ann => {
    const matchesSearch = ann.title.toLowerCase().includes(searchTerm.toLowerCase()) || ann.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || (statusFilter === "published" ? ann.published : !ann.published);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Historial de Anuncios</h1>
          <p className="text-gray-600 text-sm">Consulte el historial completo de anuncios creados.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por titulo o creador..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0778AC]" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="border-2 border-gray-200 rounded-lg p-2.5 text-sm bg-white flex-1">
            <option value="all">Todos los estados</option>
            <option value="published">Publicados</option>
            <option value="pending">Pendientes</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-100">
                <th className="p-4 text-sm font-semibold text-gray-600">Titulo</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Creado por</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Vigencia</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Estado</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Fecha creacion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? filtered.map(ann => (
                <tr key={ann.id} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold text-sm">{ann.title}</td>
                  <td className="p-4 text-sm text-gray-600">{ann.createdBy}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {format(ann.startDate, "dd/MM/yy", { locale: es })} - {format(ann.endDate, "dd/MM/yy", { locale: es })}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${ann.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {ann.published ? "Publicado" : "Pendiente"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{format(ann.createdAt, "dd/MM/yyyy", { locale: es })}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No se encontraron anuncios.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
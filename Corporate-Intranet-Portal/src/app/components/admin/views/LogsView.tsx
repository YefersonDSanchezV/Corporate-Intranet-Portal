import { Search, Filter, Calendar, Eye, X } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "../../../contexts/AuthContext";

export function LogsView() {
  const { accessRecords } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const filteredLogs = accessRecords.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || format(new Date(log.accessTime), "yyyy-MM-dd") === dateFilter;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Logs del Sistema</h1>
        <p className="text-gray-600 text-sm">Consulta detallada de todas las acciones realizadas en la plataforma.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar usuario..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0778AC]" />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0778AC]" />
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Filter className="w-4 h-4 mr-2" />
          {filteredLogs.length} registro(s) encontrado(s)
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Usuario</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Modulo</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Fecha y Hora</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0778AC]/10 flex items-center justify-center text-[#0778AC] font-bold text-xs uppercase">
                        {log.userName.substring(0, 2)}
                      </div>
                      <span className="font-semibold text-gray-700">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.moduleName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {format(new Date(log.accessTime), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => setSelectedLog(log)} className="p-2 bg-gray-100 hover:bg-[#0778AC] hover:text-white text-gray-500 rounded-lg transition-all" title="Ver detalles">
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">No se encontraron registros de logs.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0778AC] px-6 py-5 flex justify-between items-center rounded-t-xl">
              <h3 className="font-bold text-xl text-white">Detalles del Acceso</h3>
              <button onClick={() => setSelectedLog(null)} className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 font-mono text-sm">
              <pre className="text-green-400">{JSON.stringify(selectedLog, null, 2)}</pre>
            </div>
            <div className="bg-[#121212] px-6 py-4 border-t border-white/10 flex justify-end">
              <button onClick={() => setSelectedLog(null)} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-semibold transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
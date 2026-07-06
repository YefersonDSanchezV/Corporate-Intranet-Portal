import { Search, Filter, Calendar, FileJson, Eye, X } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "../../contexts/AuthContext";
import { getGreeting } from "../../utils/greetings";

interface LogEntry {
  id: string;
  username: string;
  action: "GET" | "POST" | "PUT" | "DELETE" | "LOGIN" | "LOGOUT";
  module: string;
  timestamp: Date;
  details: any;
}

const MOCK_LOGS: LogEntry[] = [
  {
    id: "1",
    username: "admin",
    action: "POST",
    module: "Gestión Institucional",
    timestamp: new Date(2026, 3, 15, 8, 30, 0),
    details: {
      action: "Create Achievement",
      data: { title: "Acreditación Excelencia", level: "Internacional", date: "2026-04" },
      ip: "192.168.1.50",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
    }
  },
  {
    id: "2",
    username: "comunicaciones",
    action: "PUT",
    module: "Comunicaciones",
    timestamp: new Date(2026, 3, 15, 9, 15, 20),
    details: {
      action: "Update Announcement",
      id: "ann_123",
      changes: { title: "Nuevo horario de atención" },
      ip: "192.168.1.102"
    }
  },
  {
    id: "3",
    username: "ti",
    action: "DELETE",
    module: "Gestión de Usuarios",
    timestamp: new Date(2026, 3, 15, 10, 0, 5),
    details: {
      action: "Deactivate User",
      targetUser: "jsmith",
      reason: "Termination of contract"
    }
  },
  {
    id: "4",
    username: "sistemas",
    action: "POST",
    module: "Administrador Intranet",
    timestamp: new Date(2026, 3, 14, 16, 45, 0),
    details: {
      action: "Register Redirect Site",
      site: { title: "Portal Facturación", url: "https://facturas.icvc.com" }
    }
  },
  {
    id: "5",
    username: "coordinador_ti",
    action: "GET",
    module: "Logs",
    timestamp: new Date(2026, 3, 15, 11, 20, 0),
    details: {
      action: "View Logs List",
      filters: { username: "all", type: "all" }
    }
  }
];

export function LogsModule() {
  const { user } = useAuth();
  const greeting = getGreeting();
  const [logs] = useState<LogEntry[]>(MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesDate = !dateFilter || format(log.timestamp, "yyyy-MM-dd") === dateFilter;
    return matchesSearch && matchesAction && matchesDate;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case "POST": return "bg-green-100 text-green-800 border-green-200";
      case "PUT": return "bg-blue-100 text-blue-800 border-blue-200";
      case "DELETE": return "bg-red-100 text-red-800 border-red-200";
      case "GET": return "bg-gray-100 text-gray-800 border-gray-200";
      case "LOGIN": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#0778AC] mb-2">Logs del Sistema</h1>
        <div className="h-1 bg-gradient-to-r from-[#CF3438] to-transparent w-32 md:w-48 rounded-full"></div>
      </div>

      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#0778AC]">
        <p className="text-gray-700 font-bold text-sm md:text-base mb-1">
          ¡{greeting}, {user?.fullName.split(' ')[0]}!
        </p>
        <p className="text-gray-600 text-sm md:text-base">
          En este módulo podrás consultar el registro detallado de todas las acciones realizadas en la plataforma.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre de Usuario</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0778AC]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Acción</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0778AC] appearance-none"
              >
                <option value="all">Todas las acciones</option>
                <option value="GET">GET (Consulta)</option>
                <option value="POST">POST (Creación)</option>
                <option value="PUT">PUT (Actualización)</option>
                <option value="DELETE">DELETE (Eliminación)</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0778AC]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0778AC] text-white">
                <th className="px-6 py-4 text-left font-semibold text-sm">Usuario</th>
                <th className="px-6 py-4 text-left font-semibold text-sm">Acción</th>
                <th className="px-6 py-4 text-left font-semibold text-sm">Módulo</th>
                <th className="px-6 py-4 text-left font-semibold text-sm">Fecha y Hora</th>
                <th className="px-6 py-4 text-center font-semibold text-sm">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0778AC]/10 flex items-center justify-center text-[#0778AC] font-bold text-xs uppercase">
                          {log.username.substring(0, 2)}
                        </div>
                        <span className="font-semibold text-gray-700">{log.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.module}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(log.timestamp, "dd/MM/yyyy HH:mm:ss", { locale: es })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 bg-gray-100 hover:bg-[#0778AC] hover:text-white text-gray-500 rounded-lg transition-all"
                        title="Ver detalles JSON"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                    No se encontraron registros de logs con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalles JSON */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0778AC] px-6 py-5 flex justify-between items-center rounded-t-xl">
              <div>
                <h3 className="font-bold text-xl text-white">Detalles de la Acción (JSON)</h3>
                <p className="text-blue-100 text-xs mt-1">Estructura de datos detallada de la operación realizada</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 font-mono text-sm">
              <pre className="text-green-400">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="bg-[#121212] px-6 py-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

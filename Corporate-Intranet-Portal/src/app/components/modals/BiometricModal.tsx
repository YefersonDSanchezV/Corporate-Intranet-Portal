import { X, Plus, Calendar as CalendarIcon, Clock, Filter, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BiometricEntry {
  id: string;
  employeeName: string;
  docNumber: string;
  position: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: "Puntual" | "Retraso" | "Inasistencia" | "Permiso";
}

const INITIAL_ENTRIES: BiometricEntry[] = [
  {
    id: "1",
    employeeName: "Sofía Ramírez",
    docNumber: "1.032.109.876",
    position: "Administrativo",
    date: "2026-04-14",
    checkIn: "07:05 AM",
    checkOut: "04:30 PM",
    status: "Puntual"
  },
  {
    id: "2",
    employeeName: "Roberto Sánchez",
    docNumber: "1.021.098.765",
    position: "Recursos Humanos",
    date: "2026-04-14",
    checkIn: "07:15 AM",
    checkOut: "04:45 PM",
    status: "Retraso"
  }
];

interface BiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BiometricModal({ isOpen, onClose }: BiometricModalProps) {
  const [activeTab, setActiveTab] = useState<"consult" | "upload" | "agenda">("consult");
  const [entries, setEntries] = useState<BiometricEntry[]>(INITIAL_ENTRIES);
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredEntries = entries.filter(entry => 
    entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.docNumber.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0778AC] to-[#0996d3] p-4 md:p-6 text-white flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold italic">Biometric - Agenda del Personal</h2>
            <p className="text-white/80 text-xs mt-1">Monitoreo de asistencia y agenda laboral</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0 overflow-x-auto">
          {[
            { key: "consult", label: "Consultar Marcaciones", icon: Clock },
            { key: "agenda", label: "Agenda Mensual", icon: CalendarIcon },
            { key: "upload", label: "Cargar Novedad", icon: Plus },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                activeTab === tab.key
                  ? "border-[#CF3438] text-[#CF3438] bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === "consult" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <div className="relative w-full md:w-96">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#0778AC]"
                  />
                </div>
                <button 
                  onClick={() => setActiveTab("upload")}
                  className="bg-[#CF3438] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 hover:bg-[#a01f24] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Cargar Marcación
                </button>
              </div>

              <div className="overflow-x-auto border-2 border-gray-100 rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-100">
                      <th className="text-left px-4 py-3 font-bold text-gray-600">Empleado</th>
                      <th className="text-left px-4 py-3 font-bold text-gray-600">Documento</th>
                      <th className="text-left px-4 py-3 font-bold text-gray-600">Fecha</th>
                      <th className="text-center px-4 py-3 font-bold text-gray-600">Entrada</th>
                      <th className="text-center px-4 py-3 font-bold text-gray-600">Salida</th>
                      <th className="text-center px-4 py-3 font-bold text-gray-600">Estado</th>
                      <th className="text-center px-4 py-3 font-bold text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map(entry => (
                      <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800">{entry.employeeName}</div>
                          <div className="text-[10px] text-gray-500 uppercase">{entry.position}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{entry.docNumber}</td>
                        <td className="px-4 py-3 text-gray-600">{entry.date}</td>
                        <td className="px-4 py-3 text-center text-blue-600 font-medium">{entry.checkIn}</td>
                        <td className="px-4 py-3 text-center text-orange-600 font-medium">{entry.checkOut}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            entry.status === "Puntual" ? "bg-green-100 text-green-700" :
                            entry.status === "Retraso" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="max-w-2xl mx-auto py-8">
              <div className="bg-gray-50 rounded-xl p-8 border-2 border-dashed border-gray-200 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-700 mb-2">Registro de Novedades</h3>
                <p className="text-gray-500 text-sm mb-6">Formulario para cargar marcaciones manuales o permisos del personal.</p>
                
                <form className="space-y-4 text-left">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Número de Documento</label>
                      <input type="text" className="w-full border-2 border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#0778AC] transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha</label>
                      <input type="date" className="w-full border-2 border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#0778AC] transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Novedad</label>
                    <select className="w-full border-2 border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#0778AC] transition-all appearance-none">
                      <option>Marcación Manual (Entrada)</option>
                      <option>Marcación Manual (Salida)</option>
                      <option>Permiso Laboral</option>
                      <option>Incapacidad</option>
                      <option>Vacaciones</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Observaciones</label>
                    <textarea className="w-full border-2 border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#0778AC] transition-all resize-none" rows={3}></textarea>
                  </div>
                  <button type="submit" className="w-full bg-[#0778AC] text-white py-3 rounded-lg font-bold shadow-lg hover:bg-[#065a87] transition-all">
                    Cargar Novedad al Sistema
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "agenda" && (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium italic">Visor de agenda mensual en desarrollo...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

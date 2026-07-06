import { Eye, Send, CheckCircle, XCircle, X, Trash2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAnnouncements } from "../../../contexts/AnnouncementsContext";

export function AnunciosPendientesView() {
  const { announcements, publishAnnouncement, deleteAnnouncement } = useAnnouncements();
  const [selectedAnn, setSelectedAnn] = useState<any | null>(null);

  const pending = announcements.filter(a => !a.published);

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
                <th className="p-4 text-sm font-semibold text-gray-600">Titulo</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Creado por</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Fecha inicio</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Fecha fin</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pending.length > 0 ? pending.map(ann => (
                <tr key={ann.id} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold text-sm">{ann.title}</td>
                  <td className="p-4 text-sm text-gray-600">{ann.createdBy}</td>
                  <td className="p-4 text-sm">{format(ann.startDate, "dd/MM/yyyy HH:mm", { locale: es })}</td>
                  <td className="p-4 text-sm">{format(ann.endDate, "dd/MM/yyyy HH:mm", { locale: es })}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => setSelectedAnn(ann)} className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg" title="Ver detalle">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => publishAnnouncement(ann.id)} className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg" title="Publicar">
                        <Send className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm("Eliminar anuncio?")) deleteAnnouncement(ann.id); }} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay anuncios pendientes de aprobacion.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAnn && (
        <div className="fixed inset-0 z-[200] bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#0778AC]">{selectedAnn.title}</h2>
              <button onClick={() => setSelectedAnn(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{selectedAnn.description}</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Creado por: {selectedAnn.createdBy}</p>
              <p>Inicio: {format(selectedAnn.startDate, "dd/MM/yyyy HH:mm", { locale: es })}</p>
              <p>Fin: {format(selectedAnn.endDate, "dd/MM/yyyy HH:mm", { locale: es })}</p>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => { publishAnnouncement(selectedAnn.id); setSelectedAnn(null); }} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold text-sm">
                Publicar anuncio
              </button>
              <button onClick={() => setSelectedAnn(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-semibold text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
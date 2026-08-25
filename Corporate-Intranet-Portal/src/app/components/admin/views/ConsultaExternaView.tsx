import { Plus, Trash2, ExternalLink, Save } from "lucide-react";
import { useState } from "react";
import { useSystem } from "../../../contexts/SystemContext";

export function ConsultaExternaView() {
  const { epsList, addEps, removeEps } = useSystem();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const reset = () => { setName(""); setUrl(""); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    addEps({ name, url });
    reset();
    setShowForm(false);
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Consulta Externa</h1>
          <p className="text-gray-600 text-sm">Administre las plataformas EPS para consulta externa.</p>
        </div>
        <button onClick={() => { reset(); setShowForm(!showForm); }} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md">
          <Plus className="w-4 h-4" />
          {showForm ? "Ver listado" : "Nueva EPS"}
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 max-w-3xl">
          <h2 className="text-lg font-bold text-[#0778AC] mb-6">Registrar nueva plataforma EPS</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la EPS *</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="Ej: Nueva EPS" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">URL de la plataforma *</label>
              <input value={url} onChange={e => setUrl(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="https://..." />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">Cancelar</button>
              <button type="submit" className="flex items-center gap-2 bg-[#CF3438] hover:bg-[#a01f24] text-white px-6 py-2.5 rounded-lg text-sm font-semibold">
                <Save className="w-4 h-4" /> Guardar EPS
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-100">
                  <th className="p-4 text-sm font-semibold text-gray-600">EPS</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">URL</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {epsList.map((eps) => (
                  <tr key={eps.id} className="hover:bg-gray-50">
                    <td className="p-4 font-semibold text-sm">{eps.name}</td>
                    <td className="p-4"><a href={eps.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#0778AC] hover:underline">{eps.url}</a></td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <a href={eps.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"><ExternalLink className="w-4 h-4" /></a>
                        <button onClick={() => removeEps(eps.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {epsList.length === 0 && (
                  <tr><td colSpan={3} className="p-8 text-center text-gray-400">No hay plataformas EPS registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
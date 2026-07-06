import { Plus, Trash2, ExternalLink, X, Save, FileLock } from "lucide-react";
import { useState } from "react";
import { useSystem } from "../../../contexts/SystemContext";

export function FormatosContingenciaView() {
  const { contingencyFormats, addFormat, removeFormat } = useSystem();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");

  const reset = () => { setName(""); setCode(""); setDescription(""); setUrl(""); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    addFormat({ name, code, description, url });
    reset();
    setShowForm(false);
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Formatos de Contingencia</h1>
          <p className="text-gray-600 text-sm">Administre los formatos de contingencia disponibles para descarga.</p>
        </div>
        <button onClick={() => { reset(); setShowForm(!showForm); }} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md">
          <Plus className="w-4 h-4" />
          {showForm ? "Ver listado" : "Nuevo formato"}
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 max-w-3xl">
          <h2 className="text-lg font-bold text-[#0778AC] mb-6">Registrar nuevo formato de contingencia</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del formato *</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="Ej: Formato de ingreso manual" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Código *</label>
              <input value={code} onChange={e => setCode(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="Ej: FC-001" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">URL del formato</label>
              <input value={url} onChange={e => setUrl(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="https://..." />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">Cancelar</button>
              <button type="submit" className="flex items-center gap-2 bg-[#CF3438] hover:bg-[#a01f24] text-white px-6 py-2.5 rounded-lg text-sm font-semibold">
                <Save className="w-4 h-4" /> Guardar formato
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
                  <th className="p-4 text-sm font-semibold text-gray-600">Código</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Nombre</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Descripción</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contingencyFormats.map((fmt) => (
                  <tr key={fmt.id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm font-bold text-[#0778AC]">{fmt.code}</td>
                    <td className="p-4 text-sm font-semibold">{fmt.name}</td>
                    <td className="p-4 text-sm text-gray-600">{fmt.description || "-"}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {fmt.url && (
                          <a href={fmt.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"><ExternalLink className="w-4 h-4" /></a>
                        )}
                        <button onClick={() => removeFormat(fmt.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {contingencyFormats.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-gray-400">No hay formatos de contingencia registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
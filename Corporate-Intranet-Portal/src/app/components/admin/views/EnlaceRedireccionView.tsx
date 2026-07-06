import { Globe, ExternalLink, Save } from "lucide-react";
import { useState } from "react";
import { useSystem } from "../../../contexts/SystemContext";

export function EnlaceRedireccionView() {
  const { sites, addSite } = useSystem();
  const innovacionSites = sites.filter(s => s.moduleId === "InnovacionAnalitica" || s.moduleId === "analytics");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    addSite({ title, url: url.startsWith("http") ? url : `https://${url}`, type: "icon", ref: "Globe", moduleId: "InnovacionAnalitica" });
    setTitle(""); setUrl("");
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Enlace de Redireccion</h1>
        <p className="text-gray-600 text-sm">Administre los enlaces de redireccion del modulo Innovaccion Analitica.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 max-w-3xl mb-6">
        <h2 className="text-lg font-bold text-[#0778AC] mb-4">Agregar nuevo enlace</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del sitio *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="Ej: Plataforma de datos" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">URL *</label>
            <input value={url} onChange={e => setUrl(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="https://..." />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="flex items-center gap-2 bg-[#CF3438] hover:bg-[#a01f24] text-white px-6 py-2.5 rounded-lg text-sm font-semibold">
              <Save className="w-4 h-4" /> Agregar enlace
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-100">
                <th className="p-4 text-sm font-semibold text-gray-600">Nombre</th>
                <th className="p-4 text-sm font-semibold text-gray-600">URL</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {innovacionSites.map(site => (
                <tr key={site.id} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold text-sm">{site.title}</td>
                  <td className="p-4"><a href={site.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#0778AC] hover:underline">{site.url}</a></td>
                  <td className="p-4 text-center">
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg inline-block"><ExternalLink className="w-4 h-4" /></a>
                  </td>
                </tr>
              ))}
              {innovacionSites.length === 0 && (
                <tr><td colSpan={3} className="p-8 text-center text-gray-400">No hay enlaces configurados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
import { Globe, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSystem } from "../../../contexts/SystemContext";

export function InnovacionAnaliticaView() {
  const { sites, setSites } = useSystem() as any;
  const [showForm, setShowForm] = useState(false);
  
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const newSite = {
      id: Date.now().toString(),
      title,
      url: url.startsWith("http") ? url : `https://${url}`,
      active: true,
      moduleId: "InnovacionAnalitica", // Fixed to IA module
    };

    setSites([...sites, newSite]);
    setTitle("");
    setUrl("");
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar este enlace?")) {
      setSites(sites.filter((s: any) => s.id !== id));
    }
  };

  // Filtrar solo sitios de Innovación Analítica
  const iaSites = sites.filter((s: any) => s.moduleId === "InnovacionAnalitica");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e] mb-2">Innovación Analítica</h1>
          <p className="text-gray-600 text-sm">
            Gestión de enlaces de redireccionamiento para el módulo de Innovación Analítica.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#CF3438] hover:bg-[#a01f24] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Ver Listado" : "Nuevo Enlace"}
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-[#0778AC] mb-6 border-b-2 border-[#0778AC]/20 pb-2">
            Registrar Nuevo Enlace
          </h2>
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre de la Plataforma / Recurso *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ej: PowerBI Dashboard"
                className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#CF3438] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL de Redirección *
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="Ej: https://app.powerbi.com/..."
                className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#CF3438] transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0778AC] hover:bg-[#065a87] text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all"
            >
              Guardar Enlace
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-100">
                  <th className="p-4 text-sm font-semibold text-gray-600">Nombre del Recurso</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">URL</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {iaSites.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-400">
                      No hay enlaces registrados para este módulo
                    </td>
                  </tr>
                ) : (
                  iaSites.map((site: any) => (
                    <tr key={site.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[#0778AC]" />
                          <span className="font-semibold text-gray-800 text-sm">{site.title}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0778AC] hover:underline">
                          {site.url}
                        </a>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(site.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

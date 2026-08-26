import { Calendar, Edit2, Eye, FileText, Globe, Image, Plus, ShieldCheck, Trash2, User } from "lucide-react";
import { useState } from "react";
import { ApiError } from "../../../api/client";
import { RedirectSite, useSystem } from "../../../contexts/SystemContext";

const MODULE_OPTIONS = [
  { id: "Inicio", name: "Inicio" },
  { id: "Area Asistencial", name: "Area Asistencial" },
  { id: "Area Administrativa", name: "Area Administrativa" },
  { id: "Gestion Institucional", name: "Gestion Institucional" },
  { id: "Soporte", name: "Soporte" },
  { id: "Directorio", name: "Directorio" },
  { id: "Innovacion Analitica", name: "Innovacion Analitica" },
];

const ICON_OPTIONS = [
  { id: "Globe", label: "Globo", icon: Globe },
  { id: "FileText", label: "Documento", icon: FileText },
  { id: "ShieldCheck", label: "Validacion", icon: ShieldCheck },
  { id: "Calendar", label: "Calendario", icon: Calendar },
  { id: "User", label: "Usuario", icon: User },
];

export function GeneralesSitiosView() {
  const { sites, addSite, updateSite, removeSite } = useSystem();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RedirectSite | null>(null);
  const [consulting, setConsulting] = useState<RedirectSite | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [moduleId, setModuleId] = useState("Area Administrativa");
  const [ref, setRef] = useState("Globe");

  const reset = () => {
    setTitle("");
    setUrl("");
    setModuleId("Area Administrativa");
    setRef("Globe");
    setEditing(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const nextSite: RedirectSite = {
      id: editing?.id || Date.now().toString(),
      title,
      url: url.startsWith("http") ? url : `https://${url}`,
      active: editing?.active ?? true,
      moduleId,
      type: "icon",
      ref,
    };
    try {
      if (editing) {
        await updateSite(nextSite);
      } else {
        await addSite({ title: nextSite.title, url: nextSite.url, moduleId: nextSite.moduleId, type: nextSite.type, ref: nextSite.ref });
      }
      reset();
      setShowForm(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar el sitio";
      alert(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Eliminar sitio de redireccion?")) {
      try {
        await removeSite(id);
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "No se pudo eliminar el sitio";
        alert(message);
      }
    }
  };

  const handleEdit = (site: RedirectSite) => {
    setEditing(site);
    setTitle(site.title);
    setUrl(site.url);
    setModuleId(site.moduleId);
    setRef(site.ref || "Globe");
    setShowForm(true);
  };

  const getModuleName = (id: string) => MODULE_OPTIONS.find((module) => module.id === id)?.name || id;

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Sitio de Redireccion</h1>
          <p className="text-gray-600 text-sm">Liste, cree y administre los sitios asociados a cada modulo del portal.</p>
        </div>
        <button onClick={() => { reset(); setShowForm(!showForm); }} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md">
          <Plus className="w-4 h-4" />
          {showForm ? "Ver listado" : "Nuevo sitio"}
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 max-w-3xl">
          <h2 className="text-lg font-bold text-[#0778AC] mb-6">{editing ? "Editar sitio de redireccion" : "Crear nuevo sitio de redireccion"}</h2>
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del sitio *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">URL del sitio *</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Modulo al que pertenece</label>
              <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm bg-white">
                {MODULE_OPTIONS.map((module) => <option key={module.id} value={module.id}>{module.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Icono de referencia</label>
              <div className="grid grid-cols-5 gap-2">
                {ICON_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button key={option.id} type="button" title={option.label} onClick={() => setRef(option.id)} className={`h-12 rounded-lg border flex items-center justify-center ${ref === option.id ? "border-[#CF3438] bg-red-50 text-[#CF3438]" : "border-gray-200 text-gray-500"}`}>
                      <Icon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="bg-[#CF3438] hover:bg-[#a01f24] text-white px-6 py-3 rounded-lg font-semibold">{editing ? "Guardar cambios" : "Crear sitio"}</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-100">
                  <th className="p-4 text-sm font-semibold text-gray-600">Nombre</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">URL</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Modulo asignado</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sites.map((site) => (
                  <tr key={site.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-[#0778AC]" />
                        <span className="font-semibold text-gray-800 text-sm">{site.title}</span>
                      </div>
                    </td>
                    <td className="p-4"><a href={site.url || "#"} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0778AC] hover:underline">{site.url || "Sin URL"}</a></td>
                    <td className="p-4"><span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">{getModuleName(site.moduleId)}</span></td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button title="Editar" onClick={() => handleEdit(site)} className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button title="Consultar" onClick={() => setConsulting(site)} className="p-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg"><Eye className="w-4 h-4" /></button>
                        <button title="Eliminar" onClick={() => handleDelete(site.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {consulting && (
        <div className="fixed inset-0 z-[200] bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-[#0778AC] mb-4">{consulting.title}</h2>
            <p className="text-sm text-gray-600 mb-2">URL: {consulting.url || "Sin URL"}</p>
            <p className="text-sm text-gray-600 mb-2">Modulo: {getModuleName(consulting.moduleId)}</p>
            <p className="text-sm text-gray-600">Icono: {consulting.ref}</p>
            <div className="flex justify-end mt-6"><button onClick={() => setConsulting(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold">Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

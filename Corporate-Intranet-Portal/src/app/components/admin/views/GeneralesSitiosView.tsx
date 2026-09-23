import { Calendar, Edit2, Eye, FileText, Globe, Image, Plus, ShieldCheck, Trash2, User, X } from "lucide-react";
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

const DISABLED_MODULES = new Set<string>(["Directorio"]);

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
    if (DISABLED_MODULES.has(moduleId)) {
      alert("El módulo Directorio está inhabilitado para sitios de redirección.");
      return;
    }

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
  const [moduleFilter, setModuleFilter] = useState<string>("Todos");
  const [urlColWidth, setUrlColWidth] = useState(340);
  const [nameColWidth, setNameColWidth] = useState(220);
  const startResize = (col: 'name'|'url') => (e: React.MouseEvent) => {
    const startX = e.clientX; const startW = col==='name'? nameColWidth : urlColWidth;
    const onMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startX;
      if (col==='name') setNameColWidth(Math.max(120, startW+diff)); else setUrlColWidth(Math.max(150, startW+diff));
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  };
  const filteredSites = moduleFilter==="Todos" ? sites : sites.filter(s=> s.moduleId===moduleFilter);
  const countsByModule = MODULE_OPTIONS.map(m=> ({ id:m.id, count: sites.filter(s=> s.moduleId===m.id).length }));

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Sitio de Redireccion</h1>
          <p className="text-gray-600 text-sm">Liste, cree y administre los sitios asociados a cada modulo del portal. ({sites.length} total)</p>
        </div>
        <button onClick={() => { reset(); setShowForm(true); }} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md">
          <Plus className="w-4 h-4" />
          Nuevo sitio
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider py-2">Filtros por módulo:</span>
        <button onClick={()=> setModuleFilter("Todos")} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${moduleFilter==="Todos" ? 'bg-[#0778AC] text-white border-[#0778AC]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0778AC]'}`}>Todos ({sites.length})</button>
        {MODULE_OPTIONS.map(m=> {
          const isDisabled = DISABLED_MODULES.has(m.id);
          return (
            <button key={m.id} disabled={isDisabled} title={isDisabled ? "Módulo inhabilitado" : undefined} onClick={()=> !isDisabled && setModuleFilter(m.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold border truncate ${isDisabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60' : moduleFilter===m.id ? 'bg-[#0778AC] text-white border-[#0778AC]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0778AC]'}`}>{m.name} ({countsByModule.find(c=>c.id===m.id)?.count||0}){isDisabled ? " • inhabilitado" : ""}</button>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <colgroup>
              <col style={{width: nameColWidth}} />
              <col style={{width: urlColWidth}} />
              <col style={{width: 170}} />
              <col style={{width: 140}} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-100">
                <th className="p-4 text-sm font-semibold text-gray-600 relative select-none bg-gray-50">Nombre<span onMouseDown={startResize('name')} className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-[#0778AC]/40" /></th>
                <th className="p-4 text-sm font-semibold text-gray-600 relative select-none bg-gray-50">URL<span onMouseDown={startResize('url')} className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-[#0778AC]/40" /></th>
                <th className="p-4 text-sm font-semibold text-gray-600">Modulo asignado</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSites.map((site) => (
                <tr key={site.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <Image className="w-4 h-4 text-[#0778AC] flex-shrink-0" />
                      <span className="font-semibold text-gray-800 text-sm truncate block" title={site.title}>{site.title}</span>
                    </div>
                  </td>
                  <td className="p-4"><a href={site.url || "#"} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0778AC] hover:underline block truncate max-w-full break-all font-mono bg-blue-50/50 px-2 py-1 rounded border border-blue-100" title={site.url}>{site.url || "Sin URL"}</a></td>
                  <td className="p-4"><span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded truncate block max-w-[150px]" title={getModuleName(site.moduleId)}>{getModuleName(site.moduleId)}</span></td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button title="Editar" onClick={() => handleEdit(site)} className="p-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button title="Consultar" onClick={() => setConsulting(site)} className="p-2 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg"><Eye className="w-4 h-4" /></button>
                      <button title="Eliminar" onClick={() => handleDelete(site.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSites.length===0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400 text-sm">No hay sitios para el módulo seleccionado. Crea uno con “Nuevo sitio”.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-white text-lg">{editing ? "Editar sitio de redireccion" : "Crear nuevo sitio de redireccion"}</h3>
                <p className="text-white/70 text-xs mt-0.5">Complete los datos del sitio de redireccionamiento</p>
              </div>
              <button onClick={() => { setShowForm(false); reset(); }} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del sitio *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">URL del sitio *</label>
                <input value={url} onChange={(e) => setUrl(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Modulo al que pertenece {DISABLED_MODULES.has(moduleId) && <span className="text-xs text-red-500 font-normal">(inhabilitado)</span>}</label>
                <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm bg-white">
                  {MODULE_OPTIONS.map((module) => {
                    const isDisabled = DISABLED_MODULES.has(module.id);
                    return <option key={module.id} value={module.id} disabled={isDisabled} style={isDisabled ? { color: "#9CA3AF" } : {}}>{module.name}{isDisabled ? " (inhabilitado)" : ""}</option>;
                  })}
                </select>
                {DISABLED_MODULES.has("Directorio") && <p className="text-[11px] text-amber-600 mt-1">Directorio inhabilitado: no se agregan sitios de redireccionamiento aquí.</p>}
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
              <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => { setShowForm(false); reset(); }} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="bg-[#CF3438] hover:bg-[#a01f24] text-white px-6 py-3 rounded-lg font-semibold">{editing ? "Actualizar" : "Grabar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {consulting && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white truncate" title={consulting.title}>{consulting.title}</h2>
              <button onClick={() => setConsulting(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nombre del sitio</p><p className="text-sm font-semibold text-gray-800 break-all">{consulting.title}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">URL</p><a href={consulting.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#0778AC] hover:underline break-all">{consulting.url || "Sin URL"}</a></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Módulo asignado</p><p className="text-sm font-semibold text-gray-800">{getModuleName(consulting.moduleId)}</p></div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100"><p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Icono</p><p className="text-sm font-semibold text-gray-800">{consulting.ref}</p></div>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button onClick={() => setConsulting(null)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

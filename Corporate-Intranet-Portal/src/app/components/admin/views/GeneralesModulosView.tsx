import { Eye, LayoutGrid, Pencil, Plus, Save, ToggleLeft, ToggleRight, Users } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";

interface PortalModule {
  id: string;
  name: string;
  active: boolean;
  adEnabled: boolean;
  allowedUsers: string[];
}

const DEFAULT_MODULES: PortalModule[] = [
  { id: "clinical", name: "Area Asistencial", active: true, adEnabled: true, allowedUsers: [] },
  { id: "administrative", name: "Area Administrativa", active: true, adEnabled: true, allowedUsers: [] },
  { id: "institutional", name: "Gestion Institucional", active: true, adEnabled: false, allowedUsers: [] },
  { id: "support", name: "Soporte", active: true, adEnabled: true, allowedUsers: [] },
  { id: "directory", name: "Directorio", active: true, adEnabled: false, allowedUsers: [] },
  { id: "analytics", name: "Innovacion Analitica", active: true, adEnabled: true, allowedUsers: [] },
];

export function GeneralesModulosView() {
  const { users } = useAuth();
  const [modules, setModules] = useState<PortalModule[]>(() => {
    const saved = localStorage.getItem("admin_portal_modules");
    return saved ? JSON.parse(saved) : DEFAULT_MODULES;
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PortalModule | null>(null);
  const [consulting, setConsulting] = useState<PortalModule | null>(null);
  const [name, setName] = useState("");
  const [adEnabled, setAdEnabled] = useState(true);
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);

  const persist = (next: PortalModule[]) => {
    setModules(next);
    localStorage.setItem("admin_portal_modules", JSON.stringify(next));
  };

  const resetForm = () => {
    setName("");
    setAdEnabled(true);
    setAllowedUsers([]);
    setEditing(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editing) {
      persist(modules.map((module) => module.id === editing.id ? { ...editing, name, adEnabled, allowedUsers } : module));
    } else {
      persist([...modules, { id: Date.now().toString(), name, active: true, adEnabled, allowedUsers }]);
    }
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (module: PortalModule) => {
    setEditing(module);
    setName(module.name);
    setAdEnabled(module.adEnabled);
    setAllowedUsers(module.allowedUsers);
    setShowForm(true);
  };

  const toggleActive = (id: string) => {
    persist(modules.map((module) => module.id === id ? { ...module, active: !module.active } : module));
  };

  const toggleAllowedUser = (username: string) => {
    setAllowedUsers((current) => current.includes(username) ? current.filter((item) => item !== username) : [...current, username]);
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Modulos</h1>
          <p className="text-gray-600 text-sm">Administre los modulos visibles en la navegacion del portal y su validacion con Directorio Activo.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md">
          <Plus className="w-4 h-4" />
          {showForm ? "Ver listado" : "Nuevo modulo"}
        </button>
      </div>

      {showForm ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del modulo *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
              <input value="Activo por defecto" disabled className="w-full border-2 border-gray-100 bg-gray-50 rounded-lg p-3 text-sm text-gray-500" />
            </div>
            <label className="lg:col-span-2 flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm font-medium text-blue-900">
              <input type="checkbox" checked={adEnabled} onChange={(e) => setAdEnabled(e.target.checked)} className="w-4 h-4" />
              Validar con Directorio Activo
            </label>
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-[#0778AC]" />
                <label className="text-sm font-semibold text-gray-700">Anclar modulo con usuarios del Directorio Activo</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center gap-3 border border-gray-100 rounded-lg p-3 text-sm hover:bg-gray-50">
                    <input type="checkbox" checked={allowedUsers.includes(user.username)} onChange={() => toggleAllowedUser(user.username)} />
                    <span>{user.fullName} <span className="text-gray-400">({user.username})</span></span>
                  </label>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 flex justify-end">
              <button type="submit" className="flex items-center gap-2 bg-[#CF3438] hover:bg-[#a01f24] text-white px-6 py-3 rounded-lg font-semibold">
                <Save className="w-4 h-4" />
                Guardar configuracion
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
                  <th className="p-4 text-sm font-semibold text-gray-600">Nombre</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Estado</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Validado con AD</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {modules.map((module) => (
                  <tr key={module.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 text-[#0778AC]" />
                        <span className="font-semibold text-gray-800">{module.name}</span>
                      </div>
                    </td>
                    <td className="p-4"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${module.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{module.active ? "Activo" : "Inactivo"}</span></td>
                    <td className="p-4"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${module.adEnabled ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>{module.adEnabled ? "Si" : "No"}</span></td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button title="Activar o inactivar" onClick={() => toggleActive(module.id)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">{module.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}</button>
                        <button title="Editar configuracion" onClick={() => handleEdit(module)} className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700"><Pencil className="w-4 h-4" /></button>
                        <button title="Consultar" onClick={() => setConsulting(module)} className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700"><Eye className="w-4 h-4" /></button>
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
            <h2 className="text-xl font-bold text-[#0778AC] mb-4">{consulting.name}</h2>
            <p className="text-sm text-gray-600 mb-2">Estado: {consulting.active ? "Activo" : "Inactivo"}</p>
            <p className="text-sm text-gray-600 mb-2">Validado con AD: {consulting.adEnabled ? "Si" : "No"}</p>
            <p className="text-sm text-gray-600">Usuarios anclados: {consulting.allowedUsers.length ? consulting.allowedUsers.join(", ") : "Sin usuarios asignados"}</p>
            <div className="flex justify-end mt-6"><button onClick={() => setConsulting(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold">Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Shield, Search } from "lucide-react";
import { useState } from "react";
import { useSystem } from "../../../contexts/SystemContext";

const COM_ACTIONS = [
  "Publicar anuncios",
  "Aprobar anuncios",
  "Editar anuncios",
  "Eliminar anuncios",
  "Gestionar tareas",
  "Gestionar calendarios",
  "Gestionar logros",
];

export function PermisosComunicacionesView() {
  const { roles, rolePermissions, updateRoleActionPermissions } = useSystem();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.description.toLowerCase().includes(searchTerm.toLowerCase()));

  const toggleAction = (roleId: string, action: string) => {
    const current = rolePermissions.find(p => p.roleId === roleId)?.actions || [];
    const next = current.includes(action) ? current.filter(a => a !== action) : [...current, action];
    updateRoleActionPermissions(roleId, next);
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Permisos de Comunicaciones</h1>
        <p className="text-gray-600 text-sm">Configure los permisos de acciones del modulo de comunicaciones por rol.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar rol..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0778AC]" />
        </div>
      </div>

      <div className="space-y-6">
        {filteredRoles.map(role => {
          const actions = rolePermissions.find(p => p.roleId === role.id)?.actions || [];
          return (
            <div key={role.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-[#0778AC]" />
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">{role.description}</h3>
                  <p className="text-[10px] text-gray-400">#{role.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {COM_ACTIONS.map(action => (
                  <label key={action} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
                    <input type="checkbox" checked={actions.includes(action)} onChange={() => toggleAction(role.id, action)} className="w-4 h-4 accent-[#CF3438]" />
                    {action}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
import { Shield, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useSystem } from "../../../contexts/SystemContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useAdminAccess } from "../useAdminAccess";
import { noPermissionReason } from "../AccessGate";

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
  const { comUserPermissions, updateComUserPermissions } = useSystem();
  const { users } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const comUsers = useMemo(() => {
    return users.filter(u => {
      const role = (u.role || "").toLowerCase();
      const pos = (u.position || "").toLowerCase();
      return role.includes("comunicac") || pos.includes("comunicac");
    });
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return comUsers;
    const q = searchTerm.toLowerCase();
    return comUsers.filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.position || "").toLowerCase().includes(q)
    );
  }, [comUsers, searchTerm]);

  const selectedUser = comUsers.find(u => u.id === selectedUserId) || null;
  const actions = selectedUserId ? (comUserPermissions[selectedUserId] || []) : [];

  const { can } = useAdminAccess();
  const canActualizar = can("permisos", "actualizar");

  const toggleAction = (action: string) => {
    if (!selectedUserId || !canActualizar) return;
    const current = comUserPermissions[selectedUserId] || [];
    const next = current.includes(action) ? current.filter(a => a !== action) : [...current, action];
    updateComUserPermissions(selectedUserId, next);
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Permisos de Comunicaciones</h1>
        <p className="text-gray-600 text-sm">Seleccione un funcionario con cargo <span className="font-semibold">Comunicaciones</span> para otorgar acciones del módulo.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar funcionario..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0778AC]" />
          </div>
          <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white">
            <option value="">Seleccione funcionario...</option>
            {filteredUsers.map(u => (
              <option key={u.id} value={u.id}>{u.fullName} ({u.username}) - {u.position || u.role}</option>
            ))}
          </select>
        </div>
        {comUsers.length === 0 && (
          <p className="text-xs text-amber-600 mt-3">No hay usuarios con cargo Comunicaciones. Cree usuarios con ese cargo en Generales → Usuarios.</p>
        )}
        {filteredUsers.length === 0 && comUsers.length > 0 && (
          <p className="text-xs text-gray-400 mt-3">Sin resultados para "{searchTerm}"</p>
        )}
      </div>

      {selectedUser ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#0778AC]/10 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#0778AC]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">{selectedUser.fullName}</h3>
              <p className="text-xs text-gray-500">{selectedUser.username} • {selectedUser.position || selectedUser.role} • {selectedUser.status === 'active' ? 'Activo' : 'Inactivo'}</p>
            </div>
            <span className="ml-auto text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{actions.length} permisos</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {COM_ACTIONS.map(action => (
              <label key={action} className={`flex items-center gap-3 p-3 border border-gray-100 rounded-lg text-sm ${canActualizar ? "hover:bg-gray-50 cursor-pointer" : "bg-gray-50/60 text-gray-400 cursor-not-allowed"}`}>
                <input
                  type="checkbox"
                  checked={actions.includes(action)}
                  disabled={!canActualizar}
                  title={canActualizar ? undefined : noPermissionReason("Permisos de Comunicaciones", "actualizar")}
                  onChange={() => toggleAction(action)}
                  className="w-4 h-4 accent-[#CF3438] disabled:opacity-40"
                />
                {action}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-dashed border-gray-200 p-8 text-center">
          <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Seleccione un funcionario arriba para gestionar sus permisos.</p>
        </div>
      )}
    </div>
  );
}

import { Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";

const COM_ROLES = ["comunicaciones"];

export function UsuariosComunicacionesView() {
  const { users } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const comUsers = users.filter(u => u.role === "comunicaciones" || (u.position || "").toLowerCase().includes("comunicac"));
  const filtered = comUsers.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0778AC] mb-2">Usuarios de Comunicaciones</h1>
        <p className="text-gray-600 text-sm">Usuarios con acceso al modulo de comunicaciones.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar usuario..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0778AC]" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-100">
                <th className="p-4 text-sm font-semibold text-gray-600">Usuario</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Nombre completo</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Rol</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold text-sm">{u.username}</td>
                  <td className="p-4 text-sm text-gray-700">{u.fullName}</td>
                  <td className="p-4">
                    <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">{u.role}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.status === "active" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">No se encontraron usuarios.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
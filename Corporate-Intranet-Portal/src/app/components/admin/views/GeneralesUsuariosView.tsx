import {
  CheckCircle,
  Eye,
  Key,
  Pencil,
  Plus,
  Save,
  Shield,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AccessRequest, useAuth, User, UserRole } from "../../../contexts/AuthContext";
import { useSystem } from "../../../contexts/SystemContext";
import { AdminView } from "../AdminSidebar";

type Mode = "list" | "create" | "requests" | "cargos";

const MODULE_PERMISSIONS = [
  "Usuarios",
  "Crear Usuario",
  "Solicitudes",
  "Cargo",
  "Modulos",
  "Sitio de Redireccion",
  "Directorio de Extensiones",
  "Directorio de Correos",
];

const DEFAULT_CARGOS: Array<{ id: string; name: UserRole; label: string }> = [
  { id: "admin", name: "admin", label: "Administrador" },
  { id: "asistencial", name: "asistencial", label: "Asistencial" },
  { id: "administrativo", name: "administrativo", label: "Administrativo" },
  { id: "ti", name: "ti", label: "Tecnologia" },
];

function statusLabel(status: User["status"]) {
  return status === "active" ? "Activo" : "Inactivo";
}

export function GeneralesUsuariosView({
  mode,
  onModeChange,
}: {
  mode: Mode;
  onModeChange: (view: AdminView) => void;
}) {
  const { users, addUser, toggleUserStatus, accessRequests, approveAccessRequest, rejectAccessRequest, updateUser } = useAuth();
  const { roles, addRole, rolePermissions, updateRoleModulePermissions } = useSystem();

  const [statusFilter, setStatusFilter] = useState<"all" | User["status"]>("all");
  const [nameFilter, setNameFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [identification, setIdentification] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [cargo, setCargo] = useState<UserRole>("asistencial");

  const [newCargoName, setNewCargoName] = useState("");
  const [permissionRoleId, setPermissionRoleId] = useState(roles[0]?.id || "admin");

  useEffect(() => {
    setPermissionRoleId((current) => current || roles[0]?.id || "admin");
  }, [roles]);

  useEffect(() => {
    if (mode !== "create") return;
    const raw = sessionStorage.getItem("pending_access_request");
    if (!raw) return;

    try {
      const request = JSON.parse(raw) as AccessRequest;
      setIdentification(request.documentNumber || "");
      setFullName(request.fullName || "");
      setEmail(request.email || "");
      setPhone(request.phone || "");
      setPosition(request.position || "");
      setUsername((request.email || request.documentNumber || "").split("@")[0]);
      setPassword(request.documentNumber || "");
      sessionStorage.removeItem("pending_access_request");
    } catch {
      sessionStorage.removeItem("pending_access_request");
    }
  }, [mode]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      const matchesName = `${user.username} ${user.fullName}`.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesPosition = user.position.toLowerCase().includes(positionFilter.toLowerCase());
      return matchesStatus && matchesName && matchesPosition;
    });
  }, [users, statusFilter, nameFilter, positionFilter]);

  const cargos = useMemo(() => {
    const existing = roles.map((role) => ({
      id: role.id,
      name: role.name as UserRole,
      label: role.description || role.name,
    }));
    const merged = [...DEFAULT_CARGOS];
    existing.forEach((role) => {
      if (!merged.some((item) => item.name === role.name)) merged.push(role);
    });
    return merged;
  }, [roles]);

  const resetCreateForm = () => {
    setUsername("");
    setPassword("");
    setIdentification("");
    setFullName("");
    setEmail("");
    setPhone("");
    setPosition("");
    setCargo("asistencial");
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !identification.trim() || !fullName.trim()) return;

    addUser({
      username: username.trim(),
      password,
      identification,
      fullName,
      email,
      phone,
      position,
      department: "General",
      role: cargo,
    });
    resetCreateForm();
    onModeChange("usuarios");
  };

  const handleAuthorize = (request: AccessRequest) => {
    approveAccessRequest(request.id);
    sessionStorage.setItem("pending_access_request", JSON.stringify(request));
    onModeChange("crear-usuario");
  };

  const handleResetPassword = (user: User) => {
    updateUser({ ...user, password: user.identification });
    alert(`Contrasena restablecida para ${user.username}.`);
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    updateUser(editingUser);
    setEditingUser(null);
  };

  const handleAddCargo = () => {
    const trimmed = newCargoName.trim();
    if (!trimmed) return;
    addRole({ name: trimmed.toLowerCase().replace(/\s+/g, "_"), description: trimmed });
    setNewCargoName("");
  };

  const selectedPermissions = rolePermissions.find((permission) => permission.roleId === permissionRoleId)?.modules || [];

  const togglePermission = (permission: string) => {
    const next = selectedPermissions.includes(permission)
      ? selectedPermissions.filter((item) => item !== permission)
      : [...selectedPermissions, permission];
    updateRoleModulePermissions(permissionRoleId, next);
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0778AC] mb-2">
            {mode === "list" && "Gestion de Usuarios"}
            {mode === "create" && "Crear Usuario"}
            {mode === "requests" && "Solicitudes de Usuarios"}
            {mode === "cargos" && "Cargo"}
          </h1>
          <p className="text-gray-600 text-sm">
            Administre usuarios, solicitudes de acceso y permisos por cargo del panel administrativo.
          </p>
        </div>
        {mode !== "create" && (
          <button onClick={() => onModeChange("crear-usuario")} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm">
            <UserPlus className="w-4 h-4" />
            Crear Usuario
          </button>
        )}
      </div>

      {mode === "list" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="border-2 border-gray-200 rounded-lg p-2.5 text-sm bg-white">
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
            <input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} placeholder="Filtrar por nombre o usuario" className="border-2 border-gray-200 rounded-lg p-2.5 text-sm" />
            <input value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} placeholder="Filtrar por cargo" className="border-2 border-gray-200 rounded-lg p-2.5 text-sm" />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-100">
                    <th className="p-4 text-sm font-semibold text-gray-600">Nombre de Usuario</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Estado</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Nombre Completo</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Cargo</th>
                    <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm font-semibold text-gray-800">{user.username}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {statusLabel(user.status)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-700">{user.fullName}</td>
                      <td className="p-4 text-sm text-gray-700">{user.position || user.role}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button title={user.status === "active" ? "Desactivar" : "Activar"} onClick={() => toggleUserStatus(user.username)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">
                            {user.status === "active" ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button title="Editar" onClick={() => setEditingUser(user)} className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700"><Pencil className="w-4 h-4" /></button>
                          <button title="Consultar" onClick={() => setSelectedUser(user)} className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700"><Eye className="w-4 h-4" /></button>
                          <button title="Restablecer contrasena" onClick={() => handleResetPassword(user)} className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700"><Key className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {mode === "create" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <FormField label="Nombre de Usuario *" value={username} onChange={setUsername} required />
            <FormField label="Clave de Usuario *" value={password} onChange={setPassword} required type="password" />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estado del Usuario</label>
              <input value="Activo automatico" disabled className="w-full border-2 border-gray-100 bg-gray-50 rounded-lg p-3 text-sm text-gray-500" />
            </div>
            <FormField label="Numero de identificacion *" value={identification} onChange={setIdentification} required />
            <FormField label="Nombre completo del Usuario *" value={fullName} onChange={setFullName} required />
            <FormField label="Email Corporativo del Usuario" value={email} onChange={setEmail} type="email" />
            <FormField label="Celular del Usuario" value={phone} onChange={setPhone} />
            <FormField label="Cargo del Usuario" value={position} onChange={setPosition} />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cargo para permisos</label>
              <select value={cargo} onChange={(e) => setCargo(e.target.value as UserRole)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm bg-white">
                {cargos.map((item) => <option key={item.id} value={item.name}>{item.label}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={resetCreateForm} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">Limpiar</button>
              <button type="submit" className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-6 py-2.5 rounded-lg text-sm font-semibold">
                <Save className="w-4 h-4" />
                Guardar Usuario
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === "requests" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-100">
                  <th className="p-4 text-sm font-semibold text-gray-600">Identificacion</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Nombre Completo</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Cargo</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Email Corporativo</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Estado</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accessRequests.map((request) => (
                  <tr key={request.id} className={request.status === "rejected" ? "bg-red-50/50 text-gray-400" : "hover:bg-gray-50"}>
                    <td className="p-4 text-sm">{request.documentNumber}</td>
                    <td className="p-4 text-sm font-semibold">{request.fullName}</td>
                    <td className="p-4 text-sm">{request.position}</td>
                    <td className="p-4 text-sm">{request.email || "Pendiente"}</td>
                    <td className="p-4 text-sm">{request.status === "pending" ? "Pendiente" : request.status === "approved" ? "Autorizada" : "Denegada"}</td>
                    <td className="p-4">
                      {request.status === "pending" ? (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleAuthorize(request)} className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Autorizar
                          </button>
                          <button onClick={() => rejectAccessRequest(request.id)} className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                            <XCircle className="w-4 h-4" />
                            Denegar
                          </button>
                        </div>
                      ) : (
                        <span className="block text-center text-xs font-semibold">Bloqueada</span>
                      )}
                    </td>
                  </tr>
                ))}
                {accessRequests.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400">No hay solicitudes registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mode === "cargos" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-[#0778AC]">Cargos registrados</h2>
              <div className="flex gap-2">
                <input value={newCargoName} onChange={(e) => setNewCargoName(e.target.value)} placeholder="Nuevo cargo" className="border-2 border-gray-200 rounded-lg p-2 text-sm" />
                <button onClick={handleAddCargo} className="flex items-center gap-1 bg-[#0778AC] text-white rounded-lg px-3 py-2 text-sm font-semibold"><Plus className="w-4 h-4" />Crear</button>
              </div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-sm font-semibold text-gray-600">Nombre</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Estado</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Total de permiso del cargo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cargos.map((item) => {
                  const role = roles.find((candidate) => candidate.name === item.name || candidate.id === item.id);
                  const total = rolePermissions.find((permission) => permission.roleId === (role?.id || item.id))?.modules.length || 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm font-semibold">{item.label}</td>
                      <td className="p-4"><span className="bg-green-100 text-green-700 text-xs font-medium rounded-full px-2.5 py-1">Activo</span></td>
                      <td className="p-4 text-sm">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-[#0778AC]" />
              <h2 className="font-bold text-[#0778AC]">Autorizar permisos</h2>
            </div>
            <select value={permissionRoleId} onChange={(e) => setPermissionRoleId(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm bg-white mb-4">
              {roles.map((role) => <option key={role.id} value={role.id}>{role.description || role.name}</option>)}
            </select>
            <div className="space-y-2">
              {MODULE_PERMISSIONS.map((permission) => (
                <label key={permission} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
                  <input type="checkbox" checked={selectedPermissions.includes(permission)} onChange={() => togglePermission(permission)} className="w-4 h-4" />
                  {permission}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {(selectedUser || editingUser) && (
        <UserDialog
          user={editingUser || selectedUser!}
          editing={Boolean(editingUser)}
          onChange={setEditingUser}
          onClose={() => {
            setSelectedUser(null);
            setEditingUser(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#0778AC]" />
    </div>
  );
}

function UserDialog({ user, editing, onChange, onClose, onSave }: { user: User; editing: boolean; onChange: (user: User) => void; onClose: () => void; onSave: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <h2 className="text-xl font-bold text-[#0778AC] mb-5">{editing ? "Editar usuario" : "Consultar usuario"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["username", "fullName", "identification", "email", "phone", "position"] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{field}</label>
              <input
                disabled={!editing}
                value={(user[field] as string) || ""}
                onChange={(e) => onChange({ ...user, [field]: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm disabled:bg-gray-50"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold">Cerrar</button>
          {editing && <button onClick={onSave} className="px-4 py-2 rounded-lg bg-[#0778AC] text-white text-sm font-semibold">Guardar cambios</button>}
        </div>
      </div>
    </div>
  );
}

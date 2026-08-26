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

// Estructura jerárquica del panel de control para autorización de cargos
const CONTROL_PANEL_MODULES: Array<{ id: string; label: string; children?: Array<{ id: string; label: string }> }> = [
  {
    id: "generales",
    label: "Generales",
    children: [
      { id: "usuarios", label: "Usuarios" },
      { id: "crear-usuario", label: "Crear Usuario" },
      { id: "solicitudes", label: "Solicitudes" },
      { id: "cargos", label: "Cargo" },
      { id: "modulos", label: "Módulos" },
      { id: "sitios", label: "Sitio de Redirección" },
      { id: "directorio-extensiones", label: "Directorio de Extensiones" },
      { id: "directorio-correos", label: "Directorio de Correos" },
      { id: "logs", label: "Logs" },
    ],
  },
  {
    id: "comunicaciones",
    label: "Comunicaciones",
    children: [
      { id: "dashboard-comunicaciones", label: "Dashboard" },
      { id: "usuarios-comunicaciones", label: "Usuarios" },
      { id: "permisos", label: "Permisos" },
      { id: "crear-anuncio", label: "Crear Anuncio" },
      { id: "calendario-anuncios", label: "Calendario de Anuncios" },
      { id: "anuncios-pendientes", label: "Anuncios Pendientes" },
      { id: "anuncios-historial", label: "Historial de Anuncios" },
      { id: "calendario-cumpleanios", label: "Calendario de Cumpleaños" },
      { id: "calendario-eventos", label: "Calendario de Eventos" },
      { id: "logros-acreditaciones", label: "Logros y Acreditaciones" },
      { id: "tareas-seguimiento", label: "Tareas y Seguimiento" },
    ],
  },
  {
    id: "asistencia",
    label: "Asistencia",
    children: [
      { id: "formatos-contingencia", label: "Formatos de Contingencia" },
      { id: "consulta-externa", label: "Consulta Externa" },
    ],
  },
  {
    id: "innovacion",
    label: "Innovación Analítica",
    children: [{ id: "enlace-redireccion", label: "Enlace de Redirección" }],
  },
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
  const { roles, addRole, toggleRoleEstado, rolePermissions, updateRoleModulePermissions } = useSystem();

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
  const [birthDate, setBirthDate] = useState("1990-01-01");

  const [newCargoName, setNewCargoName] = useState("");
  const [showCargoModal, setShowCargoModal] = useState(false);
  const [permissionRoleId, setPermissionRoleId] = useState("");

  useEffect(() => {
    if (roles.length === 0) return;
    setPermissionRoleId((current) => {
      if (current && roles.some(r => r.id === current)) return current;
      return roles[0].id;
    });
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
    return roles.map((role) => ({
      id: role.id,
      name: role.name as UserRole,
      label: role.description || role.name,
    }));
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
    setBirthDate("1990-01-01");
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !identification.trim() || !fullName.trim()) return;

    await addUser({
      username: username.trim(),
      password,
      identification,
      fullName,
      email,
      phone,
      position,
      department: "General",
      role: cargo,
      birthDate,
    });
    resetCreateForm();
    onModeChange("usuarios");
  };

  const handleAuthorize = (request: AccessRequest) => {
    approveAccessRequest(request.id);
    sessionStorage.setItem("pending_access_request", JSON.stringify(request));
    onModeChange("crear-usuario");
  };

  const handleResetPassword = async (user: User) => {
    await updateUser({ ...user, password: user.identification });
    alert(`Contrasena restablecida para ${user.username}.`);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    await updateUser(editingUser);
    setEditingUser(null);
  };

  const handleAddCargo = async () => {
    const trimmed = newCargoName.trim();
    if (!trimmed) return;
    await addRole({ name: trimmed.toLowerCase().replace(/\s+/g, "_"), description: trimmed });
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
            <FormField label="Fecha de Nacimiento *" value={birthDate} onChange={setBirthDate} type="date" required />
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
        <div className="space-y-5">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-[#0778AC]">Cargos registrados</h2>
              <button onClick={() => setShowCargoModal(true)} className="flex items-center gap-1 bg-[#0778AC] hover:bg-[#065a87] text-white rounded-lg px-4 py-2 text-sm font-semibold shadow-sm"><Plus className="w-4 h-4" />Crear Cargo</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-gray-600">Nombre</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Estado</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Usuarios con el cargo</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Permisos panel control</th>
                    <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cargos.map((item) => {
                    const cargoRole = roles.find(r => r.id === item.id);
                    const totalUsers = users.filter(u => u.role.toLowerCase() === item.name.toLowerCase() || (u.position || "").toLowerCase() === item.label.toLowerCase()).length;
                    const totalPerms = rolePermissions.find((permission) => permission.roleId === item.id)?.modules.length || 0;
                    const isActive = cargoRole?.estado !== false;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-4 text-sm font-semibold">{item.label}</td>
                        <td className="p-4"><span className={`text-xs font-medium rounded-full px-2.5 py-1 ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{isActive ? "Activo" : "Inactivo"}</span></td>
                        <td className="p-4 text-sm text-center"><span className="bg-blue-50 text-blue-700 text-xs font-bold rounded-full px-2.5 py-1">{totalUsers}</span></td>
                        <td className="p-4 text-sm text-center"><span className="bg-purple-50 text-purple-700 text-xs font-bold rounded-full px-2.5 py-1">{totalPerms}</span></td>
                        <td className="p-4 text-center">
                          <button onClick={() => toggleRoleEstado(item.id)} title={isActive ? "Inactivar" : "Activar"} className={`p-2 rounded-lg ${isActive ? "bg-amber-50 hover:bg-amber-100 text-amber-700" : "bg-green-50 hover:bg-green-100 text-green-700"}`}>
                            {isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {cargos.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay cargos registrados. Cree uno nuevo.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-[#0778AC]" />
              <h2 className="font-bold text-[#0778AC]">Autorizar acceso a módulos y submódulos del panel de control al cargo</h2>
            </div>
            <p className="text-xs text-gray-500 mb-3">Seleccione un cargo para asignar los módulos y submódulos del panel de control a los que podrá acceder.</p>
            <select value={permissionRoleId} onChange={(e) => setPermissionRoleId(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm bg-white mb-4">
              <option value="">Seleccione un cargo...</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.description || role.name}</option>)}
            </select>
            {permissionRoleId ? (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {CONTROL_PANEL_MODULES.map((section) => {
                  const sectionIds = [section.id, ...(section.children?.map(c => c.id) || [])];
                  const sectionSelected = sectionIds.every(id => selectedPermissions.includes(id));
                  const sectionPartial = !sectionSelected && sectionIds.some(id => selectedPermissions.includes(id));
                  return (
                    <div key={section.id} className="border border-gray-100 rounded-lg overflow-hidden">
                      <label className={`flex items-center gap-3 p-3 cursor-pointer ${sectionSelected ? "bg-[#0778AC]/10 border-[#0778AC]/20" : "bg-gray-50 hover:bg-gray-100"}`}>
                        <input type="checkbox" checked={sectionSelected} ref={el => { if (el) el.indeterminate = sectionPartial; }} onChange={() => {
                          const allSelected = sectionSelected;
                          let next: string[];
                          if (allSelected) {
                            next = selectedPermissions.filter(p => !sectionIds.includes(p));
                          } else {
                            next = [...new Set([...selectedPermissions, ...sectionIds])];
                          }
                          updateRoleModulePermissions(permissionRoleId, next);
                        }} className="w-4 h-4 accent-[#0778AC]" />
                        <span className="font-bold text-sm text-gray-800">{section.label}</span>
                        <span className="ml-auto text-xs text-gray-500">{section.children ? `${section.children.length} submódulos` : ""}</span>
                      </label>
                      {section.children && (
                        <div className="divide-y divide-gray-50 bg-white">
                          {section.children.map((sub) => (
                            <label key={sub.id} className="flex items-center gap-3 p-3 pl-8 hover:bg-gray-50 cursor-pointer text-sm">
                              <input type="checkbox" checked={selectedPermissions.includes(sub.id)} onChange={() => togglePermission(sub.id)} className="w-4 h-4 accent-[#0778AC]" />
                              <span className="text-gray-700">{sub.label}</span>
                              <span className="ml-auto text-[10px] text-gray-400 font-mono">{sub.id}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic text-center py-4">Seleccione un cargo arriba para gestionar sus permisos.</p>
            )}
          </div>
        </div>
      )}

      {/* Modal Crear Cargo */}
      {showCargoModal && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5" /> Nuevo Cargo</h3>
              <button onClick={() => { setShowCargoModal(false); setNewCargoName(""); }} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del cargo *</label>
              <input value={newCargoName} onChange={(e) => setNewCargoName(e.target.value)} placeholder="Ej: Coordinador de Calidad" autoFocus className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#0778AC] focus:ring-2 focus:ring-[#0778AC]/20" />
              <p className="text-xs text-gray-500 mt-2">Solo el nombre. Se crea activo y disponible para asignar a usuarios.</p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => { setShowCargoModal(false); setNewCargoName(""); }} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-100">Cancelar</button>
              <button onClick={async () => { await handleAddCargo(); setShowCargoModal(false); }} disabled={!newCargoName.trim()} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-semibold"><Save className="w-4 h-4" /> Crear Cargo</button>
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">cargo</label>
            {editing ? (
              <select value={user.role} onChange={(e) => onChange({ ...user, role: e.target.value as UserRole, position: e.target.value })} className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm bg-white">
                <option value="admin">Administrador</option>
                <option value="asistencial">Asistencial</option>
                <option value="administrativo">Administrativo</option>
                <option value="ti">Tecnologia</option>
                <option value="comunicaciones">Comunicaciones</option>
                <option value="sistemas">Sistemas</option>
              </select>
            ) : (
              <input disabled value={user.role} className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm disabled:bg-gray-50" />
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">birthDate</label>
            <input
              type="date"
              disabled={!editing}
              value={user.birthDate || "1990-01-01"}
              onChange={(e) => onChange({ ...user, birthDate: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm disabled:bg-gray-50"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold">Cerrar</button>
          {editing && <button onClick={onSave} className="px-4 py-2 rounded-lg bg-[#0778AC] text-white text-sm font-semibold">Guardar cambios</button>}
        </div>
      </div>
    </div>
  );
}

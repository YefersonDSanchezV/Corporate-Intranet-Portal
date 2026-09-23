import {
  CheckCircle,
  Eye,
  EyeOff,
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
import { CONTROL_PANEL_MODULES, countAuthorizedSubmodules } from "../rbac";
import { usersApi } from "../../../api/users";
import { ApiError } from "../../../api/client";

type Mode = "list" | "create" | "requests" | "cargos";


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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [permissionRoleId, setPermissionRoleId] = useState("");

  // Solicitudes — estado extendido backend
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState<any | null>(null);
  const [approvingSolicitud, setApprovingSolicitud] = useState<any | null>(null);
  const [approveUsername, setApproveUsername] = useState("");
  const [approvePassword, setApprovePassword] = useState("");
  const [showApprovePassword, setShowApprovePassword] = useState(false);
  const [approveCargo, setApproveCargo] = useState<UserRole>("asistencial");
  const [approveNombreCompleto, setApproveNombreCompleto] = useState("");
  const [approveMotivo, setApproveMotivo] = useState("");

  // Reset password modal + toast
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Rechazo con motivo
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (roles.length === 0) return;
    setPermissionRoleId((current) => {
      if (current && roles.some(r => r.id === current)) return current;
      return roles[0].id;
    });
  }, [roles]);

  // Cargar solicitudes desde backend cuando se entra a modo requests
  useEffect(() => {
    if (mode !== "requests") return;
    let cancelled = false;
    (async () => {
      try {
        const data = await usersApi.accessRequests();
        if (!cancelled) setSolicitudes(data);
      } catch {
        // fallback a local AuthContext
        if (!cancelled) setSolicitudes(accessRequests as any);
      }
    })();
    return () => { cancelled = true; };
  }, [mode, accessRequests]);

  // Fallback: si backend no responde, mostrar locales
  const solicitudesToShow = solicitudes.length > 0 ? solicitudes : (accessRequests as any);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    if (mode !== "create" && !showCreateModal) return;
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
      if (mode === "create") {
        // Compatibilidad: modo página antigua redirige a modal flotante
        setShowCreateModal(true);
      }
    } catch {
      sessionStorage.removeItem("pending_access_request");
    }
  }, [mode, showCreateModal]);

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

  const cargosFijos = useMemo(() => {
    const fijos = ["administrador", "asistencial", "administrativo", "comunicaciones"];
    return cargos.filter(c => fijos.includes(c.name.toLowerCase()));
  }, [cargos]);

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
    if (!username.trim() || !password.trim() || !identification.trim() || !fullName.trim() || !phone.trim()) {
      showToast("El campo Celular no puede estar vacío");
      return;
    }

    try {
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
      setShowCreateModal(false);
      if (mode === "create") onModeChange("usuarios");
      showToast(`Usuario ${username} creado correctamente`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : (err as Error).message;
      showToast(msg || "No se pudo crear el usuario");
    }
  };

  const buildNombreCompleto = (r: any) => {
    if (r.nombreCompleto) return r.nombreCompleto;
    if (r.primerNombre) {
      const parts = [r.primerNombre, r.segundoNombre, r.primerApellido, r.segundoApellido].filter(Boolean);
      return parts.join(" ");
    }
    return r.fullName || r.nombre || "";
  };

  const handleAuthorize = (request: any) => {
    const nombreCompleto = buildNombreCompleto(request);
    const primerNombre = (request.primerNombre || request.fullName || request.nombre || "").split(" ")[0] || "";
    const primerApellido = request.primerApellido || (request.fullName || request.nombre || "").split(" ").slice(-1)[0] || "";
    const autoUser = `${primerNombre.toLowerCase()}.${primerApellido.toLowerCase()}`.replace(/\s+/g, "");
    setApprovingSolicitud(request);
    setApproveNombreCompleto(nombreCompleto);
    setApproveUsername(autoUser);
    setApprovePassword("");
    setApproveCargo((request.cargo || "asistencial").toLowerCase().replace(/\s+/g, "_") as UserRole);
    setApproveMotivo("");
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingSolicitud) return;
    const req: any = approvingSolicitud;
    const isRejected = ((req.estado || req.status || "").toString().toUpperCase() === "RECHAZADA" || (req.estado || req.status || "").toString().toUpperCase() === "REJECTED");
    if (isRejected && !approveMotivo.trim()) {
      showToast("Debe indicar el motivo de aprobación tras rechazo");
      return;
    }
    if (approveMotivo.length > 1000) {
      showToast("El motivo no puede exceder 1000 caracteres");
      return;
    }
    const id = req.oid || req.id;
    try {
      // Crear usuario con datos de la solicitud + credenciales del modal
      const identificacion = String(req.identificacion || req.documentNumber || "");
      const email = req.correo || req.email || `${approveUsername}@icvc.local`;
      const cargoRole = approveCargo;
      // Buscar cargoOid
      let cargoLabel = cargoRole;
      const foundRole = roles.find(r => r.name.toLowerCase() === cargoRole.toLowerCase());
      if (foundRole) cargoLabel = foundRole.description || foundRole.name;

      await addUser({
        username: approveUsername.trim(),
        password: approvePassword,
        identification: identificacion,
        fullName: approveNombreCompleto,
        email,
        phone: req.celular || req.phone || "",
        position: cargoLabel,
        department: "General",
        role: cargoRole,
        birthDate: req.fechaNacimiento ? String(req.fechaNacimiento).slice(0,10) : "1990-01-01",
      });
      // Marcar solicitud como aprobada en backend (con motivo si viene de rechazo)
      try { await usersApi.approveAccessRequest(String(id), isRejected ? approveMotivo : undefined); } catch { approveAccessRequest(String(id)); }
      // Refrescar lista
      try { const data = await usersApi.accessRequests(); setSolicitudes(data); } catch {}
      setApprovingSolicitud(null);
      setApproveMotivo("");
      showToast(`Usuario ${approveUsername} creado y solicitud aprobada`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : (err as Error).message;
      showToast(msg || "No se pudo aprobar la solicitud");
    }
  };

  const handleReject = (request: any) => {
    setRejectTarget(request);
    setRejectReason((request.observaciones || "").slice(0, 1000));
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (rejectReason.length > 1000) {
      showToast("El motivo no puede exceder 1000 caracteres");
      return;
    }
    const id = (rejectTarget as any).oid || (rejectTarget as any).id;
    try {
      await usersApi.rejectAccessRequest(String(id), rejectReason);
      try { const data = await usersApi.accessRequests(); setSolicitudes(data); } catch { rejectAccessRequest(String(id)); }
      showToast("Solicitud rechazada");
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : (err as Error).message;
      showToast(msg || "No se pudo rechazar");
    }
  };

  const handleResetPassword = (user: User) => {
    setResetTarget(user);
    setResetPasswordValue("");
  };

  const handleConfirmResetPassword = async () => {
    if (!resetTarget) return;
    if (!resetPasswordValue.trim()) { showToast("Ingrese la nueva contraseña"); return; }
    try {
      await usersApi.resetPassword(resetTarget.id, resetPasswordValue);
      // También actualizar local
      await updateUser({ ...resetTarget, password: resetPasswordValue } as any);
      showToast(`Contraseña restablecida para ${resetTarget.username}.`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al restablecer";
      showToast(msg);
    } finally {
      setResetTarget(null);
      setResetPasswordValue("");
    }
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
        {mode !== "create" && mode !== "requests" && (
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm">
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
            <input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} placeholder="Filtrar por nombre o usuario" autoComplete="off" className="border-2 border-gray-200 rounded-lg p-2.5 text-sm" />
            <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} className="border-2 border-gray-200 rounded-lg p-2.5 text-sm bg-white">
              <option value="">Filtrar por cargo (Todos)</option>
              {cargosFijos.map((c) => <option key={c.id} value={c.label}>{c.label}</option>)}
            </select>
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
            <FormField label="Celular del Usuario *" value={phone} onChange={setPhone} required />
            <FormField label="Cargo del Usuario" value={position} onChange={setPosition} />
            <FormField label="Fecha de Nacimiento *" value={birthDate} onChange={setBirthDate} type="date" required />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cargo para permisos</label>
              <select value={cargo} onChange={(e) => setCargo(e.target.value as UserRole)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm bg-white">
                {cargosFijos.map((item) => <option key={item.id} value={item.name}>{item.label}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={resetCreateForm} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">Limpiar</button>
              <button type="submit" className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-6 py-2.5 rounded-lg text-sm font-semibold">
                <Save className="w-4 h-4" />
                Grabar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal flotante Crear Usuario sobre pantalla Usuarios - efecto difuminado */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2"><UserPlus className="w-5 h-5" /> Crear Usuario</h3>
                <p className="text-white/70 text-xs mt-0.5">Complete los datos del nuevo usuario</p>
              </div>
              <button onClick={() => { setShowCreateModal(false); resetCreateForm(); }} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><XCircle className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-6 overflow-y-auto">
              <FormField label="Nombre de Usuario *" value={username} onChange={setUsername} required />
              <FormField label="Clave de Usuario *" value={password} onChange={setPassword} required type="password" />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estado del Usuario</label>
                <input value="Activo automatico" disabled className="w-full border-2 border-gray-100 bg-gray-50 rounded-lg p-3 text-sm text-gray-500" />
              </div>
              <FormField label="Numero de identificacion *" value={identification} onChange={setIdentification} required />
              <FormField label="Nombre completo del Usuario *" value={fullName} onChange={setFullName} required />
              <FormField label="Email Corporativo del Usuario" value={email} onChange={setEmail} type="email" />
              <FormField label="Celular del Usuario *" value={phone} onChange={setPhone} required />
              <FormField label="Cargo del Usuario" value={position} onChange={setPosition} />
              <FormField label="Fecha de Nacimiento *" value={birthDate} onChange={setBirthDate} type="date" required />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cargo para permisos</label>
                <select value={cargo} onChange={(e) => setCargo(e.target.value as UserRole)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm bg-white">
                  {cargosFijos.map((item) => <option key={item.id} value={item.name}>{item.label}</option>)}
                </select>
              </div>
              <div className="lg:col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100 mt-2">
                <button type="button" onClick={() => { setShowCreateModal(false); resetCreateForm(); }} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] text-white px-6 py-2.5 rounded-lg text-sm font-semibold">
                  <Save className="w-4 h-4" />
                  Grabar
                </button>
              </div>
            </form>
          </div>
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
                {solicitudesToShow.map((request: any) => {
                  const id = request.oid || request.id;
                  const identificacion = request.identificacion || request.documentNumber || "";
                  const nombreCompleto = buildNombreCompleto(request);
                  const cargoVal = request.cargo || request.position || "";
                  const emailVal = request.correo || request.email || "Pendiente";
                  const rawEstado = (request.estado || request.status || "PENDIENTE").toString().toUpperCase();
                  const estadoLabel = rawEstado === "PENDIENTE" || rawEstado === "PENDING" ? "Solicitud" : rawEstado === "APROBADA" || rawEstado === "APPROVED" ? "Aprobado" : rawEstado === "RECHAZADA" || rawEstado === "REJECTED" ? "Rechazado" : rawEstado;
                  const isApproved = rawEstado === "APROBADA" || rawEstado === "APPROVED";
                  const isRejected = rawEstado === "RECHAZADA" || rawEstado === "REJECTED";
                  return (
                  <tr key={id} className={isRejected ? "bg-red-50/50" : isApproved ? "bg-green-50/30" : "hover:bg-gray-50"}>
                    <td className="p-4 text-sm">{identificacion}</td>
                    <td className="p-4 text-sm font-semibold">{nombreCompleto}</td>
                    <td className="p-4 text-sm">{cargoVal}</td>
                    <td className="p-4 text-sm">{emailVal}</td>
                    <td className="p-4 text-sm"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isApproved ? "bg-green-100 text-green-700" : isRejected ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{estadoLabel}</span></td>
                    <td className="p-4">
                      <div className="flex justify-center gap-1.5">
                        <button title="Consultar" onClick={() => setSelectedSolicitud(request)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg"><Eye className="w-4 h-4" /></button>
                        {!isApproved && (
                          <button onClick={() => handleAuthorize(request)} className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Aprobar
                          </button>
                        )}
                        {!isApproved && !isRejected && (
                          <button onClick={() => handleReject(request)} className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                            <XCircle className="w-4 h-4" />
                            Rechazar
                          </button>
                        )}
                        {isApproved && <span className="text-xs font-semibold text-green-700 px-3 py-1.5">Aprobado</span>}
                        {isRejected && <span className="text-xs font-semibold text-red-700 px-3 py-1.5">Rechazado</span>}
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {solicitudesToShow.length === 0 && (
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
              <button onClick={() => setShowCargoModal(true)} className="flex items-center gap-1 bg-[#0778AC] hover:bg-[#065a87] text-white rounded-lg px-4 py-2 text-sm font-semibold shadow-sm"><Plus className="w-4 h-4" />Grabar</button>
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
                    const totalPerms = countAuthorizedSubmodules(
                      rolePermissions.find((permission) => permission.roleId === item.id)?.modules || [],
                    );
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
              <button onClick={async () => { await handleAddCargo(); setShowCargoModal(false); }} disabled={!newCargoName.trim()} className="flex items-center gap-2 bg-[#0778AC] hover:bg-[#065a87] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-semibold"><Save className="w-4 h-4" /> Grabar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Consultar Solicitud */}
      {selectedSolicitud && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-white">Consultar Solicitud</h3>
              <button onClick={() => setSelectedSolicitud(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Detail label="Primer Nombre" value={selectedSolicitud.primerNombre || ""} />
              <Detail label="Segundo Nombre" value={selectedSolicitud.segundoNombre || "-"} />
              <Detail label="Primer Apellido" value={selectedSolicitud.primerApellido || ""} />
              <Detail label="Segundo Apellido" value={selectedSolicitud.segundoApellido || ""} />
              <Detail label="Identificación" value={String(selectedSolicitud.identificacion || selectedSolicitud.documentNumber || "")} />
              <Detail label="Email Corporativo" value={selectedSolicitud.correo || selectedSolicitud.email || ""} />
              <Detail label="Celular" value={selectedSolicitud.celular || selectedSolicitud.phone || ""} />
              <Detail label="Cargo" value={selectedSolicitud.cargo || selectedSolicitud.position || ""} />
              <Detail label="Fecha Nacimiento" value={selectedSolicitud.fechaNacimiento ? String(selectedSolicitud.fechaNacimiento).slice(0,10) : "-"} />
              <Detail label="Estado" value={selectedSolicitud.estado || selectedSolicitud.status || ""} />
              {(selectedSolicitud.observaciones || selectedSolicitud.observacion) && (
                <div className="md:col-span-2">
                  <Detail label="Observación / Motivo" value={selectedSolicitud.observaciones || selectedSolicitud.observacion || ""} />
                </div>
              )}
              {(!selectedSolicitud.observaciones && (selectedSolicitud.estado || "").toString().toUpperCase().includes("RECHAZADA")) && (
                <div className="md:col-span-2">
                  <Detail label="Observación / Motivo" value="—" />
                </div>
              )}
              <div className="md:col-span-2 flex justify-end pt-4">
                <button onClick={() => setSelectedSolicitud(null)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aprobar Solicitud — Nombre de Usuario + Contraseña + Cargo para permisos + Nombre completo */}
      {approvingSolicitud && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">Aprobar Solicitud</h3>
                <p className="text-white/70 text-xs mt-0.5">Se creará el usuario con los datos de la solicitud</p>
              </div>
              <button onClick={() => setApprovingSolicitud(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleApproveSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
                <input value={approveNombreCompleto} onChange={(e) => setApproveNombreCompleto(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de Usuario *</label>
                <input value={approveUsername} onChange={(e) => setApproveUsername(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm" placeholder="ej: juan.perez" />
                <p className="text-xs text-gray-500 mt-1">Autogenerado: primer nombre + . + primer apellido</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña *</label>
                <div className="relative">
                  <input type={showApprovePassword ? "text" : "password"} value={approvePassword} onChange={(e) => setApprovePassword(e.target.value)} required className="w-full border-2 border-gray-200 rounded-lg p-3 pr-11 text-sm" placeholder="Ingrese contraseña" />
                  <button type="button" onClick={() => setShowApprovePassword(!showApprovePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#0778AC] transition-colors" tabIndex={-1}>
                    {showApprovePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cargo para permisos *</label>
                <select value={approveCargo} onChange={(e) => setApproveCargo(e.target.value as UserRole)} required className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm bg-white">
                  {cargosFijos.map((c) => <option key={c.id} value={c.name}>{c.label}</option>)}
                </select>
              </div>
              {((approvingSolicitud as any)?.estado?.toString().toUpperCase().includes("RECHAZADA") || (approvingSolicitud as any)?.status?.toString().toUpperCase().includes("REJECTED")) && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Explicación de aprobación tras rechazo *</label>
                  <textarea value={approveMotivo} onChange={(e) => setApproveMotivo(e.target.value.slice(0,1000))} rows={4} maxLength={1000} required placeholder="Explique por qué aprueba una solicitud previamente rechazada..." className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[#0778AC]" />
                  <div className="text-right text-xs text-gray-500 mt-1">{approveMotivo.length}/1000</div>
                </div>
              )}
              <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setApprovingSolicitud(null)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" /> Grabar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Restablecer Contraseña */}
      {resetTarget && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-white">Restablecer Contraseña</h3>
              <button onClick={() => setResetTarget(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Usuario: <span className="font-semibold">{resetTarget.username}</span></p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nueva contraseña *</label>
                <div className="relative">
                  <input type={showResetPassword ? "text" : "password"} value={resetPasswordValue} onChange={(e) => setResetPasswordValue(e.target.value)} placeholder="Ingrese la nueva contraseña" className="w-full border-2 border-gray-200 rounded-lg p-3 pr-11 text-sm" autoFocus />
                  <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#0778AC] transition-colors" tabIndex={-1}>
                    {showResetPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setResetTarget(null)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancelar</button>
                <button onClick={handleConfirmResetPassword} className="bg-[#0778AC] hover:bg-[#065a87] text-white px-6 py-2.5 rounded-lg text-sm font-semibold">Restablecer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazar con motivo */}
      {rejectTarget && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-white">Rechazar Solicitud</h3>
              <button onClick={() => setRejectTarget(null)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-full"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Indique el motivo del rechazo (máximo 1000 caracteres):</p>
              <div>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value.slice(0,1000))} rows={5} maxLength={1000} placeholder="Escriba el motivo del rechazo..." className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[#0778AC]" />
                <div className="text-right text-xs text-gray-500 mt-1">{rejectReason.length}/1000</div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setRejectTarget(null)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancelar</button>
                <button onClick={handleConfirmReject} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold">Grabar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notificación inferior derecha */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[400] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold text-gray-800 break-all mt-1">{value || "-"}</div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input type={isPassword ? (show ? "text" : "password") : type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#0778AC] ${isPassword ? "pr-11" : ""}`} />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#0778AC] transition-colors" tabIndex={-1}>
            {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
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
                <option value="comunicaciones">Comunicaciones</option>
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
          {editing && <button onClick={onSave} className="px-4 py-2 rounded-lg bg-[#0778AC] text-white text-sm font-semibold">Actualizar</button>}
        </div>
      </div>
    </div>
  );
}

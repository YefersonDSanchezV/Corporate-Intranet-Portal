import { useState } from "react";
import { Users, UserPlus, Key, FileText, Search, Edit, Power, Eye, RotateCcw } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface SystemUser {
  id: string;
  documentType: string;
  documentNumber: string;
  fullName: string;
  phone: string;
  position: string;
  role: string;
  username: string;
  createdDate: Date;
  status: "active" | "inactive";
}

export function UserManagementModule() {
  const { user: currentUser, users: usersFromAuth, accessRequests, passwordResetRequests, approveAccessRequest, rejectAccessRequest, resetPassword, addUser, updateUser, toggleUserStatus } = useAuth();
  const [activeTab, setActiveTab] = useState<"create" | "list" | "access-requests" | "password-requests">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedAccessRequest, setSelectedAccessRequest] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const canEditUsers =
    currentUser?.role === "admin" ||
    currentUser?.role === "root" ||
    currentUser?.role === "coordinador_ti" ||
    currentUser?.role === "ingeniero_sistemas";

  const [newUser, setNewUser] = useState({
    documentType: "",
    documentNumber: "",
    fullName: "",
    phone: "",
    position: "",
    role: "",
    username: "",
    password: "",
    confirmPassword: ""
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (newUser.password !== newUser.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    addUser({
      username: newUser.username,
      fullName: newUser.fullName,
      identification: newUser.documentNumber,
      email: `${newUser.username}@icvc.com.co`,
      position: newUser.position,
      department: "Por asignar",
      role: newUser.role as any
    });

    setNewUser({
      documentType: "",
      documentNumber: "",
      fullName: "",
      phone: "",
      position: "",
      role: "",
      username: "",
      password: "",
      confirmPassword: ""
    });
    setActiveTab("list");
  };

  const handleToggleStatus = (userId: string) => {
    const target = usersFromAuth.find(u => u.id === userId);
    if (target) toggleUserStatus(target.username);
  };

  const handleResetUserPassword = (userId: string) => {
    const user = usersFromAuth.find(u => u.id === userId);
    if (user) {
      alert(`Contraseña reseteada para ${user.fullName}. Nueva contraseña: ${user.identification}`);
    }
  };

  const handleGrantAccess = (requestId: string) => {
    const request = accessRequests.find(r => r.id === requestId);
    if (request) {
      // Precargar datos del formulario con la información de la solicitud
      setNewUser({
        documentType: request.documentType,
        documentNumber: request.documentNumber,
        fullName: request.fullName,
        phone: request.phone,
        position: request.position,
        role: "",
        username: "",
        password: "",
        confirmPassword: ""
      });
      setSelectedAccessRequest(requestId);
      approveAccessRequest(requestId);
      setActiveTab("create");
    }
  };

  const handleResetPasswordRequest = (requestId: string) => {
    const request = passwordResetRequests.find(r => r.id === requestId);
    if (!request) return;

    // Buscar el usuario en el sistema por nombre de usuario
    const user = usersFromAuth.find(u => u.username === request.username);

    if (!user) {
      alert(`Error: El usuario "${request.username}" no existe en el sistema. No se puede resetear la contraseña.`);
      return;
    }

    // Resetear la contraseña al número de documento
    alert(`Contraseña reseteada para ${user.fullName}.\nNueva contraseña: ${user.identification}\n\nEl usuario puede iniciar sesión con su número de documento.`);
    resetPassword(requestId);
  };

  const filteredUsers = usersFromAuth.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.identification.includes(searchTerm) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || u.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleEditUser = (userToEdit: any) => {
    setEditingUser({ ...userToEdit });
    setShowEditModal(true);
  };

  const handleSaveEditUser = () => {
    if (!editingUser) return;
    updateUser(editingUser);
    setShowEditModal(false);
    setEditingUser(null);
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: "Admin",
      root: "Root",
      ti: "TI",
      coordinador_ti: "Coordinador TI",
      sistemas: "Sistemas",
      ingeniero_sistemas: "Ingeniero de Sistemas",
      comunicaciones: "Comunicaciones",
      asistencial: "Asistencial",
      coordinador_asistencial: "Coordinador Asistencial",
      coordinador_consulta_externa: "Coordinador Consulta Externa",
      administrativo: "Administrativo",
      administrativo_rrhh: "Administrativo Recursos Humanos",
      administrativo_calidad: "Administrativo Calidad",
      coordinador_administrativo: "Coordinador Administrativo"
    };
    return roles[role] || role;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md border-2 border-[#0778AC]/20 p-6">
        <h1 className="text-2xl font-bold text-[#0778AC] flex items-center gap-3">
          <Users className="w-8 h-8" />
          Gestión de Usuarios
        </h1>
        <p className="text-gray-600 mt-2">
          Administración completa de usuarios del sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md border-2 border-gray-100 overflow-hidden">
        <div className="flex flex-wrap border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${
              activeTab === "list"
                ? "bg-[#0778AC] text-white border-b-4 border-[#CF3438]"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Users className="w-5 h-5" />
            Lista de Usuarios
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${
              activeTab === "create"
                ? "bg-[#0778AC] text-white border-b-4 border-[#CF3438]"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <UserPlus className="w-5 h-5" />
            Crear Usuario
          </button>
          <button
            onClick={() => setActiveTab("access-requests")}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${
              activeTab === "access-requests"
                ? "bg-[#0778AC] text-white border-b-4 border-[#CF3438]"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FileText className="w-5 h-5" />
            Solicitudes de Acceso
            {accessRequests.filter(r => r.status === "pending").length > 0 && (
              <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                {accessRequests.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("password-requests")}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all ${
              activeTab === "password-requests"
                ? "bg-[#0778AC] text-white border-b-4 border-[#CF3438]"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Key className="w-5 h-5" />
            Restaurar Contraseñas
            {passwordResetRequests.filter(r => r.status === "pending").length > 0 && (
              <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                {passwordResetRequests.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Lista de Usuarios */}
          {activeTab === "list" && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, documento o usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#0778AC]"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#0778AC] text-white">
                      <th className="px-4 py-3 text-left">N° Documento</th>
                      <th className="px-4 py-3 text-left">Nombre Completo</th>
                      <th className="px-4 py-3 text-left">Usuario</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                      <th className="px-4 py-3 text-left">Fecha Creación</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3">{u.identification}</td>
                        <td className="px-4 py-3 font-semibold">{u.fullName}</td>
                        <td className="px-4 py-3">{u.username}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            u.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {u.status === "active" ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{new Date(u.createdDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setShowUserModal(true);
                              }}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                              title="Ver información"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleResetUserPassword(u.id)}
                              className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors"
                              title="Restaurar contraseña"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            {canEditUsers && (
                              <button
                                onClick={() => handleEditUser(u)}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                title="Editar usuario"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleStatus(u.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                u.status === "active"
                                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                                  : "bg-green-100 text-green-600 hover:bg-green-200"
                              }`}
                              title={u.status === "active" ? "Desactivar" : "Activar"}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Crear Usuario */}
          {activeTab === "create" && (
            <form onSubmit={handleCreateUser} className="space-y-6">
              {selectedAccessRequest && (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-semibold">
                    ✓ Datos precargados desde solicitud de acceso. Complete los campos faltantes para finalizar el registro.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo de Identificación */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Tipo de Identificación <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newUser.documentType}
                    onChange={(e) => setNewUser({ ...newUser, documentType: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                    required
                  >
                    <option value="">Seleccione...</option>
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="PP">Pasaporte</option>
                  </select>
                </div>

                {/* Número de Identificación */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Número de Identificación <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.documentNumber}
                    onChange={(e) => setNewUser({ ...newUser, documentNumber: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                    placeholder="Número de documento"
                    autoComplete="off"
                    required
                  />
                </div>

                {/* Nombre Completo */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                    placeholder="Nombre completo del usuario"
                    autoComplete="off"
                    required
                  />
                </div>

                {/* Número de Teléfono */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Número de Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                    placeholder="Número de teléfono"
                    autoComplete="off"
                    required
                  />
                </div>

                {/* Cargo dentro de la empresa */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Cargo dentro de la Empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.position}
                    onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                    placeholder="Cargo del usuario"
                    autoComplete="off"
                    required
                  />
                </div>

                {/* Rol */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">
                    Rol <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                    required
                  >
                    <option value="">Seleccione un rol...</option>
                    <option value="ti">TI</option>
                    <option value="coordinador_ti">Coordinador TI</option>
                    <option value="sistemas">Sistemas</option>
                    <option value="ingeniero_sistemas">Ingeniero de Sistemas</option>
                    <option value="comunicaciones">Comunicaciones</option>
                    <option value="asistencial">Asistencial</option>
                    <option value="coordinador_asistencial">Coordinador Asistencial</option>
                    <option value="coordinador_consulta_externa">Coordinador Consulta Externa</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="administrativo_rrhh">Administrativo Recursos Humanos</option>
                    <option value="administrativo_calidad">Administrativo Calidad</option>
                    <option value="coordinador_administrativo">Coordinador Administrativo</option>
                  </select>
                </div>

                {/* Nombre de Usuario */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Nombre de Usuario para Acceso <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                    placeholder="Usuario de acceso"
                    autoComplete="off"
                    required
                  />
                </div>

                {/* Contraseña del usuario */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Contraseña del Usuario <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                    placeholder="Contraseña"
                    required
                  />
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Confirmar Contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#0778AC]"
                    placeholder="Confirme la contraseña"
                    required
                  />
                </div>
              </div>

              {/* Botón Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#0778AC] to-[#0778AC]/90 hover:from-[#0778AC]/90 hover:to-[#0778AC] text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Crear Usuario
                </button>
              </div>
            </form>
          )}

          {/* Solicitudes de Acceso */}
          {activeTab === "access-requests" && (
            <div className="space-y-4">
              {accessRequests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay solicitudes de acceso pendientes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {accessRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`border-2 rounded-lg p-4 ${
                        request.status === "pending"
                          ? "border-yellow-300 bg-yellow-50"
                          : request.status === "approved"
                          ? "border-green-300 bg-green-50"
                          : "border-red-300 bg-red-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{request.fullName}</h3>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                            <p><strong>Documento:</strong> {request.documentType} - {request.documentNumber}</p>
                            <p><strong>Teléfono:</strong> {request.phone}</p>
                            <p><strong>Cargo:</strong> {request.position}</p>
                            <p><strong>Fecha:</strong> {request.requestDate.toLocaleDateString()}</p>
                          </div>
                        </div>
                        {request.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleGrantAccess(request.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                            >
                              Acceso Concedido
                            </button>
                            <button
                              onClick={() => rejectAccessRequest(request.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                        {request.status !== "pending" && (
                          <span className={`px-4 py-2 rounded-lg font-semibold ${
                            request.status === "approved" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                          }`}>
                            {request.status === "approved" ? "Aprobado" : "Rechazado"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Solicitudes de Restaurar de Contraseña */}
          {activeTab === "password-requests" && (
            <div className="space-y-4">
              {passwordResetRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay solicitudes de restaurar de contraseña</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {passwordResetRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`border-2 rounded-lg p-4 ${
                        request.status === "pending"
                          ? "border-yellow-300 bg-yellow-50"
                          : "border-green-300 bg-green-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{request.username}</h3>
                          <div className="mt-2 text-sm text-gray-600">
                            <p><strong>Observación:</strong></p>
                            <p className="mt-1 bg-white p-3 rounded border">{request.details}</p>
                            <p className="mt-2"><strong>Fecha:</strong> {request.requestDate.toLocaleDateString()}</p>
                          </div>
                        </div>
                        {request.status === "pending" ? (
                          <button
                            onClick={() => handleResetPasswordRequest(request.id)}
                            className="bg-[#CF3438] hover:bg-[#a01f24] text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Restaurar Contraseña
                          </button>
                        ) : (
                          <span className="px-4 py-2 bg-green-200 text-green-800 rounded-lg font-semibold">
                            Completado
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Información de Usuario */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-[#0778AC] text-white px-6 py-5 flex justify-between items-center rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold">Información del Usuario</h2>
                <p className="text-blue-100 text-xs mt-1">Detalles completos del perfil registrado</p>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <RotateCcw className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Tipo de Documento</p>
                  <p className="font-semibold">CC</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Número de Documento</p>
                  <p className="font-semibold">{selectedUser.identification}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 text-sm">Nombre Completo</p>
                  <p className="font-semibold">{selectedUser.fullName}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Teléfono</p>
                  <p className="font-semibold">{selectedUser.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Cargo</p>
                  <p className="font-semibold">{selectedUser.position}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Rol</p>
                  <p className="font-semibold">{getRoleLabel(selectedUser.role)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Usuario</p>
                  <p className="font-semibold">{selectedUser.username}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Estado</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedUser.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {selectedUser.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 text-sm">Fecha de Creación</p>
                  <p className="font-semibold">{new Date(selectedUser.createdDate).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Usuario */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-[#0778AC] text-white px-6 py-5 flex justify-between items-center rounded-t-xl flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold">Editar Usuario</h2>
                <p className="text-blue-100 text-xs mt-1">Actualice los datos del funcionario</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditingUser(null); }} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                <RotateCcw className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Tipo de Documento</label>
                  <select value={editingUser.documentType} onChange={e => setEditingUser({ ...editingUser, documentType: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#CF3438]">
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="PP">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Número de Documento</label>
                  <input type="text" value={editingUser.identification} onChange={e => setEditingUser({ ...editingUser, identification: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#CF3438]" />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Nombre Completo</label>
                <input type="text" value={editingUser.fullName} onChange={e => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#CF3438]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Teléfono</label>
                  <input type="tel" value={editingUser.phone} onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#CF3438]" />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Cargo</label>
                  <input type="text" value={editingUser.position} onChange={e => setEditingUser({ ...editingUser, position: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#CF3438]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Rol</label>
                  <select value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#CF3438]">
                    <option value="ti">TI</option>
                    <option value="coordinador_ti">Coordinador TI</option>
                    <option value="sistemas">Sistemas</option>
                    <option value="ingeniero_sistemas">Ingeniero de Sistemas</option>
                    <option value="comunicaciones">Comunicaciones</option>
                    <option value="asistencial">Asistencial</option>
                    <option value="coordinador_asistencial">Coordinador Asistencial</option>
                    <option value="coordinador_consulta_externa">Coordinador Consulta Externa</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="administrativo_rrhh">Administrativo RRHH</option>
                    <option value="administrativo_calidad">Administrativo Calidad</option>
                    <option value="coordinador_administrativo">Coordinador Administrativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Usuario</label>
                  <input type="text" value={editingUser.username} onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-[#CF3438]" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors">Cancelar</button>
                <button onClick={handleSaveEditUser}
                  className="bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg">Guardar Cambios</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

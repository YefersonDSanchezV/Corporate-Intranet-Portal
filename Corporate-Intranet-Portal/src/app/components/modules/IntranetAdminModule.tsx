import { LayoutGrid, Plus, Pencil, Search, Sliders, ShieldCheck, Globe, Image as ImageIcon, CheckCircle2, UserCheck, X, Save, Power, User, FileText, Phone, Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useSystem, RedirectSite } from "../../contexts/SystemContext";
import { useAuth } from "../../contexts/AuthContext";
import { getGreeting } from "../../utils/greetings";

const MODULES_LIST = [
  "Inicio",
  "Área Asistencial",
  "Área Administrativa",
  "Gestión Institucional",
  "Soporte",
  "Directorio",
  "Comunicaciones",
  "Administración del Sistema"
];

const MODULE_OPTIONS = [
  { id: "Clinical", name: "Área Asistencial" },
  { id: "Administrative", name: "Área Administrativa" },
  { id: "Institutional", name: "Gestión Institucional" },
  { id: "Support", name: "Soporte" }
];

const MOCK_PERMISSIONS = [
  { module: "Inicio", actions: ["Registrar Anuncio"] },
  { module: "Área Asistencial", actions: ["Registrar formatos de contingencia", "Registrar Datos de EPS para Consulta Externa"] },
  { module: "Área Administrativa", actions: ["Cargar nuevas Tareas", "Matriz de Contratos"] },
  { module: "Gestión Institucional", actions: ["Registro de logros obtenidos", "Editar Logros Obtenidos"] },
  { module: "Soporte", actions: ["Registrar Ext, Correo soporte"] },
  { module: "Directorio", actions: ["Registrar Directorio"] },
  { module: "Comunicaciones", actions: ["Editar Solicitudes de registros de anuncios", "Aprobar y Rechazar solicitudes de Anuncios"] },
  { module: "Gestión de Usuarios", actions: ["Listar Usuarios", "Crear usuarios", "Solicitudes de Usuarios", "Editar Usuarios", "Reinicio de Contraseña"] },
  { module: "Logs", actions: ["Consultar Logs"] },
  { module: "Administrador Intranet", actions: ["Registrar Sitios de redirección", "Actualizar sitios de redirección", "Consultar sitios de redirección", "Autorizar módulos a Usuarios", "Autorizar Acciones de Módulos a Usuarios"] }
];

export function IntranetAdminModule() {
  const { 
    sites, addSite, updateSite, toggleSiteActive, 
    roles, addRole, rolePermissions, updateRoleModulePermissions, updateRoleActionPermissions 
  } = useSystem();
  const { user } = useAuth();
  const greeting = getGreeting();
  
  const [activeTab, setActiveTab] = useState<"roles" | "sites" | "permissions" | "actions">("sites");
  const [showAddSite, setShowAddSite] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [editingSite, setEditingSite] = useState<RedirectSite | null>(null);
  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [actionRoleSearch, setActionRoleSearch] = useState("");
  const [selectedRoleForActions, setSelectedRoleForActions] = useState<string | null>(null);
  const [showFullRoleModal, setShowFullRoleModal] = useState(false);
  
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  
  const iconOptions = [
    { name: "Documentos", icon: FileText, ref: "FileText" },
    { name: "Red", icon: Globe, ref: "Globe" },
    { name: "Usuario", icon: User, ref: "User" },
    { name: "Médico", icon: ShieldCheck, ref: "ShieldCheck" },
    { name: "Teléfono", icon: Phone, ref: "Phone" },
    { name: "Calendario", icon: Calendar, ref: "Calendar" }
  ];

  // Form State
  const [newSite, setNewSite] = useState<Omit<RedirectSite, "id" | "active">>({
    title: "",
    url: "",
    type: "icon",
    ref: "Link",
    moduleId: "Administrative"
  });

  const filteredRolesForMatrix = useMemo(() => {
    return roles.filter(r => 
      r.name.toLowerCase().includes(roleSearchTerm.toLowerCase()) || 
      r.description.toLowerCase().includes(roleSearchTerm.toLowerCase())
    );
  }, [roles, roleSearchTerm]);

  const handleAddRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name.trim()) return;
    addRole(newRole);
    setShowAddRole(false);
    setNewRole({ name: "", description: "" });
  };

  const handleAddSiteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSite(newSite);
    setShowAddSite(false);
    setNewSite({ title: "", url: "", type: "icon", ref: "Link", moduleId: "Administrative" });
  };

  const handleSaveEditSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;
    updateSite(editingSite);
    setEditingSite(null);
  };

  const handleModuleToggle = (roleId: string, moduleName: string) => {
    const currentPerms = rolePermissions.find(p => p.roleId === roleId)?.modules || [];
    const newPerms = currentPerms.includes(moduleName)
      ? currentPerms.filter(m => m !== moduleName)
      : [...currentPerms, moduleName];
    updateRoleModulePermissions(roleId, newPerms);
  };

  const handleActionToggle = (roleId: string, actionName: string) => {
    const currentPerms = rolePermissions.find(p => p.roleId === roleId)?.actions || [];
    const newPerms = currentPerms.includes(actionName)
      ? currentPerms.filter(a => a !== actionName)
      : [...currentPerms, actionName];
    updateRoleActionPermissions(roleId, newPerms);
  };

  const selectedRoleObject = roles.find(r => r.id === selectedRoleForActions);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#0778AC] mb-2">Administrador del Portal</h1>
        <div className="h-1 bg-gradient-to-r from-[#CF3438] to-transparent w-32 md:w-48 rounded-full"></div>
      </div>

      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#0778AC]">
        <p className="text-gray-700 font-bold text-sm md:text-base mb-1">
          ¡{greeting}, {user?.fullName.split(' ')[0]}!
        </p>
        <p className="text-gray-600 text-sm md:text-base">
          En este módulo podrás configurar los accesos, roles y permisos globales de la Intranet Institucional.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 md:gap-4 mb-6">
        <button
          onClick={() => setActiveTab("roles")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === "roles" ? "bg-[#0778AC] text-white shadow-lg" : "bg-white border-2 border-gray-100 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <User className="w-5 h-5" />
          Roles del Sistema
        </button>
        <button
          onClick={() => setActiveTab("sites")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === "sites" ? "bg-[#0778AC] text-white shadow-lg" : "bg-white border-2 border-gray-100 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Globe className="w-5 h-5" />
          Sitios de Redirección
        </button>
        <button
          onClick={() => setActiveTab("permissions")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === "permissions" ? "bg-[#0778AC] text-white shadow-lg" : "bg-white border-2 border-gray-100 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <UserCheck className="w-5 h-5" />
          Autorizar Módulos
        </button>
        <button
          onClick={() => setActiveTab("actions")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            activeTab === "actions" ? "bg-[#0778AC] text-white shadow-lg" : "bg-white border-2 border-gray-100 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          Permisos de Acciones
        </button>
      </div>

      {/* Content: Roles del sistema */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
              <User className="w-6 h-6 text-[#CF3438]" />
              Gestión de Roles
            </h2>
            <button
              onClick={() => setShowAddRole(true)}
              className="bg-gradient-to-r from-[#CF3438] to-[#CF3438]/90 text-white px-4 py-2 rounded-lg font-semibold shadow-md flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuevo Rol
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-100">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 uppercase">Clave del Rol</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 uppercase">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map(role => (
                    <tr key={role.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        #{role.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {role.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Content: Sitios de Redirección */}
      {activeTab === "sites" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-[#CF3438]" />
              Gestión de Redirecciones
            </h2>
            <button
              onClick={() => setShowAddSite(true)}
              className="bg-gradient-to-r from-[#CF3438] to-[#CF3438]/90 text-white px-4 py-2 rounded-lg font-semibold shadow-md flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuevo Sitio
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-100">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 uppercase">Título del Sitio</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 uppercase">Enlace</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 uppercase">Módulo</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map(site => (
                    <tr key={site.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center border text-[#0778AC]">
                            {site.type === "icon" ? <Globe className="w-6 h-6" /> : <img src={site.ref} alt="" className="w-full h-full object-cover rounded" />}
                          </div>
                          <span className="font-semibold text-gray-800">{site.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-600 font-medium underline truncate max-w-xs">{site.url}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{site.moduleId}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${site.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {site.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setEditingSite(site)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => toggleSiteActive(site.id)}
                            className={`p-2 rounded-lg transition-colors ${site.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            title={site.active ? "Inactivar" : "Activar"}
                          >
                            <Power className="w-5 h-5" />
                          </button>
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

      {/* Content: Autorizar Módulos */}
      {activeTab === "permissions" && (
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-[#0778AC]" />
              Matriz de Autorización de Módulos
            </h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar rol..." 
                value={roleSearchTerm}
                onChange={(e) => setRoleSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border-2 border-gray-100 rounded-lg focus:border-[#0778AC] outline-none text-sm"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0778AC] text-white">
                  <th className="px-4 py-3 text-left">Rol</th>
                  {MODULES_LIST.map(m => <th key={m} className="px-4 py-3 text-center text-xs whitespace-nowrap">{m}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredRolesForMatrix.map((u: any) => {
                  const perms = rolePermissions.find((p: any) => p.roleId === u.id)?.modules || [];
                  return (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-700 text-sm">{u.description}</p>
                        <p className="text-xs text-gray-500">#{u.name}</p>
                      </td>
                      {MODULES_LIST.map(m => (
                        <td key={m} className="px-4 py-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={perms.includes(m)}
                            onChange={() => handleModuleToggle(u.id, m)}
                            className="w-5 h-5 accent-[#CF3438] cursor-pointer" 
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content: Acciones por Módulos */}
      {activeTab === "actions" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#0778AC]" />
              Permisos Especiales por Rol
            </h2>
            
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2">Buscar Rol para Asignar Permisos</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Escriba rol y presione Enter..." 
                      value={actionRoleSearch}
                      onChange={(e) => setActionRoleSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Tab') {
                          const found = roles.find((u: any) => 
                            u.description.toLowerCase().includes(actionRoleSearch.toLowerCase()) || 
                            u.name.toLowerCase().includes(actionRoleSearch.toLowerCase())
                          );
                          if (found) {
                            setSelectedRoleForActions(found.id);
                            setActionRoleSearch(found.description);
                          }
                        }
                      }}
                      className="w-full pl-9 pr-4 py-2 border-2 border-gray-100 rounded-lg focus:border-[#0778AC] outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => setShowFullRoleModal(true)}
                    className="bg-[#0778AC] text-white p-2 rounded-lg hover:bg-[#065a87] transition-colors shadow-md"
                    title="Ver lista completa de roles"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {selectedRoleObject ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_PERMISSIONS.map((mod, i) => {
                  const userActions = rolePermissions.find((p: any) => p.roleId === selectedRoleObject.id)?.actions || [];
                  return (
                    <div key={i} className="bg-white rounded-xl shadow-md border-2 border-gray-100 p-5 flex flex-col hover:border-[#0778AC]/30 transition-all">
                      <div className="bg-[#0778AC]/10 text-[#0778AC] px-3 py-1.5 rounded-lg text-sm font-bold mb-4 self-start">
                        {mod.module}
                      </div>
                      <ul className="space-y-3 flex-1">
                        {mod.actions.map((act, j) => (
                          <li 
                            key={j} 
                            onClick={() => handleActionToggle(selectedRoleObject.id, act)}
                            className="flex items-start gap-3 text-sm text-gray-700 group cursor-pointer"
                          >
                            <div className={`mt-0.5 w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                              userActions.includes(act) ? 'border-[#CF3438] bg-[#CF3438]' : 'border-[#CF3438]/30 group-hover:border-[#CF3438]'
                            }`}>
                              {userActions.includes(act) && <CheckCircle2 className="w-4 h-4 text-white" />}
                            </div>
                            <span className={userActions.includes(act) ? "font-bold text-[#CF3438]" : ""}>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium text-lg">Seleccione un rol de la lista superior para visualizar y gestionar sus permisos de acción.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for Adding Roles */}
      {showAddRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 flex justify-between items-center text-white rounded-t-xl bg-[#CF3438]">
              <h3 className="font-bold text-lg">Registrar Nuevo Rol</h3>
              <button onClick={() => setShowAddRole(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddRoleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Clave del Rol *</label>
                <input 
                  type="text" 
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value.toLowerCase().trim().replace(/\s+/g, '_')})}
                  required
                  placeholder="ej: finanzas, admin, medico_general"
                  className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-[#0778AC] outline-none transition-all" 
                />
                <p className="text-xs text-gray-500 mt-1">Sustituya espacios por guiones bajos. Solo minúsculas.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción del Rol *</label>
                <input 
                  type="text" 
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  required
                  placeholder="Personal del departamento de finanzas..."
                  className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-[#0778AC] outline-none transition-all" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddRole(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#CF3438] hover:bg-[#CF3438]/90 text-white rounded-lg font-semibold shadow-md transition-colors flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Guardar Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals for Adding/Editing Sites */}
      {(showAddSite || editingSite) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#0778AC] text-white px-6 py-5 flex justify-between items-center rounded-t-xl flex-shrink-0">
              <div>
                <h3 className="font-bold text-xl">{editingSite ? "Editar Sitio" : "Nuevo Sitio"}</h3>
                <p className="text-blue-100 text-xs mt-1">Configure los datos del sitio de redirección</p>
              </div>
              <button onClick={() => { setShowAddSite(false); setEditingSite(null); }} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={editingSite ? handleSaveEditSite : handleAddSiteSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Título del Sitio *</label>
                <input 
                  type="text" 
                  value={editingSite ? editingSite.title : newSite.title}
                  onChange={(e) => editingSite ? setEditingSite({...editingSite, title: e.target.value}) : setNewSite({...newSite, title: e.target.value})}
                  required
                  className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-[#0778AC] outline-none transition-all" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Enlace del Sitio *</label>
                <input 
                  type="url" 
                  value={editingSite ? editingSite.url : newSite.url}
                  onChange={(e) => editingSite ? setEditingSite({...editingSite, url: e.target.value}) : setNewSite({...newSite, url: e.target.value})}
                  required
                  className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-[#0778AC] outline-none transition-all" 
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Referencia *</label>
                  <select 
                    value={editingSite ? editingSite.type : newSite.type}
                    onChange={(e) => {
                      const val = e.target.value as "image" | "icon";
                      editingSite ? setEditingSite({...editingSite, type: val}) : setNewSite({...newSite, type: val});
                    }}
                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-[#0778AC] outline-none transition-all"
                  >
                    <option value="icon">Ícono</option>
                    <option value="image">Imagen URL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Módulo Destino *</label>
                  <select 
                    value={editingSite ? editingSite.moduleId : newSite.moduleId}
                    onChange={(e) => editingSite ? setEditingSite({...editingSite, moduleId: e.target.value}) : setNewSite({...newSite, moduleId: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-[#0778AC] outline-none transition-all"
                  >
                    <option value="Clinical">Área Asistencial</option>
                    <option value="Administrative">Área Administrativa</option>
                    <option value="Institutional">Gestión Institucional</option>
                    <option value="Support">Soporte</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {(editingSite ? editingSite.type : newSite.type) === "image" ? "Cargar Imagen (URL)" : "Elegir Ícono"}
                </label>
                {(editingSite ? editingSite.type : newSite.type) === "image" ? (
                  <input 
                    type="text" 
                    value={editingSite ? editingSite.ref : newSite.ref}
                    onChange={(e) => editingSite ? setEditingSite({...editingSite, ref: e.target.value}) : setNewSite({...newSite, ref: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:border-[#0778AC] outline-none transition-all" 
                    placeholder="URL de la imagen..."
                  />
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {iconOptions.map(opt => (
                      <button 
                        key={opt.ref}
                        type="button"
                        onClick={() => editingSite ? setEditingSite({...editingSite, ref: opt.ref}) : setNewSite({...newSite, ref: opt.ref})}
                        className={`p-3 border-2 rounded-lg hover:border-[#0778AC] transition-all flex flex-col items-center gap-1 ${
                          (editingSite ? editingSite.ref : newSite.ref) === opt.ref ? "border-[#0778AC] bg-blue-50" : "border-gray-100"
                        }`}
                      >
                         <opt.icon className={`w-6 h-6 ${(editingSite ? editingSite.ref : newSite.ref) === opt.ref ? "text-[#0778AC]" : "text-gray-500"}`} />
                         <span className="text-[10px] uppercase font-bold text-gray-400">{opt.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setShowAddSite(false); setEditingSite(null); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={`flex-1 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2 ${
                    editingSite ? "bg-blue-600 shadow-blue-200" : "bg-[#CF3438] shadow-red-200"
                  }`}
                >
                  <Save className="w-5 h-5" />
                  {editingSite ? "Guardar Cambios" : "Actualizar Sitio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <FullRoleModal 
        isOpen={showFullRoleModal} 
        onClose={() => setShowFullRoleModal(false)} 
        roles={roles}
        onSelect={(id) => {
          setSelectedRoleForActions(id);
          const r = roles.find((x: any) => x.id === id);
          if (r) setActionRoleSearch(r.description);
        }}
      />
    </div>
  );
}

// Modal para selección completa de roles
function FullRoleModal({ isOpen, onClose, roles, onSelect }: { isOpen: boolean, onClose: () => void, roles: any[], onSelect: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        <div className="bg-[#0778AC] text-white px-6 py-5 flex justify-between items-center rounded-t-xl">
          <div>
            <h3 className="font-bold text-xl">Seleccionar Rol</h3>
            <p className="text-blue-100 text-xs mt-1">Busque y seleccione un rol del sistema</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Filtrar por nombre o clave..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border-2 border-gray-100 rounded-lg focus:border-[#0778AC] outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.map(u => (
            <button 
              key={u.id}
              onClick={() => { onSelect(u.id); onClose(); }}
              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#0778AC]">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-800">{u.fullName}</p>
                <p className="text-xs text-gray-500">@{u.username} - {u.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

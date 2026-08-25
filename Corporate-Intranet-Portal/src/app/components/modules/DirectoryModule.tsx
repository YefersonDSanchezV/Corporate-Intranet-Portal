import { Search, Phone, Building2, Users, Plus, Pencil, X, Check, Mail, Briefcase, MapPin, Eye } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSystem, DirectoryEntry, InstitutionEmail } from "../../contexts/SystemContext";
import { getGreeting } from "../../utils/greetings";
import { hasRole, TI_SUPPORT_ROLES } from "../../utils/roles";

type Floor = "Todos" | "Piso 1" | "Piso 2" | "Piso 3" | "Piso 4" | "Piso 5" | "Piso 6" | "Urgencia" | "Línea de frente";

const FLOORS: Floor[] = ["Todos", "Piso 1", "Piso 2", "Piso 3", "Piso 4", "Piso 5", "Piso 6", "Urgencia", "Línea de frente"];
const EDITABLE_FLOORS = FLOORS.filter(f => f !== "Todos");

export function DirectoryModule() {
  const { user } = useAuth();
  const { directory, addDirectoryEntry, updateDirectoryEntry, institutionEmails, addInstitutionEmail, updateInstitutionEmail } = useSystem();
  const greeting = getGreeting();
  const [selectedFloor, setSelectedFloor] = useState<Floor>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"extensiones" | "correos">("extensiones");
  const [emailSearchTerm, setEmailSearchTerm] = useState("");

  // Sub-modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DirectoryEntry | null>(null);
  const [editSearch, setEditSearch] = useState("");

  // Modales Correo
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);
  const [showEditEmailModal, setShowEditEmailModal] = useState(false);
  const [showViewEmailModal, setShowViewEmailModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<InstitutionEmail | null>(null);

  // Formulario email
  const [emailFormData, setEmailFormData] = useState<Omit<InstitutionEmail, 'id'>>({
    employeeName: "",
    position: "",
    email: "",
    area: "",
    floor: ""
  });

  // Formulario nuevo
  const [newType, setNewType] = useState<"asistencial" | "administrativo">("asistencial");
  const [newName, setNewName] = useState("");
  const [newExtension, setNewExtension] = useState("");
  const [newFloors, setNewFloors] = useState<Floor[]>([]);

  const canManage = hasRole(user, TI_SUPPORT_ROLES);

  const filteredExtensions = directory.filter(ext => {
    const currentFloors = ext.floor || [];
    const matchesFloor = selectedFloor === "Todos" || currentFloors.includes(selectedFloor);
    const matchesSearch = ext.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ext.extension.includes(searchTerm);
    return matchesFloor && matchesSearch && ext.active;
  });

  const asistencialExtensions = filteredExtensions.filter(ext => ext.type === "asistencial");
  const administrativoExtensions = filteredExtensions.filter(ext => ext.type === "administrativo");

  // Editar
  const editFilteredExtensions = directory.filter(ext =>
    (ext.name.toLowerCase().includes(editSearch.toLowerCase()) ||
    ext.extension.includes(editSearch)) && ext.active
  );

  const toggleFloor = (floor: Floor, forEdit = false) => {
    if (forEdit && editingEntry) {
      const currentFloors = editingEntry.floor || [];
      const floors = currentFloors.includes(floor)
        ? currentFloors.filter(f => f !== floor)
        : [...currentFloors, floor];
      setEditingEntry({ ...editingEntry, floor: floors });
    } else {
      setNewFloors(prev => prev.includes(floor) ? prev.filter(f => f !== floor) : [...prev, floor]);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newExtension.trim() || newFloors.length === 0) return;
    
    addDirectoryEntry({
      name: newName,
      extension: newExtension,
      floor: newFloors,
      type: newType
    });

    setNewName(""); setNewExtension(""); setNewFloors([]); setNewType("asistencial");
    setShowAddModal(false);
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;
    updateDirectoryEntry(editingEntry);
    setEditingEntry(null);
  };

  return (
    <>
      <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#0778AC] mb-2">Directorio Institucional</h1>
        <div className="h-1 bg-gradient-to-r from-[#CF3438] to-transparent w-32 md:w-48 rounded-full"></div>
      </div>

      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#0778AC]">
        <p className="text-gray-700 font-bold text-sm md:text-base mb-1">
          ¡{greeting}, {user?.fullName.split(' ')[0]}!
        </p>
        <p className="text-gray-600 text-sm md:text-base">
          En este módulo encontrarás el directorio de extensiones telefónicas y correos institucionales.
        </p>
      </div>

      <div className="mb-6 flex gap-4 border-b-2 border-gray-100 pb-1">
        <button
          onClick={() => setView("extensiones")}
          className={`pb-3 px-2 font-bold text-sm md:text-base transition-all relative ${
            view === "extensiones" ? "text-[#CF3438]" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" /> Extensiones
          </div>
          {view === "extensiones" && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#CF3438] rounded-full" />}
        </button>
        <button
          onClick={() => setView("correos")}
          className={`pb-3 px-2 font-bold text-sm md:text-base transition-all relative ${
            view === "correos" ? "text-[#CF3438]" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" /> Correos
          </div>
          {view === "correos" && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#CF3438] rounded-full" />}
        </button>
      </div>

      {view === "extensiones" ? (
        <div>
          

        {/* Botones de gestión */}
        {canManage && (
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Cargar Nuevo Directorio
            </button>
            <button
              onClick={() => { setShowEditModal(true); setEditSearch(""); setEditingEntry(null); }}
              className="flex items-center gap-2 bg-gradient-to-r from-[#0778AC] to-[#0996d3] hover:from-[#065a87] hover:to-[#0778AC] text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Pencil className="w-4 h-4" /> Editar Directorio
            </button>
          </div>
        )}

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#0778AC]" />
            <input
              type="text"
              placeholder="Buscar área o extensión..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-gray-200 rounded-lg pl-10 md:pl-14 pr-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all shadow-sm text-sm md:text-base"
            />
          </div>
        </div>

        {/* Filtros por piso */}
        <div className="mb-6 md:mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtrar por piso:</h3>
          <div className="flex flex-wrap gap-2">
            {FLOORS.map((floor) => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all shadow-sm ${
                  selectedFloor === floor
                    ? 'bg-[#CF3438] text-white'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#CF3438] hover:bg-[#f0f4f8]'
                }`}
              >
                {floor}
              </button>
            ))}
          </div>
        </div>

        {/* Extensiones por columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Columna Asistencial */}
          <section>
            <div className="bg-gradient-to-r from-[#0778AC] to-[#0996d3] rounded-t-lg p-4 text-white">
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6" /> Asistencial
              </h2>
            </div>
            <div className="bg-white border-2 border-[#0778AC] border-t-0 rounded-b-lg p-4 space-y-3">
              {asistencialExtensions.length > 0 ? (
                asistencialExtensions.map((ext) => (
                  <div key={ext.id} className="bg-gradient-to-r from-[#f0f4f8] to-white border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Building2 className="w-5 h-5 text-[#0778AC] flex-shrink-0" />
                        <span className="font-semibold text-gray-800 text-sm md:text-base">{ext.name}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-[#0778AC] text-white px-3 py-1 rounded-full">
                        <Phone className="w-4 h-4" />
                        <span className="font-bold text-sm">{ext.extension}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">{ext.floor?.join(", ") || ""}</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 font-bold text-center py-6 text-sm uppercase tracking-wider">NO HAY EXTENSIONES REGISTRADAS</p>
              )}
            </div>
          </section>

          {/* Columna Administrativo */}
          <section>
            <div className="bg-gradient-to-r from-[#CF3438] to-[#e74c3c] rounded-t-lg p-4 text-white">
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                <Building2 className="w-6 h-6" /> Administrativo
              </h2>
            </div>
            <div className="bg-white border-2 border-[#CF3438] border-t-0 rounded-b-lg p-4 space-y-3">
              {administrativoExtensions.length > 0 ? (
                administrativoExtensions.map((ext) => (
                  <div key={ext.id} className="bg-gradient-to-r from-[#f0f4f8] to-white border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Building2 className="w-5 h-5 text-[#CF3438] flex-shrink-0" />
                        <span className="font-semibold text-gray-800 text-sm md:text-base">{ext.name}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-[#CF3438] text-white px-3 py-1 rounded-full">
                        <Phone className="w-4 h-4" />
                        <span className="font-bold text-sm">{ext.extension}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">{ext.floor?.join(", ") || ""}</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 font-bold text-center py-6 text-sm uppercase tracking-wider">NO HAY EXTENSIONES REGISTRADAS</p>
              )}
            </div>
          </section>
        </div>
      </div>
    ) : (
        /* VISTA CORREOS */
        <div>
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#0778AC] mb-2">Correos Institucionales</h1>
              <div className="h-1 bg-gradient-to-r from-[#CF3438] to-transparent w-32 md:w-48 rounded-full"></div>
            </div>
            
            <button
              onClick={() => {
                setEmailFormData({ employeeName: "", position: "", email: "", area: "", floor: "" });
                setShowAddEmailModal(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" /> Cargar Nuevo Correo
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#0778AC]" />
              <input
                type="text"
                placeholder="Buscar por nombre, cargo, correo o área..."
                value={emailSearchTerm}
                onChange={(e) => setEmailSearchTerm(e.target.value)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl pl-10 md:pl-14 pr-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-[#0778AC] text-white">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Funcionario</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Cargo</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Correo Electrónico</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Área</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {institutionEmails.filter(e => 
                  e.employeeName.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
                  e.position.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
                  e.email.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
                  e.area.toLowerCase().includes(emailSearchTerm.toLowerCase())
                ).length > 0 ? (
                  institutionEmails.filter(e => 
                    e.employeeName.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
                    e.position.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
                    e.email.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
                    e.area.toLowerCase().includes(emailSearchTerm.toLowerCase())
                  ).map((email) => (
                    <tr key={email.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-[#0778AC]">
                            <Users className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-gray-800">{email.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{email.position}</td>
                      <td className="px-6 py-4 text-sm text-[#0778AC] font-bold">{email.email}</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                          {email.area}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setSelectedEmail(email); setShowViewEmailModal(true); }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Consultar"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => { setSelectedEmail(email); setEmailFormData({ ...email }); setShowEditEmailModal(true); }}
                            className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium italic">
                      No se encontraron registros de correos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL: Cargar Nuevo Directorio ═══════════ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-[#0778AC] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl">Cargar Nuevo Directorio</h3>
                <p className="text-blue-100 text-xs mt-1">Ingrese la información de la nueva extensión telefónica</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo *</label>
                <div className="flex gap-3">
                  {(["asistencial", "administrativo"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setNewType(t)}
                      className={`flex-1 py-2 rounded-lg font-semibold text-sm border-2 transition-all capitalize ${
                        newType === t ? "border-[#CF3438] bg-red-50 text-[#CF3438]" : "border-gray-200 text-gray-500"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Área de Trabajo *</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required
                  className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#CF3438] transition-all" placeholder="Ej: Laboratorio Clínico" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Número de Extensión *</label>
                <input type="text" value={newExtension} onChange={e => setNewExtension(e.target.value)} required
                  className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#CF3438] transition-all" placeholder="Ej: 3301" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Piso(s) * <span className="text-gray-400 font-normal">(seleccione uno o más)</span></label>
                <div className="flex flex-wrap gap-2">
                  {EDITABLE_FLOORS.map(floor => (
                    <button key={floor} type="button" onClick={() => toggleFloor(floor)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                        newFloors.includes(floor) ? "bg-[#CF3438] text-white border-[#CF3438]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>
                      {floor}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-lg font-semibold text-sm">Cancelar</button>
                <button type="submit" disabled={newFloors.length === 0} className="flex-1 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] text-white py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL: Editar Directorio ═══════════ */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-[#0778AC] p-5 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-xl">{editingEntry ? "Editar Registro" : "Buscar Directorio para Editar"}</h3>
                <p className="text-blue-100 text-xs mt-1">Modifique la información de la extensión seleccionada</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditingEntry(null); }} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {!editingEntry ? (
                <>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={editSearch} onChange={e => setEditSearch(e.target.value)}
                      placeholder="Buscar por nombre de área o número de extensión..."
                      className="w-full border-2 border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#0778AC] transition-all" />
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {editFilteredExtensions.map(ext => (
                      <button key={ext.id} onClick={() => setEditingEntry({ ...ext })}
                        className="w-full text-left p-3 border-2 border-gray-200 hover:border-[#0778AC] rounded-lg transition-all flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{ext.name}</p>
                          <p className="text-xs text-gray-500">{ext.type === "asistencial" ? "Asistencial" : "Administrativo"} · {ext.floor?.join(", ") || ""}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
                          <Phone className="w-3.5 h-3.5" /> {ext.extension}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo *</label>
                    <div className="flex gap-3">
                      {(["asistencial", "administrativo"] as const).map(t => (
                        <button key={t} type="button" onClick={() => setEditingEntry({ ...editingEntry, type: t })}
                          className={`flex-1 py-2 rounded-lg font-semibold text-sm border-2 transition-all capitalize ${
                            editingEntry.type === t ? "border-[#0778AC] bg-blue-50 text-[#0778AC]" : "border-gray-200 text-gray-500"
                          }`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Área de Trabajo *</label>
                    <input type="text" value={editingEntry.name} onChange={e => setEditingEntry({ ...editingEntry, name: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Número de Extensión *</label>
                    <input type="text" value={editingEntry.extension} onChange={e => setEditingEntry({ ...editingEntry, extension: e.target.value })}
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Piso(s) *</label>
                    <div className="flex flex-wrap gap-2">
                      {EDITABLE_FLOORS.map(floor => (
                        <button key={floor} type="button" onClick={() => toggleFloor(floor, true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                            editingEntry.floor.includes(floor) ? "bg-[#0778AC] text-white border-[#0778AC]" : "border-gray-200 text-gray-600"
                          }`}>
                          {floor}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setEditingEntry(null)} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-lg font-semibold text-sm">← Volver</button>
                    <button onClick={handleSaveEdit} className="flex-1 bg-gradient-to-r from-[#0778AC] to-[#0996d3] text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> Guardar Cambios
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ═══════════ MODAL: Cargar Nuevo Correo ═══════════ */}
      {showAddEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl">Cargar Nuevo Correo</h3>
                <p className="text-blue-100 text-xs mt-1">Registre los datos del funcionario y su correo institucional</p>
              </div>
              <button onClick={() => setShowAddEmailModal(false)} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              addInstitutionEmail(emailFormData);
              setShowAddEmailModal(false);
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre del Funcionario *</label>
                  <input type="text" value={emailFormData.employeeName} onChange={e => setEmailFormData({...emailFormData, employeeName: e.target.value})} required
                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#CF3438] transition-all" placeholder="Ej: Juan Pérez" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Cargo *</label>
                  <input type="text" value={emailFormData.position} onChange={e => setEmailFormData({...emailFormData, position: e.target.value})} required
                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#CF3438] transition-all" placeholder="Ej: Coordinador de Sistemas" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Correo Electrónico *</label>
                  <input type="email" value={emailFormData.email} onChange={e => setEmailFormData({...emailFormData, email: e.target.value})} required
                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#CF3438] transition-all" placeholder="Ej: juan.perez@icvc.com.co" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Área *</label>
                    <input type="text" value={emailFormData.area} onChange={e => setEmailFormData({...emailFormData, area: e.target.value})} required
                      className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#CF3438] transition-all" placeholder="Ej: Sistemas" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Piso/Ubicación *</label>
                    <input type="text" value={emailFormData.floor} onChange={e => setEmailFormData({...emailFormData, floor: e.target.value})} required
                      className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#CF3438] transition-all" placeholder="Ej: Piso 3" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddEmailModal(false)} className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL: Editar Correo ═══════════ */}
      {showEditEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl">Editar Correo Institucional</h3>
                <p className="text-blue-100 text-xs mt-1">Actualice la información del correo institucional</p>
              </div>
              <button onClick={() => setShowEditEmailModal(false)} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (selectedEmail) {
                updateInstitutionEmail({ ...emailFormData, id: selectedEmail.id } as InstitutionEmail);
                setShowEditEmailModal(false);
              }
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre del Funcionario *</label>
                  <input type="text" value={emailFormData.employeeName} onChange={e => setEmailFormData({...emailFormData, employeeName: e.target.value})} required
                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Cargo *</label>
                  <input type="text" value={emailFormData.position} onChange={e => setEmailFormData({...emailFormData, position: e.target.value})} required
                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Correo Electrónico *</label>
                  <input type="email" value={emailFormData.email} onChange={e => setEmailFormData({...emailFormData, email: e.target.value})} required
                    className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Área *</label>
                    <input type="text" value={emailFormData.area} onChange={e => setEmailFormData({...emailFormData, area: e.target.value})} required
                      className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Piso/Ubicación *</label>
                    <input type="text" value={emailFormData.floor} onChange={e => setEmailFormData({...emailFormData, floor: e.target.value})} required
                      className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500 transition-all" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowEditEmailModal(false)} className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL: Consultar Correo ═══════════ */}
      {showViewEmailModal && selectedEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0778AC] p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl">{selectedEmail.employeeName}</h3>
                <p className="text-blue-100 text-sm font-medium">{selectedEmail.position}</p>
              </div>
              <button onClick={() => setShowViewEmailModal(false)} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#CF3438] group-hover:bg-[#CF3438] group-hover:text-white transition-all">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Correo Electrónico</p>
                    <p className="text-sm font-bold text-gray-800">{selectedEmail.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#0778AC] group-hover:bg-[#0778AC] group-hover:text-white transition-all">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Área / Departamento</p>
                    <p className="text-sm font-bold text-gray-800">{selectedEmail.area}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ubicación / Piso</p>
                    <p className="text-sm font-bold text-gray-800">{selectedEmail.floor}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowViewEmailModal(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-colors"
              >
                Cerrar Consulta
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
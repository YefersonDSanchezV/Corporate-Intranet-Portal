import { X, Phone, Mail, User, Plus, Wrench, Pencil } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSystem } from "../../contexts/SystemContext";


interface ITSupportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ITSupportContactsModal({ isOpen, onClose }: ITSupportContactsModalProps) {
  const { user } = useAuth();
  const { supportContacts, setSupportContacts } = useSystem() as any;
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [addType, setAddType] = useState<"email" | "extension">("email");

  // Formulario correo
  const [newName, setNewName] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newEmail, setNewEmail] = useState("");
  // Formulario extensión
  const [newExtName, setNewExtName] = useState("");
  const [newExtNumber, setNewExtNumber] = useState("");

  const canManage =
    user?.role === "ti" ||
    user?.role === "sistemas" ||
    user?.role === "coordinador_ti" ||
    user?.role === "ingeniero_sistemas" ||
    user?.role === "admin" ||
    user?.role === "root";

  if (!isOpen) return null;

  const emailContacts = (supportContacts || []).filter((c: any) => c.type === "email");
  const extensionContacts = (supportContacts || []).filter((c: any) => c.type === "extension");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (addType === "email") {
      if (!newName.trim() || !newPosition.trim() || !newEmail.trim()) return;
      setSupportContacts((prev: any[]) => [...prev, {
        id: Date.now().toString(),
        type: "email",
        name: newName,
        position: newPosition,
        email: newEmail
      }]);
      setNewName(""); setNewPosition(""); setNewEmail("");
    } else {
      if (!newExtName.trim() || !newExtNumber.trim()) return;
      setSupportContacts((prev: any[]) => [...prev, {
        id: Date.now().toString(),
        type: "extension",
        extName: newExtName,
        extNumber: newExtNumber
      }]);
      setNewExtName(""); setNewExtNumber("");
    }
    setShowAddForm(false);
  };

  const handleStartEdit = (contact: any) => {
    setEditingContact({ ...contact });
    setShowAddForm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    setSupportContacts((prev: any[]) => prev.map(c => c.id === editingContact.id ? editingContact : c));
    setEditingContact(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0778AC] to-[#0996d3] p-4 md:p-6 text-white flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Extensiones y Correos — Soporte Técnico</h2>
            <p className="text-white/80 text-xs mt-1">Contactos del área de Sistemas y Biomédica</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Botón Cargar */}
        {canManage && !showAddForm && (
          <div className="px-4 md:px-6 pt-4 flex-shrink-0">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Cargar
            </button>
          </div>
        )}

        {/* Formulario de carga */}
        {showAddForm && canManage && (
          <div className="mx-4 md:mx-6 mt-4 bg-gray-50 border-2 border-[#0778AC] rounded-lg p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#0778AC]">Nuevo Registro de Soporte</h3>
              <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo *</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAddType("email")}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm border-2 transition-all ${
                    addType === "email" ? "border-[#0778AC] bg-blue-50 text-[#0778AC]" : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  Correo
                </button>
                <button
                  type="button"
                  onClick={() => setAddType("extension")}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm border-2 transition-all ${
                    addType === "extension" ? "border-[#0778AC] bg-blue-50 text-[#0778AC]" : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  Extensión Telefónica
                </button>
              </div>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              {addType === "email" ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Funcionario *</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC] transition-all" placeholder="Ej: María Torres" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Cargo del Funcionario *</label>
                    <input type="text" value={newPosition} onChange={e => setNewPosition(e.target.value)} required
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC] transition-all" placeholder="Ej: Analista de Sistemas" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Correo del Funcionario *</label>
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC] transition-all" placeholder="Ej: mtorres@icvc.com.co" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la Extensión *</label>
                    <input type="text" value={newExtName} onChange={e => setNewExtName(e.target.value)} required
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC] transition-all" placeholder="Ej: Soporte Redes" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Número de la Extensión *</label>
                    <input type="text" value={newExtNumber} onChange={e => setNewExtNumber(e.target.value)} required
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#0778AC] transition-all" placeholder="Ej: 120" />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-lg font-semibold text-sm hover:border-gray-300 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white py-2.5 rounded-lg font-semibold text-sm transition-all">Guardar</button>
              </div>
            </form>
          </div>
        )}

        {/* Formulario de edición */}
        {editingContact && canManage && (
          <div className="mx-4 md:mx-6 mt-4 bg-gray-50 border-2 border-[#CF3438] rounded-lg p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#CF3438]">Editar Registro de Soporte</h3>
              <button onClick={() => setEditingContact(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              {editingContact.type === "email" ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Funcionario *</label>
                    <input type="text" value={editingContact.name || ""} onChange={e => setEditingContact({...editingContact, name: e.target.value})} required
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#CF3438] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Cargo del Funcionario *</label>
                    <input type="text" value={editingContact.position || ""} onChange={e => setEditingContact({...editingContact, position: e.target.value})} required
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#CF3438] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Correo del Funcionario *</label>
                    <input type="email" value={editingContact.email || ""} onChange={e => setEditingContact({...editingContact, email: e.target.value})} required
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#CF3438] transition-all" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la Extensión *</label>
                    <input type="text" value={editingContact.extName || ""} onChange={e => setEditingContact({...editingContact, extName: e.target.value})} required
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#CF3438] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Número de la Extensión *</label>
                    <input type="text" value={editingContact.extNumber || ""} onChange={e => setEditingContact({...editingContact, extNumber: e.target.value})} required
                      className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#CF3438] transition-all" />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditingContact(null)} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-lg font-semibold text-sm hover:border-gray-300 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white py-2.5 rounded-lg font-semibold text-sm transition-all">Guardar Cambios</button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de contactos */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Correos */}
          <h3 className="text-base font-semibold text-[#0778AC] mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5" /> Correos de Soporte
          </h3>
          <div className="grid grid-cols-1 gap-3 mb-6">
            {emailContacts.map((contact: any) => (
              <div key={contact.id} className="p-4 bg-white border-2 border-gray-200 hover:border-[#CF3438] rounded-lg transition-all">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-[#0778AC] to-[#0891d1] rounded-full p-3 shadow-md">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800 text-base mb-0.5">{contact.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{contact.position}</p>
                      </div>
                      {canManage && (
                        <button onClick={() => handleStartEdit(contact)} className="p-1.5 text-[#0778AC] hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-[#0778AC]" />
                      <span className="text-gray-700">{contact.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Extensiones */}
          <h3 className="text-base font-semibold text-[#CF3438] mb-3 flex items-center gap-2">
            <Phone className="w-5 h-5" /> Extensiones Telefónicas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {extensionContacts.map((contact: any) => (
              <div key={contact.id} className="p-4 bg-white border-2 border-gray-200 hover:border-[#CF3438] rounded-lg transition-all flex items-center gap-4">
                <div className="bg-gradient-to-br from-[#CF3438] to-[#e74c3c] rounded-full p-3 shadow-md">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">{contact.extName}</h4>
                      <p className="text-lg font-bold text-[#CF3438]">Ext. {contact.extNumber}</p>
                    </div>
                    {canManage && (
                      <button onClick={() => handleStartEdit(contact)} className="p-1.5 text-[#CF3438] hover:bg-red-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

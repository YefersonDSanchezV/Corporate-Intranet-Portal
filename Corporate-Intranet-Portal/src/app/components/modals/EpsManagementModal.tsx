import { X, Plus, ExternalLink, ToggleLeft, ToggleRight, Pencil, Check, Image } from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSystem } from "../../contexts/SystemContext";

export interface EpsLink {
  id: string;
  name: string;
  url: string;
  photo?: string;
  active: boolean;
  registeredBy: string;
  registeredAt: Date;
}

interface EpsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_EPS: EpsLink[] = [
  { id: "1", name: "Nueva EPS", url: "https://www.nuevaeps.com.co", active: true, registeredBy: "Sistema", registeredAt: new Date(2026, 0, 1) },
  { id: "2", name: "Sanitas EPS", url: "https://www.sanitas.com.co", active: true, registeredBy: "Sistema", registeredAt: new Date(2026, 0, 1) },
  { id: "3", name: "Salud Total EPS", url: "https://www.saludtotal.com.co", active: true, registeredBy: "Sistema", registeredAt: new Date(2026, 0, 1) },
  { id: "4", name: "Compensar EPS", url: "https://www.compensar.com", active: true, registeredBy: "Sistema", registeredAt: new Date(2026, 0, 1) },
  { id: "5", name: "Sura EPS", url: "https://www.eps.sura.com", active: false, registeredBy: "Sistema", registeredAt: new Date(2026, 0, 1) },
  { id: "6", name: "Famisanar EPS", url: "https://www.famisanar.com.co", active: true, registeredBy: "Sistema", registeredAt: new Date(2026, 0, 1) },
];

export function EpsManagementModal({ isOpen, onClose }: EpsManagementModalProps) {
  const { user } = useAuth();
  const { epsList, setEpsList } = useSystem() as any; // Using custom contextual type integration
  const [activeTab, setActiveTab] = useState<"list" | "register">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");

  // Formulario nuevo enlace
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPhoto, setNewPhoto] = useState<string | undefined>();
  const [successMsg, setSuccessMsg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManage =
    user?.role === "coordinador_consulta_externa" ||
    user?.role === "admin" ||
    user?.role === "root";

  if (!isOpen) return null;

  const handleToggleActive = (id: string) => {
    setEpsList((prev: any[]) =>
      prev.map((e) => (e.id === id ? { ...e, active: !e.active } : e))
    );
  };

  const handleStartEdit = (item: EpsLink) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditUrl(item.url);
  };

  const handleSaveEdit = (id: string) => {
    setEpsList((prev: any[]) =>
      prev.map((e) =>
        e.id === id ? { ...e, name: editName, url: editUrl } : e
      )
    );
    setEditingId(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    const newEps: EpsLink = {
      id: Date.now().toString(),
      name: newName,
      url: newUrl.startsWith("http") ? newUrl : `https://${newUrl}`,
      photo: newPhoto,
      active: true,
      registeredBy: user?.fullName || "Usuario",
      registeredAt: new Date(),
    };

    setEpsList((prev: any[]) => [newEps, ...prev]);
    setNewName("");
    setNewUrl("");
    setNewPhoto(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setActiveTab("list");
    }, 1800);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0778AC] to-[#0996d3] p-4 md:p-6 text-white flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Gestión de Plataformas EPS</h2>
            <p className="text-white/80 text-xs mt-1">
              Administración de enlaces de acceso a plataformas de Consulta Externa
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs — solo para gestores */}
        {canManage && (
          <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-6 py-3 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "list"
                  ? "border-[#0778AC] text-[#0778AC] bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Lista de Plataformas EPS
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`px-6 py-3 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "register"
                  ? "border-[#0778AC] text-[#0778AC] bg-white"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Plus className="w-4 h-4" />
              Registrar Enlace
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* TAB: Lista */}
          {activeTab === "list" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-3 text-gray-600 font-semibold">Plataforma</th>
                    <th className="text-left py-3 px-3 text-gray-600 font-semibold">Enlace de Acceso</th>
                    <th className="text-center py-3 px-3 text-gray-600 font-semibold">Estado</th>
                    {canManage && (
                      <th className="text-center py-3 px-3 text-gray-600 font-semibold">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(epsList || []).map((item: any) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        !item.active ? "opacity-50" : ""
                      }`}
                    >
                      {/* Nombre */}
                      <td className="py-3 px-3">
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="border-2 border-[#0778AC] rounded-lg px-2 py-1 text-sm w-full focus:outline-none"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            {item.photo ? (
                              <img src={item.photo} alt={item.name} className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-[#0778AC]/20 to-[#0778AC]/10 rounded flex items-center justify-center">
                                <Image className="w-4 h-4 text-[#0778AC]" />
                              </div>
                            )}
                            <span className="font-medium text-gray-800">{item.name}</span>
                          </div>
                        )}
                      </td>

                      {/* URL */}
                      <td className="py-3 px-3">
                        {editingId === item.id ? (
                          <input
                            type="url"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            className="border-2 border-[#0778AC] rounded-lg px-2 py-1 text-sm w-full focus:outline-none"
                          />
                        ) : (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0778AC] hover:underline flex items-center gap-1 text-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {item.url}
                          </a>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                            item.active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {item.active ? "Activa" : "Inactiva"}
                        </span>
                      </td>

                      {/* Acciones */}
                      {canManage && (
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-2">
                            {editingId === item.id ? (
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                                title="Guardar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleActive(item.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                item.active
                                  ? "bg-red-100 hover:bg-red-200 text-red-600"
                                  : "bg-green-100 hover:bg-green-200 text-green-600"
                              }`}
                              title={item.active ? "Desactivar" : "Activar"}
                            >
                              {item.active ? (
                                <ToggleRight className="w-4 h-4" />
                              ) : (
                                <ToggleLeft className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: Registrar Nuevo Enlace */}
          {activeTab === "register" && canManage && (
            <div className="max-w-lg mx-auto">
              {successMsg ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-800">¡Enlace EPS registrado exitosamente!</p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre de la Plataforma *
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      placeholder="Ej: Coosalud EPS"
                      className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#0778AC] focus:ring-2 focus:ring-[#0778AC]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Enlace de Acceso *
                    </label>
                    <input
                      type="text"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      required
                      placeholder="Ej: https://www.coosalud.com.co"
                      className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#0778AC] focus:ring-2 focus:ring-[#0778AC]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Foto de Referencia{" "}
                      <span className="text-gray-400 font-normal">(Opcional)</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                        newPhoto
                          ? "border-green-400 bg-green-50"
                          : "border-gray-300 hover:border-[#0778AC] hover:bg-blue-50/20"
                      }`}
                    >
                      {newPhoto ? (
                        <div className="flex flex-col items-center gap-2">
                          <img
                            src={newPhoto}
                            alt="Preview"
                            className="w-20 h-20 object-contain rounded-lg"
                          />
                          <p className="text-xs text-green-600 font-medium">Imagen cargada</p>
                        </div>
                      ) : (
                        <div>
                          <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Clic para cargar imagen de referencia</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG o SVG</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!newName.trim() || !newUrl.trim()}
                    className="w-full bg-gradient-to-r from-[#0778AC] to-[#0996d3] hover:from-[#065a87] hover:to-[#0778AC] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                    Registrar Enlace EPS
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

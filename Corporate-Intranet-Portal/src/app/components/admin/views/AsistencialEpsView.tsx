import { Plus, ExternalLink, ToggleLeft, ToggleRight, Pencil, Check, Image, Link } from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useSystem } from "../../../contexts/SystemContext";

export function AsistencialEpsView() {
  const { user } = useAuth();
  const { epsList, setEpsList } = useSystem() as any;
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");

  // Formulario nuevo enlace
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPhoto, setNewPhoto] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleActive = (id: string) => {
    setEpsList((prev: any[]) =>
      prev.map((e) => (e.id === id ? { ...e, active: !e.active } : e))
    );
  };

  const handleStartEdit = (item: any) => {
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

    const newEps = {
      id: Date.now().toString(),
      name: newName,
      url: newUrl.startsWith("http") ? newUrl : `https://${newUrl}`,
      photo: newPhoto,
      active: true,
      registeredBy: user?.fullName || "Admin",
      registeredAt: new Date(),
    };

    setEpsList((prev: any[]) => [newEps, ...prev]);
    setNewName("");
    setNewUrl("");
    setNewPhoto(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowUploadForm(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e] mb-2">Plataformas EPS</h1>
          <p className="text-gray-600 text-sm">
            Gestión de enlaces de acceso a plataformas de Consulta Externa para las EPS.
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#0778AC] to-[#0996d3] hover:from-[#065a87] hover:to-[#0778AC] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all"
        >
          {showUploadForm ? <Link className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showUploadForm ? "Ver Listado" : "Registrar Enlace EPS"}
        </button>
      </div>

      {showUploadForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-[#0778AC] mb-6 border-b-2 border-[#0778AC]/20 pb-2">
            Registrar Nuevo Enlace EPS
          </h2>
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
                Foto de Referencia <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                  newPhoto
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 hover:border-[#0778AC] hover:bg-blue-50/20"
                }`}
              >
                {newPhoto ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={newPhoto} alt="Preview" className="w-20 h-20 object-contain rounded-lg" />
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
              className="w-full bg-[#0778AC] hover:bg-[#065a87] text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Registrar Enlace EPS
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-100">
                  <th className="p-4 text-sm font-semibold text-gray-600">Plataforma</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Enlace de Acceso</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Estado</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(epsList || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                      No hay plataformas EPS registradas
                    </td>
                  </tr>
                ) : (
                  (epsList || []).map((item: any) => (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!item.active ? "opacity-60" : ""}`}>
                      <td className="p-4">
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="border-2 border-[#0778AC] rounded-lg px-2 py-1 text-sm w-full focus:outline-none"
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            {item.photo ? (
                              <img src={item.photo} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                            ) : (
                              <div className="w-10 h-10 bg-[#0778AC]/10 rounded-lg flex items-center justify-center">
                                <Image className="w-5 h-5 text-[#0778AC]" />
                              </div>
                            )}
                            <span className="font-semibold text-gray-800">{item.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
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
                            className="text-[#0778AC] hover:underline flex items-center gap-1 text-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {item.url}
                          </a>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                          item.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {item.active ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {editingId === item.id ? (
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                              title="Guardar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleActive(item.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.active
                                ? "bg-red-50 hover:bg-red-100 text-red-600"
                                : "bg-green-50 hover:bg-green-100 text-green-600"
                            }`}
                            title={item.active ? "Desactivar" : "Activar"}
                          >
                            {item.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

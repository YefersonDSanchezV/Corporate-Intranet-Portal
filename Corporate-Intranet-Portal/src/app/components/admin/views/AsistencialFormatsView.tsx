import { FileText, Plus, Trash2, Upload, Eye, EyeOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";

interface ContingencyFormat {
  id: string;
  name: string;
  details: string;
  fileName: string;
  visibleOnHome: boolean;
  uploadedBy: string;
  uploadedAt: Date;
}

export function AsistencialFormatsView() {
  const { user } = useAuth();
  const [formats, setFormats] = useState<ContingencyFormat[]>(() => {
    const saved = localStorage.getItem('intranet_contingencyFormats');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((item: any) => ({
        ...item,
        uploadedAt: new Date(item.uploadedAt)
      }));
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('intranet_contingencyFormats', JSON.stringify(formats));
  }, [formats]);

  // Formulario nuevo formato
  const [newName, setNewName] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleVisibility = (id: string) => {
    setFormats((prev) =>
      prev.map((f) => (f.id === id ? { ...f, visibleOnHome: !f.visibleOnHome } : f))
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Está seguro que desea eliminar este formato?")) {
      setFormats((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFileName(file.name);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newFileName) return;

    const newFormat: ContingencyFormat = {
      id: Date.now().toString(),
      name: newName,
      details: newDetails,
      fileName: newFileName,
      visibleOnHome: true,
      uploadedBy: user?.fullName || "Admin",
      uploadedAt: new Date(),
    };

    setFormats((prev) => [newFormat, ...prev]);
    setNewName("");
    setNewDetails("");
    setNewFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowUploadForm(false);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e] mb-2">Formatos de Contingencia</h1>
          <p className="text-gray-600 text-sm">
            Gestión de documentos disponibles para uso manual durante contingencias del sistema DGH.
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all"
        >
          {showUploadForm ? <FileText className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showUploadForm ? "Ver Listado" : "Cargar Formato"}
        </button>
      </div>

      {showUploadForm ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-[#0778AC] mb-6 border-b-2 border-[#0778AC]/20 pb-2">
            Cargar Nuevo Formato
          </h2>
          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Formato *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                placeholder="Ej: Formato de Referencia y Contrarreferencia"
                className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Detalles del Formato
              </label>
              <textarea
                value={newDetails}
                onChange={(e) => setNewDetails(e.target.value)}
                placeholder="Describa para qué se utiliza este formato..."
                rows={3}
                className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#CF3438] focus:ring-2 focus:ring-[#CF3438]/20 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Archivo del Formato (.docx) *
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                  newFileName
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 hover:border-[#CF3438] hover:bg-red-50/20"
                }`}
              >
                <Upload className={`w-8 h-8 mx-auto mb-2 ${newFileName ? "text-green-500" : "text-gray-400"}`} />
                {newFileName ? (
                  <div>
                    <p className="text-sm font-semibold text-green-700">{newFileName}</p>
                    <p className="text-xs text-green-500 mt-1">Archivo listo para cargar</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600">Haga clic para seleccionar el archivo</p>
                    <p className="text-xs text-gray-400 mt-1">Solo archivos .docx</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <button
              type="submit"
              disabled={!newName.trim() || !newFileName}
              className="w-full bg-[#0778AC] hover:bg-[#065a87] text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Guardar Formato
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-100">
                  <th className="p-4 text-sm font-semibold text-gray-600">Formato</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Archivo</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Subido por</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Estado</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {formats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      No hay formatos registrados
                    </td>
                  </tr>
                ) : (
                  formats.map((format) => (
                    <tr key={format.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-gray-800 text-sm">{format.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">{format.details}</p>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                          <FileText className="w-3 h-3" />
                          {format.fileName}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-800">{format.uploadedBy}</p>
                        <p className="text-xs text-gray-400">{formatDate(format.uploadedAt)}</p>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          format.visibleOnHome ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {format.visibleOnHome ? "Visible" : "Oculto"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleVisibility(format.id)}
                            title={format.visibleOnHome ? "Ocultar" : "Mostrar"}
                            className={`p-1.5 rounded-lg transition-colors ${
                              format.visibleOnHome ? "bg-blue-50 text-blue-600 hover:bg-blue-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {format.visibleOnHome ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(format.id)}
                            title="Eliminar"
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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

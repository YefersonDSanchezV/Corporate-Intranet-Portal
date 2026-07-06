import { X, FileText, FileDown, ExternalLink } from "lucide-react";
import { useSystem } from "../../contexts/SystemContext";

interface ContingencyFormatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContingencyFormatsModal({ isOpen, onClose }: ContingencyFormatsModalProps) {
  const { contingencyFormats } = useSystem();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#CF3438] to-[#e74c3c] p-4 md:p-6 text-white flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Formatos de Contingencia</h2>
            <p className="text-white/80 text-xs mt-1">
              Documentos disponibles para uso manual durante contingencias del sistema DGH
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="space-y-3">
              {contingencyFormats.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No hay formatos registrados</p>
                </div>
              ) : (
                contingencyFormats.map((format) => (
                  <div
                    key={format.id}
                    className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-[#CF3438] transition-all group"
                  >
                    {/* Icono */}
                    <div className="bg-gradient-to-br from-[#0778AC] to-[#0891d1] rounded-lg p-3 shadow-md flex-shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                        {format.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format.description || format.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        <strong>Código:</strong> {format.code}
                      </p>

                      {/* Acciones */}
                      {format.url && (
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <a
                            href={format.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-[#CF3438] hover:bg-[#b82d31] text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Abrir Formato
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
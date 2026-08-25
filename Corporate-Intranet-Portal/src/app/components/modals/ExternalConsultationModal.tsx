import { X, ExternalLink } from "lucide-react";
import { useSystem } from "../../contexts/SystemContext";

interface ExternalConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExternalConsultationModal({ isOpen, onClose }: ExternalConsultationModalProps) {
  const { epsList } = useSystem() as any;

  const activeEps = (epsList || []).filter((e: any) => e.active);

  const handleEPSClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0778AC] to-[#0996d3] p-4 md:p-6 text-white flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Consulta Externa — Plataformas EPS</h2>
              <p className="text-white/80 text-xs mt-1">
                Acceso directo a plataformas de las EPS disponibles
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lista de EPS activas */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {activeEps.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p>No hay plataformas EPS activas disponibles.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeEps.map((eps: any) => (
                  <button
                    key={eps.id}
                    onClick={() => handleEPSClick(eps.url)}
                    className="p-6 bg-white border-2 border-gray-200 hover:border-[#CF3438] rounded-lg transition-all hover:shadow-lg group flex flex-col items-center gap-3"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-[#0778AC]/10 to-[#0778AC]/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      {eps.photo ? (
                        <img
                          src={eps.photo}
                          alt={eps.name}
                          className="w-16 h-16 object-contain rounded-lg"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-[#0778AC]/40 select-none">
                          {eps.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-800 mb-1">{eps.name}</p>
                      <div className="flex items-center justify-center gap-1 text-[#0778AC] text-sm group-hover:underline">
                        <ExternalLink className="w-4 h-4" />
                        <span>Ir a plataforma</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

import { BarChart2, ExternalLink, Globe } from "lucide-react";
import { useMemo } from "react";
import { useSystem } from "../../contexts/SystemContext";

export function InnovacionAnaliticaModule() {
  const { sites } = useSystem();

  // Solo los sitios asociados al módulo "InnovacionAnalitica"
  const iaLinks = useMemo(
    () => sites.filter((s) => s.moduleId === "InnovacionAnalitica" && s.active),
    [sites]
  );

  const handleLinkClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {/* Enlaces disponibles */}
      <section>
        <h2 className="text-lg md:text-xl font-semibold text-[#0778AC] mb-4 pb-2 border-b-2 border-[#CF3438]/30">
          Plataformas y Recursos Disponibles
        </h2>

        {iaLinks.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
            <div className="w-20 h-20 bg-[#0778AC]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="w-10 h-10 text-[#0778AC]/40" />
            </div>
            <h3 className="text-gray-500 font-semibold text-lg mb-2">
              No hay recursos configurados
            </h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Los enlaces de redireccionamiento para este módulo se configuran
              desde el Panel Administrativo → Innovación Analítica.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {iaLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.url)}
                className="bg-white border-2 border-gray-200 hover:border-[#0778AC] rounded-xl p-6 text-left transition-all hover:shadow-lg group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0778AC] to-[#0778AC]/70 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-[#0778AC] transition-colors">
                      {link.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-[#0778AC]">
                      <ExternalLink className="w-3 h-3" />
                      <span>Abrir plataforma</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { Stethoscope, Globe } from "lucide-react";
import { AppCard } from "../AppCard";
import { useState, useMemo } from "react";
import { ExternalConsultationModal } from "../modals/ExternalConsultationModal";
import { useSystem } from "../../contexts/SystemContext";

export function ClinicalAreaModule() {
  const { sites } = useSystem();
  const [externalConsultationModalOpen, setExternalConsultationModalOpen] = useState(false);

  const handleAppClick = (appName: string, url?: string) => {
    if (appName === "Consulta Externa") {
      setExternalConsultationModalOpen(true);
    } else if (url) {
      window.open(url, "_blank");
    }
  };

  // Solo Consulta Externa como base + sitios dinámicos Area Asistencial (visualización en panel público corregida)
  const clinicalApps = useMemo(() => {
    const baseApps = [{ title: "Consulta Externa", icon: Stethoscope, name: "Consulta Externa" }];
    const customSites = sites
      .filter(s => (s.moduleId === "Area Asistencial" || s.moduleId === "Clinical") && s.active)
      .map(s => ({ title: s.title, icon: Globe, name: s.title, url: s.url }));
    return [...baseApps, ...customSites];
  }, [sites]);

  return (
    <>
      <div className="space-y-6">
        <section>
          <h2 className="text-lg md:text-xl font-semibold text-[#0778AC] mb-4 pb-2 border-b-2 border-[#CF3438]/30">
            Aplicaciones Disponibles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {clinicalApps.map((app, index) => (
              <AppCard 
                key={index} 
                title={app.title} 
                icon={app.icon} 
                size="large"
                onClick={() => handleAppClick(app.name, (app as any).url)}
              />
            ))}
          </div>
        </section>
      </div>

      <ExternalConsultationModal
        isOpen={externalConsultationModalOpen}
        onClose={() => setExternalConsultationModalOpen(false)}
      />
    </>
  );
}
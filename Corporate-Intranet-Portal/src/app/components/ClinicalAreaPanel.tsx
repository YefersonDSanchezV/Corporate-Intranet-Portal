import { 
  Stethoscope
} from "lucide-react";
import { AppCard } from "./AppCard";
import { useState } from "react";
import { ExternalConsultationModal } from "./modals/ExternalConsultationModal";

export function ClinicalAreaPanel() {
  const [externalConsultationModalOpen, setExternalConsultationModalOpen] = useState(false);

  const handleAppClick = (appName: string) => {
    if (appName === "Consulta Externa") {
      setExternalConsultationModalOpen(true);
    }
  };

  const clinicalApps = [
    { title: "Consulta Externa", icon: Stethoscope, name: "Consulta Externa" }
  ];

  return (
    <>
      <section className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold text-[#0778AC] mb-4 pb-2 border-b-2 border-[#CF3438]/30">
          Área Asistencial
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {clinicalApps.map((app, index) => (
            <AppCard 
              key={index} 
              title={app.title} 
              icon={app.icon}
              onClick={() => handleAppClick(app.name)}
            />
          ))}
        </div>
      </section>

      <ExternalConsultationModal
        isOpen={externalConsultationModalOpen}
        onClose={() => setExternalConsultationModalOpen(false)}
      />
    </>
  );
}
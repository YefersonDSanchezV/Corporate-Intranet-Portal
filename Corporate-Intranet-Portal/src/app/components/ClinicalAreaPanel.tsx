import { 
  FileText, 
  FlaskConical, 
  Image, 
  BookOpen 
} from "lucide-react";
import { AppCard } from "./AppCard";
import { useState } from "react";
import { RedirectModal } from "./modals/RedirectModal";
import { ContingencyFormatsModal } from "./modals/ContingencyFormatsModal";

export function ClinicalAreaPanel() {
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [redirectPortal, setRedirectPortal] = useState("");
  const [contingencyModalOpen, setContingencyModalOpen] = useState(false);

  const handleAppClick = (appName: string) => {
    if (appName === "Contingencia") {
      setContingencyModalOpen(true);
    } else {
      setRedirectPortal(appName);
      setRedirectModalOpen(true);
    }
  };

  const clinicalApps = [
    { title: "DGH - Dinamica Gestion Hospitalaria", icon: FileText, name: "DGH - Dinámica Gestión Hospitalaria" },
    { title: "Enterprise - Software de Laboratorio", icon: FlaskConical, name: "Enterprise - Software de Laboratorio" },
    { title: "ActualPac - Software de Imagenologia", icon: Image, name: "ActualPac - Software de Imagenología" },
    { title: "Formatos de Contingencia", icon: BookOpen, name: "Contingencia" }
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

      <RedirectModal
        isOpen={redirectModalOpen}
        onClose={() => setRedirectModalOpen(false)}
        portalName={redirectPortal}
      />

      <ContingencyFormatsModal
        isOpen={contingencyModalOpen}
        onClose={() => setContingencyModalOpen(false)}
      />
    </>
  );
}
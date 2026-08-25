import { FileText, FlaskConical, Image, BookOpen, Stethoscope, Globe } from "lucide-react";
import { AppCard } from "../AppCard";
import { useState, useMemo } from "react";
import { RedirectModal } from "../modals/RedirectModal";
import { ContingencyFormatsModal } from "../modals/ContingencyFormatsModal";
import { ExternalConsultationModal } from "../modals/ExternalConsultationModal";
import { useAuth } from "../../contexts/AuthContext";
import { useSystem } from "../../contexts/SystemContext";
import { getGreeting } from "../../utils/greetings";

export function ClinicalAreaModule() {
  const { user } = useAuth();
  const { sites } = useSystem();
  const greeting = getGreeting();
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [redirectPortal, setRedirectPortal] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [contingencyModalOpen, setContingencyModalOpen] = useState(false);
  const [externalConsultationModalOpen, setExternalConsultationModalOpen] = useState(false);

  const handleAppClick = (appName: string, url?: string) => {
    if (appName === "Contingencia") {
      setContingencyModalOpen(true);
    } else if (appName === "Consulta Externa") {
      setExternalConsultationModalOpen(true);
    } else {
      setRedirectPortal(appName);
      setRedirectUrl(url || "");
      setRedirectModalOpen(true);
    }
  };

  const clinicalApps = useMemo(() => {
    const baseApps = [
      { title: "DGH - Dinamica Gestion Hospitalaria", icon: FileText, name: "DGH - Dinámica Gestión Hospitalaria", roles: ["all"] },
      { title: "Enterprise - Software de Laboratorio", icon: FlaskConical, name: "Enterprise - Software de Laboratorio", roles: ["all"] },
      { title: "ActualPac - Software de Imagenologia", icon: Image, name: "ActualPac - Software de Imagenología", roles: ["all"] },
      { title: "Formatos de Contingencia", icon: BookOpen, name: "Contingencia", roles: ["admin", "root", "ti", "coordinador_ti", "asistencial", "coordinador_asistencial"] },
      { title: "Consulta Externa", icon: Stethoscope, name: "Consulta Externa", roles: ["all"] }
    ].filter(app => app.roles.includes("all") || app.roles.includes(user?.role || ""));

    const customSites = sites
      .filter(s => s.moduleId === "Clinical" && s.active)
      .map(s => ({
        title: s.title,
        icon: Globe,
        name: s.title,
        url: s.url,
        isCustom: true
      }));

    return [...baseApps, ...customSites];
  }, [user, sites]);

  return (
    <>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0778AC] mb-2">Área Asistencial</h1>
          <div className="h-1 bg-gradient-to-r from-[#CF3438] to-transparent w-32 md:w-48 rounded-full"></div>
        </div>

        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#CF3438]">
          <p className="text-gray-700 font-bold text-sm md:text-base mb-1">
            ¡{greeting}, {user?.fullName.split(' ')[0]}!
          </p>
          <p className="text-gray-600 text-sm md:text-base">
            En este módulo encontrarás herramientas para la gestión asistencial, historia clínica y software de apoyo médico.
          </p>
        </div>

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

      <RedirectModal
        isOpen={redirectModalOpen}
        onClose={() => setRedirectModalOpen(false)}
        portalName={redirectPortal}
        portalUrl={redirectUrl}
      />

      <ContingencyFormatsModal
        isOpen={contingencyModalOpen}
        onClose={() => setContingencyModalOpen(false)}
      />

      <ExternalConsultationModal
        isOpen={externalConsultationModalOpen}
        onClose={() => setExternalConsultationModalOpen(false)}
      />
    </>
  );
}
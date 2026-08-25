import {
  FileText,
  Globe,
  User,
  ShieldCheck,
  Phone,
  Calendar,
  Users
} from "lucide-react";
import { AppCard } from "./AppCard";
import { useState } from "react";
import { RedirectModal } from "./modals/RedirectModal";
import { useSystem } from "../contexts/SystemContext";

const ICON_MAP: Record<string, any> = {
  FileText,
  Globe,
  User,
  ShieldCheck,
  Phone,
  Calendar
};

const MODULE_MAP: Record<string, string> = {
  Inicio: "Inicio",
  Clinical: "Area Asistencial",
  Administrative: "Area Administrativa",
  Institutional: "Gestion Institucional",
  Soporte: "Soporte",
  Directorio: "Directorio",
  InnovacionAnalitica: "Innovacion Analitica",
};

export function QuickAccessSection() {
  const { sites } = useSystem();
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [redirectPortal, setRedirectPortal] = useState("");

  const handleAppClick = (appName: string, moduleId?: string, url?: string) => {
    if (appName === "Extensiones") {
      window.dispatchEvent(new CustomEvent("switchModule", { detail: "Directorio" }));
    } else if (moduleId && moduleId !== "Inicio" && MODULE_MAP[moduleId]) {
      window.dispatchEvent(new CustomEvent("switchModule", { detail: MODULE_MAP[moduleId] }));
    } else if (!url && MODULE_MAP[appName]) {
      window.dispatchEvent(new CustomEvent("switchModule", { detail: MODULE_MAP[appName] }));
    } else {
      setRedirectPortal(appName);
      setRedirectModalOpen(true);
    }
  };

  // Filtrar accesos rápidos de la base de datos (SystemContext)
  const dynamicSites = sites
    .filter(s => s.moduleId === "Inicio" && s.active)
    .map(s => ({
      title: s.title,
      icon: ICON_MAP[s.ref] || FileText,
      name: s.title,
      moduleId: s.moduleId,
      url: s.url
    }));

  // Siempre incluimos Extensiones ya que es una función interna compleja
  const allQuickAccess = [
    ...dynamicSites,
    { title: "Extensiones Telefónicas - Directorio Institucional", icon: Users, name: "Extensiones" }
  ];

  // En el futuro, podríamos agregar filtrado por roles aquí si RedirectSite tuviera ese campo
  const quickAccess = allQuickAccess;

  return (
    <>
      <section className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold text-[#0778AC] mb-4 pb-2 border-b-2 border-[#CF3438]/30">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {quickAccess.map((app, index) => (
            <AppCard 
              key={index} 
              title={app.title} 
              icon={app.icon} 
              size="large"
              onClick={() => handleAppClick(app.name, (app as any).moduleId, (app as any).url)}
            />
          ))}
        </div>
      </section>

      <RedirectModal
        isOpen={redirectModalOpen}
        onClose={() => setRedirectModalOpen(false)}
        portalName={redirectPortal}
      />
    </>
  );
}

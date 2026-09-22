import { 
  Headphones, 
  Wrench, 
  Stethoscope 
} from "lucide-react";
import { AppCard } from "./AppCard";
import { useState } from "react";
import { ITSupportContactsModal } from "./modals/ITSupportContactsModal";
import { useSystem } from "../contexts/SystemContext";

const ICON_MAP: Record<string, any> = {
  Headphones,
  Wrench,
  Stethoscope
};

export function SupportPanel() {
  const { sites } = useSystem();
  const [contactsModalOpen, setContactsModalOpen] = useState(false);

  const handleAppClick = (appName: string, url?: string) => {
    if (appName === "Contactos") {
      setContactsModalOpen(true);
    } else if (url) {
      window.open(url, "_blank");
    }
  };

  const dynamicSupportSites = sites
    .filter(s => s.moduleId === "Soporte" && s.active)
    .map(s => ({
       title: s.title,
       icon: ICON_MAP[s.ref] || Headphones,
       name: s.title,
       url: s.url
    }));

  const supportApps = [
    ...dynamicSupportSites,
    { title: "Extensiones y Correos - Soporte Técnico", icon: Wrench, name: "Contactos" }
  ];

  return (
    <>
      <section className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold text-[#0778AC] mb-4 pb-2 border-b-2 border-[#CF3438]/30">
          Soporte
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {supportApps.map((app, index) => (
            <AppCard 
              key={index} 
              title={app.title} 
              icon={app.icon}
              onClick={() => handleAppClick(app.name, (app as any).url)}
            />
          ))}
        </div>
      </section>

      <ITSupportContactsModal
        isOpen={contactsModalOpen}
        onClose={() => setContactsModalOpen(false)}
      />
    </>
  );
}
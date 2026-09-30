import { Wrench } from "lucide-react";
import { AppCard } from "../AppCard";
import { useState, useMemo } from "react";
import { ITSupportContactsModal } from "../modals/ITSupportContactsModal";
import { useSystem } from "../../contexts/SystemContext";

export function SupportModule() {
  const { sites } = useSystem();
  const [contactsModalOpen, setContactsModalOpen] = useState(false);

  const handleAppClick = (appName: string, url?: string) => {
    if (appName === "Contactos") {
      setContactsModalOpen(true);
    } else if (url) {
      window.open(url, "_blank");
    }
  };

  const supportApps = useMemo(() => {
    const baseApps = [
      { title: "Correo y Extensiones - Soporte Técnico", icon: Wrench, name: "Contactos" },
    ];

    const customSites = sites
      .filter(s => (s.moduleId === "Soporte" || s.moduleId === "Support") && s.active)
      .map(s => ({
        title: s.title,
        icon: Wrench,
        name: s.title,
        url: s.url
      }));

    return [...customSites, ...baseApps];
  }, [sites]);

  return (
    <>
      <div className="space-y-6">
        <section>
          <h2 className="text-lg md:text-xl font-semibold text-[#0778AC] mb-4 pb-2 border-b-2 border-[#CF3438]/30">
            Servicios de Soporte
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
            {supportApps.map((app, index) => (
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

      <ITSupportContactsModal
        isOpen={contactsModalOpen}
        onClose={() => setContactsModalOpen(false)}
      />
    </>
  );
}
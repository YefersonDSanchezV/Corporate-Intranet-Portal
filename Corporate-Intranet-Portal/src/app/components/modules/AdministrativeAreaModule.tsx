import { Calendar,  Globe } from "lucide-react";
import { AppCard } from "../AppCard";
import { useState, useMemo } from "react";
import { RedirectModal } from "../modals/RedirectModal";
import { useAuth } from "../../contexts/AuthContext";
import { useSystem } from "../../contexts/SystemContext";
import { getGreeting } from "../../utils/greetings";

export function AdministrativeAreaModule() {
  const { user } = useAuth();
  const { sites } = useSystem();
  const greeting = getGreeting();
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [redirectPortal, setRedirectPortal] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");

  const handleAppClick = (appName: string, url?: string) => {
    setRedirectPortal(appName);
    setRedirectUrl(url || "");
    setRedirectModalOpen(true);
  };

  const adminApps = useMemo(() => {
    const baseApps = [
      { 
        title: "Biometric - Agenda del Personal", 
        icon: Calendar, 
        name: "Biometric - Agenda del Personal",
        restricted: false 
      },
    ];

    const customSites = sites
      .filter(s => s.moduleId === "Administrative" && s.active)
      .map(s => ({
        title: s.title,
        icon: Globe,
        name: s.title,
        url: s.url,
        restricted: false
      }));

    return [...baseApps, ...customSites];
  }, [sites]);

  return (
    <>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0778AC] mb-2">Área Administrativa</h1>
          <div className="h-1 bg-gradient-to-r from-[#CF3438] to-transparent w-32 md:w-48 rounded-full"></div>
        </div>

        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#0778AC]">
          <p className="text-gray-700 font-bold text-sm md:text-base mb-1">
            ¡{greeting}, {user?.fullName.split(' ')[0]}!
          </p>
          <p className="text-gray-600 text-sm md:text-base">
            En este módulo encontrarás herramientas para la gestión de procesos administrativos, contratos y tareas internas.
          </p>
        </div>

        <section>
          <h2 className="text-lg md:text-xl font-semibold text-[#0778AC] mb-4 pb-2 border-b-2 border-[#CF3438]/30">
            Aplicaciones Disponibles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {adminApps.map((app, index) => (
              <div key={index} className="relative">
                <AppCard
                  title={app.title}
                  icon={app.icon}
                  size="large"
                  onClick={() => handleAppClick(app.name, (app as any).url)}
                />
                {app.restricted && (
                  <div className="absolute inset-0 rounded-lg bg-gray-100/70 flex items-center justify-center cursor-not-allowed">
                    <span className="text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded-full shadow">Sin acceso</span>
                  </div>
                )}
              </div>
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
    </>
  );
}
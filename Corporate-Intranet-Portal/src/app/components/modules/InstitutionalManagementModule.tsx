import { Award, Globe } from "lucide-react";
import { AppCard } from "../AppCard";
import { useState, useMemo } from "react";
import { AccreditationAchievementsModal } from "../modals/AccreditationAchievementsModal";
import { useSystem } from "../../contexts/SystemContext";

export function InstitutionalManagementModule() {
  const { sites } = useSystem();
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);

  const handleAppClick = (appName: string, url?: string) => {
    if (appName === "Logros") {
      setAchievementsModalOpen(true);
    } else if (url) {
      window.open(url, "_blank");
    }
  };

  const managementApps = useMemo(() => {
    const baseApps = [
      { title: "Logros obtenidos", icon: Award, name: "Logros" }
    ];

    const customSites = sites
      .filter(s => (s.moduleId === "Gestion Institucional" || s.moduleId === "Institutional") && s.active)
      .map(s => ({
        title: s.title,
        icon: Globe,
        name: s.title,
        url: s.url
      }));

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
            {managementApps.map((app, index) => (
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

      <AccreditationAchievementsModal
        isOpen={achievementsModalOpen}
        onClose={() => setAchievementsModalOpen(false)}
      />
    </>
  );
}
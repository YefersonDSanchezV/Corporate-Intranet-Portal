import { Award } from "lucide-react";
import { AppCard } from "./AppCard";
import { useState } from "react";
import { AccreditationAchievementsModal } from "./modals/AccreditationAchievementsModal";

export function InstitutionalManagementPanel() {
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);

  const handleAppClick = (appName: string) => {
    if (appName === "Logros") {
      setAchievementsModalOpen(true);
    }
  };

  const managementApps = [
    { title: "Logros obtenidos", icon: Award, name: "Logros" }
  ];

  return (
    <>
      <section className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold text-[#0778AC] mb-4 pb-2 border-b-2 border-[#CF3438]/30">
          Gestión Institucional
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {managementApps.map((app, index) => (
            <AppCard 
              key={index} 
              title={app.title} 
              icon={app.icon}
              onClick={() => handleAppClick(app.name)}
            />
          ))}
        </div>
      </section>

      <AccreditationAchievementsModal
        isOpen={achievementsModalOpen}
        onClose={() => setAchievementsModalOpen(false)}
      />
    </>
  );
}
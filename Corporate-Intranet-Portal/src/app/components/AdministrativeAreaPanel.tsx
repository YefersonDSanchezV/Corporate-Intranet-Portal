import {
  Calendar
} from "lucide-react";
import { AppCard } from "./AppCard";
import { useState } from "react";
import { RedirectModal } from "./modals/RedirectModal";

export function AdministrativeAreaPanel() {
  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [redirectPortal, setRedirectPortal] = useState("");

  const handleAppClick = (appName: string) => {
    setRedirectPortal(appName);
    setRedirectModalOpen(true);
  };

  const adminApps = [
    { title: "Biometric - Agenda del Personal", icon: Calendar, name: "Biometric - Agenda del Personal" }
  ];

  return (
    <>
      <section className="mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl font-semibold text-[#0778AC] mb-4 pb-2 border-b-2 border-[#CF3438]/30">
          Área Administrativa
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {adminApps.map((app, index) => (
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
    </>
  );
}
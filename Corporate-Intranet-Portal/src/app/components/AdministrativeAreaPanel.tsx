import {
  Globe
} from "lucide-react";
import { AppCard } from "./AppCard";
import { useSystem } from "../contexts/SystemContext";

export function AdministrativeAreaPanel() {
  const { sites } = useSystem();

  const handleAppClick = (appName: string, url?: string) => {
    if (url) window.open(url, "_blank");
  };

  const adminApps = sites.filter(s => (s.moduleId === "Area Administrativa" || s.moduleId==="Administrative") && s.active).map(s=> ({ title: s.title, icon: Globe, name: s.title, url: s.url }));

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
              onClick={() => handleAppClick(app.name, (app as any).url)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
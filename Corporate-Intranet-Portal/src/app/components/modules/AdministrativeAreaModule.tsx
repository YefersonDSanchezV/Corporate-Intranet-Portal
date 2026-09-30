import { Globe } from "lucide-react";
import { AppCard } from "../AppCard";
import { useMemo } from "react";
import { useSystem } from "../../contexts/SystemContext";

export function AdministrativeAreaModule() {
  const { sites } = useSystem();

  const handleAppClick = (appName: string, url?: string) => {
    if (url) window.open(url, "_blank");
  };

  const adminApps = useMemo(() => {
    return sites
      .filter(s => (s.moduleId === "Area Administrativa" || s.moduleId === "Administrative") && s.active)
      .map(s => ({
        title: s.title,
        icon: Globe,
        name: s.title,
        url: s.url,
        restricted: false
      }));
  }, [sites]);

  return (
    <>
      <div className="space-y-6">
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

    </>
  );
}
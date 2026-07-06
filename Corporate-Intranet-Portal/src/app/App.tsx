import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { HomeModule } from "./components/modules/HomeModule";
import { ClinicalAreaModule } from "./components/modules/ClinicalAreaModule";
import { AdministrativeAreaModule } from "./components/modules/AdministrativeAreaModule";
import { InstitutionalManagementModule } from "./components/modules/InstitutionalManagementModule";
import { SupportModule } from "./components/modules/SupportModule";
import { DirectoryModule } from "./components/modules/DirectoryModule";
import { InnovacionAnaliticaModule } from "./components/modules/InnovacionAnaliticaModule";
import { useState, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminAuthProvider, useAdminAuth } from "./contexts/AdminAuthContext";
import { AnnouncementsProvider } from "./contexts/AnnouncementsContext";
import { SystemProvider } from "./contexts/SystemContext";
import { AnnouncementPanel } from "./components/AnnouncementPanel";
import { BirthdayWall } from "./components/BirthdayWall";
import { AdminPanel } from "./components/admin/AdminPanel";

function AppContent() {
  const { adminPanelOpen } = useAdminAuth();
  const [activeModule, setActiveModule] = useState("Inicio");

  useEffect(() => {
    const handleSwitch = (e: any) => {
      if (e.detail) setActiveModule(e.detail);
    };
    window.addEventListener("switchModule", handleSwitch);
    return () => window.removeEventListener("switchModule", handleSwitch);
  }, []);

  const renderModule = () => {
    switch (activeModule) {
      case "Inicio":
        return <HomeModule />;
      case "Area Asistencial":
        return <ClinicalAreaModule />;
      case "Area Administrativa":
        return <AdministrativeAreaModule />;
      case "Gestion Institucional":
        return <InstitutionalManagementModule />;
      case "Soporte":
        return <SupportModule />;
      case "Directorio":
        return <DirectoryModule />;
      case "Innovacion Analitica":
        return <InnovacionAnaliticaModule />;
      default:
        return <HomeModule />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <Header />
        <Navigation activeModule={activeModule} onModuleChange={setActiveModule} />

        <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
          {activeModule === "Inicio" ? (
            renderModule()
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <aside className="lg:col-span-3 order-2 lg:order-1">
                <div className="sticky top-4 space-y-6">
                  <AnnouncementPanel compact={true} />
                  <BirthdayWall />
                </div>
              </aside>
              <div className="lg:col-span-9 order-1 lg:order-2">{renderModule()}</div>
            </div>
          )}
        </main>

        <Footer />
      </div>

      {adminPanelOpen && <AdminPanel />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <SystemProvider>
          <AnnouncementsProvider>
            <AppContent />
          </AnnouncementsProvider>
        </SystemProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

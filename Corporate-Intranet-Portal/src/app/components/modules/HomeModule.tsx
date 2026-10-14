import { SearchBar } from "../SearchBar";
import { AnnouncementPanel } from "../AnnouncementPanel";
import { QuickAccessSection } from "../QuickAccessSection";
import { ClinicalAreaPanel } from "../ClinicalAreaPanel";
import { AdministrativeAreaPanel } from "../AdministrativeAreaPanel";
import { InstitutionalManagementPanel } from "../InstitutionalManagementPanel";
import { SupportPanel } from "../SupportPanel";
import { BirthdayWall } from "../BirthdayWall";
import { useAuth } from "../../contexts/AuthContext";
import { getGreeting } from "../../utils/greetings";
import { hasRole, ADMIN_PANEL_ROLES, ASISTENCIAL_PANEL_ROLES } from "../../utils/roles";

export function HomeModule() {
  const { user } = useAuth();
  const greeting = getGreeting();

  const canSeeAsistencialPanel = hasRole(user, ASISTENCIAL_PANEL_ROLES);
  const canSeeAdministrativePanel = hasRole(user, ADMIN_PANEL_ROLES);
  const canSeeInstitutionalPanel = hasRole(user, ADMIN_PANEL_ROLES);

  return (
    <>
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#0778AC]">
        <h1 className="text-2xl md:text-3xl font-bold text-[#0778AC] mb-2">
          {user ? `¡${greeting}, ${user.fullName.split(' ')[0]}!` : `¡${greeting}!`}
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          En este módulo encontrarás los accesos principales y anuncios más recientes para mantenerte al día.
        </p>
      </div>

      <SearchBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12 items-stretch">
        <div className="lg:col-span-2">
          <AnnouncementPanel variant="home" />
        </div>
        <div className="lg:col-span-1">
          <BirthdayWall />
        </div>
      </div>

      <QuickAccessSection />

      {/* Paneles según permisos de rol */}
      {canSeeAsistencialPanel && <ClinicalAreaPanel />}
      {canSeeAdministrativePanel && <AdministrativeAreaPanel />}
      {canSeeInstitutionalPanel && <InstitutionalManagementPanel />}
      <SupportPanel />
    </>
  );
}

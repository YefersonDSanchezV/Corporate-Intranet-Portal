import { SearchBar } from "../SearchBar";
import { AnnouncementPanel } from "../AnnouncementPanel";
import { QuickAccessSection } from "../QuickAccessSection";
import { ClinicalAreaPanel } from "../ClinicalAreaPanel";
import { AdministrativeAreaPanel } from "../AdministrativeAreaPanel";
import { InstitutionalManagementPanel } from "../InstitutionalManagementPanel";
import { SupportPanel } from "../SupportPanel";
import { RegisterAnnouncementModal } from "../modals/RegisterAnnouncementModal";
import { BirthdayWall } from "../BirthdayWall";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getGreeting } from "../../utils/greetings";

export function HomeModule() {
  const { user } = useAuth();
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const greeting = getGreeting();

  // Un rol es "coordinador" si contiene la palabra "coordinador" en su string
  const isCoordinador = user?.role?.includes("coordinador") ?? false;
  const isComunicaciones = user?.role === "comunicaciones";
  const isAdminOrRoot = user?.role === "admin" || user?.role === "root";

  // Solo coordinadores (cualquier tipo), comunicaciones, admin y root pueden registrar/solicitar anuncios
  const canRegisterAnnouncements = isCoordinador || isComunicaciones || isAdminOrRoot;

  // Los roles que NO necesitan contraseña de confirmación adicional
  const noPasswordRequired = isCoordinador || isComunicaciones || isAdminOrRoot;

  const canSeeAsistencialPanel =
    user?.role === "admin" ||
    user?.role === "root" ||
    user?.role === "ti" ||
    user?.role === "coordinador_ti" ||
    user?.role === "asistencial" ||
    user?.role === "coordinador_asistencial" ||
    user?.role === "coordinador_consulta_externa" ||
    user?.role === "administrativo" ||
    user?.role === "administrativo_rrhh" ||
    user?.role === "administrativo_calidad" ||
    user?.role === "coordinador_administrativo";

  const canSeeAdministrativePanel =
    user?.role === "admin" ||
    user?.role === "root" ||
    user?.role === "ti" ||
    user?.role === "coordinador_ti" ||
    user?.role === "administrativo" ||
    user?.role === "administrativo_rrhh" ||
    user?.role === "administrativo_calidad" ||
    user?.role === "coordinador_administrativo";

  const canSeeInstitutionalPanel =
    user?.role === "admin" ||
    user?.role === "root" ||
    user?.role === "ti" ||
    user?.role === "coordinador_ti" ||
    user?.role === "administrativo" ||
    user?.role === "administrativo_rrhh" ||
    user?.role === "administrativo_calidad" ||
    user?.role === "coordinador_administrativo";

  return (
    <>
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#0778AC]">
        <h1 className="text-2xl md:text-3xl font-bold text-[#0778AC] mb-2">
          ¡{greeting}, {user?.fullName.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          En este módulo encontrarás los accesos principales y anuncios más recientes para mantenerte al día.
        </p>
      </div>

      <SearchBar />

      {/* Botón para registrar / solicitar anuncios */}
      {canRegisterAnnouncements && (
        <div className="mb-6">
          <button
            id="btn-registrar-anuncio"
            onClick={() => setRegisterModalOpen(true)}
            className="w-full md:w-auto bg-gradient-to-r from-[#CF3438] to-[#e74c3c] hover:from-[#a01f24] hover:to-[#CF3438] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {isComunicaciones
              ? "Registrar / Publicar Anuncio o Comunicado"
              : "Solicitar Registro de Anuncio o Comunicado"}
          </button>
          {!isComunicaciones && (
            <p className="mt-2 text-xs text-gray-500">
              * Su solicitud será revisada y aprobada por el área de Comunicaciones antes de publicarse.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12 items-stretch">
        <div className="lg:col-span-2">
          <AnnouncementPanel />
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

      <RegisterAnnouncementModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        requirePassword={!noPasswordRequired}
        isComunicaciones={isComunicaciones}
      />
    </>
  );
}

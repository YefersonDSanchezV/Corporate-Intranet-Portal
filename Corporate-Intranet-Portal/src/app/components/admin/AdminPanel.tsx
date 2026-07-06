import { useState } from "react";
import { AdminSidebar, AdminView } from "./AdminSidebar";
import { WelcomeView } from "./views/WelcomeView";
import { GeneralesUsuariosView } from "./views/GeneralesUsuariosView";
import { GeneralesModulosView } from "./views/GeneralesModulosView";
import { GeneralesSitiosView } from "./views/GeneralesSitiosView";
import { GeneralesDirectorioView } from "./views/GeneralesDirectorioView";
import { DashboardComunicacionesView } from "./views/DashboardComunicacionesView";
import { UsuariosComunicacionesView } from "./views/UsuariosComunicacionesView";
import { PermisosComunicacionesView } from "./views/PermisosComunicacionesView";
import { CrearAnuncioView } from "./views/CrearAnuncioView";
import { CalendarioAnunciosView } from "./views/CalendarioAnunciosView";
import { AnunciosPendientesView } from "./views/AnunciosPendientesView";
import { HistorialAnunciosView } from "./views/HistorialAnunciosView";
import { CalendarioCumpleaniosView } from "./views/CalendarioCumpleaniosView";
import { CalendarioEventosView } from "./views/CalendarioEventosView";
import { LogrosAcreditacionesView } from "./views/LogrosAcreditacionesView";
import { TareasSeguimientoView } from "./views/TareasSeguimientoView";
import { FormatosContingenciaView } from "./views/FormatosContingenciaView";
import { ConsultaExternaView } from "./views/ConsultaExternaView";
import { EnlaceRedireccionView } from "./views/EnlaceRedireccionView";
import { LogsView } from "./views/LogsView";

export function AdminPanel() {
  const [activeView, setActiveView] = useState<AdminView>("welcome");

  const renderView = () => {
    switch (activeView) {
      case "welcome":
        return <WelcomeView onViewChange={setActiveView} />;
      case "usuarios":
        return <GeneralesUsuariosView mode="list" onModeChange={setActiveView} />;
      case "crear-usuario":
        return <GeneralesUsuariosView mode="create" onModeChange={setActiveView} />;
      case "solicitudes":
        return <GeneralesUsuariosView mode="requests" onModeChange={setActiveView} />;
      case "cargos":
        return <GeneralesUsuariosView mode="cargos" onModeChange={setActiveView} />;
      case "modulos":
        return <GeneralesModulosView />;
      case "sitios":
        return <GeneralesSitiosView />;
      case "directorio-extensiones":
        return <GeneralesDirectorioView type="extension" />;
      case "directorio-correos":
        return <GeneralesDirectorioView type="email" />;
      case "dashboard-comunicaciones":
        return <DashboardComunicacionesView />;
      case "usuarios-comunicaciones":
        return <UsuariosComunicacionesView />;
      case "permisos":
        return <PermisosComunicacionesView />;
      case "crear-anuncio":
        return <CrearAnuncioView />;
      case "calendario-anuncios":
        return <CalendarioAnunciosView />;
      case "anuncios-pendientes":
        return <AnunciosPendientesView />;
      case "anuncios-historial":
        return <HistorialAnunciosView />;
      case "calendario-cumpleanios":
        return <CalendarioCumpleaniosView />;
      case "calendario-eventos":
        return <CalendarioEventosView />;
      case "logros-acreditaciones":
        return <LogrosAcreditacionesView />;
      case "tareas-seguimiento":
        return <TareasSeguimientoView />;
      case "formatos-contingencia":
        return <FormatosContingenciaView />;
      case "consulta-externa":
        return <ConsultaExternaView />;
      case "enlace-redireccion":
        return <EnlaceRedireccionView />;
      case "logs":
        return <LogsView />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-400">Vista en construccion</h2>
              <p className="text-sm text-gray-400 mt-2">({activeView})</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f8f9fa] z-[150] flex overflow-hidden">
      <AdminSidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 h-full overflow-y-auto">{renderView()}</main>
    </div>
  );
}

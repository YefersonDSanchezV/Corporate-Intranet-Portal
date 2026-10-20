import { useEffect, useMemo, useState } from "react";
import { AdminSidebar, AdminView } from "./AdminSidebar";
import { WelcomeView } from "./views/WelcomeView";
import { GeneralesUsuariosView } from "./views/GeneralesUsuariosView";
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
import { CumpleaniosComunicacionesView } from "./views/CumpleaniosComunicacionesView";
import { ParametrosComunicacionesView } from "./views/ParametrosComunicacionesView";
import { PlantillasCumpleaniosView } from "./views/PlantillasCumpleaniosView";
import { LogrosAcreditacionesView } from "./views/LogrosAcreditacionesView";
import { FormatosContingenciaView } from "./views/FormatosContingenciaView";
import { ConsultaExternaView } from "./views/ConsultaExternaView";
import { EnlaceRedireccionView } from "./views/EnlaceRedireccionView";
import { LogsView } from "./views/LogsView";
import { AccesoRapidoView } from "./views/AccesoRapidoView";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { useSystem } from "../../contexts/SystemContext";
import { getAllowedAdminViews, getUserAdminPermissions } from "./rbac";

export function AdminPanel() {
  const { adminUser } = useAdminAuth();
  const { roles, rolePermissions } = useSystem();
  const [activeView, setActiveView] = useState<AdminView>("welcome");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const allowedViews = useMemo(() => {
    const permissions = getUserAdminPermissions(adminUser, roles, rolePermissions);
    return getAllowedAdminViews(permissions);
  }, [adminUser, roles, rolePermissions]);

  useEffect(() => {
    if (activeView === "welcome") return;
    if (!allowedViews.has(activeView)) {
      setActiveView("welcome");
    }
  }, [activeView, allowedViews]);

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

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
      case "cumpleanios-comunicaciones":
        return <CumpleaniosComunicacionesView />;
      case "parametros-comunicaciones":
        return <ParametrosComunicacionesView />;
      case "plantillas-cumpleanios":
        return <PlantillasCumpleaniosView />;
      case "logros-acreditaciones":
        return <LogrosAcreditacionesView />;
      case "formatos-contingencia":
        return <FormatosContingenciaView />;
      case "consulta-externa":
        return <ConsultaExternaView />;
      case "enlace-redireccion":
        return <EnlaceRedireccionView />;
      case "logs":
        return <LogsView />;
      case "accesos-rapidos":
        return <AccesoRapidoView />;
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
      <AdminSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
      />
      <main className="flex-1 h-full overflow-y-auto">{renderView()}</main>
    </div>
  );
}

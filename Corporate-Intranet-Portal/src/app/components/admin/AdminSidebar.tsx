import {
  AlignEndVertical,
  BookOpen,
  BriefcaseBusiness,
  Cake,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileBadge2Icon,
  FileLock,
  FileText,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Microwave,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Settings,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { useSystem } from "../../contexts/SystemContext";
import { Panel } from "react-resizable-panels";
import { getAllowedAdminViews, getUserAdminPermissions, PermissionBasedAdminView } from "./rbac";

export type AdminView = "welcome" | PermissionBasedAdminView;

interface SidebarItem {
  id: string;
  label: string;
  icon?: any;
  view?: AdminView;
  children?: SidebarItem[];
}

const MENU: SidebarItem[] = [
  {
    id: "generales",
    label: "Generales",
    icon: Settings,
    children: [
      {
        id: "usuarios-folder",
        label: "Usuarios",
        icon: Users,
        children: [
          { id: "usuarios", label: "Usuarios", view: "usuarios", icon: Users },
          { id: "solicitudes", label: "Solicitudes", view: "solicitudes", icon: ClipboardCheck },
          { id: "cargos", label: "Cargo", view: "cargos", icon: BriefcaseBusiness },
        ],
      },
      { id: "logs", label: "Logs", view: "logs", icon: FileText },
      {
        id: "parametros-folder",
        label: "Parámetros",
        icon: Settings,
        children: [
          { id: "parametros-comunicaciones", label: "Comunicaciones", view: "parametros-comunicaciones", icon: Microwave },
        ],
      },
    ],
  },
  {
    id: "directorio",
    label: "Directorio",
    icon: BookOpen,
    children: [
      { id: "dir-extensiones", label: "Extensiones Telefónicas", view: "directorio-extensiones", icon: Phone },
      { id: "dir-correos", label: "Correos Electrónicos", view: "directorio-correos", icon: Mail },
    ],
  },
  {
    id: "modulo",
    label: "Sitios",
    icon: Globe,
    children: [
      { id: "sitios", label: "Sitio de Redirección", view: "sitios", icon: Globe },
      { id: "accesos-rapidos", label: "Sitios de Acceso Rápido", view: "accesos-rapidos", icon: LayoutDashboard },
    ],
  },
  {
    id: "comunicaciones",
    label: "Comunicaciones",
    icon: Microwave,
    children: [
      { id: "dashboard", label: "Dashboard", view: "dashboard-comunicaciones", icon: LayoutDashboard },
      { id: "usuarios", 
        label: "Usuarios", 
        icon: Users,
        children: [
          { id: "usuarios", label: "Usuarios", view: "usuarios-comunicaciones", icon: Users },
          { id: "permisos", label: "Permisos", view: "permisos", icon: Shield },
        ],
      },
      {
        id: "anuncios",
        label: "Anuncios",
        icon: FileText,
        children: [
          { id: "crear-anuncio", label: "Crear Anuncio", view: "crear-anuncio", icon: FileText },
          { id: "anuncios-pendientes", label: "Anuncios Pendientes", view: "anuncios-pendientes", icon: AlignEndVertical },
          { id: "anuncios-historial", label: "Histórico de Anuncios", view: "anuncios-historial", icon: Calendar },
        ],
      },
      {
        id: "cumpleanios-folder",
        label: "Cumpleaños",
        icon: Cake,
        children: [
          { id: "cumpleanios-comunicaciones", label: "Cumpleaños", view: "cumpleanios-comunicaciones", icon: Cake },
          { id: "plantillas-cumpleanios", label: "Plantillas de Cumpleaños", view: "plantillas-cumpleanios", icon: ImageIcon },
        ],
      },
      {
        id: "calendarios",
        label: "Calendarios",
        icon: Calendar,
        children: [
          { id: "cumpleanios", label: "Cumpleaños", view: "calendario-cumpleanios", icon: Calendar },
          { id: "calendario-anuncios", label: "Anuncios", view: "calendario-anuncios", icon: Calendar },
        ],
      },
      { id: "logros-acreditaciones", label: "Logros y Acreditaciones", view: "logros-acreditaciones", icon: FileBadge2Icon},
    ],
  },
  {
    id: "asistencia",
    label: "Asistencia",
    icon: UserPlus,
     children: [
      { id: "formatos-contingencia", label: "Formatos de Contingencia", view: "formatos-contingencia", icon: FileLock },
      { id: "consulta-externa", label: "Consulta Externa", view: "consulta-externa", icon: FileText },
    ],
  },
  { id: "innovaccion-analitica",
    label: "Innovacción Analítica",
    icon: CheckCircle,
     children: [
      { id: "enlace-redireccion", label: "Enlace de Redirección", view: "enlace-redireccion", icon: Globe },
     ]
  },
];

interface AdminSidebarProps {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

function isChildActive(item: SidebarItem, activeView: AdminView): boolean {
  return Boolean(
    item.children?.some(
      (child) => child.view === activeView || isChildActive(child, activeView)
    )
  );
}

function SidebarNode({
  item,
  activeView,
  onViewChange,
  depth = 0,
  collapsed = false,
}: {
  item: SidebarItem;
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  depth?: number;
  collapsed?: boolean;
}) {
  const isActive = item.view === activeView;
  const hasChildren = Boolean(item.children?.length);
  const childIsActive = isChildActive(item, activeView);
  // Al iniciar sesión todas las carpetas arrancan comprimidas; solo se abre la que
  // contiene la vista activa para no perder el contexto de dónde está el usuario.
  const [open, setOpen] = useState(childIsActive);
  const Icon = item.icon;

  // Barra comprimida: solo iconos, con tooltip del nombre.
  if (collapsed) {
    return (
      <div>
        <button
          onClick={() => (hasChildren ? setOpen(!open) : item.view && onViewChange(item.view))}
          title={item.label}
          className={`w-full flex items-center justify-center py-2.5 rounded-lg mx-auto transition-all ${
            isActive || childIsActive
              ? "bg-[#CF3438] text-white font-semibold shadow-md"
              : "text-white/75 hover:text-white hover:bg-black/10"
          }`}
        >
          {Icon ? <Icon className="w-4 h-4 flex-shrink-0" /> : <span className="text-xs">{item.label.charAt(0)}</span>}
        </button>
        {hasChildren && open && (
          <div className="mt-0.5 space-y-0.5">
            {item.children!.map((child) => (
              <SidebarNode
                key={child.id}
                item={child}
                activeView={activeView}
                onViewChange={onViewChange}
                depth={depth + 1}
                collapsed
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all rounded-lg mx-1 ${
            childIsActive
              ? "text-white bg-black/10"
              : "text-white/80 hover:text-white hover:bg-black/10"
          }`}
          style={{ paddingLeft: `${16 + depth * 12}px` }}
        >
          {Icon && <Icon className="w-4 h-4 flex-shrink-0 opacity-80" />}
          <span className="flex-1 text-sm font-medium">{item.label}</span>
          {open ? <ChevronDown className="w-3.5 h-3.5 opacity-60" /> : <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
        </button>
        {open && (
          <div className="mt-0.5 space-y-0.5">
            {item.children!.map((child) => (
              <SidebarNode key={child.id} item={child} activeView={activeView} onViewChange={onViewChange} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => item.view && onViewChange(item.view)}
      className={`w-full flex items-center gap-3 py-2 text-left transition-all rounded-lg mx-1 ${
        isActive
          ? "bg-[#CF3438] text-white font-semibold shadow-md"
          : "text-white/75 hover:text-white hover:bg-black/10"
      }`}
      style={{ paddingLeft: `${20 + depth * 12}px`, paddingRight: "12px" }}
    >
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span className="text-sm">{item.label}</span>
    </button>
  );
}

/**
 * Carpeta padre de primer nivel (Generales, Directorio, Sitios, Comunicaciones,
 * Asistencia, Innovacción Analítica). Es desplegable: arranca comprimida y solo se
 * abre la que contiene la vista activa. Dentro cuelga el árbol de módulos.
 */
function SidebarSection({
  section,
  activeView,
  onViewChange,
  collapsed,
}: {
  section: SidebarItem;
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  collapsed: boolean;
}) {
  const sectionIsActive = isChildActive(section, activeView);
  const [open, setOpen] = useState(sectionIsActive);
  const Icon = section.icon;

  if (collapsed) {
    return (
      <div className="mb-1">
        <button
          onClick={() => setOpen(!open)}
          title={section.label}
          className={`w-full flex items-center justify-center py-2.5 rounded-lg mx-auto transition-all ${
            sectionIsActive
              ? "text-white bg-black/15"
              : "text-white/50 hover:text-white hover:bg-black/10"
          }`}
        >
          {Icon ? <Icon className="w-4 h-4 flex-shrink-0" /> : <span className="text-[10px] font-bold uppercase">{section.label.charAt(0)}</span>}
        </button>
        {open && (
          <div className="mt-0.5 space-y-0.5">
            {section.children?.map((item) => (
              <SidebarNode
                key={item.id}
                item={item}
                activeView={activeView}
                onViewChange={onViewChange}
                collapsed
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-1.5">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all rounded-lg ${
          sectionIsActive
            ? "text-white bg-black/15"
            : "text-white/80 hover:text-white hover:bg-black/10"
        }`}
      >
        {Icon && <Icon className="w-4 h-4 flex-shrink-0 opacity-90" />}
        <span className="flex-1 text-[11px] font-bold uppercase tracking-wider">{section.label}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 opacity-60" /> : <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
      </button>
      {open && (
        <div className="mt-1 space-y-0.5 pl-2 border-l border-white/10 ml-2">
          {section.children?.map((item) => (
            <SidebarNode
              key={item.id}
              item={item}
              activeView={activeView}
              onViewChange={onViewChange}
              collapsed={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminSidebar({
  activeView,
  onViewChange,
  collapsed = false,
  onToggleCollapsed,
}: AdminSidebarProps) {
  const { adminLogout, adminUser } = useAdminAuth();
  const { roles, rolePermissions } = useSystem();
  const allowedViews = useMemo(() => {
    const permissions = getUserAdminPermissions(adminUser, roles, rolePermissions);
    return getAllowedAdminViews(permissions);
  }, [adminUser, roles, rolePermissions]);

  const visibleMenu = useMemo(() => {
    function filterByPermissions(items: SidebarItem[]): SidebarItem[] {
      return items
        .map((item) => {
          if (item.view) {
            return allowedViews.has(item.view) ? item : null;
          }
          if (!item.children) {
            return item;
          }
          const visibleChildren = filterByPermissions(item.children);
          if (visibleChildren.length === 0) {
            return null;
          }
          return { ...item, children: visibleChildren };
        })
        .filter((item): item is SidebarItem => item !== null);
    }
    return filterByPermissions(MENU);
  }, [allowedViews]);

  return (
    <div className="relative h-full flex-shrink-0 group">
      <aside
        className={`bg-[#0778AC] flex flex-col h-full select-none transition-all duration-200 ${
          collapsed ? "w-16" : "w-72"
        }`}
      >
        <div className="px-4 py-5 border-b border-white/10 flex items-center">
          {collapsed ? (
            <button
              onClick={() => onViewChange("welcome")}
              title="Intranet Institucional"
              className="w-8 h-8 bg-[#CF3438] rounded-lg flex items-center justify-center mx-auto"
            >
              <Shield className="w-4 h-4 text-white" />
            </button>
          ) : (
            <div className="cursor-pointer min-w-0 flex-1" onClick={() => onViewChange("welcome")}>
              <h2 className="text-white font-bold text-sm leading-tight">Intranet Institucional</h2>
              <p className="text-white/50 text-[10px] mt-0.5">Panel Administrativo</p>
            </div>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-3 sidebar-scrollbar ${collapsed ? "px-2 space-y-2" : "px-2 space-y-1"}`}>
        {visibleMenu.map((section) => (
          <SidebarSection
            key={section.id}
            section={section}
            activeView={activeView}
            onViewChange={onViewChange}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className={`border-t border-white/10 ${collapsed ? "p-2" : "p-4"}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 bg-[#CF3438] rounded-full flex items-center justify-center" title={adminUser?.fullName || "Administrador"}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <button onClick={adminLogout} title="Cerrar Sesion" className="text-white/60 hover:text-white hover:bg-black/10 rounded-lg p-2 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#CF3438] rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold truncate" title={adminUser?.fullName || "Administrador"}>{adminUser?.fullName || "Administrador"}</p>
                <p className="text-white/50 text-[10px] truncate" title={adminUser?.position || adminUser?.role || "root"}>{adminUser?.position || adminUser?.role || "root"}</p>
              </div>
            </div>
            <button onClick={adminLogout} className="w-full flex items-center gap-2 text-white/60 hover:text-white hover:bg-black/10 rounded-lg px-3 py-2 transition-all text-sm">
              <LogOut className="w-4 h-4" />
              Cerrar Sesion
            </button>
          </>
        )}
      </div>
      </aside>

      {/* Asa lateral para comprimir/expandir: pegada al borde derecho del navbar. */}
      <button
        onClick={onToggleCollapsed}
        title={collapsed ? "Expandir barra de navegación" : "Comprimir barra de navegación"}
        aria-label={collapsed ? "Expandir barra de navegación" : "Comprimir barra de navegación"}
        className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 z-10 h-14 w-5 flex items-center justify-center rounded-full bg-[#0778AC] border border-white/25 text-white/70 shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-white hover:bg-[#065a87] transition-all"
      >
        {collapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

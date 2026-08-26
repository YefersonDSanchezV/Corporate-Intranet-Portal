import {
  AlignEndVertical,
  BookOpen,
  BriefcaseBusiness,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileBadge2Icon,
  FileLock,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Mail,
  Microwave,
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
          { id: "crear-usuario", label: "Crear Usuario", view: "crear-usuario", icon: UserPlus },
          { id: "solicitudes", label: "Solicitudes", view: "solicitudes", icon: ClipboardCheck },
          { id: "cargos", label: "Cargo", view: "cargos", icon: BriefcaseBusiness },
        ],
      },
      { id: "sitios", label: "Sitio de Redireccion", view: "sitios", icon: Globe },
      {
        id: "directorio",
        label: "Directorio",
        icon: BookOpen,
        children: [
          { id: "dir-extensiones", label: "Directorio de Extensiones", view: "directorio-extensiones", icon: Phone },
          { id: "dir-correos", label: "Directorio de Correos", view: "directorio-correos", icon: Mail },
        ],
      },
      { id: "logs", label: "Logs", view: "logs", icon: FileText },
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
          { id: "calendario-anuncios", label: "Calendario de Anuncios", view: "calendario-anuncios", icon: Calendar },
          { id: "anuncios-pendientes", label: "Anuncios Pendientes", view: "anuncios-pendientes", icon: AlignEndVertical },
          { id: "anuncios-historial", label: "Historial de Anuncios", view: "anuncios-historial", icon: Calendar },
        ],
      },
      {
        id: "calendarios",
        label: "Calendarios",
        icon: Calendar,
        children: [
          { id: "cumpleanios", label: "Cumpleaños", view: "calendario-cumpleanios", icon: Calendar },
          { id: "eventos", label: "Eventos", view: "calendario-eventos", icon: Calendar },
        ],
      },
      { id: "logros-acreditaciones", label: "Logros y Acreditaciones", view: "logros-acreditaciones", icon: FileBadge2Icon},
      { id: "tareas-seguimiento", label: "Tareas y Seguimiento", view: "tareas-seguimiento", icon: ClipboardCheck },
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
}: {
  item: SidebarItem;
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  depth?: number;
}) {
  const isActive = item.view === activeView;
  const hasChildren = Boolean(item.children?.length);
  const childIsActive = isChildActive(item, activeView);
  const [open, setOpen] = useState(depth === 0 || childIsActive);
  const Icon = item.icon;

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

export function AdminSidebar({ activeView, onViewChange }: AdminSidebarProps) {
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
    <aside className="w-72 bg-[#0778AC] flex flex-col h-full flex-shrink-0 select-none">
      <div className="px-4 py-5 border-b border-white/10 cursor-pointer" onClick={() => onViewChange("welcome")}>
        
        <h2 className="text-white font-bold text-sm leading-tight">Intranet Institucional</h2>
        <p className="text-white/50 text-[10px] mt-0.5">Panel Administrativo</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 custom-scrollbar">
        {visibleMenu.map((section) => (
          <div key={section.id} className="mb-2">
            <button
              onClick={() => onViewChange("welcome")}
              className="w-full flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-white/40 uppercase tracking-widest"
            >
              {section.icon && <section.icon className="w-3.5 h-3.5" />}
              {section.label}
            </button>
            <div className="space-y-0.5">
              {section.children?.map((item) => (
                <SidebarNode key={item.id} item={item} activeView={activeView} onViewChange={onViewChange} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-[#CF3438] rounded-full flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">Administrador</p>
            <p className="text-white/50 text-[10px]">root</p>
          </div>
        </div>
        <button onClick={adminLogout} className="w-full flex items-center gap-2 text-white/60 hover:text-white hover:bg-black/10 rounded-lg px-3 py-2 transition-all text-sm">
          <LogOut className="w-4 h-4" />
          Cerrar Sesion
        </button>
      </div>
    </aside>
  );
}

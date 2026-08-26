import type { User } from "../../contexts/AuthContext";
import type { Role, RolePermission } from "../../contexts/SystemContext";

export const CONTROL_PANEL_MODULES: Array<{
  id: string;
  label: string;
  children?: Array<{ id: string; label: string }>;
}> = [
  {
    id: "generales",
    label: "Generales",
    children: [
      { id: "usuarios", label: "Usuarios" },
      { id: "crear-usuario", label: "Crear Usuario" },
      { id: "solicitudes", label: "Solicitudes" },
      { id: "cargos", label: "Cargo" },
      { id: "sitios", label: "Sitio de Redirección" },
      { id: "directorio-extensiones", label: "Directorio de Extensiones" },
      { id: "directorio-correos", label: "Directorio de Correos" },
      { id: "logs", label: "Logs" },
    ],
  },
  {
    id: "comunicaciones",
    label: "Comunicaciones",
    children: [
      { id: "dashboard-comunicaciones", label: "Dashboard" },
      { id: "usuarios-comunicaciones", label: "Usuarios" },
      { id: "permisos", label: "Permisos" },
      { id: "crear-anuncio", label: "Crear Anuncio" },
      { id: "calendario-anuncios", label: "Calendario de Anuncios" },
      { id: "anuncios-pendientes", label: "Anuncios Pendientes" },
      { id: "anuncios-historial", label: "Historial de Anuncios" },
      { id: "calendario-cumpleanios", label: "Calendario de Cumpleaños" },
      { id: "calendario-eventos", label: "Calendario de Eventos" },
      { id: "logros-acreditaciones", label: "Logros y Acreditaciones" },
      { id: "tareas-seguimiento", label: "Tareas y Seguimiento" },
    ],
  },
  {
    id: "asistencia",
    label: "Asistencia",
    children: [
      { id: "formatos-contingencia", label: "Formatos de Contingencia" },
      { id: "consulta-externa", label: "Consulta Externa" },
    ],
  },
  {
    id: "innovacion",
    label: "Innovación Analítica",
    children: [{ id: "enlace-redireccion", label: "Enlace de Redirección" }],
  },
];

export const CONTROL_PANEL_SUBMODULE_IDS = new Set(
  CONTROL_PANEL_MODULES.flatMap((section) => section.children?.map((child) => child.id) ?? []),
);
export const CONTROL_PANEL_ALL_PERMISSION_IDS = CONTROL_PANEL_MODULES.flatMap((section) => [
  section.id,
  ...(section.children?.map((child) => child.id) ?? []),
]);

export function countAuthorizedSubmodules(permissions: string[]): number {
  return new Set(permissions.filter((permission) => CONTROL_PANEL_SUBMODULE_IDS.has(permission))).size;
}

export type PermissionBasedAdminView =
  | "usuarios"
  | "usuarios-comunicaciones"
  | "dashboard-comunicaciones"
  | "crear-usuario"
  | "solicitudes"
  | "cargos"
  | "permisos"
  | "sitios"
  | "directorio-extensiones"
  | "directorio-correos"
  | "logs"
  | "crear-anuncio"
  | "calendario-anuncios"
  | "anuncios-pendientes"
  | "anuncios-historial"
  | "calendario-cumpleanios"
  | "calendario-eventos"
  | "logros-acreditaciones"
  | "tareas-seguimiento"
  | "formatos-contingencia"
  | "consulta-externa"
  | "enlace-redireccion";

function normalize(value: string | undefined | null): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .trim();
}

function isAdministratorUser(user: User | null): boolean {
  if (!user) return false;
  const normalizedRole = normalize(user.role);
  const normalizedPosition = normalize(user.position);
  return normalizedRole === "admin" || normalizedRole === "administrador" || normalizedPosition === "administrador";
}

function resolveRoleIdForUser(user: User | null, roles: Role[]): string | null {
  if (!user) return null;
  const userRole = normalize(user.role);
  const userPosition = normalize(user.position);
  const role = roles.find((item) => {
    const roleName = normalize(item.name);
    const roleDescription = normalize(item.description);
    return roleName === userRole || roleDescription === userRole || roleName === userPosition || roleDescription === userPosition;
  });
  return role?.id ?? null;
}

export function getUserAdminPermissions(
  user: User | null,
  roles: Role[],
  rolePermissions: RolePermission[],
): string[] {
  if (isAdministratorUser(user)) {
    return CONTROL_PANEL_ALL_PERMISSION_IDS;
  }
  const roleId = resolveRoleIdForUser(user, roles);
  if (!roleId) return [];
  return rolePermissions.find((permission) => permission.roleId === roleId)?.modules ?? [];
}

export function getAllowedAdminViews(permissions: string[]): Set<PermissionBasedAdminView> {
  const allowed = new Set<PermissionBasedAdminView>();
  permissions.forEach((permission) => {
    if (CONTROL_PANEL_SUBMODULE_IDS.has(permission)) {
      allowed.add(permission as PermissionBasedAdminView);
    }
  });
  return allowed;
}

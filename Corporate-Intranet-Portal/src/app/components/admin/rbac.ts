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
      { id: "logs", label: "Logs" },
    ],
  },
  {
    id: "directorio",
    label: "Directorio",
    children: [
      { id: "directorio-extensiones", label: "Extensiones Telefónicas" },
      { id: "directorio-correos", label: "Correos Electrónicos" },
    ],
  },
  {
    id: "modulo",
    label: "Sitios",
    children: [
      { id: "sitios", label: "Sitio de Redirección" },
      { id: "accesos-rapidos", label: "Sitios de Acceso Rápido" },
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
      { id: "anuncios-historial", label: "Histórico de Anuncios" },
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

/**
 * Acciones que se pueden autorizar por módulo/submódulo dentro del panel de control.
 * El orden define el de las columnas del modal de autorización.
 */
export const CONTROL_PANEL_ACTIONS: ReadonlyArray<{ id: string; label: string; hint: string; implicit?: boolean }> = [
  { id: "grabar", label: "Grabar", hint: "Crear registros nuevos" },
  { id: "consultar", label: "Consultar", hint: "Viene implícita con el acceso al módulo", implicit: true },
  { id: "actualizar", label: "Actualizar", hint: "Editar registros existentes" },
  { id: "eliminar", label: "Eliminar", hint: "Borrar registros" },
  { id: "activar", label: "Activar/Inactivar", hint: "Habilitar o deshabilitar" },
  { id: "imprimir", label: "Imprimir", hint: "Generar reportes e impresión" },
];

export const CONTROL_PANEL_ACTION_IDS = CONTROL_PANEL_ACTIONS.map((action) => action.id);

/** Acciones que se otorgan por tener acceso al módulo, sin persistirse. */
export const CONTROL_PANEL_IMPLICIT_ACTION_IDS = CONTROL_PANEL_ACTIONS
  .filter((action) => action.implicit)
  .map((action) => action.id);

export function isImplicitControlPanelAction(actionId: string): boolean {
  return CONTROL_PANEL_IMPLICIT_ACTION_IDS.includes(actionId);
}

/**
 * Clave de un permiso de acción: `${moduloId}:${accionId}` (ej. "usuarios:grabar").
 * Se persiste en `gencargopermiso.permiso` con tipo 'ACCION', por lo que debe caber en 255
 * caracteres y no puede contener ':' — los ids de módulo están garantizado sin dos puntos.
 */
export function actionPermissionKey(moduleId: string, actionId: string): string {
  return `${moduleId}:${actionId}`;
}

export function parseActionPermissionKey(key: string): { moduleId: string; actionId: string } | null {
  const separator = key.indexOf(":");
  if (separator <= 0 || separator === key.length - 1) return null;
  const actionId = key.slice(separator + 1);
  if (!CONTROL_PANEL_ACTION_IDS.includes(actionId)) return null;
  // Las acciones implicitas no se persisten; si alguna existe de antes, se trata como legacy.
  if (isImplicitControlPanelAction(actionId)) return null;
  return { moduleId: key.slice(0, separator), actionId };
}

export function hasActionPermission(actions: string[], moduleId: string, actionId: string): boolean {
  return actions.includes(actionPermissionKey(moduleId, actionId));
}

/**
 * Permisos heredados del legacy que no siguen el formato "modulo:accion".
 * Se conservan al guardar para no perderlos.
 */
export function isLegacyActionPermission(key: string): boolean {
  return parseActionPermissionKey(key) === null;
}

/** Estado de una acción sobre un conjunto de módulos (para los checkbox tri-estado). */
export function actionStateOverModules(
  actions: string[],
  moduleIds: string[],
  actionId: string,
): { all: boolean; some: boolean } {
  if (moduleIds.length === 0) return { all: false, some: false };
  const granted = moduleIds.filter((moduleId) => hasActionPermission(actions, moduleId, actionId)).length;
  return { all: granted === moduleIds.length, some: granted > 0 };
}

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
  | "accesos-rapidos"
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

/**
 * Módulos y acciones persisted de un usuario, resueltos a partir de su cargo.
 *
 * `actions` solo contiene los permisos con formato "modulo:accion"; los permisos legacy
 * (p.ej. "Listar Usuarios") se descartan aquí porque no son verificables contra un módulo.
 *
 * Es la única fuente de resolución de permisos: la usan la navegación (AdminSidebar,
 * AdminPanel) y el gateo de acciones (useAdminAccess), para que nunca discrepen.
 */
export function getUserAdminPermissionSets(
  user: User | null,
  roles: Role[],
  rolePermissions: RolePermission[],
): { isAdministrator: boolean; modules: Set<string>; actions: Set<string> } {
  if (isAdministratorUser(user)) {
    return {
      isAdministrator: true,
      modules: new Set(CONTROL_PANEL_ALL_PERMISSION_IDS),
      actions: new Set(),
    };
  }

  const roleId = resolveRoleIdForUser(user, roles);
  const rolePermission = roleId ? rolePermissions.find((permission) => permission.roleId === roleId) : undefined;
  return {
    isAdministrator: false,
    modules: new Set(rolePermission?.modules ?? []),
    actions: new Set((rolePermission?.actions ?? []).filter((action) => parseActionPermissionKey(action) !== null)),
  };
}

export function getUserAdminPermissions(
  user: User | null,
  roles: Role[],
  rolePermissions: RolePermission[],
): string[] {
  const { modules } = getUserAdminPermissionSets(user, roles, rolePermissions);
  return Array.from(modules);
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

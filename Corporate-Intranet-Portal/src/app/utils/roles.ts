import type { UserRole } from "../contexts/AuthContext";

export const ADMIN_PANEL_ROLES: UserRole[] = [
  "admin",
  "root",
  "ti",
  "coordinador_ti",
  "administrativo",
  "administrativo_rrhh",
  "administrativo_calidad",
  "coordinador_administrativo",
];

export const ASISTENCIAL_PANEL_ROLES: UserRole[] = [
  ...ADMIN_PANEL_ROLES,
  "asistencial",
  "coordinador_asistencial",
  "coordinador_consulta_externa",
];

export const TI_SUPPORT_ROLES: UserRole[] = [
  "admin",
  "root",
  "ti",
  "coordinador_ti",
  "ingeniero_sistemas",
  "sistemas",
];

export function hasRole(user: { role?: UserRole } | null | undefined, roles: UserRole[]): boolean {
  if (!user?.role) return false;
  return roles.includes(user.role);
}
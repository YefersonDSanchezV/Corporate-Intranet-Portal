import type { ReactNode } from "react";
import { useAdminAccess } from "./useAdminAccess";

const ACTION_LABELS: Record<string, string> = {
  grabar: "Grabar",
  consultar: "Consultar",
  actualizar: "Actualizar",
  eliminar: "Eliminar",
  activar: "Activar/Inactivar",
  imprimir: "Imprimir",
};

export function actionLabel(actionId: string): string {
  return ACTION_LABELS[actionId] ?? actionId;
}

/** Texto para `title`/`aria-label` de controles deshabilitados. */
export function noPermissionReason(moduleLabel: string, actionId: string): string {
  return `No tiene permiso para ${actionLabel(actionId)} en ${moduleLabel}. Solicítelo a un administrador del panel.`;
}

interface CanProps {
  moduleId: string;
  actionId: string;
  children: ReactNode;
  /** Qué renderizar cuando no hay permiso. `null` oculta el contenido. */
  fallback?: ReactNode;
}

/**
 * Renderiza `children` solo si el usuario tiene permiso para la acción.
 * Autorizar el módulo implica "consultar" automáticamente (ver useAdminAccess).
 */
export function Can({ moduleId, actionId, children, fallback = null }: CanProps) {
  const { can } = useAdminAccess();
  if (!can(moduleId, actionId)) return <>{fallback}</>;
  return <>{children}</>;
}

/**
 * Igual que `Can` pero deja el control visible y deshabilitado, para que el usuario
 * entienda que la acción existe pero no está autorizada para él.
 */
export function CanDisabled({
  moduleId,
  actionId,
  moduleLabel,
  children,
}: {
  moduleId: string;
  actionId: string;
  moduleLabel: string;
  children: (props: { disabled: boolean; title: string | undefined }) => ReactNode;
}) {
  const { can } = useAdminAccess();
  const allowed = can(moduleId, actionId);
  return <>{children({ disabled: !allowed, title: allowed ? undefined : noPermissionReason(moduleLabel, actionId) })}</>;
}

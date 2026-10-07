import { useEffect, useMemo, useState } from "react";
import { authApi } from "../../api/auth";
import { getToken } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import { useSystem } from "../../contexts/SystemContext";
import { actionPermissionKey, getUserAdminPermissionSets } from "./rbac";

/**
 * Permisos de acciones del panel de control.
 *
 * REGLA DE NEGOCIO: autorizar el acceso a un módulo/submódulo otorga ÚNICAMENTE la acción
 * "consultar". Las demás (grabar, actualizar, eliminar, activar/inactivar, imprimir) quedan
 * inactivas hasta que se autoricen explícitamente en el modal "Autorizar acceso".
 * Por eso "consultar" es implícita y nunca se persiste por separado.
 */
export interface AdminAccess {
  /** El usuario es administrador del sistema: tiene todos los permisos sin excepción. */
  isAdministrator: boolean;
  /** ¿Tiene acceso al módulo/submódulo? Para el administrador siempre true. */
  hasModule: (moduleId: string) => boolean;
  /** ¿Puede ejecutar esta acción sobre el módulo/submódulo? */
  can: (moduleId: string, actionId: string) => boolean;
}

/**
 * Resolución remota (GET /api/me/permissions) cacheada por token: el backend resuelve el
 * cargo del usuario y devuelve los módulos/acciones persistidos. Si falla o aún no hay JWT,
 * se conserva la resolución local, sin bloquear la interfaz.
 */
let permissionsCache: {
  token: string | null;
  modules: ReadonlySet<string> | null;
  actions: ReadonlySet<string> | null;
  settled: boolean;
  promise?: Promise<boolean>;
} = { token: null, modules: null, actions: null, settled: false };

function loadBackendPermissions(): Promise<boolean> {
  const token = getToken();
  if (permissionsCache.token !== token) {
    permissionsCache = { token, modules: null, actions: null, settled: false };
  }
  if (permissionsCache.settled) {
    return Promise.resolve(permissionsCache.modules !== null);
  }
  if (!permissionsCache.promise) {
    permissionsCache.promise = authApi
      .mePermissions()
      .then((permissions) => {
        permissionsCache.modules = new Set(permissions.modules ?? []);
        permissionsCache.actions = new Set(permissions.actions ?? []);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        permissionsCache.settled = true;
      });
  }
  return permissionsCache.promise;
}

/**
 * Hook de control de acceso del panel de control.
 *
 * La resolución local delega en `getUserAdminPermissionSets`, la misma función que usa la
 * navegación, de modo que un control nunca queda habilitado en una vista que el usuario no
 * ve, ni al revés. Cuando el backend responde `/me/permissions`, esos sets hacen contrapeso
 * (la autoridad última para cada acción la aplica el interceptor de permisos del backend).
 */
export function useAdminAccess(): AdminAccess {
  const { user } = useAuth();
  const { adminUser } = useAdminAuth();
  const { roles, rolePermissions } = useSystem();
  const [backendResolved, setBackendResolved] = useState(false);

  useEffect(() => {
    let active = true;
    loadBackendPermissions().then(() => {
      if (active) setBackendResolved(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return useMemo<AdminAccess>(() => {
    const { isAdministrator, modules, actions } = getUserAdminPermissionSets(
      adminUser || user,
      roles,
      rolePermissions,
    );

    if (isAdministrator) {
      return { isAdministrator: true, hasModule: () => true, can: () => true };
    }

    const effectiveModules =
      backendResolved && permissionsCache.modules ? permissionsCache.modules : modules;
    const effectiveActions =
      backendResolved && permissionsCache.actions ? permissionsCache.actions : actions;

    const hasModule = (moduleId: string) => effectiveModules.has(moduleId);
    const can = (moduleId: string, actionId: string) => {
      if (!effectiveModules.has(moduleId)) return false;
      // "consultar" viene implícita con el acceso al módulo.
      if (actionId === "consultar") return true;
      return effectiveActions.has(actionPermissionKey(moduleId, actionId));
    };

    return { isAdministrator: false, hasModule, can };
  }, [adminUser, user, roles, rolePermissions, backendResolved]);
}
package co.com.icvc.intranet_backend.permisos;

import java.util.Set;

public record CargoPermisos(Set<String> modulos, Set<String> acciones) {

    public static final CargoPermisos EMPTY = new CargoPermisos(Set.of(), Set.of());

    public boolean hasModulo(String moduleId) {
        return modulos.contains(moduleId);
    }

    public boolean hasAccion(String moduleId, String actionId) {
        return acciones.contains(moduleId + ":" + actionId);
    }
}
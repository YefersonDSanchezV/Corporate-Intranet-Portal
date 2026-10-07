package co.com.icvc.intranet_backend.permisos;

import co.com.icvc.intranet_backend.user.repository.CargoPermisoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CargoPermisosCache {

    public static final String CACHE_NAME = "cargoPermisos";

    private final CargoPermisoRepository cargoPermisoRepository;

    @Cacheable(cacheNames = CACHE_NAME, key = "#cargoOid")
    public CargoPermisos byCargoOid(Integer cargoOid) {
        if (cargoOid == null) {
            return CargoPermisos.EMPTY;
        }
        java.util.Set<String> modulos = new java.util.HashSet<>();
        java.util.Set<String> acciones = new java.util.HashSet<>();
        cargoPermisoRepository.findByCargoOid(cargoOid).forEach(permiso -> {
            if ("MODULO".equals(permiso.getTipo()) && permiso.getPermiso() != null) {
                modulos.add(permiso.getPermiso().trim());
            } else if ("ACCION".equals(permiso.getTipo())) {
                String key = parseActionKey(permiso.getPermiso());
                if (key != null) {
                    acciones.add(key);
                }
            }
        });
        return new CargoPermisos(java.util.Set.copyOf(modulos), java.util.Set.copyOf(acciones));
    }

    /**
     * Conserva únicamente claves modulo:accion válidas. Lo legacy (sin ':') y la acción
     * implícita 'consultar' no conceden acciones: consultar se deriva del acceso al módulo.
     */
    private static String parseActionKey(String key) {
        if (key == null) {
            return null;
        }
        int separator = key.indexOf(':');
        if (separator <= 0 || separator == key.length() - 1) {
            return null;
        }
        String actionId = key.substring(separator + 1);
        if ("consultar".equals(actionId)) {
            return null;
        }
        return key;
    }
}
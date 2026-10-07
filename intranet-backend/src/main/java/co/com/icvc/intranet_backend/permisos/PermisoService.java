package co.com.icvc.intranet_backend.permisos;

import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PermisoService {

    public static final String ADMIN_AUTHORITY = "ROLE_ADMIN";

    private final UsuarioRepository usuarioRepository;
    private final CargoPermisosCache cargoPermisosCache;

    public boolean isAdministrator(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> ADMIN_AUTHORITY.equalsIgnoreCase(authority)
                        || "ADMIN".equalsIgnoreCase(authority));
    }

    public CargoPermisos loadForUsername(String username) {
        if (username == null || username.isBlank()) {
            return CargoPermisos.EMPTY;
        }
        Usuario usuario = usuarioRepository.findByUsername(username).orElse(null);
        if (usuario == null || usuario.getCargo() == null || usuario.getCargo().getOid() == null) {
            return CargoPermisos.EMPTY;
        }
        return cargoPermisosCache.byCargoOid(usuario.getCargo().getOid());
    }

    /**
     * Regla compartida con el frontend: el acceso al módulo concede 'consultar' de forma
     * implícita; el resto de acciones exigen la clave persistida 'modulo:accion'.
     */
    public boolean can(String username, String moduleId, String actionId) {
        CargoPermisos permisos = loadForUsername(username);
        if (!permisos.hasModulo(moduleId)) {
            return false;
        }
        if ("consultar".equals(actionId)) {
            return true;
        }
        return permisos.hasAccion(moduleId, actionId);
    }
}
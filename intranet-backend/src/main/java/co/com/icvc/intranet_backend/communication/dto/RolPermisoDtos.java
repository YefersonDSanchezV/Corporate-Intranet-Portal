package co.com.icvc.intranet_backend.communication.dto;

import co.com.icvc.intranet_backend.communication.entity.Permiso;
import co.com.icvc.intranet_backend.communication.entity.Rol;
import co.com.icvc.intranet_backend.communication.entity.UsuarioComunicacion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public final class RolPermisoDtos {

    private RolPermisoDtos() {
    }

    public record RolRequest(
            @NotBlank String nombre,
            String descripcion,
            List<@Positive Integer> permisoOids) {
    }

    public record RolResponse(Integer oid, String nombre, String descripcion, List<Integer> permisoOids) {

        public static RolResponse from(Rol rol, List<Integer> permisoOids) {
            return new RolResponse(rol.getOid(), rol.getNombre(), rol.getDescripcion(), permisoOids);
        }
    }

    public record PermisoRequest(@NotBlank String nombre, String descripcion) {
    }

    public record PermisoResponse(Integer oid, String nombre, String descripcion) {

        public static PermisoResponse from(Permiso permiso) {
            return new PermisoResponse(permiso.getOid(), permiso.getNombre(), permiso.getDescripcion());
        }
    }

    public record UsuarioComunicacionRequest(
            @NotNull @Positive Integer usuarioOid,
            @NotNull @Positive Integer rolOid,
            @NotNull Boolean estado) {
    }

    public record UsuarioComunicacionResponse(
            Integer oid,
            Integer usuarioOid,
            String username,
            Integer rolOid,
            String rolNombre,
            boolean estado) {

        public static UsuarioComunicacionResponse from(UsuarioComunicacion uc) {
            return new UsuarioComunicacionResponse(
                    uc.getOid(),
                    uc.getUsuario() != null ? uc.getUsuario().getOid() : null,
                    uc.getUsuario() != null ? uc.getUsuario().getUsername() : null,
                    uc.getRol() != null ? uc.getRol().getOid() : null,
                    uc.getRol() != null ? uc.getRol().getNombre() : null,
                    uc.isEstado());
        }
    }
}
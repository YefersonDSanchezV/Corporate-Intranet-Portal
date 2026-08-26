package co.com.icvc.intranet_backend.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.time.LocalDateTime;

public final class UsuarioDtos {

    private UsuarioDtos() {
    }

    public record CreateRequest(
            @NotBlank String username,
            @NotBlank String password,
            @NotNull @Positive Long identificacion,
            @NotBlank String nombreCompleto,
            @NotNull LocalDate fechaNacimiento,
            @NotBlank @Email String correoInstitucional,
            @NotNull @Positive Integer cargoOid) {
    }

    public record UpdateRequest(
            @NotBlank String nombreCompleto,
            @NotBlank @Email String correoInstitucional,
            @NotNull @Positive Integer cargoOid,
            @NotNull Boolean estado,
            LocalDate fechaNacimiento) {
    }

    public record StatusRequest(@NotNull Boolean estado) {
    }

    public record UpdatePasswordRequest(String password) {
    }

    public record Response(
            Integer oid,
            String username,
            Long identificacion,
            String nombreCompleto,
            LocalDate fechaNacimiento,
            String correoInstitucional,
            Integer cargoOid,
            String cargoNombre,
            boolean estado,
            LocalDateTime fechaCreacion) {

        public static Response from(co.com.icvc.intranet_backend.user.entity.Usuario usuario) {
            return new Response(
                    usuario.getOid(),
                    usuario.getUsername(),
                    usuario.getIdentificacion(),
                    usuario.getNombreCompleto(),
                    usuario.getFechaNacimiento(),
                    usuario.getCorreoInstitucional(),
                    usuario.getCargo() != null ? usuario.getCargo().getOid() : null,
                    usuario.getCargo() != null ? usuario.getCargo().getNombre() : null,
                    usuario.isEstado(),
                    usuario.getFechaCreacion());
        }
    }
}
package co.com.icvc.intranet_backend.user.dto;

import co.com.icvc.intranet_backend.user.entity.CumpleanosManual;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Cumpleaños manual: los mismos datos de la tabla de consulta
 * (nombre completo, fecha de nacimiento) más {@code cargo} en texto libre,
 * independiente del catálogo de cargos del sistema.
 */
public final class CumpleanosManualDtos {

    private CumpleanosManualDtos() {
    }

    public record CreateRequest(
            @NotBlank(message = "El nombre completo es obligatorio") String nombreCompleto,
            @NotNull(message = "La fecha de nacimiento es obligatoria") @Past(message = "La fecha de nacimiento debe ser anterior a hoy") LocalDate fechaNacimiento,
            @NotBlank(message = "El cargo es obligatorio") String cargo) {
    }

    public record Response(
            Integer oid,
            String nombreCompleto,
            LocalDate fechaNacimiento,
            String cargo,
            LocalDateTime fechaCreacion) {

        public static Response from(CumpleanosManual cumpleanos) {
            return new Response(
                    cumpleanos.getOid(),
                    cumpleanos.getNombreCompleto(),
                    cumpleanos.getFechaNacimiento(),
                    cumpleanos.getCargo(),
                    cumpleanos.getFechaCreacion());
        }
    }
}

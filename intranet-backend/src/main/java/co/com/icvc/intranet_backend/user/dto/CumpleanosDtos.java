package co.com.icvc.intranet_backend.user.dto;

import java.time.LocalDate;

/**
 * DTO para el módulo Calendario de Cumpleaños.
 * Se construye automáticamente a partir de la fecha de nacimiento
 * registrada en {@code genusuario}, sin carga manual.
 */
public final class CumpleanosDtos {

    private CumpleanosDtos() {
    }

    public record Response(
            Integer oid,
            String username,
            String nombreCompleto,
            LocalDate fechaNacimiento,
            LocalDate fechaCumpleanos,
            int edadQueCumple,
            Integer cargoOid,
            String cargoNombre,
            boolean estado) {
    }
}

package co.com.icvc.intranet_backend.user.dto;

import co.com.icvc.intranet_backend.portal.dto.PosicionFoto;
import co.com.icvc.intranet_backend.user.entity.CumpleanosManual;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Cumpleaños manual: los mismos datos de la tabla de consulta
 * (nombre completo, fecha de nacimiento) más {@code cargo} en texto libre,
 * independiente del catálogo de cargos del sistema.
 * Incluye la plantilla asignada y la posición de la foto dentro de ella.
 */
public final class CumpleanosManualDtos {

    private CumpleanosManualDtos() {
    }

    public record CreateRequest(
            @NotBlank(message = "El nombre completo es obligatorio") String nombreCompleto,
            @NotNull(message = "La fecha de nacimiento es obligatoria") @Past(message = "La fecha de nacimiento debe ser anterior a hoy") LocalDate fechaNacimiento,
            @NotBlank(message = "El cargo es obligatorio") String cargo,
            Integer fotoArchivoOid,
            Integer plantillaOid,
            BigDecimal fotoPx,
            BigDecimal fotoPy,
            BigDecimal fotoAncho,
            BigDecimal fotoAlto,
            Boolean fotoRedondo,
            BigDecimal fotoZoom,
            BigDecimal fotoOffsetX,
            BigDecimal fotoOffsetY) {

        /** Posición configurada en el formulario; si no llega, se usa la de la plantilla. */
        public PosicionFoto posicion() {
            if (fotoPx == null && fotoPy == null && fotoAncho == null && fotoAlto == null && fotoRedondo == null
                    && fotoZoom == null && fotoOffsetX == null && fotoOffsetY == null) {
                return null;
            }
            return PosicionFoto.validar(fotoPx, fotoPy, fotoAncho, fotoAlto, fotoRedondo,
                    fotoZoom, fotoOffsetX, fotoOffsetY);
        }
    }

    public record Response(
            Integer oid,
            String nombreCompleto,
            LocalDate fechaNacimiento,
            String cargo,
            Integer fotoArchivoOid,
            LocalDateTime fechaCreacion,
            LocalDateTime fechaActualizacion,
            Integer plantillaOid,
            String plantillaNombre,
            Integer plantillaArchivoOid,
            PosicionFoto posicion) {

        public static Response from(CumpleanosManual cumpleanos) {
            var plantilla = cumpleanos.getPlantilla();
            PosicionFoto posicion = cumpleanos.getFotoPx() == null ? null : PosicionFoto.of(
                    cumpleanos.getFotoPx(),
                    cumpleanos.getFotoPy(),
                    cumpleanos.getFotoAncho(),
                    cumpleanos.getFotoAlto(),
                    cumpleanos.isFotoRedondo(),
                    cumpleanos.getFotoZoom(),
                    cumpleanos.getFotoOffsetX(),
                    cumpleanos.getFotoOffsetY());
            return new Response(
                    cumpleanos.getOid(),
                    cumpleanos.getNombreCompleto(),
                    cumpleanos.getFechaNacimiento(),
                    cumpleanos.getCargo(),
                    cumpleanos.getFotoArchivoOid(),
                    cumpleanos.getFechaCreacion(),
                    cumpleanos.getFechaActualizacion(),
                    plantilla != null ? plantilla.getOid() : null,
                    plantilla != null ? plantilla.getNombre() : null,
                    plantilla != null && plantilla.getArchivo() != null ? plantilla.getArchivo().getOid() : null,
                    posicion);
        }
    }
}

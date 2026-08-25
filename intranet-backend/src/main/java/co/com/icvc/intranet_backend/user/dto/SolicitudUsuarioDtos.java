package co.com.icvc.intranet_backend.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public final class SolicitudUsuarioDtos {

    private SolicitudUsuarioDtos() {
    }

    public record CreateRequest(
            @NotNull @Positive Long identificacion,
            @NotBlank String nombre,
            @NotBlank String cargo,
            @NotBlank @Email String correo,
            String observaciones) {
    }

    public record Response(
            Integer oid,
            Long identificacion,
            String nombre,
            String cargo,
            String correo,
            String estado,
            java.time.LocalDateTime fechaSolicitud,
            java.time.LocalDateTime fechaAprobacion,
            java.time.LocalDateTime fechaRechazo,
            String observaciones) {

        public static Response from(co.com.icvc.intranet_backend.user.entity.SolicitudUsuario solicitud) {
            return new Response(
                    solicitud.getOid(),
                    solicitud.getIdentificacion(),
                    solicitud.getNombre(),
                    solicitud.getCargo(),
                    solicitud.getCorreo(),
                    solicitud.getEstado() != null ? solicitud.getEstado().name() : null,
                    solicitud.getFechaSolicitud(),
                    solicitud.getFechaAprobacion(),
                    solicitud.getFechaRechazo(),
                    solicitud.getObservaciones());
        }
    }
}
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
            @NotBlank String primerNombre,
            String segundoNombre,
            @NotBlank String primerApellido,
            @NotBlank String segundoApellido,
            @NotBlank String cargo,
            @NotBlank @Email String correo,
            @NotBlank String celular,
            @NotNull java.time.LocalDate fechaNacimiento,
            // Compatibilidad: si frontend viejo envía nombre/cargo/correo antiguos
            String nombre,
            String observaciones) {
    }

    public record RejectRequest(
            @jakarta.validation.constraints.Size(max = 1000, message = "El motivo no puede exceder 1000 caracteres")
            String observaciones) {
    }

    public record ApproveRequest(
            @jakarta.validation.constraints.Size(max = 1000, message = "El motivo no puede exceder 1000 caracteres")
            String observaciones) {
    }

    public record Response(
            Integer oid,
            Long identificacion,
            String nombre,
            String primerNombre,
            String segundoNombre,
            String primerApellido,
            String segundoApellido,
            String nombreCompleto,
            String cargo,
            String correo,
            String celular,
            java.time.LocalDate fechaNacimiento,
            String estado,
            java.time.LocalDateTime fechaSolicitud,
            java.time.LocalDateTime fechaAprobacion,
            java.time.LocalDateTime fechaRechazo,
            String observaciones) {

        public static Response from(co.com.icvc.intranet_backend.user.entity.SolicitudUsuario solicitud) {
            String full = buildNombreCompleto(solicitud);
            return new Response(
                    solicitud.getOid(),
                    solicitud.getIdentificacion(),
                    solicitud.getNombre(),
                    solicitud.getPrimerNombre(),
                    solicitud.getSegundoNombre(),
                    solicitud.getPrimerApellido(),
                    solicitud.getSegundoApellido(),
                    full,
                    solicitud.getCargo(),
                    solicitud.getCorreo(),
                    solicitud.getCelular(),
                    solicitud.getFechaNacimiento(),
                    solicitud.getEstado() != null ? solicitud.getEstado().name() : null,
                    solicitud.getFechaSolicitud(),
                    solicitud.getFechaAprobacion(),
                    solicitud.getFechaRechazo(),
                    solicitud.getObservaciones());
        }

        private static String buildNombreCompleto(co.com.icvc.intranet_backend.user.entity.SolicitudUsuario s) {
            if (s.getPrimerNombre() != null && s.getPrimerApellido() != null) {
                StringBuilder sb = new StringBuilder();
                sb.append(s.getPrimerNombre());
                if (s.getSegundoNombre() != null && !s.getSegundoNombre().isBlank()) sb.append(" ").append(s.getSegundoNombre());
                sb.append(" ").append(s.getPrimerApellido());
                if (s.getSegundoApellido() != null && !s.getSegundoApellido().isBlank()) sb.append(" ").append(s.getSegundoApellido());
                return sb.toString().trim();
            }
            return s.getNombre() != null ? s.getNombre() : "";
        }
    }
}
package co.com.icvc.intranet_backend.communication.dto;

import co.com.icvc.intranet_backend.communication.entity.MuroCsvRegistro;
import co.com.icvc.intranet_backend.communication.entity.MuroMensaje;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

public final class MuroDtos {

    private MuroDtos() {
    }

    public record CreateRequest(
            @NotBlank(message = "El mensaje no puede estar vacío") @Size(max = 500, message = "El mensaje no puede exceder 500 caracteres") String texto,
            @Size(max = 60, message = "El nombre no puede exceder 60 caracteres") String nombre) {
    }

    public record Response(
            Integer oid,
            Integer autorOid,
            String autorNombre,
            String texto,
            LocalDateTime fecha) {

        public static Response from(MuroMensaje mensaje) {
            String nombre = mensaje.getAutorNombre() != null && !mensaje.getAutorNombre().isBlank()
                    ? mensaje.getAutorNombre()
                    : mensaje.getAutor() != null ? mensaje.getAutor().getNombreCompleto() : "Desconocido";
            return new Response(
                    mensaje.getOid(),
                    mensaje.getAutor() != null ? mensaje.getAutor().getOid() : null,
                    nombre,
                    mensaje.getTexto(),
                    mensaje.getFecha());
        }
    }

    public record ReporteResponse(
            Integer oid,
            LocalDate fechaDia,
            Integer totalMensajes,
            Integer archivoOid,
            String archivoNombre,
            LocalDateTime fechaCreacion) {

        public static ReporteResponse from(MuroCsvRegistro registro) {
            return new ReporteResponse(
                    registro.getOid(),
                    registro.getFechaDia(),
                    registro.getTotalMensajes(),
                    registro.getArchivo() != null ? registro.getArchivo().getOid() : null,
                    registro.getArchivo() != null ? registro.getArchivo().getNombreOriginal() : null,
                    registro.getFechaCreacion());
        }
    }
}

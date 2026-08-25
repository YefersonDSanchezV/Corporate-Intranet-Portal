package co.com.icvc.intranet_backend.communication.dto;

import co.com.icvc.intranet_backend.communication.entity.LogroAcreditacion;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public final class LogroDtos {

    private LogroDtos() {
    }

    public record CreateRequest(
            @NotBlank String titulo,
            String descripcion,
            String urlImagen) {
    }

    public record Response(
            Integer oid,
            String titulo,
            String descripcion,
            String urlImagen,
            LocalDateTime fechaCreacion) {

        public static Response from(LogroAcreditacion logro) {
            return new Response(
                    logro.getOid(),
                    logro.getTitulo(),
                    logro.getDescripcion(),
                    logro.getUrlImagen(),
                    logro.getFechaCreacion());
        }
    }
}
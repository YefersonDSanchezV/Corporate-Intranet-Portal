package co.com.icvc.intranet_backend.innovation.dto;

import co.com.icvc.intranet_backend.innovation.entity.EnlaceInnovacion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public final class InnovationDtos {

    private InnovationDtos() {
    }

    public record CreateRequest(
            @NotBlank String nombre,
            @NotBlank String url,
            @NotNull @Positive Integer creadorOid) {
    }

    public record Response(
            Integer oid,
            String nombre,
            String url,
            Integer creadorOid,
            String creadorNombre,
            LocalDateTime fechaCreacion) {

        public static Response from(EnlaceInnovacion enlace) {
            return new Response(
                    enlace.getOid(),
                    enlace.getNombre(),
                    enlace.getUrl(),
                    enlace.getCreador() != null ? enlace.getCreador().getOid() : null,
                    enlace.getCreador() != null ? enlace.getCreador().getNombreCompleto() : null,
                    enlace.getFechaCreacion());
        }
    }
}
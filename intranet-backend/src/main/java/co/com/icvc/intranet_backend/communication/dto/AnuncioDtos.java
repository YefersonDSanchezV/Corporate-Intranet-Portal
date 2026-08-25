package co.com.icvc.intranet_backend.communication.dto;

import co.com.icvc.intranet_backend.communication.entity.Anuncio;
import co.com.icvc.intranet_backend.communication.entity.TipoAnuncio;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public final class AnuncioDtos {

    private AnuncioDtos() {
    }

    public record CreateRequest(
            @NotBlank String titulo,
            @NotBlank String descripcion,
            @NotNull @Positive Integer tipoOid,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            LocalDateTime fechaVencimiento) {
    }

    public record Response(
            Integer oid,
            String titulo,
            String descripcion,
            Integer tipoOid,
            String tipoNombre,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            Integer creadorOid,
            String creadorNombre,
            String estado,
            LocalDateTime fechaCreacion,
            LocalDateTime fechaVencimiento,
            boolean eliminado) {

        public static Response from(Anuncio anuncio) {
            return new Response(
                    anuncio.getOid(),
                    anuncio.getTitulo(),
                    anuncio.getDescripcion(),
                    anuncio.getTipo() != null ? anuncio.getTipo().getOid() : null,
                    anuncio.getTipo() != null ? anuncio.getTipo().getNombre() : null,
                    anuncio.getFechaInicio(),
                    anuncio.getFechaFin(),
                    anuncio.getCreador() != null ? anuncio.getCreador().getOid() : null,
                    anuncio.getCreador() != null && anuncio.getCreador().getUsuario() != null
                            ? anuncio.getCreador().getUsuario().getNombreCompleto()
                            : null,
                    anuncio.getEstado() != null ? anuncio.getEstado().name() : null,
                    anuncio.getFechaCreacion(),
                    anuncio.getFechaVencimiento(),
                    anuncio.isEliminado());
        }
    }

    public record TipoResponse(Integer oid, String nombre) {

        public static TipoResponse from(TipoAnuncio tipo) {
            return new TipoResponse(tipo.getOid(), tipo.getNombre());
        }
    }
}
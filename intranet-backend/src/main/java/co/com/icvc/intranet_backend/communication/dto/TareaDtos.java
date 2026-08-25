package co.com.icvc.intranet_backend.communication.dto;

import co.com.icvc.intranet_backend.communication.entity.ComentarioTarea;
import co.com.icvc.intranet_backend.communication.entity.TareaSeguimiento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public final class TareaDtos {

    private TareaDtos() {
    }

    public record CreateRequest(
            @NotBlank String titulo,
            String descripcion,
            @NotNull @Positive Integer asignadaAOid,
            @NotNull @Positive Integer asignadaPorOid,
            LocalDateTime fechaInicio,
            LocalDateTime fechaLimite,
            @NotNull String prioridad) {
    }

    public record Response(
            Integer oid,
            String titulo,
            String descripcion,
            Integer asignadaAOid,
            String asignadaANombre,
            Integer asignadaPorOid,
            String asignadaPorNombre,
            String estado,
            LocalDateTime fechaInicio,
            LocalDateTime fechaLimite,
            String prioridad) {

        public static Response from(TareaSeguimiento tarea) {
            return new Response(
                    tarea.getOid(),
                    tarea.getTitulo(),
                    tarea.getDescripcion(),
                    tarea.getAsignadaA() != null ? tarea.getAsignadaA().getOid() : null,
                    tarea.getAsignadaA() != null && tarea.getAsignadaA().getUsuario() != null
                            ? tarea.getAsignadaA().getUsuario().getNombreCompleto()
                            : null,
                    tarea.getAsignadaPor() != null ? tarea.getAsignadaPor().getOid() : null,
                    tarea.getAsignadaPor() != null && tarea.getAsignadaPor().getUsuario() != null
                            ? tarea.getAsignadaPor().getUsuario().getNombreCompleto()
                            : null,
                    tarea.getEstado() != null ? tarea.getEstado().name() : null,
                    tarea.getFechaInicio(),
                    tarea.getFechaLimite(),
                    tarea.getPrioridad() != null ? tarea.getPrioridad().name() : null);
        }
    }

    public record ComentarioRequest(
            String descripcion,
            @NotNull @Positive Integer autorOid) {
    }

    public record ComentarioResponse(
            Integer oid,
            Integer tareaOid,
            String descripcion,
            LocalDateTime fecha,
            Integer autorOid,
            String autorNombre) {

        public static ComentarioResponse from(ComentarioTarea comentario) {
            return new ComentarioResponse(
                    comentario.getOid(),
                    comentario.getTarea() != null ? comentario.getTarea().getOid() : null,
                    comentario.getDescripcion(),
                    comentario.getFecha(),
                    comentario.getAutor() != null ? comentario.getAutor().getOid() : null,
                    comentario.getAutor() != null ? comentario.getAutor().getNombreCompleto() : null);
        }
    }
}
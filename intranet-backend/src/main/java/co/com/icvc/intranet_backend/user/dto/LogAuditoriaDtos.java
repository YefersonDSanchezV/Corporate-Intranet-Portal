package co.com.icvc.intranet_backend.user.dto;

import co.com.icvc.intranet_backend.user.entity.LogAuditoria;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public final class LogAuditoriaDtos {

    private LogAuditoriaDtos() {
    }

    public record CreateRequest(
            @NotNull @Positive Integer usuarioOid,
            String accion,
            String tabla,
            String registro) {
    }

    public record Response(
            Integer oid,
            Integer usuarioOid,
            String username,
            String accion,
            String valorAnterior,
            String valorNuevo,
            LocalDateTime fechaCambio,
            String ip,
            String tabla,
            String registro) {

        public static Response from(LogAuditoria log) {
            return new Response(
                    log.getOid(),
                    log.getUsuario() != null ? log.getUsuario().getOid() : null,
                    log.getUsuario() != null ? log.getUsuario().getUsername() : null,
                    log.getAccion(),
                    log.getValorAnterior(),
                    log.getValorNuevo(),
                    log.getFechaCambio(),
                    log.getIp(),
                    log.getTabla(),
                    log.getRegistro());
        }
    }
}
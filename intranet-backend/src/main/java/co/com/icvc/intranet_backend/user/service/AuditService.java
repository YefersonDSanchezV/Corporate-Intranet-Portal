package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.user.entity.LogAuditoria;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.LogAuditoriaRepository;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final LogAuditoriaRepository logRepository;
    private final UsuarioRepository usuarioRepository;
    private final JdbcTemplate jdbcTemplate;

    public LogAuditoria registrar(String accion, String tabla, String registro,
            String valorAnterior, String valorNuevo, Integer usuarioOid, String ip) {
        if (usuarioOid == null) {
            return null;
        }
        Usuario usuario = usuarioRepository.findById(usuarioOid).orElse(null);
        if (usuario == null) {
            return null;
        }
        LogAuditoria audit = LogAuditoria.builder()
                .usuario(usuario)
                .accion(accion)
                .tabla(tabla)
                .registro(registro)
                .valorAnterior(valorAnterior)
                .valorNuevo(valorNuevo)
                .fechaCambio(LocalDateTime.now())
                .ip(ip)
                .build();
        try {
            return logRepository.save(audit);
        } catch (Exception ex) {
            String msg = ex.getMessage() != null ? ex.getMessage() : "";
            if (msg.contains("oid") || (ex.getCause() != null && ex.getCause().getMessage() != null && ex.getCause().getMessage().contains("oid"))) {
                log.warn("JPA save genlogs falló por oid, reintentando nativo: {}", ex.getMessage());
                try {
                    Integer nextOid = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(oid),0)+1 FROM genlogs", Integer.class);
                    jdbcTemplate.update(
                            "INSERT INTO genlogs (oid, genusuario, genlogacci, genlogtabla, genlogregist, genlogvalant, genlogvalnue, genlogfechac, genlogip) VALUES (?,?,?,?,?,?,?,?,?)",
                            nextOid, usuarioOid, accion, tabla, registro, valorAnterior, valorNuevo, Timestamp.valueOf(LocalDateTime.now()), ip);
                    return logRepository.findById(nextOid).orElse(audit);
                } catch (Exception ex2) {
                    log.error("Fallback nativo genlogs falló: {}", ex2.getMessage(), ex2);
                    return null;
                }
            }
            log.error("Error registrando auditoría: {}", ex.getMessage(), ex);
            return null;
        }
    }
}
package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.user.entity.LogAuditoria;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.LogAuditoriaRepository;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private static final long GENLOGS_ADVISORY_LOCK_KEY = 0x6C6F6753L;

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
        try {
            lockLogs();
            Integer nextOid = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(oid),0)+1 FROM genlogs", Integer.class);
            jdbcTemplate.update(
                    "INSERT INTO genlogs (oid, genusuario, genlogacci, genlogtabla, genlogregist, genlogvalant, genlogvalnue, genlogfechac, genlogip) VALUES (?,?,?,?,?,?,?,?,?)",
                    nextOid, usuarioOid, accion, tabla, registro, valorAnterior, valorNuevo,
                    Timestamp.valueOf(LocalDateTime.now()), ip);
            LogAuditoria audit = logRepository.findById(nextOid).orElse(null);
            if (audit == null) {
                audit = LogAuditoria.builder()
                        .usuario(usuario)
                        .accion(accion)
                        .tabla(tabla)
                        .registro(registro)
                        .valorAnterior(valorAnterior)
                        .valorNuevo(valorNuevo)
                        .fechaCambio(LocalDateTime.now())
                        .ip(ip)
                        .build();
            }
            return audit;
        } catch (Exception ex) {
            log.error("Error registrando auditoría en genlogs: {}", ex.getMessage(), ex);
            return null;
        }
    }

    private void lockLogs() {
        jdbcTemplate.execute((ConnectionCallback<Object>) con -> {
            try (PreparedStatement ps = con.prepareStatement("SELECT pg_advisory_xact_lock(?)")) {
                ps.setLong(1, GENLOGS_ADVISORY_LOCK_KEY);
                ps.execute();
            }
            return null;
        });
    }
}
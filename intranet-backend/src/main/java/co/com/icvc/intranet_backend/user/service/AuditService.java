package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.user.entity.LogAuditoria;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.LogAuditoriaRepository;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final LogAuditoriaRepository logRepository;
    private final UsuarioRepository usuarioRepository;

    public LogAuditoria registrar(String accion, String tabla, String registro,
            String valorAnterior, String valorNuevo, Integer usuarioOid, String ip) {
        if (usuarioOid == null) {
            return null;
        }
        Usuario usuario = usuarioRepository.findById(usuarioOid).orElse(null);
        if (usuario == null) {
            return null;
        }
        LogAuditoria log = LogAuditoria.builder()
                .usuario(usuario)
                .accion(accion)
                .tabla(tabla)
                .registro(registro)
                .valorAnterior(valorAnterior)
                .valorNuevo(valorNuevo)
                .fechaCambio(LocalDateTime.now())
                .ip(ip)
                .build();
        return logRepository.save(log);
    }
}
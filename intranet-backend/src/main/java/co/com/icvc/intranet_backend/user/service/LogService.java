package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.user.dto.LogAuditoriaDtos;
import co.com.icvc.intranet_backend.user.entity.LogAuditoria;
import co.com.icvc.intranet_backend.user.repository.LogAuditoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LogService {

    private final LogAuditoriaRepository logRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<LogAuditoriaDtos.Response> list(String tabla) {
        if (tabla == null || tabla.isBlank()) {
            return logRepository.findAllByOrderByFechaCambioDesc().stream()
                    .map(LogAuditoriaDtos.Response::from)
                    .toList();
        }
        return logRepository.findAllByTablaOrderByFechaCambioDesc(tabla).stream()
                .map(LogAuditoriaDtos.Response::from)
                .toList();
    }

    @Transactional
    public LogAuditoriaDtos.Response create(LogAuditoriaDtos.CreateRequest request, String ip) {
        LogAuditoria log = auditService.registrar(request.accion(), request.tabla(), request.registro(),
                null, null, request.usuarioOid(), ip);
        return log != null ? LogAuditoriaDtos.Response.from(log) : null;
    }
}
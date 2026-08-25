package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.common.exception.ConflictException;
import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.mapper.Mappers;
import co.com.icvc.intranet_backend.user.dto.SolicitudUsuarioDtos;
import co.com.icvc.intranet_backend.user.entity.SolicitudUsuario;
import co.com.icvc.intranet_backend.user.enums.EstadoSolicitud;
import co.com.icvc.intranet_backend.user.repository.SolicitudUsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccessRequestService {

    private final SolicitudUsuarioRepository solicitudRepository;

    @Transactional(readOnly = true)
    public List<SolicitudUsuarioDtos.Response> list() {
        return solicitudRepository.findAllByOrderByFechaSolicitudDesc().stream()
                .map(SolicitudUsuarioDtos.Response::from)
                .toList();
    }

    @Transactional
    public SolicitudUsuarioDtos.Response create(SolicitudUsuarioDtos.CreateRequest request) {
        SolicitudUsuario solicitud = SolicitudUsuario.builder()
                .identificacion(request.identificacion())
                .nombre(request.nombre())
                .cargo(request.cargo())
                .correo(request.correo())
                .estado(EstadoSolicitud.PENDIENTE)
                .fechaSolicitud(LocalDateTime.now())
                .observaciones(Mappers.trimToNull(request.observaciones()))
                .build();
        return SolicitudUsuarioDtos.Response.from(solicitudRepository.save(solicitud));
    }

    @Transactional
    public SolicitudUsuarioDtos.Response approve(Integer id) {
        SolicitudUsuario solicitud = require(id);
        if (solicitud.getEstado() != EstadoSolicitud.PENDIENTE) {
            throw new ConflictException("Solo se pueden aprobar solicitudes pendientes");
        }
        solicitud.setEstado(EstadoSolicitud.APROBADA);
        solicitud.setFechaAprobacion(LocalDateTime.now());
        return SolicitudUsuarioDtos.Response.from(solicitudRepository.save(solicitud));
    }

    @Transactional
    public SolicitudUsuarioDtos.Response reject(Integer id) {
        SolicitudUsuario solicitud = require(id);
        if (solicitud.getEstado() != EstadoSolicitud.PENDIENTE) {
            throw new ConflictException("Solo se pueden rechazar solicitudes pendientes");
        }
        solicitud.setEstado(EstadoSolicitud.RECHAZADA);
        solicitud.setFechaRechazo(LocalDateTime.now());
        return SolicitudUsuarioDtos.Response.from(solicitudRepository.save(solicitud));
    }

    private SolicitudUsuario require(Integer id) {
        return solicitudRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Solicitud de acceso", id));
    }
}
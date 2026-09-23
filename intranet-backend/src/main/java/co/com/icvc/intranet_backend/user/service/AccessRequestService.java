package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.common.exception.ConflictException;
import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.mapper.Mappers;
import co.com.icvc.intranet_backend.user.dto.SolicitudUsuarioDtos;
import co.com.icvc.intranet_backend.user.entity.SolicitudUsuario;
import co.com.icvc.intranet_backend.user.enums.EstadoSolicitud;
import co.com.icvc.intranet_backend.user.repository.SolicitudUsuarioRepository;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccessRequestService {

    private final SolicitudUsuarioRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<SolicitudUsuarioDtos.Response> list() {
        return solicitudRepository.findAllByOrderByFechaSolicitudDesc().stream()
                .map(SolicitudUsuarioDtos.Response::from)
                .toList();
    }

    @Transactional
    public SolicitudUsuarioDtos.Response create(SolicitudUsuarioDtos.CreateRequest request) {
        if (usuarioRepository.existsByIdentificacion(request.identificacion())) {
            throw new ConflictException("usuario ya se encuentra creado en el sistema");
        }
        String nombreCompleto = buildNombreCompleto(request);
        String obs = Mappers.trimToNull(request.observaciones());
        if (obs == null) obs = "";
        SolicitudUsuario solicitud = SolicitudUsuario.builder()
                .identificacion(request.identificacion())
                .nombre(nombreCompleto)
                .primerNombre(request.primerNombre())
                .segundoNombre(Mappers.trimToNull(request.segundoNombre()))
                .primerApellido(request.primerApellido())
                .segundoApellido(request.segundoApellido())
                .cargo(request.cargo())
                .correo(request.correo())
                .celular(request.celular())
                .fechaNacimiento(request.fechaNacimiento())
                .estado(EstadoSolicitud.PENDIENTE)
                .fechaSolicitud(LocalDateTime.now())
                .observaciones(obs)
                .build();
        return SolicitudUsuarioDtos.Response.from(solicitudRepository.save(solicitud));
    }

    private String buildNombreCompleto(SolicitudUsuarioDtos.CreateRequest r) {
        if (r.primerNombre() != null && r.primerApellido() != null) {
            StringBuilder sb = new StringBuilder(r.primerNombre().trim());
            if (r.segundoNombre() != null && !r.segundoNombre().isBlank()) sb.append(" ").append(r.segundoNombre().trim());
            sb.append(" ").append(r.primerApellido().trim());
            if (r.segundoApellido() != null && !r.segundoApellido().isBlank()) sb.append(" ").append(r.segundoApellido().trim());
            return sb.toString().trim();
        }
        return r.nombre() != null ? r.nombre().trim() : "";
    }

    @Transactional
    public SolicitudUsuarioDtos.Response approve(Integer id, String motivo) {
        SolicitudUsuario solicitud = require(id);
        if (solicitud.getEstado() == EstadoSolicitud.APROBADA) {
            throw new ConflictException("La solicitud ya está aprobada");
        }
        boolean wasRejected = solicitud.getEstado() == EstadoSolicitud.RECHAZADA;
        if (wasRejected) {
            String obs = Mappers.trimToNull(motivo);
            if (obs == null || obs.isBlank()) {
                throw new ConflictException("Debe indicar el motivo de aprobación tras rechazo");
            }
            if (obs.length() > 1000) {
                throw new ConflictException("El motivo no puede exceder 1000 caracteres");
            }
            solicitud.setObservaciones(obs);
        } else if (motivo != null && !motivo.isBlank()) {
            String obs = Mappers.trimToNull(motivo);
            if (obs != null && obs.length() > 1000) {
                throw new ConflictException("El motivo no puede exceder 1000 caracteres");
            }
            if (obs != null) solicitud.setObservaciones(obs);
        }
        // Permitir aprobar desde PENDIENTE o RECHAZADA (rechazo reversible)
        solicitud.setEstado(EstadoSolicitud.APROBADA);
        solicitud.setFechaAprobacion(LocalDateTime.now());
        solicitud.setFechaRechazo(null);
        return SolicitudUsuarioDtos.Response.from(solicitudRepository.save(solicitud));
    }

    @Transactional
    public SolicitudUsuarioDtos.Response approve(Integer id) {
        return approve(id, null);
    }

    @Transactional
    public SolicitudUsuarioDtos.Response reject(Integer id, String motivo) {
        SolicitudUsuario solicitud = require(id);
        if (solicitud.getEstado() == EstadoSolicitud.RECHAZADA) {
            throw new ConflictException("La solicitud ya está rechazada");
        }
        if (solicitud.getEstado() == EstadoSolicitud.APROBADA) {
            throw new ConflictException("No se puede rechazar una solicitud ya aprobada");
        }
        String obs = Mappers.trimToNull(motivo);
        if (obs != null && obs.length() > 1000) {
            throw new ConflictException("El motivo no puede exceder 1000 caracteres");
        }
        solicitud.setEstado(EstadoSolicitud.RECHAZADA);
        solicitud.setFechaRechazo(LocalDateTime.now());
        solicitud.setObservaciones(obs != null ? obs : "");
        return SolicitudUsuarioDtos.Response.from(solicitudRepository.save(solicitud));
    }

    @Transactional
    public SolicitudUsuarioDtos.Response reject(Integer id) {
        return reject(id, null);
    }

    private SolicitudUsuario require(Integer id) {
        return solicitudRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Solicitud de acceso", id));
    }
}
package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.common.exception.ConflictException;
import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.user.dto.SolicitudUsuarioDtos;
import co.com.icvc.intranet_backend.user.entity.SolicitudUsuario;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.enums.EstadoSolicitud;
import co.com.icvc.intranet_backend.user.repository.SolicitudUsuarioRepository;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    public static final String RESET_MARKER = "RESET_PASSWORD";

    private final SolicitudUsuarioRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<SolicitudUsuarioDtos.Response> list() {
        return solicitudRepository.findAllByOrderByFechaSolicitudDesc().stream()
                .filter(solicitud -> solicitud.getObservaciones() != null
                        && solicitud.getObservaciones().startsWith(RESET_MARKER))
                .map(SolicitudUsuarioDtos.Response::from)
                .toList();
    }

    @Transactional
    public SolicitudUsuarioDtos.Response create(Long identificacion, String observacion) {
        SolicitudUsuario solicitud = SolicitudUsuario.builder()
                .identificacion(identificacion)
                .nombre("")
                .cargo("")
                .correo("")
                .estado(EstadoSolicitud.PENDIENTE)
                .fechaSolicitud(LocalDateTime.now())
                .observaciones(RESET_MARKER + "|" + (observacion == null ? "" : observacion))
                .build();
        return SolicitudUsuarioDtos.Response.from(solicitudRepository.save(solicitud));
    }

    @Transactional
    public SolicitudUsuarioDtos.Response complete(Integer id) {
        SolicitudUsuario solicitud = solicitudRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Solicitud de reset de contraseña", id));
        if (solicitud.getEstado() != EstadoSolicitud.PENDIENTE) {
            throw new ConflictException("La solicitud ya fue procesada");
        }
        Usuario usuario = usuarioRepository.findAll().stream()
                .filter(u -> u.getIdentificacion().equals(solicitud.getIdentificacion()))
                .findFirst()
                .orElseThrow(() -> NotFoundException.of("Usuario con identificación", solicitud.getIdentificacion()));
        usuario.setPasswordHash(passwordEncoder.encode(String.valueOf(usuario.getIdentificacion())));
        usuarioRepository.save(usuario);
        solicitud.setEstado(EstadoSolicitud.APROBADA);
        solicitud.setFechaAprobacion(LocalDateTime.now());
        return SolicitudUsuarioDtos.Response.from(solicitudRepository.save(solicitud));
    }
}
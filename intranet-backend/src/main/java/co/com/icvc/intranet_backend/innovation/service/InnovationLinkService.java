package co.com.icvc.intranet_backend.innovation.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.innovation.dto.InnovationDtos;
import co.com.icvc.intranet_backend.innovation.entity.EnlaceInnovacion;
import co.com.icvc.intranet_backend.innovation.repository.EnlaceInnovacionRepository;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InnovationLinkService {

    private final EnlaceInnovacionRepository enlaceRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<InnovationDtos.Response> list() {
        return enlaceRepository.findAllByOrderByFechaCreacionDesc().stream()
                .map(InnovationDtos.Response::from)
                .toList();
    }

    @Transactional
    public InnovationDtos.Response create(InnovationDtos.CreateRequest request) {
        Usuario creador = usuarioRepository.findById(request.creadorOid())
                .orElseThrow(() -> NotFoundException.of("Usuario", request.creadorOid()));
        EnlaceInnovacion enlace = EnlaceInnovacion.builder()
                .nombre(request.nombre())
                .url(request.url())
                .creador(creador)
                .fechaCreacion(LocalDateTime.now())
                .build();
        return InnovationDtos.Response.from(enlaceRepository.save(enlace));
    }

    @Transactional
    public InnovationDtos.Response update(Integer id, InnovationDtos.CreateRequest request) {
        EnlaceInnovacion enlace = require(id);
        Usuario creador = usuarioRepository.findById(request.creadorOid())
                .orElseThrow(() -> NotFoundException.of("Usuario", request.creadorOid()));
        enlace.setNombre(request.nombre());
        enlace.setUrl(request.url());
        enlace.setCreador(creador);
        return InnovationDtos.Response.from(enlaceRepository.save(enlace));
    }

    @Transactional
    public void delete(Integer id) {
        enlaceRepository.delete(require(id));
    }

    private EnlaceInnovacion require(Integer id) {
        return enlaceRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Enlace de innovación", id));
    }
}
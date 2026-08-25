package co.com.icvc.intranet_backend.communication.service;

import co.com.icvc.intranet_backend.common.exception.ConflictException;
import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.mapper.Mappers;
import co.com.icvc.intranet_backend.communication.dto.TareaDtos;
import co.com.icvc.intranet_backend.communication.entity.ArchivoTarea;
import co.com.icvc.intranet_backend.communication.entity.ComentarioTarea;
import co.com.icvc.intranet_backend.communication.entity.TareaSeguimiento;
import co.com.icvc.intranet_backend.communication.entity.UsuarioComunicacion;
import co.com.icvc.intranet_backend.communication.enums.EstadoTarea;
import co.com.icvc.intranet_backend.communication.enums.PrioridadTarea;
import co.com.icvc.intranet_backend.communication.repository.ArchivoTareaRepository;
import co.com.icvc.intranet_backend.communication.repository.ComentarioTareaRepository;
import co.com.icvc.intranet_backend.communication.repository.TareaSeguimientoRepository;
import co.com.icvc.intranet_backend.communication.repository.UsuarioComunicacionRepository;
import co.com.icvc.intranet_backend.portal.dto.PortalDtos;
import co.com.icvc.intranet_backend.portal.entity.Archivo;
import co.com.icvc.intranet_backend.portal.service.FileService;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TareaSeguimientoRepository tareaRepository;
    private final UsuarioComunicacionRepository usuarioComunicacionRepository;
    private final ComentarioTareaRepository comentarioRepository;
    private final ArchivoTareaRepository archivoTareaRepository;
    private final UsuarioRepository usuarioRepository;
    private final FileService fileService;

    @Transactional(readOnly = true)
    public List<TareaDtos.Response> list() {
        return tareaRepository.findAllByOrderByFechaLimiteAsc().stream()
                .map(TareaDtos.Response::from)
                .toList();
    }

    @Transactional
    public TareaDtos.Response create(TareaDtos.CreateRequest request) {
        TareaSeguimiento tarea = TareaSeguimiento.builder()
                .titulo(request.titulo())
                .descripcion(request.descripcion())
                .asignadaA(requireUsuarioComunicacion(request.asignadaAOid()))
                .asignadaPor(requireUsuarioComunicacion(request.asignadaPorOid()))
                .estado(EstadoTarea.PENDIENTE)
                .fechaInicio(request.fechaInicio())
                .fechaLimite(request.fechaLimite())
                .prioridad(Mappers.enumValue(PrioridadTarea.class, request.prioridad(), "Prioridad inválida"))
                .build();
        return TareaDtos.Response.from(tareaRepository.save(tarea));
    }

    @Transactional
    public TareaDtos.Response update(Integer id, TareaDtos.CreateRequest request) {
        TareaSeguimiento tarea = require(id);
        tarea.setTitulo(request.titulo());
        tarea.setDescripcion(request.descripcion());
        tarea.setAsignadaA(requireUsuarioComunicacion(request.asignadaAOid()));
        tarea.setAsignadaPor(requireUsuarioComunicacion(request.asignadaPorOid()));
        tarea.setFechaInicio(request.fechaInicio());
        tarea.setFechaLimite(request.fechaLimite());
        tarea.setPrioridad(Mappers.enumValue(PrioridadTarea.class, request.prioridad(), "Prioridad inválida"));
        return TareaDtos.Response.from(tareaRepository.save(tarea));
    }

    @Transactional
    public TareaDtos.Response complete(Integer id) {
        TareaSeguimiento tarea = require(id);
        if (tarea.getEstado() == EstadoTarea.COMPLETADA) {
            throw new ConflictException("La tarea ya está completada");
        }
        tarea.setEstado(EstadoTarea.COMPLETADA);
        return TareaDtos.Response.from(tareaRepository.save(tarea));
    }

    @Transactional
    public TareaDtos.ComentarioResponse addComment(Integer id, TareaDtos.ComentarioRequest request) {
        TareaSeguimiento tarea = require(id);
        Usuario autor = usuarioRepository.findById(request.autorOid())
                .orElseThrow(() -> NotFoundException.of("Usuario", request.autorOid()));
        ComentarioTarea comentario = ComentarioTarea.builder()
                .tarea(tarea)
                .descripcion(request.descripcion())
                .fecha(LocalDateTime.now())
                .autor(autor)
                .build();
        return TareaDtos.ComentarioResponse.from(comentarioRepository.save(comentario));
    }

    @Transactional(readOnly = true)
    public List<TareaDtos.ComentarioResponse> comments(Integer id) {
        return comentarioRepository.findAllByTareaOidOrderByFechaAsc(id).stream()
                .map(TareaDtos.ComentarioResponse::from)
                .toList();
    }

    @Transactional
    public PortalDtos.ArchivoResponse attachFile(Integer id, MultipartFile file, Integer usuarioOid) {
        TareaSeguimiento tarea = require(id);
        Archivo archivo = fileService.store(file, usuarioOid);
        archivoTareaRepository.save(ArchivoTarea.builder().tarea(tarea).archivo(archivo).build());
        return PortalDtos.ArchivoResponse.from(archivo);
    }

    private TareaSeguimiento require(Integer id) {
        return tareaRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Tarea", id));
    }

    private UsuarioComunicacion requireUsuarioComunicacion(Integer oid) {
        return usuarioComunicacionRepository.findById(oid)
                .orElseThrow(() -> NotFoundException.of("Usuario de comunicación", oid));
    }
}
package co.com.icvc.intranet_backend.communication.service;

import co.com.icvc.intranet_backend.common.exception.ConflictException;
import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.mapper.Mappers;
import co.com.icvc.intranet_backend.communication.dto.AnuncioDtos;
import co.com.icvc.intranet_backend.communication.entity.Anuncio;
import co.com.icvc.intranet_backend.communication.entity.ArchivoAnuncio;
import co.com.icvc.intranet_backend.communication.entity.TipoAnuncio;
import co.com.icvc.intranet_backend.communication.entity.UsuarioComunicacion;
import co.com.icvc.intranet_backend.communication.enums.EstadoAnuncio;
import co.com.icvc.intranet_backend.communication.repository.AnuncioRepository;
import co.com.icvc.intranet_backend.communication.repository.ArchivoAnuncioRepository;
import co.com.icvc.intranet_backend.communication.repository.TipoAnuncioRepository;
import co.com.icvc.intranet_backend.communication.repository.UsuarioComunicacionRepository;
import co.com.icvc.intranet_backend.portal.dto.PortalDtos;
import co.com.icvc.intranet_backend.portal.entity.Archivo;
import co.com.icvc.intranet_backend.portal.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnuncioRepository anuncioRepository;
    private final TipoAnuncioRepository tipoRepository;
    private final UsuarioComunicacionRepository usuarioComunicacionRepository;
    private final ArchivoAnuncioRepository archivoAnuncioRepository;
    private final FileService fileService;

    @Transactional(readOnly = true)
    public List<AnuncioDtos.Response> list(String estado) {
        if (estado == null || estado.isBlank()) {
            return anuncioRepository.findAllByEliminadoFalseOrderByFechaCreacionDesc().stream()
                    .map(AnuncioDtos.Response::from)
                    .toList();
        }
        EstadoAnuncio estadoAnuncio = Mappers.enumValue(EstadoAnuncio.class, estado, "Estado de anuncio inválido");
        return anuncioRepository.findAllByEliminadoFalseAndEstadoOrderByFechaCreacionDesc(estadoAnuncio).stream()
                .map(AnuncioDtos.Response::from)
                .toList();
    }

    @Transactional
    public AnuncioDtos.Response create(AnuncioDtos.CreateRequest request, Integer creadorOid) {
        TipoAnuncio tipo = tipoRepository.findById(request.tipoOid())
                .orElseThrow(() -> NotFoundException.of("Tipo de anuncio", request.tipoOid()));
        UsuarioComunicacion creador = creadorOid != null
                ? usuarioComunicacionRepository.findById(creadorOid).orElse(null)
                : null;
        Anuncio anuncio = Anuncio.builder()
                .titulo(request.titulo())
                .descripcion(request.descripcion())
                .tipo(tipo)
                .fechaInicio(request.fechaInicio())
                .fechaFin(request.fechaFin())
                .fechaVencimiento(request.fechaVencimiento())
                .creador(creador)
                .estado(EstadoAnuncio.PENDIENTE)
                .fechaCreacion(LocalDateTime.now())
                .eliminado(false)
                .build();
        return AnuncioDtos.Response.from(anuncioRepository.save(anuncio));
    }

    @Transactional
    public AnuncioDtos.Response update(Integer id, AnuncioDtos.CreateRequest request) {
        Anuncio anuncio = require(id);
        TipoAnuncio tipo = tipoRepository.findById(request.tipoOid())
                .orElseThrow(() -> NotFoundException.of("Tipo de anuncio", request.tipoOid()));
        anuncio.setTitulo(request.titulo());
        anuncio.setDescripcion(request.descripcion());
        anuncio.setTipo(tipo);
        anuncio.setFechaInicio(request.fechaInicio());
        anuncio.setFechaFin(request.fechaFin());
        anuncio.setFechaVencimiento(request.fechaVencimiento());
        return AnuncioDtos.Response.from(anuncioRepository.save(anuncio));
    }

    @Transactional
    public void delete(Integer id) {
        Anuncio anuncio = require(id);
        anuncio.setEliminado(true);
        anuncioRepository.save(anuncio);
    }

    @Transactional
    public AnuncioDtos.Response publish(Integer id) {
        Anuncio anuncio = require(id);
        if (anuncio.getEstado() == EstadoAnuncio.PUBLICADO) {
            throw new ConflictException("El anuncio ya está publicado");
        }
        anuncio.setEstado(EstadoAnuncio.PUBLICADO);
        return AnuncioDtos.Response.from(anuncioRepository.save(anuncio));
    }

    @Transactional
    public PortalDtos.ArchivoResponse attachFile(Integer id, MultipartFile file, Integer usuarioOid) {
        Anuncio anuncio = require(id);
        Archivo archivo = fileService.store(file, usuarioOid);
        ArchivoAnuncio relacion = ArchivoAnuncio.builder()
                .anuncio(anuncio)
                .archivo(archivo)
                .build();
        archivoAnuncioRepository.save(relacion);
        return PortalDtos.ArchivoResponse.from(archivo);
    }

    @Transactional(readOnly = true)
    public List<AnuncioDtos.TipoResponse> tipos() {
        return tipoRepository.findAllByOrderByNombreAsc().stream()
                .map(AnuncioDtos.TipoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PortalDtos.ArchivoResponse> archivos(Integer id) {
        return archivoAnuncioRepository.findAllByAnuncioOid(id).stream()
                .map(relacion -> PortalDtos.ArchivoResponse.from(relacion.getArchivo()))
                .toList();
    }

    private Anuncio require(Integer id) {
        return anuncioRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Anuncio", id));
    }
}
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
import co.com.icvc.intranet_backend.user.dto.LogAuditoriaDtos;
import co.com.icvc.intranet_backend.user.repository.LogAuditoriaRepository;
import co.com.icvc.intranet_backend.user.service.AuditService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
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
    private final AuditService auditService;
    private final LogAuditoriaRepository logAuditoriaRepository;
    private final ObjectMapper objectMapper;

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
        UsuarioComunicacion creador = null;
        if (creadorOid != null) {
            creador = usuarioComunicacionRepository.findByUsuarioOid(creadorOid).orElse(null);
            if (creador == null) {
                creador = usuarioComunicacionRepository.findById(creadorOid).orElse(null);
            }
        }
        String codigo = generateCodigo();
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
                .codigo(codigo)
                .areaInforma(request.areaInforma())
                .build();
        return AnuncioDtos.Response.from(anuncioRepository.save(anuncio));
    }

    private String generateCodigo() {
        LocalDate now = LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();
        // Secuencia global autoincremental que continúa aunque cambie el mes
        long baseSeq = anuncioRepository.count() + 1;
        // Asegurar que no colisione si hubo borrados físicos
        String codigo;
        long seq = baseSeq;
        do {
            codigo = String.format("SOLANU-%04d-%02d-%04d", year, month, seq);
            seq++;
            if (seq > baseSeq + 10000) break; // salvaguarda
        } while (anuncioRepository.existsByCodigo(codigo) && seq < baseSeq + 10000);
        // Si colisionó, usar max oid +1 como fallback
        if (anuncioRepository.existsByCodigo(codigo)) {
            long maxOid = anuncioRepository.findTopByOrderByOidDesc().map(a -> (long) a.getOid()).orElse(baseSeq);
            codigo = String.format("SOLANU-%04d-%02d-%04d", year, month, maxOid + 1);
        }
        return codigo;
    }

    @Transactional
    public AnuncioDtos.Response update(Integer id, AnuncioDtos.CreateRequest request, Integer editorOid, String ip) {
        Anuncio anuncio = require(id);
        // Snapshot ANTES de la modificación para dejar registro de qué cambió.
        AnuncioDtos.Response before = AnuncioDtos.Response.from(anuncio);
        UsuarioComunicacion creadorExistente = anuncio.getCreador();
        TipoAnuncio tipo = tipoRepository.findById(request.tipoOid())
                .orElseThrow(() -> NotFoundException.of("Tipo de anuncio", request.tipoOid()));
        anuncio.setTitulo(request.titulo());
        anuncio.setDescripcion(request.descripcion());
        anuncio.setTipo(tipo);
        anuncio.setFechaInicio(request.fechaInicio());
        anuncio.setFechaFin(request.fechaFin());
        anuncio.setFechaVencimiento(request.fechaVencimiento());
        anuncio.setAreaInforma(request.areaInforma());
        // Preservar explícitamente el creador original
        if (creadorExistente != null) {
            anuncio.setCreador(creadorExistente);
        }
        Anuncio saved = anuncioRepository.save(anuncio);
        AnuncioDtos.Response after = AnuncioDtos.Response.from(saved);
        registrarEdicion(saved, before, after, editorOid, ip);
        return after;
    }

    // Deja un registro en la auditoría (genlogs) con los valores antes/después de la edición.
    private void registrarEdicion(Anuncio anuncio, AnuncioDtos.Response before, AnuncioDtos.Response after,
            Integer editorOid, String ip) {
        if (editorOid == null) {
            return;
        }
        auditService.registrar("ACTUALIZAR", "comanuncio", registroKey(anuncio),
                toJson(before), toJson(after), editorOid, ip);
    }

    @Transactional(readOnly = true)
    public List<LogAuditoriaDtos.Response> history(Integer id) {
        Anuncio anuncio = require(id);
        return logAuditoriaRepository
                .findAllByTablaAndRegistroOrderByFechaCambioDesc("comanuncio", registroKey(anuncio)).stream()
                .map(LogAuditoriaDtos.Response::from)
                .toList();
    }

    private String registroKey(Anuncio anuncio) {
        return anuncio.getCodigo() != null ? anuncio.getCodigo() : String.valueOf(anuncio.getOid());
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            return null;
        }
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
    public AnuncioDtos.Response reject(Integer id, String observation) {
        Anuncio anuncio = require(id);
        anuncio.setEstado(EstadoAnuncio.RECHAZADO);
        if (observation != null && !observation.isBlank()) {
            String desc = anuncio.getDescripcion() == null ? "" : anuncio.getDescripcion();
            // append observation for audit, keep original
            anuncio.setDescripcion(desc + "\n[Rechazo: " + observation.trim() + "]");
        }
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
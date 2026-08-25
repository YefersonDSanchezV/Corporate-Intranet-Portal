package co.com.icvc.intranet_backend.communication.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.communication.dto.LogroDtos;
import co.com.icvc.intranet_backend.communication.entity.ArchivoLogro;
import co.com.icvc.intranet_backend.communication.entity.LogroAcreditacion;
import co.com.icvc.intranet_backend.communication.repository.ArchivoLogroRepository;
import co.com.icvc.intranet_backend.communication.repository.LogroAcreditacionRepository;
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
public class AchievementService {

    private final LogroAcreditacionRepository logroRepository;
    private final ArchivoLogroRepository archivoLogroRepository;
    private final FileService fileService;

    @Transactional(readOnly = true)
    public List<LogroDtos.Response> list() {
        return logroRepository.findAllByOrderByFechaCreacionDesc().stream()
                .map(LogroDtos.Response::from)
                .toList();
    }

    @Transactional
    public LogroDtos.Response create(LogroDtos.CreateRequest request) {
        LogroAcreditacion logro = LogroAcreditacion.builder()
                .titulo(request.titulo())
                .descripcion(request.descripcion())
                .urlImagen(request.urlImagen())
                .fechaCreacion(LocalDateTime.now())
                .build();
        return LogroDtos.Response.from(logroRepository.save(logro));
    }

    @Transactional
    public LogroDtos.Response update(Integer id, LogroDtos.CreateRequest request) {
        LogroAcreditacion logro = require(id);
        logro.setTitulo(request.titulo());
        logro.setDescripcion(request.descripcion());
        logro.setUrlImagen(request.urlImagen());
        return LogroDtos.Response.from(logroRepository.save(logro));
    }

    @Transactional
    public void delete(Integer id) {
        logroRepository.delete(require(id));
    }

    @Transactional
    public PortalDtos.ArchivoResponse attachFile(Integer id, MultipartFile file, Integer usuarioOid) {
        LogroAcreditacion logro = require(id);
        Archivo archivo = fileService.store(file, usuarioOid);
        archivoLogroRepository.save(ArchivoLogro.builder().logro(logro).archivo(archivo).build());
        return PortalDtos.ArchivoResponse.from(archivo);
    }

    @Transactional(readOnly = true)
    public List<PortalDtos.ArchivoResponse> archivos(Integer id) {
        return archivoLogroRepository.findAllByLogroOid(id).stream()
                .map(relacion -> PortalDtos.ArchivoResponse.from(relacion.getArchivo()))
                .toList();
    }

    private LogroAcreditacion require(Integer id) {
        return logroRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Logro/Acreditación", id));
    }
}
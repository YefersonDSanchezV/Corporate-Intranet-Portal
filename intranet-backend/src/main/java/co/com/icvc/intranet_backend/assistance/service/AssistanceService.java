package co.com.icvc.intranet_backend.assistance.service;

import co.com.icvc.intranet_backend.assistance.dto.AssistanceDtos;
import co.com.icvc.intranet_backend.assistance.entity.ArchivoFormato;
import co.com.icvc.intranet_backend.assistance.entity.FormatoContingencia;
import co.com.icvc.intranet_backend.assistance.entity.SitioExterno;
import co.com.icvc.intranet_backend.assistance.repository.ArchivoFormatoRepository;
import co.com.icvc.intranet_backend.assistance.repository.FormatoContingenciaRepository;
import co.com.icvc.intranet_backend.assistance.repository.SitioExternoRepository;
import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.mapper.Mappers;
import co.com.icvc.intranet_backend.portal.dto.PortalDtos;
import co.com.icvc.intranet_backend.portal.entity.Archivo;
import co.com.icvc.intranet_backend.portal.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AssistanceService {

    private final SitioExternoRepository sitioExternoRepository;
    private final FormatoContingenciaRepository formatoRepository;
    private final ArchivoFormatoRepository archivoFormatoRepository;
    private final FileService fileService;

    @Transactional(readOnly = true)
    public List<AssistanceDtos.SitioExternoResponse> listExternalSites() {
        return sitioExternoRepository.findAllByOrderByNombreAsc().stream()
                .map(AssistanceDtos.SitioExternoResponse::from)
                .toList();
    }

    @Transactional
    public AssistanceDtos.SitioExternoResponse createExternalSite(AssistanceDtos.SitioExternoRequest request) {
        SitioExterno sitio = SitioExterno.builder()
                .nombre(request.nombre())
                .url(request.url())
                .build();
        return AssistanceDtos.SitioExternoResponse.from(sitioExternoRepository.save(sitio));
    }

    @Transactional
    public AssistanceDtos.SitioExternoResponse updateExternalSite(Integer id, AssistanceDtos.SitioExternoRequest request) {
        SitioExterno sitio = sitioExternoRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Sitio externo", id));
        sitio.setNombre(request.nombre());
        sitio.setUrl(request.url());
        return AssistanceDtos.SitioExternoResponse.from(sitioExternoRepository.save(sitio));
    }

    @Transactional
    public void deleteExternalSite(Integer id) {
        sitioExternoRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<AssistanceDtos.FormatoResponse> listFormats() {
        return formatoRepository.findAllByOrderByNombreAsc().stream()
                .map(AssistanceDtos.FormatoResponse::from)
                .toList();
    }

    @Transactional
    public AssistanceDtos.FormatoResponse createFormat(AssistanceDtos.FormatoRequest request) {
        FormatoContingencia formato = FormatoContingencia.builder()
                .nombre(Mappers.trimToNull(request.nombre()))
                .observaciones(Mappers.trimToNull(request.observaciones()))
                .codigo(Mappers.trimToNull(request.codigo()))
                .build();
        return AssistanceDtos.FormatoResponse.from(formatoRepository.save(formato));
    }

    @Transactional
    public AssistanceDtos.FormatoResponse updateFormat(Integer id, AssistanceDtos.FormatoRequest request) {
        FormatoContingencia formato = formatoRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Formato de contingencia", id));
        formato.setNombre(Mappers.trimToNull(request.nombre()));
        formato.setObservaciones(Mappers.trimToNull(request.observaciones()));
        formato.setCodigo(Mappers.trimToNull(request.codigo()));
        return AssistanceDtos.FormatoResponse.from(formatoRepository.save(formato));
    }

    @Transactional
    public void deleteFormat(Integer id) {
        formatoRepository.deleteById(id);
    }

    @Transactional
    public PortalDtos.ArchivoResponse attachFile(Integer id, MultipartFile file, Integer usuarioOid) {
        FormatoContingencia formato = formatoRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Formato de contingencia", id));
        Archivo archivo = fileService.store(file, usuarioOid);
        archivoFormatoRepository.save(ArchivoFormato.builder().formato(formato).archivo(archivo).build());
        return PortalDtos.ArchivoResponse.from(archivo);
    }

    @Transactional(readOnly = true)
    public List<PortalDtos.ArchivoResponse> archivos(Integer id) {
        return archivoFormatoRepository.findAllByFormatoOid(id).stream()
                .map(relacion -> PortalDtos.ArchivoResponse.from(relacion.getArchivo()))
                .toList();
    }
}
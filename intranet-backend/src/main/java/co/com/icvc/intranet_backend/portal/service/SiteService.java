package co.com.icvc.intranet_backend.portal.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.portal.dto.PortalDtos;
import co.com.icvc.intranet_backend.portal.entity.Modulo;
import co.com.icvc.intranet_backend.portal.entity.SitioRedireccion;
import co.com.icvc.intranet_backend.portal.repository.ModuloRepository;
import co.com.icvc.intranet_backend.portal.repository.SitioRedireccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SiteService {

    private final SitioRedireccionRepository sitioRepository;
    private final ModuloRepository moduloRepository;

    @Transactional(readOnly = true)
    public List<PortalDtos.SitioResponse> list(Integer moduloOid) {
        List<SitioRedireccion> sitios = moduloOid != null
                ? sitioRepository.findAllByModuloOidOrderByNombreAsc(moduloOid)
                : sitioRepository.findAllByOrderByNombreAsc();
        return sitios.stream().map(PortalDtos.SitioResponse::from).toList();
    }

    @Transactional
    public PortalDtos.SitioResponse create(PortalDtos.SitioRequest request) {
        Modulo modulo = moduloRepository.findById(request.moduloOid())
                .orElseThrow(() -> NotFoundException.of("Módulo", request.moduloOid()));
        SitioRedireccion sitio = SitioRedireccion.builder()
                .nombre(request.nombre())
                .url(request.url())
                .modulo(modulo)
                .icono(request.icono())
                .build();
        return PortalDtos.SitioResponse.from(sitioRepository.save(sitio));
    }

    @Transactional
    public PortalDtos.SitioResponse update(Integer id, PortalDtos.SitioRequest request) {
        SitioRedireccion sitio = require(id);
        Modulo modulo = moduloRepository.findById(request.moduloOid())
                .orElseThrow(() -> NotFoundException.of("Módulo", request.moduloOid()));
        sitio.setNombre(request.nombre());
        sitio.setUrl(request.url());
        sitio.setModulo(modulo);
        sitio.setIcono(request.icono());
        return PortalDtos.SitioResponse.from(sitioRepository.save(sitio));
    }

    @Transactional(readOnly = true)
    public PortalDtos.SitioResponse get(Integer id) {
        return PortalDtos.SitioResponse.from(require(id));
    }

    @Transactional
    public void delete(Integer id) {
        sitioRepository.delete(require(id));
    }

    private SitioRedireccion require(Integer id) {
        return sitioRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Sitio de redirección", id));
    }
}
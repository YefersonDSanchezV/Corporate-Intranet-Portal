package co.com.icvc.intranet_backend.portal.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.common.mapper.Mappers;
import co.com.icvc.intranet_backend.portal.dto.PortalDtos;
import co.com.icvc.intranet_backend.portal.entity.Modulo;
import co.com.icvc.intranet_backend.portal.repository.ModuloRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuloRepository moduloRepository;

    @Transactional(readOnly = true)
    public List<PortalDtos.ModuloResponse> list() {
        return moduloRepository.findAllByOrderByNombreAsc().stream()
                .map(PortalDtos.ModuloResponse::from)
                .toList();
    }

    @Transactional
    public PortalDtos.ModuloResponse create(String nombre, boolean estado) {
        String nombreLimpio = Mappers.trimToNull(nombre);
        if (nombreLimpio == null) {
            throw new ValidationException("El nombre del módulo es obligatorio");
        }
        Modulo modulo = Modulo.builder().nombre(nombreLimpio).estado(estado).build();
        return PortalDtos.ModuloResponse.from(moduloRepository.save(modulo));
    }

    @Transactional
    public void updateEstado(Integer id, boolean estado) {
        Modulo modulo = moduloRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Módulo", id));
        modulo.setEstado(estado);
        moduloRepository.save(modulo);
    }
}
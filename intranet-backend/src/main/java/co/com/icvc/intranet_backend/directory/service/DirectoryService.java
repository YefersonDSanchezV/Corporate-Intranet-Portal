package co.com.icvc.intranet_backend.directory.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.directory.dto.DirectoryDtos;
import co.com.icvc.intranet_backend.directory.entity.Area;
import co.com.icvc.intranet_backend.directory.entity.CorreoDirectorio;
import co.com.icvc.intranet_backend.directory.entity.ExtensionDirectorio;
import co.com.icvc.intranet_backend.directory.entity.Piso;
import co.com.icvc.intranet_backend.directory.repository.AreaRepository;
import co.com.icvc.intranet_backend.directory.repository.CorreoDirectorioRepository;
import co.com.icvc.intranet_backend.directory.repository.ExtensionDirectorioRepository;
import co.com.icvc.intranet_backend.directory.repository.PisoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DirectoryService {

    private final ExtensionDirectorioRepository extensionRepository;
    private final CorreoDirectorioRepository correoRepository;
    private final AreaRepository areaRepository;
    private final PisoRepository pisoRepository;

    @Transactional(readOnly = true)
    public List<DirectoryDtos.ExtensionResponse> listExtensions(boolean soloSoporte) {
        List<ExtensionDirectorio> extensiones = soloSoporte
                ? extensionRepository.findAllBySoporteTrue()
                : extensionRepository.findAllByOrderByNombreAsc();
        return extensiones.stream().map(DirectoryDtos.ExtensionResponse::from).toList();
    }

    @Transactional
    public DirectoryDtos.ExtensionResponse createExtension(DirectoryDtos.ExtensionRequest request) {
        ExtensionDirectorio extension = ExtensionDirectorio.builder()
                .nombre(request.nombre())
                .extension(request.extension())
                .area(requireArea(request.areaOid()))
                .piso(requirePiso(request.pisoOid()))
                .soporte(request.soporte())
                .build();
        return DirectoryDtos.ExtensionResponse.from(extensionRepository.save(extension));
    }

    @Transactional
    public DirectoryDtos.ExtensionResponse updateExtension(Integer id, DirectoryDtos.ExtensionRequest request) {
        ExtensionDirectorio extension = requireExtension(id);
        extension.setNombre(request.nombre());
        extension.setExtension(request.extension());
        extension.setArea(requireArea(request.areaOid()));
        extension.setPiso(requirePiso(request.pisoOid()));
        extension.setSoporte(request.soporte());
        return DirectoryDtos.ExtensionResponse.from(extensionRepository.save(extension));
    }

    @Transactional
    public void deleteExtension(Integer id) {
        extensionRepository.delete(requireExtension(id));
    }

    @Transactional(readOnly = true)
    public List<DirectoryDtos.CorreoResponse> listEmails(boolean soloSoporte) {
        List<CorreoDirectorio> correos = soloSoporte
                ? correoRepository.findAllBySoporteTrue()
                : correoRepository.findAllByOrderByNombreAsc();
        return correos.stream().map(DirectoryDtos.CorreoResponse::from).toList();
    }

    @Transactional
    public DirectoryDtos.CorreoResponse createEmail(DirectoryDtos.CorreoRequest request) {
        CorreoDirectorio correo = CorreoDirectorio.builder()
                .nombre(request.nombre())
                .correo(request.correo())
                .area(requireArea(request.areaOid()))
                .piso(requirePiso(request.pisoOid()))
                .soporte(request.soporte())
                .build();
        return DirectoryDtos.CorreoResponse.from(correoRepository.save(correo));
    }

    @Transactional
    public DirectoryDtos.CorreoResponse updateEmail(Integer id, DirectoryDtos.CorreoRequest request) {
        CorreoDirectorio correo = requireEmail(id);
        correo.setNombre(request.nombre());
        correo.setCorreo(request.correo());
        correo.setArea(requireArea(request.areaOid()));
        correo.setPiso(requirePiso(request.pisoOid()));
        correo.setSoporte(request.soporte());
        return DirectoryDtos.CorreoResponse.from(correoRepository.save(correo));
    }

    @Transactional
    public void deleteEmail(Integer id) {
        correoRepository.delete(requireEmail(id));
    }

    @Transactional(readOnly = true)
    public List<DirectoryDtos.AreaResponse> listAreas() {
        return areaRepository.findAllByOrderByNombreAsc().stream()
                .map(DirectoryDtos.AreaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DirectoryDtos.PisoResponse> listFloors() {
        return pisoRepository.findAllByOrderByNombreAsc().stream()
                .map(DirectoryDtos.PisoResponse::from)
                .toList();
    }

    private Area requireArea(Integer id) {
        return areaRepository.findById(id).orElseThrow(() -> NotFoundException.of("Área", id));
    }

    private Piso requirePiso(Integer id) {
        return pisoRepository.findById(id).orElseThrow(() -> NotFoundException.of("Piso", id));
    }

    private ExtensionDirectorio requireExtension(Integer id) {
        return extensionRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Extensión de directorio", id));
    }

    private CorreoDirectorio requireEmail(Integer id) {
        return correoRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Correo de directorio", id));
    }
}
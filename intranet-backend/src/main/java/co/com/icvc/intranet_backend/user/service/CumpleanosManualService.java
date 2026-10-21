package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.dto.PosicionFoto;
import co.com.icvc.intranet_backend.portal.entity.PlantillaCumpleanios;
import co.com.icvc.intranet_backend.portal.repository.PlantillaCumpleaniosRepository;
import co.com.icvc.intranet_backend.user.dto.CumpleanosManualDtos;
import co.com.icvc.intranet_backend.user.entity.CumpleanosManual;
import co.com.icvc.intranet_backend.user.repository.CumpleanosManualRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * CRUD de cumpleaños manuales. El cargo se guarda como texto libre escrito
 * por el operador; no referencia al catálogo de cargos del sistema.
 * La plantilla es opcional y se puede asignar desde el formulario o desde el
 * modal de edición del módulo de Cumpleaños.
 */
@Service
@RequiredArgsConstructor
public class CumpleanosManualService {

    private final CumpleanosManualRepository cumpleanosRepository;
    private final PlantillaCumpleaniosRepository plantillaRepository;

    @Transactional(readOnly = true)
    public List<CumpleanosManualDtos.Response> list() {
        return cumpleanosRepository.findAllByOrderByNombreCompletoAsc().stream()
                .map(CumpleanosManualDtos.Response::from)
                .toList();
    }

    @Transactional
    public CumpleanosManualDtos.Response create(CumpleanosManualDtos.CreateRequest request) {
        FechaNacimientoValidator.validar(request.fechaNacimiento());
        String cargo = validarCargo(request.cargo());
        if (request.fotoArchivoOid() == null) {
            throw new ValidationException("La fotografía es obligatoria");
        }
        PlantillaCumpleanios plantilla = resolverPlantilla(request.plantillaOid());
        PosicionFoto posicion = request.posicion() != null ? request.posicion() : PosicionFoto.de(plantilla);
        CumpleanosManual cumpleanos = CumpleanosManual.builder()
                .nombreCompleto(request.nombreCompleto().trim())
                .fechaNacimiento(request.fechaNacimiento())
                .cargo(cargo)
                .fotoArchivoOid(request.fotoArchivoOid())
                .plantilla(plantilla)
                .fotoPx(posicion.px())
                .fotoPy(posicion.py())
                .fotoAncho(posicion.ancho())
                .fotoAlto(posicion.alto())
                .fotoRedondo(posicion.redondo())
                .fotoZoom(posicion.zoom())
                .fotoOffsetX(posicion.offsetX())
                .fotoOffsetY(posicion.offsetY())
                .fechaCreacion(LocalDateTime.now())
                .build();
        return CumpleanosManualDtos.Response.from(cumpleanosRepository.save(cumpleanos));
    }

    @Transactional
    public CumpleanosManualDtos.Response update(Integer id, CumpleanosManualDtos.CreateRequest request) {
        CumpleanosManual cumpleanos = require(id);
        FechaNacimientoValidator.validar(request.fechaNacimiento());
        cumpleanos.setNombreCompleto(request.nombreCompleto().trim());
        cumpleanos.setFechaNacimiento(request.fechaNacimiento());
        cumpleanos.setCargo(validarCargo(request.cargo()));
        if (request.fotoArchivoOid() == null) {
            throw new ValidationException("La fotografía es obligatoria");
        }
        cumpleanos.setFotoArchivoOid(request.fotoArchivoOid());
        if (request.plantillaOid() != null) {
            cumpleanos.setPlantilla(resolverPlantilla(request.plantillaOid()));
        }
        PosicionFoto posicion = request.posicion();
        if (posicion != null) {
            cumpleanos.setFotoPx(posicion.px());
            cumpleanos.setFotoPy(posicion.py());
            cumpleanos.setFotoAncho(posicion.ancho());
            cumpleanos.setFotoAlto(posicion.alto());
            cumpleanos.setFotoRedondo(posicion.redondo());
            cumpleanos.setFotoZoom(posicion.zoom());
            cumpleanos.setFotoOffsetX(posicion.offsetX());
            cumpleanos.setFotoOffsetY(posicion.offsetY());
        }
        cumpleanos.setFechaActualizacion(LocalDateTime.now());
        return CumpleanosManualDtos.Response.from(cumpleanosRepository.save(cumpleanos));
    }

    @Transactional
    public void delete(Integer id) {
        cumpleanosRepository.delete(require(id));
    }

    private PlantillaCumpleanios resolverPlantilla(Integer plantillaOid) {
        if (plantillaOid == null) {
            return null;
        }
        return plantillaRepository.findById(plantillaOid)
                .orElseThrow(() -> NotFoundException.of("Plantilla de cumpleaños", plantillaOid));
    }

    private String validarCargo(String cargo) {
        if (cargo == null || cargo.isBlank()) {
            throw new ValidationException("El cargo es obligatorio");
        }
        String limpio = cargo.trim();
        if (limpio.length() > 255) {
            throw new ValidationException("El cargo no puede exceder 255 caracteres");
        }
        return limpio;
    }

    private CumpleanosManual require(Integer id) {
        return cumpleanosRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Cumpleaños", id));
    }
}

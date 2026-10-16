package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
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
 */
@Service
@RequiredArgsConstructor
public class CumpleanosManualService {

    private final CumpleanosManualRepository cumpleanosRepository;

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
        CumpleanosManual cumpleanos = CumpleanosManual.builder()
                .nombreCompleto(request.nombreCompleto().trim())
                .fechaNacimiento(request.fechaNacimiento())
                .cargo(cargo)
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
        return CumpleanosManualDtos.Response.from(cumpleanosRepository.save(cumpleanos));
    }

    @Transactional
    public void delete(Integer id) {
        cumpleanosRepository.delete(require(id));
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

package co.com.icvc.intranet_backend.user.controller;

import co.com.icvc.intranet_backend.permisos.RequiresPermission;
import co.com.icvc.intranet_backend.user.dto.CumpleanosManualDtos;
import co.com.icvc.intranet_backend.user.service.CumpleanosManualService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Cumpleaños registrados manualmente (botón "Nuevo cumpleaños").
 * El cargo es texto libre, distinto del catálogo de cargos del sistema.
 */
@RestController
@RequestMapping("/api/cumpleanos-manuales")
@RequiredArgsConstructor
public class CumpleanosManualController {

    private final CumpleanosManualService cumpleanosService;

    @GetMapping
    public List<CumpleanosManualDtos.Response> list() {
        return cumpleanosService.list();
    }

    @PostMapping
    @RequiresPermission(module = "calendario-cumpleanios", action = "grabar")
    public ResponseEntity<CumpleanosManualDtos.Response> create(
            @Valid @RequestBody CumpleanosManualDtos.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cumpleanosService.create(request));
    }

    @PutMapping("/{id}")
    @RequiresPermission(module = "calendario-cumpleanios", action = "actualizar")
    public CumpleanosManualDtos.Response update(@PathVariable Integer id,
            @Valid @RequestBody CumpleanosManualDtos.CreateRequest request) {
        return cumpleanosService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @RequiresPermission(module = "calendario-cumpleanios", action = "eliminar")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        cumpleanosService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

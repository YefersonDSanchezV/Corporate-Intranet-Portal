package co.com.icvc.intranet_backend.user.controller;

import co.com.icvc.intranet_backend.user.dto.CargoDtos;
import co.com.icvc.intranet_backend.user.service.CargoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cargos")
@RequiredArgsConstructor
public class CargoController {

    private final CargoService cargoService;

    @GetMapping
    public List<CargoDtos.Response> list() {
        return cargoService.list();
    }

    @PostMapping
    public ResponseEntity<CargoDtos.Response> create(@Valid @RequestBody CargoDtos.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cargoService.create(request));
    }

    @PatchMapping("/{id}/estado")
    public CargoDtos.Response toggleEstado(@PathVariable Integer id) {
        return cargoService.toggleEstado(id);
    }

    @PatchMapping("/{id}")
    public CargoDtos.Response updateEstado(@PathVariable Integer id, @Valid @RequestBody CargoDtos.UpdateStatusRequest request) {
        return cargoService.updateEstado(id, request.estado());
    }
}
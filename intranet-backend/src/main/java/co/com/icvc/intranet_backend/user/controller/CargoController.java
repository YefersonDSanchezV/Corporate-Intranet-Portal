package co.com.icvc.intranet_backend.user.controller;

import co.com.icvc.intranet_backend.user.dto.CargoDtos;
import co.com.icvc.intranet_backend.user.service.CargoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
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
}
package co.com.icvc.intranet_backend.user.controller;

import co.com.icvc.intranet_backend.permisos.RequiresPermission;
import co.com.icvc.intranet_backend.user.dto.CumpleaniosRegistroDtos;
import co.com.icvc.intranet_backend.user.service.CumpleaniosRegistroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Registros del módulo de Cumpleaños del panel: automáticos (usuarios) y manuales
 * en una sola lista, y la configuración de la tarjeta (foto y plantilla).
 */
@RestController
@RequestMapping("/api/cumpleanios")
@RequiredArgsConstructor
public class CumpleaniosRegistroController {

    private final CumpleaniosRegistroService registroService;

    @GetMapping
    public List<CumpleaniosRegistroDtos.Response> list() {
        return registroService.list();
    }

    @PutMapping("/{oid}")
    @RequiresPermission(module = "comunicaciones-cumpleanios", action = "actualizar")
    public CumpleaniosRegistroDtos.Response update(@PathVariable Integer oid,
            @Valid @RequestBody CumpleaniosRegistroDtos.UpdateRequest request) {
        return registroService.update(oid, request);
    }
}

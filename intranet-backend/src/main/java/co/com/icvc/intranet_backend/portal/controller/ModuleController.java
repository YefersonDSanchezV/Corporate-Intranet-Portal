package co.com.icvc.intranet_backend.portal.controller;

import co.com.icvc.intranet_backend.portal.dto.PortalDtos;
import co.com.icvc.intranet_backend.portal.service.ModuleService;
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
import java.util.Map;

@RestController
@RequestMapping("/api/modules")
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleService moduleService;

    @GetMapping
    public List<PortalDtos.ModuloResponse> list() {
        return moduleService.list();
    }

    @PostMapping
    public ResponseEntity<PortalDtos.ModuloResponse> create(@RequestBody Map<String, Object> body) {
        String nombre = (String) body.get("nombre");
        boolean estado = body.get("estado") == null || Boolean.TRUE.equals(body.get("estado"));
        return ResponseEntity.status(HttpStatus.CREATED).body(moduleService.create(nombre, estado));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<Void> updateEstado(@PathVariable Integer id, @RequestBody Map<String, Boolean> body) {
        moduleService.updateEstado(id, Boolean.TRUE.equals(body.get("activo")));
        return ResponseEntity.noContent().build();
    }
}
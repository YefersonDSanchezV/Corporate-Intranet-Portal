package co.com.icvc.intranet_backend.portal.controller;

import co.com.icvc.intranet_backend.permisos.RequiresPermission;
import co.com.icvc.intranet_backend.portal.dto.PlantillaCumpleaniosDtos;
import co.com.icvc.intranet_backend.portal.service.PlantillaCumpleaniosService;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Plantillas de cumpleaños: carga y mantenimiento de las imágenes de tarjeta
 * usadas por el módulo de Comunicaciones.
 */
@RestController
@RequestMapping("/api/plantillas-cumpleanios")
@RequiredArgsConstructor
public class PlantillaCumpleaniosController {

    private final PlantillaCumpleaniosService plantillaService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public List<PlantillaCumpleaniosDtos.Response> list() {
        return plantillaService.list();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequiresPermission(module = "plantillas-cumpleanios", action = "grabar")
    public ResponseEntity<PlantillaCumpleaniosDtos.Response> create(
            @RequestPart MultipartFile file,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) java.math.BigDecimal fotoPx,
            @RequestParam(required = false) java.math.BigDecimal fotoPy,
            @RequestParam(required = false) java.math.BigDecimal fotoAncho,
            @RequestParam(required = false) java.math.BigDecimal fotoAlto,
            @RequestParam(required = false) Boolean fotoRedondo) {
        Integer oid = resolvedUsuarioOid();
        if (oid == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(plantillaService.create(file, nombre, oid, fotoPx, fotoPy, fotoAncho, fotoAlto, fotoRedondo));
    }

    @DeleteMapping("/{id}")
    @RequiresPermission(module = "plantillas-cumpleanios", action = "eliminar")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        plantillaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private Integer resolvedUsuarioOid() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return null;
        }
        return usuarioRepository.findByUsername(auth.getName()).map(u -> u.getOid()).orElse(null);
    }
}

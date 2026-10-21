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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
    public List<PlantillaCumpleaniosDtos.Response> list(
            @RequestParam(required = false) Integer mes) {
        return plantillaService.list(mes);
    }

    /** Convierte un PDF en imagen para poder ubicar los campos antes de guardarlo. */
    @PostMapping(value = "/previsualizar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.IMAGE_PNG_VALUE)
    @RequiresPermission(module = "plantillas-cumpleanios", action = "grabar")
    public ResponseEntity<byte[]> previsualizar(@RequestPart MultipartFile file) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(plantillaService.previsualizar(file));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequiresPermission(module = "plantillas-cumpleanios", action = "grabar")
    public ResponseEntity<PlantillaCumpleaniosDtos.Response> create(
            @RequestPart MultipartFile file,
            // Opcional: PNG del arte que debe quedar por encima de la foto (ej. el gorro).
            @RequestPart(required = false) MultipartFile frente,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) java.math.BigDecimal fotoPx,
            @RequestParam(required = false) java.math.BigDecimal fotoPy,
            @RequestParam(required = false) java.math.BigDecimal fotoAncho,
            @RequestParam(required = false) java.math.BigDecimal fotoAlto,
            @RequestParam(required = false) Boolean fotoRedondo,
            @RequestParam(required = false) String config,
            @RequestParam(required = false) String meses) {
        Integer oid = resolvedUsuarioOid();
        if (oid == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(plantillaService.create(file, frente, nombre, oid, fotoPx, fotoPy, fotoAncho, fotoAlto,
                        fotoRedondo, config, meses));
    }

    /**
     * Actualiza la composición (marco de la foto, textos y zonas protegidas) de una
     * plantilla ya creada. Permite proteger el adorno de una plantilla existente sin
     * borrarla ni volver a cargarla.
     */
    @PutMapping(value = "/{id}/config", consumes = MediaType.APPLICATION_JSON_VALUE)
    @RequiresPermission(module = "plantillas-cumpleanios", action = "grabar")
    public PlantillaCumpleaniosDtos.Response actualizarConfig(
            @PathVariable Integer id,
            @RequestBody PlantillaCumpleaniosDtos.ConfigRequest cuerpo) {
        return plantillaService.actualizarConfig(id, cuerpo == null ? null : cuerpo.config());
    }

    /** Añade o reemplaza la capa frontal de una plantilla ya creada. */
    @PostMapping(value = "/{id}/frente", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequiresPermission(module = "plantillas-cumpleanios", action = "grabar")
    public ResponseEntity<PlantillaCumpleaniosDtos.Response> subirFrente(
            @PathVariable Integer id,
            @RequestPart MultipartFile file) {
        Integer oid = resolvedUsuarioOid();
        if (oid == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(plantillaService.setFrente(id, file, oid));
    }

    @DeleteMapping("/{id}/frente")
    @RequiresPermission(module = "plantillas-cumpleanios", action = "grabar")
    public ResponseEntity<Void> quitarFrente(@PathVariable Integer id) {
        plantillaService.quitarFrente(id);
        return ResponseEntity.noContent().build();
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

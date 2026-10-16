package co.com.icvc.intranet_backend.user.controller;

import co.com.icvc.intranet_backend.permisos.RequiresPermission;
import co.com.icvc.intranet_backend.portal.dto.PortalDtos;
import co.com.icvc.intranet_backend.portal.service.FileService;
import co.com.icvc.intranet_backend.portal.service.ParametroService;
import co.com.icvc.intranet_backend.user.dto.CumpleanosManualDtos;
import co.com.icvc.intranet_backend.user.service.CumpleanosManualService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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
    private final FileService fileService;
    private final ParametroService parametroService;
    private final co.com.icvc.intranet_backend.user.repository.UsuarioRepository usuarioRepository;

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

    /**
     * Subida de la foto obligatoria del cumpleañero (JPG/PNG, máx. 2MB por defecto,
     * configurable en Parámetros). Requiere el mismo permiso que grabar cumpleaños,
     * a diferencia del genérico {@code POST /api/files} que el interceptor niega
     * por no tener permiso declarado.
     */
    @PostMapping(value = "/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequiresPermission(module = "calendario-cumpleanios", action = "grabar")
    public ResponseEntity<PortalDtos.ArchivoResponse> uploadFoto(@RequestPart MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new co.com.icvc.intranet_backend.common.exception.ValidationException("La foto es obligatoria");
        }
        long maxMb;
        try {
            maxMb = Long.parseLong(parametroService.getOrDefault("FOTOS_CUMPLE_MAX_MB", "2").trim());
        } catch (NumberFormatException ex) {
            maxMb = 2;
        }
        String mimeCfg = parametroService.getOrDefault("FOTOS_CUMPLE_MIME", "image/jpeg,image/png");
        String contentType = file.getContentType();
        boolean mimeOk = (contentType != null && java.util.Arrays.stream(mimeCfg.split(","))
                .map(String::trim).anyMatch(contentType::equalsIgnoreCase))
                || (file.getOriginalFilename() != null && file.getOriginalFilename().matches("(?i).*\\.(jpe?g|png)$"));
        if (!mimeOk) {
            throw new co.com.icvc.intranet_backend.common.exception.ValidationException("La foto debe ser JPG o PNG");
        }
        if (file.getSize() > maxMb * 1024 * 1024) {
            throw new co.com.icvc.intranet_backend.common.exception.ValidationException(
                    "La foto no puede superar " + maxMb + "MB");
        }
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        Integer oid = auth != null && auth.getName() != null
                ? usuarioRepository.findByUsername(auth.getName()).map(u -> u.getOid()).orElse(null)
                : null;
        if (oid == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(
                PortalDtos.ArchivoResponse.from(fileService.store(file, oid)));
    }
}

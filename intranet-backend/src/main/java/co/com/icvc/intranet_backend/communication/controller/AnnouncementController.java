package co.com.icvc.intranet_backend.communication.controller;

import co.com.icvc.intranet_backend.communication.dto.AnuncioDtos;
import co.com.icvc.intranet_backend.communication.service.AnnouncementService;
import co.com.icvc.intranet_backend.common.web.HttpUtils;
import co.com.icvc.intranet_backend.permisos.RequiresPermission;
import co.com.icvc.intranet_backend.portal.dto.PortalDtos;
import co.com.icvc.intranet_backend.user.dto.LogAuditoriaDtos;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public List<AnuncioDtos.Response> list(@RequestParam(required = false) String estado) {
        return announcementService.list(estado);
    }

    @PostMapping
    @RequiresPermission(module = "crear-anuncio", action = "grabar")
    public ResponseEntity<AnuncioDtos.Response> create(@Valid @RequestBody AnuncioDtos.CreateRequest request,
            @RequestParam(required = false) Integer creadorOid) {
        return ResponseEntity.status(HttpStatus.CREATED).body(announcementService.create(request, creadorOid));
    }

    @PutMapping("/{id}")
    @RequiresPermission(module = "anuncios-pendientes", action = "actualizar")
    public AnuncioDtos.Response update(@PathVariable Integer id, @Valid @RequestBody AnuncioDtos.CreateRequest request,
            Authentication authentication, HttpServletRequest http) {
        return announcementService.update(id, request, resolveEditorOid(authentication), HttpUtils.clientIp(http));
    }

    @GetMapping("/{id}/history")
    public List<LogAuditoriaDtos.Response> history(@PathVariable Integer id) {
        return announcementService.history(id);
    }

    // Resuelve el oid del usuario autenticado (genusuario.oid) para dejarlo en la auditoría.
    private Integer resolveEditorOid(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return usuarioRepository.findByUsername(authentication.getName())
                .map(Usuario::getOid)
                .orElse(null);
    }

    @DeleteMapping("/{id}")
    @RequiresPermission(module = "anuncios-pendientes", action = "eliminar")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        announcementService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    @RequiresPermission(module = "anuncios-pendientes", action = "actualizar")
    public AnuncioDtos.Response publish(@PathVariable Integer id) {
        return announcementService.publish(id);
    }

    @PostMapping("/{id}/reject")
    @RequiresPermission(module = "anuncios-pendientes", action = "actualizar")
    public AnuncioDtos.Response reject(@PathVariable Integer id, @RequestBody(required = false) java.util.Map<String, String> body) {
        String observation = body != null ? body.get("observation") : null;
        return announcementService.reject(id, observation);
    }

    @PostMapping(value = "/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequiresPermission(module = "crear-anuncio", action = "grabar")
    public PortalDtos.ArchivoResponse attachFile(@PathVariable Integer id, @RequestPart MultipartFile file,
            @RequestParam Integer usuarioOid) {
        return announcementService.attachFile(id, file, usuarioOid);
    }

    @GetMapping("/{id}/files")
    public List<PortalDtos.ArchivoResponse> files(@PathVariable Integer id) {
        return announcementService.archivos(id);
    }
}
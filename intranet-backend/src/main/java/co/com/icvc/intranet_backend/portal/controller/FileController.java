package co.com.icvc.intranet_backend.portal.controller;

import co.com.icvc.intranet_backend.portal.dto.PortalDtos;
import co.com.icvc.intranet_backend.portal.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;
    private final co.com.icvc.intranet_backend.user.repository.UsuarioRepository usuarioRepository;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PortalDtos.ArchivoResponse> upload(@RequestPart MultipartFile file,
            @RequestParam(required = false) Integer usuarioOid) {
        Integer oid = usuarioOid;
        if (oid == null) {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null) {
                oid = usuarioRepository.findByUsername(auth.getName()).map(u -> u.getOid()).orElse(null);
            }
        }
        if (oid == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(
                PortalDtos.ArchivoResponse.from(fileService.store(file, oid)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(@PathVariable Integer id) {
        Resource resource = fileService.loadAsResource(id);
        String nombreOriginal = fileService.require(id).getNombreOriginal();
        String encoded = URLEncoder.encode(nombreOriginal == null ? "archivo" : nombreOriginal, StandardCharsets.UTF_8)
                .replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encoded)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        fileService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
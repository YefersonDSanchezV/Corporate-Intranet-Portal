package co.com.icvc.intranet_backend.communication.controller;

import co.com.icvc.intranet_backend.communication.dto.LogroDtos;
import co.com.icvc.intranet_backend.communication.service.AchievementService;
import co.com.icvc.intranet_backend.portal.dto.PortalDtos;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    @GetMapping
    public List<LogroDtos.Response> list() {
        return achievementService.list();
    }

    @PostMapping
    public ResponseEntity<LogroDtos.Response> create(@Valid @RequestBody LogroDtos.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(achievementService.create(request));
    }

    @PutMapping("/{id}")
    public LogroDtos.Response update(@PathVariable Integer id, @Valid @RequestBody LogroDtos.CreateRequest request) {
        return achievementService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        achievementService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PortalDtos.ArchivoResponse attachFile(@PathVariable Integer id, @RequestPart MultipartFile file,
            @RequestParam Integer usuarioOid) {
        return achievementService.attachFile(id, file, usuarioOid);
    }

    @GetMapping("/{id}/files")
    public List<PortalDtos.ArchivoResponse> files(@PathVariable Integer id) {
        return achievementService.archivos(id);
    }
}
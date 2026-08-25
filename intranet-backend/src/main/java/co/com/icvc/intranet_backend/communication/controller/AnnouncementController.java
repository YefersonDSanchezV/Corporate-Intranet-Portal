package co.com.icvc.intranet_backend.communication.controller;

import co.com.icvc.intranet_backend.communication.dto.AnuncioDtos;
import co.com.icvc.intranet_backend.communication.service.AnnouncementService;
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
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    public List<AnuncioDtos.Response> list(@RequestParam(required = false) String estado) {
        return announcementService.list(estado);
    }

    @PostMapping
    public ResponseEntity<AnuncioDtos.Response> create(@Valid @RequestBody AnuncioDtos.CreateRequest request,
            @RequestParam(required = false) Integer creadorOid) {
        return ResponseEntity.status(HttpStatus.CREATED).body(announcementService.create(request, creadorOid));
    }

    @PutMapping("/{id}")
    public AnuncioDtos.Response update(@PathVariable Integer id, @Valid @RequestBody AnuncioDtos.CreateRequest request) {
        return announcementService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        announcementService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    public AnuncioDtos.Response publish(@PathVariable Integer id) {
        return announcementService.publish(id);
    }

    @PostMapping(value = "/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PortalDtos.ArchivoResponse attachFile(@PathVariable Integer id, @RequestPart MultipartFile file,
            @RequestParam Integer usuarioOid) {
        return announcementService.attachFile(id, file, usuarioOid);
    }

    @GetMapping("/{id}/files")
    public List<PortalDtos.ArchivoResponse> files(@PathVariable Integer id) {
        return announcementService.archivos(id);
    }
}
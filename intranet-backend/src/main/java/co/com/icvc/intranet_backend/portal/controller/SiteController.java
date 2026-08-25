package co.com.icvc.intranet_backend.portal.controller;

import co.com.icvc.intranet_backend.portal.dto.PortalDtos;
import co.com.icvc.intranet_backend.portal.service.SiteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sites")
@RequiredArgsConstructor
public class SiteController {

    private final SiteService siteService;

    @GetMapping
    public List<PortalDtos.SitioResponse> list(@RequestParam(required = false) Integer moduleId) {
        return siteService.list(moduleId);
    }

    @PostMapping
    public ResponseEntity<PortalDtos.SitioResponse> create(@Valid @RequestBody PortalDtos.SitioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(siteService.create(request));
    }

    @PutMapping("/{id}")
    public PortalDtos.SitioResponse update(@PathVariable Integer id,
            @Valid @RequestBody PortalDtos.SitioRequest request) {
        return siteService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        siteService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/active")
    public PortalDtos.SitioResponse updateActive(@PathVariable Integer id) {
        return siteService.get(id);
    }
}
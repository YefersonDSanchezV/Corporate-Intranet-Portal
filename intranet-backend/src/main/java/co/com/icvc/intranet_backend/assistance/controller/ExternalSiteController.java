package co.com.icvc.intranet_backend.assistance.controller;

import co.com.icvc.intranet_backend.assistance.dto.AssistanceDtos;
import co.com.icvc.intranet_backend.assistance.service.AssistanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/external-sites")
@RequiredArgsConstructor
public class ExternalSiteController {

    private final AssistanceService assistanceService;

    @GetMapping
    public List<AssistanceDtos.SitioExternoResponse> list() {
        return assistanceService.listExternalSites();
    }

    @PostMapping
    public ResponseEntity<AssistanceDtos.SitioExternoResponse> create(
            @Valid @RequestBody AssistanceDtos.SitioExternoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assistanceService.createExternalSite(request));
    }

    @PutMapping("/{id}")
    public AssistanceDtos.SitioExternoResponse update(@PathVariable Integer id,
            @Valid @RequestBody AssistanceDtos.SitioExternoRequest request) {
        return assistanceService.updateExternalSite(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        assistanceService.deleteExternalSite(id);
        return ResponseEntity.noContent().build();
    }
}
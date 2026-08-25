package co.com.icvc.intranet_backend.user.controller;

import co.com.icvc.intranet_backend.user.dto.SolicitudUsuarioDtos;
import co.com.icvc.intranet_backend.user.service.AccessRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/access-requests")
@RequiredArgsConstructor
public class AccessRequestController {

    private final AccessRequestService accessRequestService;

    @GetMapping
    public List<SolicitudUsuarioDtos.Response> list() {
        return accessRequestService.list();
    }

    @PostMapping
    public ResponseEntity<SolicitudUsuarioDtos.Response> create(
            @Valid @RequestBody SolicitudUsuarioDtos.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(accessRequestService.create(request));
    }

    @PostMapping("/{id}/approve")
    public SolicitudUsuarioDtos.Response approve(@PathVariable Integer id) {
        return accessRequestService.approve(id);
    }

    @PostMapping("/{id}/reject")
    public SolicitudUsuarioDtos.Response reject(@PathVariable Integer id) {
        return accessRequestService.reject(id);
    }
}
package co.com.icvc.intranet_backend.user.controller;

import co.com.icvc.intranet_backend.user.dto.SolicitudUsuarioDtos;
import co.com.icvc.intranet_backend.user.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/password-reset-requests")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @GetMapping
    public List<SolicitudUsuarioDtos.Response> list() {
        return passwordResetService.list();
    }

    @PostMapping
    public ResponseEntity<SolicitudUsuarioDtos.Response> create(
            @RequestParam Long identificacion,
            @RequestParam(required = false) String observacion) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(passwordResetService.create(identificacion, observacion));
    }

    @PostMapping("/{id}/complete")
    public SolicitudUsuarioDtos.Response complete(@PathVariable Integer id) {
        return passwordResetService.complete(id);
    }
}
package co.com.icvc.intranet_backend.user.controller;

import co.com.icvc.intranet_backend.common.web.HttpUtils;
import co.com.icvc.intranet_backend.user.dto.UsuarioDtos;
import co.com.icvc.intranet_backend.user.service.AuditService;
import co.com.icvc.intranet_backend.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuditService auditService;

    @GetMapping
    public List<UsuarioDtos.Response> list() {
        return userService.list();
    }

    @PostMapping
    public ResponseEntity<UsuarioDtos.Response> create(@Valid @RequestBody UsuarioDtos.CreateRequest request,
            HttpServletRequest http) {
        UsuarioDtos.Response response = userService.create(request);
        auditService.registrar("CREAR", "genusuario", response.username(), null, null, response.oid(),
                HttpUtils.clientIp(http));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{username}")
    public UsuarioDtos.Response update(@PathVariable String username,
            @Valid @RequestBody UsuarioDtos.UpdateRequest request, HttpServletRequest http) {
        UsuarioDtos.Response response = userService.update(username, request);
        auditService.registrar("ACTUALIZAR", "genusuario", username, null, null, response.oid(),
                HttpUtils.clientIp(http));
        return response;
    }

    @PatchMapping("/{username}/status")
    public UsuarioDtos.Response updateStatus(@PathVariable String username,
            @Valid @RequestBody UsuarioDtos.StatusRequest request, HttpServletRequest http) {
        UsuarioDtos.Response response = userService.updateStatus(username, request);
        auditService.registrar("CAMBIAR_ESTADO", "genusuario", username, null, String.valueOf(request.estado()),
                response.oid(), HttpUtils.clientIp(http));
        return response;
    }

    @PatchMapping("/{id}/password")
    public UsuarioDtos.Response resetPassword(@PathVariable Integer id,
            @RequestBody(required = false) UsuarioDtos.UpdatePasswordRequest request, HttpServletRequest http) {
        UsuarioDtos.Response response = userService.resetPassword(id, request);
        auditService.registrar("RESETEAR_CONTRASENA", "genusuario", response.username(), null, null,
                id, HttpUtils.clientIp(http));
        return response;
    }
}
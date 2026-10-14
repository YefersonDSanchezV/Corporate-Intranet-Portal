package co.com.icvc.intranet_backend.user.controller;

import co.com.icvc.intranet_backend.common.exception.AuthenticationException;
import co.com.icvc.intranet_backend.permisos.CargoPermisos;
import co.com.icvc.intranet_backend.permisos.PermisoService;
import co.com.icvc.intranet_backend.user.dto.AuthDtos;
import co.com.icvc.intranet_backend.user.dto.UsuarioDtos;
import co.com.icvc.intranet_backend.user.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PermisoService permisoService;

    @PostMapping("/auth/login")
    public AuthDtos.LoginResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout() {
        authService.logout();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UsuarioDtos.Response me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AuthenticationException("No autenticado");
        }
        return authService.me(authentication.getName());
    }

    @GetMapping("/me/permissions")
    public AuthDtos.MePermissions mePermissions(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AuthenticationException("No autenticado");
        }
        CargoPermisos permisos = permisoService.loadForUsername(authentication.getName());
        return new AuthDtos.MePermissions(List.copyOf(permisos.modulos()), List.copyOf(permisos.acciones()));
    }
}
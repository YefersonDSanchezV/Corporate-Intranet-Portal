package co.com.icvc.intranet_backend.user.dto;

import jakarta.validation.constraints.NotBlank;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record LoginResponse(UsuarioDtos.Response usuario, String mensaje) {
    }
}
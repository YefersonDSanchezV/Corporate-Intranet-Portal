package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.user.dto.AuthDtos;
import co.com.icvc.intranet_backend.user.dto.UsuarioDtos;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request) {
        Usuario usuario = usuarioRepository.findByUsername(request.username())
                .orElseThrow(() -> new ValidationException("Credenciales inválidas"));
        if (!usuario.isEstado()) {
            throw new ValidationException("El usuario está inactivo");
        }
        if (!passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw new ValidationException("Credenciales inválidas");
        }
        return new AuthDtos.LoginResponse(UsuarioDtos.Response.from(usuario), "Autenticación exitosa");
    }

    public void logout() {
    }

    @Transactional(readOnly = true)
    public UsuarioDtos.Response me(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> NotFoundException.of("Usuario", username));
        return UsuarioDtos.Response.from(usuario);
    }
}
package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.communication.entity.UsuarioComunicacion;
import co.com.icvc.intranet_backend.communication.repository.UsuarioComunicacionRepository;
import co.com.icvc.intranet_backend.security.JwtService;
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
    private final UsuarioComunicacionRepository usuarioComunicacionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private java.util.List<String> resolveRoles(Usuario usuario) {
        java.util.List<UsuarioComunicacion> list = usuarioComunicacionRepository.findAllByUsuarioOid(usuario.getOid());
        if (list.isEmpty()) {
            return usuarioComunicacionRepository.findByUsuarioOid(usuario.getOid())
                    .map(uc -> java.util.List.<String>of(uc.getRol().getNombre().toUpperCase()))
                    .orElse(java.util.List.<String>of());
        }
        return list.stream()
                .filter(UsuarioComunicacion::isEstado)
                .map(uc -> uc.getRol().getNombre().toUpperCase())
                .toList();
    }

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
        java.util.List<String> roles = resolveRoles(usuario);
        String token = jwtService.generateToken(usuario.getUsername(), roles);
        return new AuthDtos.LoginResponse(UsuarioDtos.Response.from(usuario), token, roles, "Autenticación exitosa");
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
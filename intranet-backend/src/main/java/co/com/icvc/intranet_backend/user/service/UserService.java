package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.common.exception.ConflictException;
import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.user.dto.UsuarioDtos;
import co.com.icvc.intranet_backend.user.entity.CargoIntra;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.CargoIntraRepository;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UsuarioRepository usuarioRepository;
    private final CargoIntraRepository cargoRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UsuarioDtos.Response> list() {
        return usuarioRepository.findAllByOrderByUsernameAsc().stream()
                .map(UsuarioDtos.Response::from)
                .toList();
    }

    @Transactional
    public UsuarioDtos.Response create(UsuarioDtos.CreateRequest request) {
        if (usuarioRepository.existsByUsername(request.username())) {
            throw new ConflictException("El nombre de usuario ya existe");
        }
        if (usuarioRepository.existsByCorreoInstitucional(request.correoInstitucional())) {
            throw new ConflictException("El correo institucional ya está registrado");
        }
        CargoIntra cargo = cargoRepository.findById(request.cargoOid())
                .orElseThrow(() -> NotFoundException.of("Cargo", request.cargoOid()));
        Usuario usuario = Usuario.builder()
                .username(request.username())
                .passwordHash(passwordEncoder.encode(request.password()))
                .estado(true)
                .identificacion(request.identificacion())
                .nombreCompleto(request.nombreCompleto())
                .fechaNacimiento(request.fechaNacimiento())
                .correoInstitucional(request.correoInstitucional())
                .cargo(cargo)
                .fechaCreacion(LocalDateTime.now())
                .build();
        return UsuarioDtos.Response.from(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioDtos.Response update(String username, UsuarioDtos.UpdateRequest request) {
        Usuario usuario = requireByUsername(username);
        CargoIntra cargo = cargoRepository.findById(request.cargoOid())
                .orElseThrow(() -> NotFoundException.of("Cargo", request.cargoOid()));
        usuario.setNombreCompleto(request.nombreCompleto());
        usuario.setCorreoInstitucional(request.correoInstitucional());
        usuario.setCargo(cargo);
        usuario.setEstado(request.estado());
        return UsuarioDtos.Response.from(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioDtos.Response updateStatus(String username, UsuarioDtos.StatusRequest request) {
        Usuario usuario = requireByUsername(username);
        usuario.setEstado(request.estado());
        return UsuarioDtos.Response.from(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioDtos.Response resetPassword(Integer id, UsuarioDtos.UpdatePasswordRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Usuario", id));
        String nuevaPassword = (request == null || request.password() == null || request.password().isBlank())
                ? String.valueOf(usuario.getIdentificacion())
                : request.password();
        usuario.setPasswordHash(passwordEncoder.encode(nuevaPassword));
        return UsuarioDtos.Response.from(usuarioRepository.save(usuario));
    }

    private Usuario requireByUsername(String username) {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> NotFoundException.of("Usuario", username));
    }
}
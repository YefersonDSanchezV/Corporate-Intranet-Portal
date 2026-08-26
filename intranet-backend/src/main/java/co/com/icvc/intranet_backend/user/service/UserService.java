package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.common.exception.ConflictException;
import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.user.dto.UsuarioDtos;
import co.com.icvc.intranet_backend.user.entity.CargoIntra;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.CargoIntraRepository;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UsuarioRepository usuarioRepository;
    private final CargoIntraRepository cargoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

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
        cargoRepository.findById(request.cargoOid())
                .orElseThrow(() -> NotFoundException.of("Cargo", request.cargoOid()));
        String hash = passwordEncoder.encode(request.password());
        LocalDateTime now = LocalDateTime.now();
        // Uso de SQL nativo con oid explícito para compatibilidad con BDs existentes sin IDENTITY
        try {
            Integer nextOid = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(oid),0)+1 FROM genusuario", Integer.class);
            jdbcTemplate.update(
                    "INSERT INTO genusuario (oid, genusunom, genusuclahash, genususta, genusuide, genusunomcom, genusufecnam, genusuemacor, gencargointra, genusufechcrea) VALUES (?,?,?,?,?,?,?,?,?,?)",
                    nextOid, request.username(), hash, true, request.identificacion(), request.nombreCompleto(),
                    Date.valueOf(request.fechaNacimiento()), request.correoInstitucional(), request.cargoOid(), Timestamp.valueOf(now));
            Usuario saved = usuarioRepository.findByUsername(request.username()).orElseThrow();
            return UsuarioDtos.Response.from(saved);
        } catch (Exception ex) {
            log.warn("Fallback nativo falló, intentando JPA: {}", ex.getMessage());
            CargoIntra cargo = cargoRepository.findById(request.cargoOid()).orElseThrow();
            Usuario usuario = Usuario.builder()
                    .username(request.username())
                    .passwordHash(hash)
                    .estado(true)
                    .identificacion(request.identificacion())
                    .nombreCompleto(request.nombreCompleto())
                    .fechaNacimiento(request.fechaNacimiento())
                    .correoInstitucional(request.correoInstitucional())
                    .cargo(cargo)
                    .fechaCreacion(now)
                    .build();
            return UsuarioDtos.Response.from(usuarioRepository.save(usuario));
        }
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
        if (request.fechaNacimiento() != null) {
            usuario.setFechaNacimiento(request.fechaNacimiento());
        }
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
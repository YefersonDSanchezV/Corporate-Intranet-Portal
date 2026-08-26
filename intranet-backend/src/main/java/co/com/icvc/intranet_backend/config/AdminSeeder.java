package co.com.icvc.intranet_backend.config;

import co.com.icvc.intranet_backend.communication.entity.Rol;
import co.com.icvc.intranet_backend.communication.entity.UsuarioComunicacion;
import co.com.icvc.intranet_backend.communication.repository.RolRepository;
import co.com.icvc.intranet_backend.communication.repository.UsuarioComunicacionRepository;
import co.com.icvc.intranet_backend.user.entity.CargoIntra;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.CargoIntraRepository;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Crea el usuario administrador inicial y el rol ADMIN si no existen.
 * Todas las credenciales provienen de variables de entorno (.env / .env_pruebas)
 * y la contraseña se almacena con hash BCrypt — nunca en texto plano.
 * Usa SQL nativo con oid explícito para compatibilidad con BDs existentes
 * cuya columna oid no tiene default IDENTITY.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final CargoIntraRepository cargoRepository;
    private final RolRepository rolRepository;
    private final UsuarioComunicacionRepository usuarioComunicacionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${ADMIN_USERNAME:}")
    private String adminUsername;

    @Value("${ADMIN_INITIAL_PASSWORD:}")
    private String adminPassword;

    @Value("${ADMIN_IDENTIFICACION:0}")
    private Long adminIdentificacion;

    @Value("${ADMIN_NOMBRE_COMPLETO:Administrador}")
    private String adminNombreCompleto;

    @Value("${ADMIN_CORREO:admin@icvc.com.co}")
    private String adminCorreo;

    @Value("${ADMIN_CARGO_NOMBRE:Administrador}")
    private String adminCargoNombre;

    @Override
    public void run(String... args) {
        if (adminUsername == null || adminUsername.isBlank()
                || adminPassword == null || adminPassword.isBlank()) {
            log.info("AdminSeeder omitido: ADMIN_USERNAME o ADMIN_INITIAL_PASSWORD no configurados");
            return;
        }
        try {
            CargoIntra cargo = ensureCargo();
            Usuario admin = ensureUsuario(cargo);
            Rol adminRol = ensureRol();
            ensureComUsuario(admin, adminRol);
        } catch (Exception e) {
            log.error("AdminSeeder falló (no bloquea arranque): {}", e.getMessage(), e);
        }
    }

    private CargoIntra ensureCargo() {
        Optional<CargoIntra> existing = cargoRepository.findAll().stream()
                .filter(c -> c.getNombre().equalsIgnoreCase(adminCargoNombre))
                .findFirst();
        if (existing.isPresent()) return existing.get();
        try {
            return cargoRepository.save(CargoIntra.builder().nombre(adminCargoNombre).estado(true).build());
        } catch (Exception ex) {
            log.warn("JPA save cargo falló, reintentando con SQL nativo: {}", ex.getMessage());
            Integer nextOid = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(oid),0)+1 FROM gencargointra", Integer.class);
            jdbcTemplate.update("INSERT INTO gencargointra (oid, gencarnom, gencaresta) VALUES (?,?,?)",
                    nextOid, adminCargoNombre, true);
            return cargoRepository.findAll().stream()
                    .filter(c -> c.getNombre().equalsIgnoreCase(adminCargoNombre))
                    .findFirst().orElseThrow();
        }
    }

    private Usuario ensureUsuario(CargoIntra cargo) {
        Optional<Usuario> existing = usuarioRepository.findByUsername(adminUsername);
        if (existing.isPresent()) {
            log.info("Usuario admin '{}' ya existe (oid={})", adminUsername, existing.get().getOid());
            return existing.get();
        }
        String hash = passwordEncoder.encode(adminPassword);
        Long ident = (adminIdentificacion != null && adminIdentificacion != 0) ? adminIdentificacion : 99999999L;
        try {
            Usuario admin = Usuario.builder()
                    .username(adminUsername).passwordHash(hash).estado(true)
                    .identificacion(ident).nombreCompleto(adminNombreCompleto)
                    .fechaNacimiento(LocalDate.of(1990, 1, 1))
                    .correoInstitucional(adminCorreo).cargo(cargo)
                    .fechaCreacion(LocalDateTime.now()).build();
            admin = usuarioRepository.save(admin);
            log.info("Usuario admin '{}' creado (oid={})", adminUsername, admin.getOid());
            return admin;
        } catch (Exception ex) {
            log.warn("JPA save usuario falló, reintentando con SQL nativo: {}", ex.getMessage());
            Integer nextOid = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(oid),0)+1 FROM genusuario", Integer.class);
            jdbcTemplate.update(
                    "INSERT INTO genusuario (oid, genusunom, genusuclahash, genususta, genusuide, genusunomcom, genusufecnam, genusuemacor, gencargointra, genusufechcrea) VALUES (?,?,?,?,?,?,?,?,?,?)",
                    nextOid, adminUsername, hash, true, ident, adminNombreCompleto,
                    java.sql.Date.valueOf(LocalDate.of(1990, 1, 1)), adminCorreo, cargo.getOid(),
                    java.sql.Timestamp.valueOf(LocalDateTime.now()));
            return usuarioRepository.findByUsername(adminUsername).orElseThrow();
        }
    }

    private Rol ensureRol() {
        Optional<Rol> existing = rolRepository.findAll().stream()
                .filter(r -> "ADMIN".equalsIgnoreCase(r.getNombre())).findFirst();
        if (existing.isPresent()) return existing.get();
        try {
            return rolRepository.save(Rol.builder().nombre("ADMIN").descripcion("Administrador del panel de control").build());
        } catch (Exception ex) {
            log.warn("JPA save rol falló, reintentando con SQL nativo: {}", ex.getMessage());
            Integer nextOid = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(oid),0)+1 FROM comrol", Integer.class);
            jdbcTemplate.update("INSERT INTO comrol (oid, comrolnom, comroldes) VALUES (?,?,?)",
                    nextOid, "ADMIN", "Administrador del panel de control");
            return rolRepository.findAll().stream().filter(r -> "ADMIN".equalsIgnoreCase(r.getNombre())).findFirst().orElseThrow();
        }
    }

    private void ensureComUsuario(Usuario admin, Rol adminRol) {
        boolean already = usuarioComunicacionRepository.findByUsuarioOid(admin.getOid()).isPresent();
        if (already) return;
        // también buscar por lista para evitar duplicado
        boolean already2 = !usuarioComunicacionRepository.findAllByUsuarioOid(admin.getOid()).isEmpty();
        if (already2) return;
        try {
            usuarioComunicacionRepository.save(UsuarioComunicacion.builder().usuario(admin).rol(adminRol).estado(true).build());
        } catch (Exception ex) {
            log.warn("JPA save comusuario falló, reintentando con SQL nativo: {}", ex.getMessage());
            Integer nextOid = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(oid),0)+1 FROM comusuario", Integer.class);
            jdbcTemplate.update("INSERT INTO comusuario (oid, genusuario, comrol, comusuestado) VALUES (?,?,?,?)",
                    nextOid, admin.getOid(), adminRol.getOid(), true);
        }
        log.info("Rol ADMIN asignado al usuario '{}'", adminUsername);
    }
}

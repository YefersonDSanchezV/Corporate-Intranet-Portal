package co.com.icvc.intranet_backend.user.repository;

import co.com.icvc.intranet_backend.user.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByCorreoInstitucional(String correoInstitucional);

    List<Usuario> findAllByOrderByUsernameAsc();
}
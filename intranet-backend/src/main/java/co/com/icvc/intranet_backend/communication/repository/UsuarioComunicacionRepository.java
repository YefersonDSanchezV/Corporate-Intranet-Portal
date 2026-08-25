package co.com.icvc.intranet_backend.communication.repository;

import co.com.icvc.intranet_backend.communication.entity.UsuarioComunicacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioComunicacionRepository extends JpaRepository<UsuarioComunicacion, Integer> {

    List<UsuarioComunicacion> findAllByOrderByOidAsc();

    Optional<UsuarioComunicacion> findByUsuarioOid(Integer usuarioOid);

    boolean existsByUsuarioOid(Integer usuarioOid);
}
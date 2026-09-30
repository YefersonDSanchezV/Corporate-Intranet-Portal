package co.com.icvc.intranet_backend.communication.repository;

import co.com.icvc.intranet_backend.communication.entity.ComUsuarioAccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComUsuarioAccionRepository extends JpaRepository<ComUsuarioAccion, Integer> {
    List<ComUsuarioAccion> findByUsuarioOid(Integer usuarioOid);
    void deleteByUsuarioOid(Integer usuarioOid);
    List<ComUsuarioAccion> findAllByOrderByOidAsc();
}

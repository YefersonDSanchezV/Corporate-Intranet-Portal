package co.com.icvc.intranet_backend.portal.repository;

import co.com.icvc.intranet_backend.portal.entity.CumpleanosUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CumpleanosUsuarioRepository extends JpaRepository<CumpleanosUsuario, Integer> {

    Optional<CumpleanosUsuario> findByUsuarioOid(Integer usuarioOid);

    List<CumpleanosUsuario> findAllByUsuarioOidIn(List<Integer> usuarioOids);

    boolean existsByPlantillaOid(Integer plantillaOid);
}

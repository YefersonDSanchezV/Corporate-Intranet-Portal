package co.com.icvc.intranet_backend.portal.repository;

import co.com.icvc.intranet_backend.portal.entity.SitioRedireccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SitioRedireccionRepository extends JpaRepository<SitioRedireccion, Integer> {

    List<SitioRedireccion> findAllByModuloOidOrderByNombreAsc(Integer moduloOid);

    List<SitioRedireccion> findAllByOrderByNombreAsc();
}
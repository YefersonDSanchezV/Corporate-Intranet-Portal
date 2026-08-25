package co.com.icvc.intranet_backend.assistance.repository;

import co.com.icvc.intranet_backend.assistance.entity.SitioExterno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SitioExternoRepository extends JpaRepository<SitioExterno, Integer> {

    List<SitioExterno> findAllByOrderByNombreAsc();
}
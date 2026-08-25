package co.com.icvc.intranet_backend.directory.repository;

import co.com.icvc.intranet_backend.directory.entity.Piso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PisoRepository extends JpaRepository<Piso, Integer> {

    List<Piso> findAllByOrderByNombreAsc();
}
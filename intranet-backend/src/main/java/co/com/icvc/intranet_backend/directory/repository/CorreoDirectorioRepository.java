package co.com.icvc.intranet_backend.directory.repository;

import co.com.icvc.intranet_backend.directory.entity.CorreoDirectorio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CorreoDirectorioRepository extends JpaRepository<CorreoDirectorio, Integer> {

    List<CorreoDirectorio> findAllByOrderByNombreAsc();

    List<CorreoDirectorio> findAllBySoporteTrue();
}
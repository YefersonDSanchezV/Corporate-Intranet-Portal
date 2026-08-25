package co.com.icvc.intranet_backend.directory.repository;

import co.com.icvc.intranet_backend.directory.entity.ExtensionDirectorio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExtensionDirectorioRepository extends JpaRepository<ExtensionDirectorio, Integer> {

    List<ExtensionDirectorio> findAllByOrderByNombreAsc();

    List<ExtensionDirectorio> findAllBySoporteTrue();
}
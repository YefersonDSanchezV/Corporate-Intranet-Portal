package co.com.icvc.intranet_backend.assistance.repository;

import co.com.icvc.intranet_backend.assistance.entity.FormatoContingencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FormatoContingenciaRepository extends JpaRepository<FormatoContingencia, Integer> {

    List<FormatoContingencia> findAllByOrderByNombreAsc();
}
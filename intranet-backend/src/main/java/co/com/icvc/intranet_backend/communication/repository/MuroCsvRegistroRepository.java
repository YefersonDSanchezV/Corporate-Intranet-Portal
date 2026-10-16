package co.com.icvc.intranet_backend.communication.repository;

import co.com.icvc.intranet_backend.communication.entity.MuroCsvRegistro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MuroCsvRegistroRepository extends JpaRepository<MuroCsvRegistro, Integer> {

    List<MuroCsvRegistro> findAllByOrderByFechaDiaDesc();

    Optional<MuroCsvRegistro> findByFechaDia(LocalDate fechaDia);

    boolean existsByFechaDia(LocalDate fechaDia);
}

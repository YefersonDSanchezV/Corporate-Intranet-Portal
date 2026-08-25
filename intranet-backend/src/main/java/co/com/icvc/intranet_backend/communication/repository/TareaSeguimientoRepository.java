package co.com.icvc.intranet_backend.communication.repository;

import co.com.icvc.intranet_backend.communication.entity.TareaSeguimiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TareaSeguimientoRepository extends JpaRepository<TareaSeguimiento, Integer> {

    List<TareaSeguimiento> findAllByOrderByFechaLimiteAsc();
}
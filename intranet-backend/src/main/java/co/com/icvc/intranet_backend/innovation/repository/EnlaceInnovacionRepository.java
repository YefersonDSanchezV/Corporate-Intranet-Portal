package co.com.icvc.intranet_backend.innovation.repository;

import co.com.icvc.intranet_backend.innovation.entity.EnlaceInnovacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnlaceInnovacionRepository extends JpaRepository<EnlaceInnovacion, Integer> {

    List<EnlaceInnovacion> findAllByOrderByFechaCreacionDesc();
}
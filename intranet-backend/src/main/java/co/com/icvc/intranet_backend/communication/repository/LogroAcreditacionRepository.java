package co.com.icvc.intranet_backend.communication.repository;

import co.com.icvc.intranet_backend.communication.entity.LogroAcreditacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LogroAcreditacionRepository extends JpaRepository<LogroAcreditacion, Integer> {

    List<LogroAcreditacion> findAllByOrderByFechaCreacionDesc();
}
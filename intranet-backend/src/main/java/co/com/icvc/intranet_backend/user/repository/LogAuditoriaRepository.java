package co.com.icvc.intranet_backend.user.repository;

import co.com.icvc.intranet_backend.user.entity.LogAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, Integer> {

    List<LogAuditoria> findAllByOrderByFechaCambioDesc();

    List<LogAuditoria> findAllByTablaOrderByFechaCambioDesc(String tabla);
}
package co.com.icvc.intranet_backend.communication.repository;

import co.com.icvc.intranet_backend.communication.entity.ComentarioTarea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComentarioTareaRepository extends JpaRepository<ComentarioTarea, Integer> {

    List<ComentarioTarea> findAllByTareaOidOrderByFechaAsc(Integer tareaOid);
}
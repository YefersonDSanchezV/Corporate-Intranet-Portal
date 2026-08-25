package co.com.icvc.intranet_backend.communication.repository;

import co.com.icvc.intranet_backend.communication.entity.ArchivoTarea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArchivoTareaRepository extends JpaRepository<ArchivoTarea, Integer> {

    List<ArchivoTarea> findAllByTareaOid(Integer tareaOid);
}
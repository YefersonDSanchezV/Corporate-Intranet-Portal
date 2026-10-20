package co.com.icvc.intranet_backend.user.repository;

import co.com.icvc.intranet_backend.user.entity.CumpleanosManual;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CumpleanosManualRepository extends JpaRepository<CumpleanosManual, Integer> {

    List<CumpleanosManual> findAllByOrderByNombreCompletoAsc();

    boolean existsByPlantillaOid(Integer plantillaOid);
}

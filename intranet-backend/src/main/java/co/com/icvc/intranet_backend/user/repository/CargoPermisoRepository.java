package co.com.icvc.intranet_backend.user.repository;

import co.com.icvc.intranet_backend.user.entity.CargoPermiso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CargoPermisoRepository extends JpaRepository<CargoPermiso, Integer> {

    List<CargoPermiso> findByCargoOid(Integer cargoOid);

    void deleteByCargoOid(Integer cargoOid);

    List<CargoPermiso> findByTipo(String tipo);
}

package co.com.icvc.intranet_backend.user.repository;

import co.com.icvc.intranet_backend.user.entity.CargoIntra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CargoIntraRepository extends JpaRepository<CargoIntra, Integer> {

    List<CargoIntra> findAllByOrderByNombreAsc();
}
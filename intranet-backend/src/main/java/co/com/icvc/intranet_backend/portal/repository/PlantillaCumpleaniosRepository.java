package co.com.icvc.intranet_backend.portal.repository;

import co.com.icvc.intranet_backend.portal.entity.PlantillaCumpleanios;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlantillaCumpleaniosRepository extends JpaRepository<PlantillaCumpleanios, Integer> {

    List<PlantillaCumpleanios> findAllByOrderByFechaCreacionDesc();
}

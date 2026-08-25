package co.com.icvc.intranet_backend.directory.repository;

import co.com.icvc.intranet_backend.directory.entity.Area;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AreaRepository extends JpaRepository<Area, Integer> {

    List<Area> findAllByOrderByNombreAsc();
}
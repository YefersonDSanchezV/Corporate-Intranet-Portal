package co.com.icvc.intranet_backend.communication.repository;

import co.com.icvc.intranet_backend.communication.entity.RolPermiso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RolPermisoRepository extends JpaRepository<RolPermiso, Integer> {

    List<RolPermiso> findAllByRolOid(Integer rolOid);

    void deleteAllByRolOid(Integer rolOid);
}
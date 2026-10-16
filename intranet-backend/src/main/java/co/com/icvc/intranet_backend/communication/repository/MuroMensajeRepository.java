package co.com.icvc.intranet_backend.communication.repository;

import co.com.icvc.intranet_backend.communication.entity.MuroMensaje;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MuroMensajeRepository extends JpaRepository<MuroMensaje, Integer> {

    List<MuroMensaje> findTop50ByOrderByOidDesc();

    List<MuroMensaje> findByOidGreaterThanOrderByOidAsc(Integer oid);

    List<MuroMensaje> findTop30ByOidLessThanOrderByOidDesc(Integer oid);

    List<MuroMensaje> findAllByOrderByOidAsc();
}

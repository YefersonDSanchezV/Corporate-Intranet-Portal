package co.com.icvc.intranet_backend.communication.repository;

import co.com.icvc.intranet_backend.communication.entity.MuroMensajeHist;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MuroMensajeHistRepository extends JpaRepository<MuroMensajeHist, Integer> {
}

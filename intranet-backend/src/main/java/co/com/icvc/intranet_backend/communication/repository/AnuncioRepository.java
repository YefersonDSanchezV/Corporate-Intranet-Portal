package co.com.icvc.intranet_backend.communication.repository;

import co.com.icvc.intranet_backend.communication.entity.Anuncio;
import co.com.icvc.intranet_backend.communication.enums.EstadoAnuncio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnuncioRepository extends JpaRepository<Anuncio, Integer> {

    List<Anuncio> findAllByEliminadoFalseOrderByFechaCreacionDesc();

    List<Anuncio> findAllByEliminadoFalseAndEstadoOrderByFechaCreacionDesc(EstadoAnuncio estado);
}
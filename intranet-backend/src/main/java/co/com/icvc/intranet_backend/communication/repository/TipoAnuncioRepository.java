package co.com.icvc.intranet_backend.communication.repository;

import co.com.icvc.intranet_backend.communication.entity.TipoAnuncio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TipoAnuncioRepository extends JpaRepository<TipoAnuncio, Integer> {

    List<TipoAnuncio> findAllByOrderByNombreAsc();
}
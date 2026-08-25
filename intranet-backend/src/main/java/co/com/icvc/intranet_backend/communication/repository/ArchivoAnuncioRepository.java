package co.com.icvc.intranet_backend.communication.repository;

import co.com.icvc.intranet_backend.communication.entity.ArchivoAnuncio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArchivoAnuncioRepository extends JpaRepository<ArchivoAnuncio, Integer> {

    List<ArchivoAnuncio> findAllByAnuncioOid(Integer anuncioOid);
}
package co.com.icvc.intranet_backend.communication.repository;

import co.com.icvc.intranet_backend.communication.entity.ArchivoLogro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArchivoLogroRepository extends JpaRepository<ArchivoLogro, Integer> {

    List<ArchivoLogro> findAllByLogroOid(Integer logroOid);
}
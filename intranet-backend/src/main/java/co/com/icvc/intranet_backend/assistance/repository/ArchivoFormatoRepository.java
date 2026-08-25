package co.com.icvc.intranet_backend.assistance.repository;

import co.com.icvc.intranet_backend.assistance.entity.ArchivoFormato;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArchivoFormatoRepository extends JpaRepository<ArchivoFormato, Integer> {

    List<ArchivoFormato> findAllByFormatoOid(Integer formatoOid);
}
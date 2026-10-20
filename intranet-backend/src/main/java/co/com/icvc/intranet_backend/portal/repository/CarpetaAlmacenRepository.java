package co.com.icvc.intranet_backend.portal.repository;

import co.com.icvc.intranet_backend.portal.entity.CarpetaAlmacen;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CarpetaAlmacenRepository extends JpaRepository<CarpetaAlmacen, Integer> {

    List<CarpetaAlmacen> findAllByOrderByNombreAsc();

    Optional<CarpetaAlmacen> findFirstByBucketAndPrefijo(String bucket, String prefijo);

    boolean existsByBucketAndPrefijo(String bucket, String prefijo);

    boolean existsByBucketAndPrefijoAndOidNot(String bucket, String prefijo, Integer oid);

    /** Bloqueo de fila: hace segura la eliminación frente a cargas concurrentes. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CarpetaAlmacen c where c.oid = :oid")
    Optional<CarpetaAlmacen> findByIdForUpdate(@Param("oid") Integer oid);
}

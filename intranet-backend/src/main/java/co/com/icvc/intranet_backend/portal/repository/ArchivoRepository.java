package co.com.icvc.intranet_backend.portal.repository;

import co.com.icvc.intranet_backend.portal.entity.Archivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ArchivoRepository extends JpaRepository<Archivo, Integer> {

    /**
     * Archivos cuyo objeto vive dentro de un bucket+prefijo (carpeta lógica).
     * La ruta se guarda como {@code s3://bucket/clave}, por lo que el filtro
     * compara el prefijo de almacenamiento dentro de ese bucket.
     */
    @Query("select a from Archivo a where a.ruta like concat('s3://', :bucket, '/', :prefijo, '%')")
    List<Archivo> findEnCarpeta(@Param("bucket") String bucket, @Param("prefijo") String prefijo);

    @Query("select count(a) from Archivo a where a.ruta like concat('s3://', :bucket, '/', :prefijo, '%')")
    long countEnCarpeta(@Param("bucket") String bucket, @Param("prefijo") String prefijo);
}

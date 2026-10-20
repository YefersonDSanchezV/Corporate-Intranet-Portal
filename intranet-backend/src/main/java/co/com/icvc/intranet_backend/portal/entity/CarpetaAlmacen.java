package co.com.icvc.intranet_backend.portal.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Carpeta lógica de almacenamiento: combina un bucket físico de MinIO con un
 * prefijo de objeto, de modo que se puedan crear categorías de negocio nuevas
 * desde la interfaz sin crear buckets ni tocar código.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "gencarpetaalmacen")
public class CarpetaAlmacen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @Column(name = "gencarpnombre", nullable = false, length = 120)
    private String nombre;

    @Column(name = "gencarpdescripcion", length = 255)
    private String descripcion;

    /** DOCUMENTOS | IMAGENES | VIDEOS | OTROS */
    @Column(name = "gencarptipo", nullable = false, length = 20)
    private String tipo;

    @Column(name = "gencarpbucket", nullable = false, length = 120)
    private String bucket;

    @Column(name = "gencarpprefijo", nullable = false, length = 255)
    private String prefijo;

    @Column(name = "gencarpactivo", nullable = false)
    private boolean activo;

    @Column(name = "gencarpfechcrea", nullable = false)
    private LocalDateTime fechaCreacion;
}

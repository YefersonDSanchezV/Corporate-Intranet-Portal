package co.com.icvc.intranet_backend.portal.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Plantilla (imagen de tarjeta) usada en el módulo de cumpleaños.
 * El archivo vive en {@code genarchivo}; al eliminar la plantilla se elimina también su archivo.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "genplantillacumple")
public class PlantillaCumpleanios {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @Column(name = "genplannombre", nullable = false, length = 120)
    private String nombre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genarchivo", nullable = false)
    private Archivo archivo;

    @Column(name = "genplanfechcrea", nullable = false)
    private LocalDateTime fechaCreacion;

    /** Posición y tamaño de la foto del funcionario sobre la plantilla, en porcentaje (0-100). */
    @Column(name = "genplanfotopx", nullable = false)
    private BigDecimal fotoPx;

    @Column(name = "genplanfotopy", nullable = false)
    private BigDecimal fotoPy;

    @Column(name = "genplanfotowancho", nullable = false)
    private BigDecimal fotoAncho;

    @Column(name = "genplanfotoalto", nullable = false)
    private BigDecimal fotoAlto;

    @Column(name = "genplanfotoredondo", nullable = false)
    private boolean fotoRedondo;

    /**
     * JSON con la posición y el estilo de los campos dinámicos (nombre, cargo y
     * fecha) expresados en porcentaje sobre la plantilla. Si es {@code null} la
     * aplicación usa los valores por defecto, de modo que las plantillas creadas
     * antes de V37 siguen funcionando.
     */
    @Column(name = "genplanconfig", columnDefinition = "TEXT")
    private String config;

    /** Meses (1..12) separados por coma en que aplica; vacío = todo el año. */
    @Column(name = "genplanmeses", length = 30)
    private String meses;

    /** Formato original cargado: PDF o IMAGEN. */
    @Column(name = "genplanorigen", length = 20)
    private String origen;

    /**
     * Capa frontal opcional: un PNG (idealmente con transparencia) que se dibuja por
     * encima de la foto y por debajo de los textos, para los adornos del arte que van
     * sobre el marco de la foto (por ejemplo, el gorro de una plantilla navideña).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genplanfrente")
    private Archivo frente;
}

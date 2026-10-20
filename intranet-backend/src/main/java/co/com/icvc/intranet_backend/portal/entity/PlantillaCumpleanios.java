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
}

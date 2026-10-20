package co.com.icvc.intranet_backend.portal.entity;

import co.com.icvc.intranet_backend.user.entity.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Datos de cumpleaños configurados por el operador para un usuario del sistema
 * (cumpleaños automático): foto de la tarjeta y plantilla de fondo, con la
 * posición y el tamaño de la foto expresados en porcentaje (0-100).
 *
 * <p>La fecha de nacimiento y el nombre siguen viviendo en {@code genusuario}:
 * aquí solo se guarda lo que el sistema no puede deducir.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "genusucumple")
public class CumpleanosUsuario {

    public static final BigDecimal DEFAULT_PCT = new BigDecimal("50");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genusuario", nullable = false, unique = true)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genucumfoto")
    private Archivo foto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genucumplantilla")
    private PlantillaCumpleanios plantilla;

    @Column(name = "genucumfotopx", nullable = false)
    private BigDecimal fotoPx;

    @Column(name = "genucumfotopy", nullable = false)
    private BigDecimal fotoPy;

    @Column(name = "genucumfotowancho", nullable = false)
    private BigDecimal fotoAncho;

    @Column(name = "genucumfotoalto", nullable = false)
    private BigDecimal fotoAlto;

    @Column(name = "genucumfotoredondo", nullable = false)
    private boolean fotoRedondo;

    @Column(name = "genucumfechact", nullable = false)
    private LocalDateTime fechaActualizacion;
}

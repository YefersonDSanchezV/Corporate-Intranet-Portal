package co.com.icvc.intranet_backend.user.entity;

import co.com.icvc.intranet_backend.user.enums.EstadoSolicitud;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "gensolusuario")
public class SolicitudUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @Column(name = "gensolusuiden", nullable = false)
    private Long identificacion;

    @Column(name = "gensolusunomb", nullable = false, length = 255)
    private String nombre;

    @Column(name = "gensolusucarg", nullable = false, length = 255)
    private String cargo;

    @Column(name = "gensolusumail", nullable = false, length = 255)
    private String correo;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "gensolusuesta", nullable = false)
    private EstadoSolicitud estado;

    @Column(name = "gensolfechsol", nullable = false)
    private LocalDateTime fechaSolicitud;

    @Column(name = "gensolfechapr")
    private LocalDateTime fechaAprobacion;

    @Column(name = "gensolfechrech")
    private LocalDateTime fechaRechazo;

    @Column(name = "gensolusuobse", nullable = false, columnDefinition = "text")
    private String observaciones;
}
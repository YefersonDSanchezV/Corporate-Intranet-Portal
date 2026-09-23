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

    @Column(name = "gensolusuprinom", length = 255)
    private String primerNombre;

    @Column(name = "gensolusegnom", length = 255)
    private String segundoNombre;

    @Column(name = "gensoluspriapell", length = 255)
    private String primerApellido;

    @Column(name = "gensolusegapell", length = 255)
    private String segundoApellido;

    @Column(name = "gensolusucarg", nullable = false, length = 255)
    private String cargo;

    @Column(name = "gensolusumail", nullable = false, length = 255)
    private String correo;

    @Column(name = "gensoluscel", length = 50)
    private String celular;

    @Column(name = "gensolusfecnac")
    private java.time.LocalDate fechaNacimiento;

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
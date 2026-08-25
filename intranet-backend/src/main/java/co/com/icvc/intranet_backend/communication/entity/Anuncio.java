package co.com.icvc.intranet_backend.communication.entity;

import co.com.icvc.intranet_backend.communication.enums.EstadoAnuncio;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "comanuncio")
public class Anuncio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @Column(name = "comanutit", nullable = false, length = 255)
    private String titulo;

    @Column(name = "comanudes", nullable = false, columnDefinition = "text")
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comanutipo", nullable = false)
    private TipoAnuncio tipo;

    @Column(name = "comanufechini")
    private LocalDateTime fechaInicio;

    @Column(name = "comanufechfin")
    private LocalDateTime fechaFin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comusuario")
    private UsuarioComunicacion creador;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "comanuestado", nullable = false)
    private EstadoAnuncio estado;

    @Column(name = "comanufechcre", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "comanuvigenci")
    private LocalDateTime fechaVencimiento;

    @Column(name = "comanueliminado", nullable = false)
    private boolean eliminado;
}
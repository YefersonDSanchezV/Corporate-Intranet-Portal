package co.com.icvc.intranet_backend.communication.entity;

import co.com.icvc.intranet_backend.communication.enums.EstadoTarea;
import co.com.icvc.intranet_backend.communication.enums.PrioridadTarea;
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
@Table(name = "comtarsegui")
public class TareaSeguimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @Column(name = "comtarsetit", nullable = false, length = 255)
    private String titulo;

    @Column(name = "comtarsedes", length = 255)
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comusuarioasig", nullable = false)
    private UsuarioComunicacion asignadaA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comusuarioqasig", nullable = false)
    private UsuarioComunicacion asignadaPor;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "comtarestad", nullable = false)
    private EstadoTarea estado;

    @Column(name = "comtarfechin")
    private LocalDateTime fechaInicio;

    @Column(name = "comtarfechli")
    private LocalDateTime fechaLimite;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "comtarprior", nullable = false)
    private PrioridadTarea prioridad;
}
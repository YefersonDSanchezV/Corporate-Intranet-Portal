package co.com.icvc.intranet_backend.user.entity;

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

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "genlogs")
public class LogAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genusuario", nullable = false)
    private Usuario usuario;

    @Column(name = "genlogacci", length = 255)
    private String accion;

    @Column(name = "genlogvalant", columnDefinition = "text")
    private String valorAnterior;

    @Column(name = "genlogvalnue", columnDefinition = "text")
    private String valorNuevo;

    @Column(name = "genlogfechac", nullable = false)
    private LocalDateTime fechaCambio;

    @Column(name = "genlogip", length = 255)
    private String ip;

    @Column(name = "genlogtabla", length = 255)
    private String tabla;

    @Column(name = "genlogregist", columnDefinition = "text")
    private String registro;
}
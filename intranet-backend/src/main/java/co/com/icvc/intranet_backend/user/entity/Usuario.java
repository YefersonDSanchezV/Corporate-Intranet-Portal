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

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "genusuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @Column(name = "genusunom", nullable = false, length = 255)
    private String username;

    @Column(name = "genusuclahash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "genususta", nullable = false)
    private boolean estado;

    @Column(name = "genusuide", nullable = false)
    private Long identificacion;

    @Column(name = "genusunomcom", nullable = false, length = 255)
    private String nombreCompleto;

    @Column(name = "genusufecnam", nullable = false)
    private LocalDate fechaNacimiento;

    @Column(name = "genusuemacor", nullable = false, length = 255)
    private String correoInstitucional;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gencargointra", nullable = false)
    private CargoIntra cargo;

    @Column(name = "genusufechcrea", nullable = false)
    private LocalDateTime fechaCreacion;
}
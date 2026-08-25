package co.com.icvc.intranet_backend.communication.entity;

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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "comlogroacredi")
public class LogroAcreditacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @Column(name = "comlogacretitu", nullable = false, length = 255)
    private String titulo;

    @Column(name = "comlogacredesc", length = 255)
    private String descripcion;

    @Column(name = "comlogacreurlima", length = 255)
    private String urlImagen;

    @Column(name = "comlogacrefechacre", nullable = false)
    private LocalDateTime fechaCreacion;
}
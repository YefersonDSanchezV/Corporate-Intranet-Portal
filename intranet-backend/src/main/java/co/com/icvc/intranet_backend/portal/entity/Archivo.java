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
@Table(name = "genarchivo")
public class Archivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @Column(name = "genarchnom", nullable = false, length = 255)
    private String nombreInterno;

    @Column(name = "genarchnomori", nullable = false, length = 255)
    private String nombreOriginal;

    @Column(name = "genarchruta", nullable = false, length = 500)
    private String ruta;

    @Column(name = "genarchtipo", length = 255)
    private String tipo;

    @Column(name = "genarchsize")
    private Long tamano;

    @Column(name = "genarchfechcre", nullable = false)
    private LocalDateTime fechaCreacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genusuario", nullable = false)
    private Usuario usuario;
}
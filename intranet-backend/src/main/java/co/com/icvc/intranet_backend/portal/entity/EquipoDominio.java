package co.com.icvc.intranet_backend.portal.entity;

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
@Table(name = "genequipodominio")
public class EquipoDominio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @Column(name = "geneqnombre", nullable = false, length = 255)
    private String nombre;

    @Column(name = "genequiou", length = 255)
    private String unidadOrganizativa;

    @Column(name = "geneqactivo", nullable = false)
    private boolean activo;

    @Column(name = "genequltsyn")
    private LocalDateTime ultimaSincronizacion;
}
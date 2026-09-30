package co.com.icvc.intranet_backend.communication.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "comusuario_accion", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"genusuario", "accion"})
})
public class ComUsuarioAccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genusuario", nullable = false)
    private co.com.icvc.intranet_backend.user.entity.Usuario usuario;

    @Column(name = "accion", nullable = false, length = 255)
    private String accion;
}

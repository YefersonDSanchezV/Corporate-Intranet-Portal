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
@Table(name = "gencargopermiso", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"gencargointra", "permiso", "tipo"})
})
public class CargoPermiso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gencargointra", nullable = false)
    private CargoIntra cargo;

    @Column(name = "permiso", nullable = false, length = 255)
    private String permiso;

    @Column(name = "tipo", nullable = false, length = 20)
    private String tipo; // MODULO o ACCION
}

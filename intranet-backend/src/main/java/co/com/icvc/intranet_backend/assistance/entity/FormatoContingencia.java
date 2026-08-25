package co.com.icvc.intranet_backend.assistance.entity;

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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "asiforcontin")
public class FormatoContingencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @Column(name = "asiforconnomfor", nullable = false, length = 255)
    private String nombre;

    @Column(name = "asiforconobserv", length = 255)
    private String observaciones;

    @Column(name = "asiforconcodigo", length = 255)
    private String codigo;
}
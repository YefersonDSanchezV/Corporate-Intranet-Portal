package co.com.icvc.intranet_backend.directory.entity;

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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "gendircextenciones")
public class ExtensionDirectorio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @Column(name = "gendirextnom", nullable = false, length = 255)
    private String nombre;

    @Column(name = "gendirext", nullable = false)
    private Integer extension;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gendirextare", nullable = false)
    private Area area;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gendirextpis", nullable = false)
    private Piso piso;

    @Column(name = "gendirextsop", nullable = false)
    private boolean soporte;
}
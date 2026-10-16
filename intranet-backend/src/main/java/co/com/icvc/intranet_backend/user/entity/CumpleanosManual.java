package co.com.icvc.intranet_backend.user.entity;

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

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Cumpleaños registrado manualmente desde el módulo Calendario de Cumpleaños.
 * El {@code cargo} es texto libre escrito por el operador y es independiente
 * del catálogo de cargos del sistema ({@code gencargointra}).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "gencumpleanos")
public class CumpleanosManual {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @Column(name = "gencumnomcom", nullable = false, length = 255)
    private String nombreCompleto;

    @Column(name = "gencumfecnam", nullable = false)
    private LocalDate fechaNacimiento;

    @Column(name = "gencumcargo", nullable = false, length = 255)
    private String cargo;

    @Column(name = "gencumfechcrea", nullable = false)
    private LocalDateTime fechaCreacion;
}

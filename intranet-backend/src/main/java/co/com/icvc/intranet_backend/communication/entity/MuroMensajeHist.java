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

/**
 * Histórico de mensajes del Muro de Cumpleaños. El job nocturno mueve aquí
 * los mensajes del día antes de limpiar la tabla viva {@code genmuromen}.
 * Se guarda el nombre del autor como texto para no depender del usuario.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "genmuromenhist")
public class MuroMensajeHist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @Column(name = "genmuromenhautor", nullable = false, length = 255)
    private String autorNombre;

    @Column(name = "genmuromenhtex", nullable = false, length = 500)
    private String texto;

    @Column(name = "genmuromenhfech", nullable = false)
    private LocalDateTime fecha;

    @Column(name = "genmuromenhfecharch", nullable = false)
    private LocalDateTime fechaArchivo;
}

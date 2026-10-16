package co.com.icvc.intranet_backend.communication.entity;

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

/**
 * Mensaje del Muro de Cumpleaños (bandeja de conversación del panel público).
 * Tabla viva: solo contiene los mensajes del día en curso; el job nocturno
 * los archiva en {@code genmuromenhist} y genera el CSV del día.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "genmuromen")
public class MuroMensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genusuario")
    private Usuario autor;

    /**
     * Nombre a mostrar. Invitados (sin sesión): obligatorio, escrito por ellos.
     * Usuarios con sesión: foto del nombre completo al publicar.
     */
    @Column(name = "genmuromennom", length = 60)
    private String autorNombre;

    @Column(name = "genmuromentex", nullable = false, length = 500)
    private String texto;

    @Column(name = "genmuromenfech", nullable = false)
    private LocalDateTime fecha;
}

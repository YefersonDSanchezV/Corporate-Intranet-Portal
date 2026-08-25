package co.com.icvc.intranet_backend.communication.entity;

import co.com.icvc.intranet_backend.portal.entity.Archivo;
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
@Table(name = "comtareaarchivo")
public class ArchivoTarea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oid")
    private Integer oid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comtarsegui", nullable = false)
    private TareaSeguimiento tarea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genarchivo", nullable = false)
    private Archivo archivo;
}
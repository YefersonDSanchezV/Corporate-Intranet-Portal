package co.com.icvc.intranet_backend.user;

import co.com.icvc.intranet_backend.common.exception.ConflictException;
import co.com.icvc.intranet_backend.user.entity.SolicitudUsuario;
import co.com.icvc.intranet_backend.user.enums.EstadoSolicitud;
import co.com.icvc.intranet_backend.user.repository.SolicitudUsuarioRepository;
import co.com.icvc.intranet_backend.user.service.AccessRequestService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccessRequestServiceTest {

    @Mock
    private SolicitudUsuarioRepository solicitudRepository;

    @InjectMocks
    private AccessRequestService accessRequestService;

    @Test
    void createRegistraSolicitudPendiente() {
        SolicitudUsuario guardada = SolicitudUsuario.builder()
                .oid(1)
                .identificacion(100L)
                .estado(EstadoSolicitud.PENDIENTE)
                .fechaSolicitud(LocalDateTime.now())
                .build();
        when(solicitudRepository.save(any())).thenReturn(guardada);

        var response = accessRequestService.create(
                new co.com.icvc.intranet_backend.user.dto.SolicitudUsuarioDtos.CreateRequest(
                        100L, "Ana", "Enfermera", "ana@icvc.gov.co", "nueva"));

        assertThat(response.estado()).isEqualTo("PENDIENTE");
        assertThat(response.identificacion()).isEqualTo(100L);
    }

    @Test
    void approveMarcaAprobadaConFecha() {
        SolicitudUsuario solicitud = SolicitudUsuario.builder()
                .oid(1)
                .identificacion(200L)
                .estado(EstadoSolicitud.PENDIENTE)
                .build();
        when(solicitudRepository.findById(1)).thenReturn(Optional.of(solicitud));
        when(solicitudRepository.save(solicitud)).thenReturn(solicitud);

        var response = accessRequestService.approve(1);

        assertThat(response.estado()).isEqualTo("APROBADA");
        assertThat(solicitud.getFechaAprobacion()).isNotNull();
    }

    @Test
    void approveDeSolicitudYaProcesadaLanzaConflict() {
        SolicitudUsuario solicitud = SolicitudUsuario.builder()
                .oid(1)
                .estado(EstadoSolicitud.APROBADA)
                .build();
        when(solicitudRepository.findById(1)).thenReturn(Optional.of(solicitud));

        assertThatThrownBy(() -> accessRequestService.approve(1))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("pendientes");
    }

    @Test
    void rejectMarcaRechazadaConFecha() {
        SolicitudUsuario solicitud = SolicitudUsuario.builder()
                .oid(1)
                .estado(EstadoSolicitud.PENDIENTE)
                .build();
        when(solicitudRepository.findById(1)).thenReturn(Optional.of(solicitud));
        when(solicitudRepository.save(solicitud)).thenReturn(solicitud);

        var response = accessRequestService.reject(1);

        assertThat(response.estado()).isEqualTo("RECHAZADA");
        assertThat(solicitud.getFechaRechazo()).isNotNull();
    }
}
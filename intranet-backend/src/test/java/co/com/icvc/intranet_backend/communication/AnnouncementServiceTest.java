package co.com.icvc.intranet_backend.communication;

import co.com.icvc.intranet_backend.common.exception.ConflictException;
import co.com.icvc.intranet_backend.communication.dto.AnuncioDtos;
import co.com.icvc.intranet_backend.communication.entity.Anuncio;
import co.com.icvc.intranet_backend.communication.enums.EstadoAnuncio;
import co.com.icvc.intranet_backend.communication.repository.AnuncioRepository;
import co.com.icvc.intranet_backend.communication.repository.ArchivoAnuncioRepository;
import co.com.icvc.intranet_backend.communication.repository.TipoAnuncioRepository;
import co.com.icvc.intranet_backend.communication.repository.UsuarioComunicacionRepository;
import co.com.icvc.intranet_backend.communication.service.AnnouncementService;
import co.com.icvc.intranet_backend.portal.service.FileService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnnouncementServiceTest {

    @Mock
    private AnuncioRepository anuncioRepository;
    @Mock
    private TipoAnuncioRepository tipoRepository;
    @Mock
    private UsuarioComunicacionRepository usuarioComunicacionRepository;
    @Mock
    private ArchivoAnuncioRepository archivoAnuncioRepository;
    @Mock
    private FileService fileService;

    @InjectMocks
    private AnnouncementService announcementService;

    @Test
    void createAsignaEstadoPendientePorDefecto() {
        Anuncio anuncio = Anuncio.builder()
                .oid(1)
                .titulo("Nuevo anuncio")
                .estado(EstadoAnuncio.PENDIENTE)
                .build();
        when(tipoRepository.findById(1)).thenReturn(Optional.of(
                co.com.icvc.intranet_backend.communication.entity.TipoAnuncio.builder()
                        .oid(1).nombre("Informativo").build()));
        when(anuncioRepository.save(any())).thenReturn(anuncio);

        AnuncioDtos.Response response = announcementService.create(
                new AnuncioDtos.CreateRequest("Nuevo anuncio", "desc", 1, null, null, null), null);

        assertThat(response.estado()).isEqualTo("PENDIENTE");
        verify(anuncioRepository).save(any());
    }

    @Test
    void publishCambiaAPublicado() {
        Anuncio anuncio = Anuncio.builder()
                .oid(1)
                .titulo("Anuncio")
                .estado(EstadoAnuncio.PENDIENTE)
                .build();
        when(anuncioRepository.findById(1)).thenReturn(Optional.of(anuncio));
        when(anuncioRepository.save(anuncio)).thenReturn(anuncio);

        AnuncioDtos.Response response = announcementService.publish(1);

        assertThat(response.estado()).isEqualTo("PUBLICADO");
    }

    @Test
    void publishDeAnuncioYaPublicadoLanzaConflict() {
        Anuncio anuncio = Anuncio.builder().oid(1).estado(EstadoAnuncio.PUBLICADO).build();
        when(anuncioRepository.findById(1)).thenReturn(Optional.of(anuncio));

        assertThatThrownBy(() -> announcementService.publish(1))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("ya está publicado");
    }

    @Test
    void deleteMarcaEliminadoLogico() {
        Anuncio anuncio = Anuncio.builder().oid(1).eliminado(false).build();
        when(anuncioRepository.findById(1)).thenReturn(Optional.of(anuncio));

        announcementService.delete(1);

        assertThat(anuncio.isEliminado()).isTrue();
        verify(anuncioRepository).save(anuncio);
    }
}
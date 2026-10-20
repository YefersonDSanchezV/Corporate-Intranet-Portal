package co.com.icvc.intranet_backend.user;

import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.dto.PosicionFoto;
import co.com.icvc.intranet_backend.portal.entity.Archivo;
import co.com.icvc.intranet_backend.portal.entity.CumpleanosUsuario;
import co.com.icvc.intranet_backend.portal.repository.ArchivoRepository;
import co.com.icvc.intranet_backend.portal.repository.CumpleanosUsuarioRepository;
import co.com.icvc.intranet_backend.portal.repository.PlantillaCumpleaniosRepository;
import co.com.icvc.intranet_backend.user.dto.CumpleaniosRegistroDtos;
import co.com.icvc.intranet_backend.user.repository.CumpleanosManualRepository;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import co.com.icvc.intranet_backend.user.service.CumpleaniosRegistroService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Configuración de la tarjeta de los cumpleaños automáticos:
 * la foto solo puede ser un archivo del mismo usuario.
 */
@ExtendWith(MockitoExtension.class)
class CumpleaniosRegistroServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private CumpleanosManualRepository cumpleanosManualRepository;
    @Mock
    private CumpleanosUsuarioRepository cumpleanosUsuarioRepository;
    @Mock
    private PlantillaCumpleaniosRepository plantillaRepository;
    @Mock
    private ArchivoRepository archivoRepository;
    @InjectMocks
    private CumpleaniosRegistroService service;

    @Test
    void updateRechazaFotoDeOtroUsuario() {
        var usuario = co.com.icvc.intranet_backend.user.entity.Usuario.builder()
                .oid(7).username("jdoe").build();
        var otro = co.com.icvc.intranet_backend.user.entity.Usuario.builder().oid(99).build();
        Archivo archivo = Archivo.builder().oid(5).usuario(otro).build();

        when(usuarioRepository.existsById(7)).thenReturn(true);
        when(usuarioRepository.findById(7)).thenReturn(Optional.of(usuario));
        when(archivoRepository.findById(5)).thenReturn(Optional.of(archivo));

        var request = new CumpleaniosRegistroDtos.UpdateRequest(5, null, null, null, null, null, null);

        assertThatThrownBy(() -> service.update(7, request))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("mismo usuario");
        verify(cumpleanosUsuarioRepository, never()).save(any());
    }

    @Test
    void updateGuardaFotoPlantillaYPosicionEnPorcentaje() {
        var usuario = co.com.icvc.intranet_backend.user.entity.Usuario.builder()
                .oid(7).username("jdoe").nombreCompleto("Juan Doe")
                .fechaNacimiento(java.time.LocalDate.of(1990, 4, 12)).estado(true).build();
        Archivo archivo = Archivo.builder().oid(5).usuario(usuario).build();

        when(usuarioRepository.existsById(7)).thenReturn(true);
        when(usuarioRepository.findById(7)).thenReturn(Optional.of(usuario));
        when(archivoRepository.findById(5)).thenReturn(Optional.of(archivo));
        when(cumpleanosUsuarioRepository.findByUsuarioOid(7)).thenReturn(Optional.empty());
        when(cumpleanosUsuarioRepository.save(any())).thenAnswer(inv -> {
            CumpleanosUsuario config = inv.getArgument(0);
            config.setOid(1);
            config.setFechaActualizacion(LocalDateTime.now());
            return config;
        });

        var request = new CumpleaniosRegistroDtos.UpdateRequest(
                5, null, new BigDecimal("40"), new BigDecimal("55"), new BigDecimal("22"), new BigDecimal("30"), false);

        var response = service.update(7, request);

        assertThat(response.origen()).isEqualTo("sistema");
        // En los automáticos el identificador de fila es el del usuario; "oid" queda nulo
        // porque no existe registro manual.
        assertThat(response.usuarioOid()).isEqualTo(7);
        assertThat(response.oid()).isNull();
        assertThat(response.fotoArchivoOid()).isEqualTo(5);
        assertThat(response.plantillaOid()).isNull();
        assertThat(response.posicion()).isEqualTo(
                PosicionFoto.of(new BigDecimal("40"), new BigDecimal("55"), new BigDecimal("22"), new BigDecimal("30"), false));
    }
}

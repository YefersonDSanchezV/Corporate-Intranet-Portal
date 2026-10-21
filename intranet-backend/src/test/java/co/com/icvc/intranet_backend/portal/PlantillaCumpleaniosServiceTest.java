package co.com.icvc.intranet_backend.portal;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.dto.PlantillaCumpleaniosDtos;
import co.com.icvc.intranet_backend.portal.entity.PlantillaCumpleanios;
import co.com.icvc.intranet_backend.portal.repository.CumpleanosUsuarioRepository;
import co.com.icvc.intranet_backend.portal.repository.PlantillaCumpleaniosRepository;
import co.com.icvc.intranet_backend.portal.service.ParametroService;
import co.com.icvc.intranet_backend.portal.service.PlantillaCumpleaniosService;
import co.com.icvc.intranet_backend.portal.service.PdfRasterizador;
import co.com.icvc.intranet_backend.user.repository.CumpleanosManualRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Guardar la composición de una plantilla ya creada (marco, textos y zonas protegidas)
 * sin volver a subir el arte.
 */
class PlantillaCumpleaniosServiceTest {

    private PlantillaCumpleaniosRepository repositorio;
    private PlantillaCumpleaniosService servicio;

    @BeforeEach
    void preparar() {
        repositorio = mock(PlantillaCumpleaniosRepository.class);
        ObjectMapper mapper = new ObjectMapper();
        servicio = new PlantillaCumpleaniosService(
                repositorio,
                mock(CumpleanosUsuarioRepository.class),
                mock(CumpleanosManualRepository.class),
                mock(co.com.icvc.intranet_backend.portal.service.FileService.class),
                mock(ParametroService.class),
                mock(PdfRasterizador.class),
                mapper);
    }

    private PlantillaCumpleanios plantillaConOid(int oid) {
        PlantillaCumpleanios plantilla = PlantillaCumpleanios.builder()
                .nombre("Navideña")
                .fechaCreacion(LocalDateTime.now())
                .build();
        plantilla.setOid(oid);
        return plantilla;
    }

    @Test
    void guardaLaComposicionConLasZonasProtegidas() {
        PlantillaCumpleanios plantilla = plantillaConOid(7);
        when(repositorio.findById(7)).thenReturn(Optional.of(plantilla));
        when(repositorio.save(any(PlantillaCumpleanios.class)))
                .thenAnswer((org.mockito.stubbing.Answer<PlantillaCumpleanios>) inv -> inv.getArgument(0));

        String config = """
                {
                  "nombre": {"visible": true, "x": 78, "y": 64.76, "ancho": 80, "fuente": 3.7,
                             "color": "#FFFFFF", "alineacion": "center", "negrita": true,
                             "cursiva": false, "mayusculas": true, "familia": "serif"},
                  "cargo": {"visible": true, "x": 78, "y": 71.34, "ancho": 80, "fuente": 2.3,
                            "color": "#FFFFFF", "alineacion": "center", "negrita": false,
                            "cursiva": false, "mayusculas": false, "familia": "sans"},
                  "fecha": {"visible": true, "x": 78, "y": 76, "ancho": 80, "fuente": 2.1,
                            "color": "#FFFFFF", "alineacion": "center", "negrita": false,
                            "cursiva": false, "mayusculas": false, "familia": "serif"},
                  "fotoMarco": {"visible": true, "forma": "circulo", "x": 76.4, "y": 39.6,
                                "ancho": 33.3, "alto": 33.3, "borde": true,
                                "colorBorde": "#FFFFFF", "grosorBorde": 3.5},
                  "zonasProtegidas": [
                    {"id": "gorro", "nombre": "Gorro navideño", "x": 77.5, "y": 27.5,
                     "ancho": 22, "alto": 20, "forma": "rectangulo", "activa": true}
                  ]
                }
                """;

        PlantillaCumpleaniosDtos.Response respuesta = servicio.actualizarConfig(7, config);

        assertThat(respuesta.config().zonasProtegidas()).hasSize(1);
        assertThat(respuesta.config().zonasProtegidas().get(0).nombre()).isEqualTo("Gorro navideño");
        assertThat(respuesta.config().zonasProtegidas().get(0).activa()).isTrue();
        // La posición de la foto en la tabla se sincroniza con el marco guardado.
        assertThat(respuesta.foto().px()).isEqualByComparingTo("76.4");
        assertThat(respuesta.foto().ancho()).isEqualByComparingTo("33.3");
        assertThat(respuesta.foto().redondo()).isTrue();

        ArgumentCaptor<PlantillaCumpleanios> guardado = ArgumentCaptor.forClass(PlantillaCumpleanios.class);
        verify(repositorio).save(guardado.capture());
        assertThat(guardado.getValue().getConfig()).contains("gorro");
    }

    @Test
    void rechazaUnaComposicionSinMarcoDeFoto() {
        PlantillaCumpleanios plantilla = plantillaConOid(7);
        when(repositorio.findById(7)).thenReturn(Optional.of(plantilla));

        assertThatThrownBy(() -> servicio.actualizarConfig(7, "{\"nombre\":{}}"))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void avisaSiLaPlantillaNoExiste() {
        when(repositorio.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.actualizarConfig(99, "{}"))
                .isInstanceOf(NotFoundException.class);
    }
}

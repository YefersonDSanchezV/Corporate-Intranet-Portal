package co.com.icvc.intranet_backend.portal;

import co.com.icvc.intranet_backend.portal.dto.LayoutCumpleDtos;
import co.com.icvc.intranet_backend.portal.service.AgenteLayoutCumpleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * El agente de IA es opcional: sin proveedor no se usa y, cuando lo hay, sus respuestas
 * se acotan antes de llegar a la tarjeta.
 */
class AgenteLayoutCumpleServiceTest {

    private AgenteLayoutCumpleService servicio(String url) {
        return new AgenteLayoutCumpleService(new ObjectMapper(), url, "", "modelo-prueba", 5);
    }

    @Test
    void sinUrlConfiguradaElAgenteNoEstaDisponible() {
        assertThat(servicio("").disponible()).isFalse();
        assertThat(servicio(null).disponible()).isFalse();
        assertThat(servicio("   ").disponible()).isFalse();
        assertThat(servicio("").sugerir(new LayoutCumpleDtos.Entrada(1000.0, 1000.0, List.of(), List.of())))
                .isEmpty();
    }

    @Test
    void conUrlConfiguradaElAgenteEstaDisponible() {
        assertThat(servicio("http://agente.local/sugerir").disponible()).isTrue();
    }

    @Test
    void descartaCamposDesconocidosYAcotaLosValores() {
        LayoutCumpleDtos.Respuesta cruda = new LayoutCumpleDtos.Respuesta(
                "ia",
                "  explicación  ",
                List.of(
                        new LayoutCumpleDtos.Ajuste("nombre", 120.0, -30.0, 500.0, 99.0, "mover"),
                        new LayoutCumpleDtos.Ajuste("telefono", 10.0, 10.0, 10.0, 10.0, "no existe")),
                List.of("observación"));

        LayoutCumpleDtos.Respuesta limpia = AgenteLayoutCumpleService.sanearRespuesta(cruda);

        assertThat(limpia.ajustes()).hasSize(1);
        LayoutCumpleDtos.Ajuste ajuste = limpia.ajustes().get(0);
        assertThat(ajuste.campo()).isEqualTo("nombre");
        assertThat(ajuste.x()).isEqualTo(100.0);
        assertThat(ajuste.y()).isEqualTo(0.0);
        assertThat(ajuste.ancho()).isEqualTo(100.0);
        assertThat(ajuste.fuente()).isEqualTo(20.0);
        assertThat(limpia.explicacion()).isEqualTo("explicación");
        assertThat(limpia.origen()).isEqualTo("ia");
    }

    @Test
    void limitaElNumeroDeAjustesYDeObservaciones() {
        LayoutCumpleDtos.Respuesta cruda = new LayoutCumpleDtos.Respuesta(
                "ia",
                "",
                List.of(
                        new LayoutCumpleDtos.Ajuste("nombre", 1.0, 1.0, 10.0, 2.0, "a"),
                        new LayoutCumpleDtos.Ajuste("cargo", 1.0, 1.0, 10.0, 2.0, "b"),
                        new LayoutCumpleDtos.Ajuste("fecha", 1.0, 1.0, 10.0, 2.0, "c"),
                        new LayoutCumpleDtos.Ajuste("nombre", 1.0, 1.0, 10.0, 2.0, "sobra")),
                List.of("1", "2", "3", "4", "5", "6"));

        LayoutCumpleDtos.Respuesta limpia = AgenteLayoutCumpleService.sanearRespuesta(cruda);

        assertThat(limpia.ajustes()).hasSize(3);
        assertThat(limpia.observaciones()).hasSize(5);
    }

    @Test
    void toleraRespuestasVaciasONulas() {
        LayoutCumpleDtos.Respuesta limpia = AgenteLayoutCumpleService.sanearRespuesta(
                new LayoutCumpleDtos.Respuesta(null, null, null, null));

        assertThat(limpia.ajustes()).isEmpty();
        assertThat(limpia.observaciones()).isEmpty();
        assertThat(limpia.explicacion()).isEmpty();
        assertThat(AgenteLayoutCumpleService.sanearRespuesta(null).ajustes()).isEmpty();
    }
}

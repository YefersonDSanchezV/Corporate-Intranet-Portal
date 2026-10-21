package co.com.icvc.intranet_backend.portal;

import co.com.icvc.intranet_backend.portal.dto.ConfigTarjeta;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

/** La configuración de los campos dinámicos siempre queda completa y dentro de rango. */
class ConfigTarjetaTest {

    @Test
    void usaValoresPorDefectoCuandoNoHayConfiguracion() {
        ConfigTarjeta config = ConfigTarjeta.normalizar(null);

        assertThat(config.nombre().visible()).isTrue();
        assertThat(config.nombre().color()).isEqualTo("#0B5E8A");
        assertThat(config.cargo().familia()).isEqualTo("sans");
        assertThat(config.fecha().cursiva()).isTrue();
    }

    @Test
    void completaCamposAusentesConLosValoresPorDefecto() {
        ConfigTarjeta parcial = new ConfigTarjeta(
                new ConfigTarjeta.Campo(true, 10.0, 20.0, 30.0, 5.0, "#123456", "left", true, false, false, "serif",
                        null, null, null, null),
                null,
                null,
                null);

        ConfigTarjeta config = ConfigTarjeta.normalizar(parcial);

        assertThat(config.nombre().x()).isEqualTo(10.0);
        assertThat(config.nombre().color()).isEqualTo("#123456");
        assertThat(config.cargo().x()).isEqualTo(50.0);
        assertThat(config.fecha().y()).isEqualTo(86.0);
    }

    @Test
    void limitaLosValoresFueraDeRango() {
        ConfigTarjeta exagerada = new ConfigTarjeta(
                new ConfigTarjeta.Campo(true, 999.0, -50.0, 500.0, 90.0, "no-es-color", "diagonal", true, false, false,
                        "comic", null, null, null, null),
                null,
                null,
                null);

        ConfigTarjeta config = ConfigTarjeta.normalizar(exagerada);

        assertThat(config.nombre().x()).isEqualTo(100.0);
        assertThat(config.nombre().y()).isEqualTo(0.0);
        assertThat(config.nombre().ancho()).isEqualTo(100.0);
        assertThat(config.nombre().fuente()).isEqualTo(20.0);
        assertThat(config.nombre().color()).isEqualTo("#0B5E8A");
        assertThat(config.nombre().alineacion()).isEqualTo("center");
        assertThat(config.nombre().familia()).isEqualTo("serif");
    }

    // ---------------------------------------------------------- ajuste automático

    @Test
    void elAjusteAutomaticoVieneActivoConInterlineadoHistorico() {
        // Una plantilla creada antes de este cambio (campos en null) debe seguir
        // ajustándose sola en vez de desbordar el arte.
        ConfigTarjeta config = ConfigTarjeta.normalizar(null);

        assertThat(config.nombre().autoAjustar()).isTrue();
        assertThat(config.nombre().interlineado()).isEqualTo(1.18);
        assertThat(config.cargo().autoAjustar()).isTrue();
    }

    @Test
    void elTamanoMinimoPorDefectoEsElSesentaPorCientoDelPreferido() {
        ConfigTarjeta config = ConfigTarjeta.normalizar(null);

        // nombre: 4.6 -> 2.76 ; cargo y fecha: 3.0 -> 1.8 (con tolerancia de coma flotante)
        assertThat(config.nombre().fuenteMin()).isCloseTo(2.76, within(0.0001));
        assertThat(config.cargo().fuenteMin()).isCloseTo(1.8, within(0.0001));
        assertThat(config.fecha().fuenteMax()).isEqualTo(3.0);
    }

    @Test
    void mantieneElRangoDeFuenteCoherente() {
        // fuenteMin mayor que fuenteMax, y fuente por debajo del mínimo.
        ConfigTarjeta rara = new ConfigTarjeta(
                new ConfigTarjeta.Campo(true, 50.0, 50.0, 50.0, 2.0, "#000000", "center", false, false, false, "sans",
                        9.9, true, 8.0, 6.0),
                null,
                null,
                null);

        ConfigTarjeta.Campo campo = ConfigTarjeta.normalizar(rara).nombre();

        assertThat(campo.fuenteMin()).isLessThanOrEqualTo(campo.fuente());
        assertThat(campo.fuente()).isLessThanOrEqualTo(campo.fuenteMax());
        // El interlineado se acota al rango razonable.
        assertThat(campo.interlineado()).isEqualTo(2.5);
        assertThat(campo.fuenteMin()).isEqualTo(6.0);
        assertThat(campo.fuente()).isEqualTo(6.0);
    }

    @Test
    void respetaElAjusteAutomaticoDesactivado() {
        ConfigTarjeta sinAjuste = new ConfigTarjeta(
                new ConfigTarjeta.Campo(true, 50.0, 50.0, 50.0, 4.0, "#000000", "center", false, false, false, "sans",
                        null, false, null, null),
                null,
                null,
                null);

        assertThat(ConfigTarjeta.normalizar(sinAjuste).nombre().autoAjustar()).isFalse();
    }

    // ---------------------------------------------------------- zonas protegidas

    @Test
    void sinZonasConfiguradasLaListaQuedaVacia() {
        assertThat(ConfigTarjeta.normalizar(null).zonasProtegidas()).isEmpty();

        ConfigTarjeta sinZonas = new ConfigTarjeta(null, null, null, null, null);
        assertThat(ConfigTarjeta.normalizar(sinZonas).zonasProtegidas()).isEmpty();
    }

    @Test
    void completaIdentificadorYNombreDeLasZonas() {
        ConfigTarjeta conZona = new ConfigTarjeta(null, null, null, null,
                List.of(new ConfigTarjeta.ZonaProtegida(null, "  ", 70.0, 20.0, 20.0, 15.0, null, null, null)));

        ConfigTarjeta.ZonaProtegida zona = ConfigTarjeta.normalizar(conZona).zonasProtegidas().get(0);

        assertThat(zona.id()).isEqualTo("zona-1");
        assertThat(zona.nombre()).isEqualTo("Zona 1");
        assertThat(zona.forma()).isEqualTo("rectangulo");
        assertThat(zona.activa()).isTrue();
        assertThat(zona.automatica()).isFalse();
    }

    @Test
    void descartaZonasSinSuperficieYAcotaLasCoordenadas() {
        ConfigTarjeta rara = new ConfigTarjeta(null, null, null, null, List.of(
                new ConfigTarjeta.ZonaProtegida("a", "Sin alto", 50.0, 50.0, 20.0, 0.0, "circulo", true, false),
                new ConfigTarjeta.ZonaProtegida("b", "Fuera", 999.0, -50.0, 500.0, 500.0, "circulo", true, false)));

        List<ConfigTarjeta.ZonaProtegida> zonas = ConfigTarjeta.normalizar(rara).zonasProtegidas();

        assertThat(zonas).hasSize(1);
        assertThat(zonas.get(0).id()).isEqualTo("b");
        assertThat(zonas.get(0).x()).isEqualTo(100.0);
        assertThat(zonas.get(0).y()).isEqualTo(0.0);
        assertThat(zonas.get(0).ancho()).isEqualTo(100.0);
        assertThat(zonas.get(0).forma()).isEqualTo("circulo");
    }

    @Test
    void limitaElNumeroDeZonasYEvitaIdentificadoresRepetidos() {
        List<ConfigTarjeta.ZonaProtegida> muchas = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            muchas.add(new ConfigTarjeta.ZonaProtegida("gorro", "Gorro", 70.0, 20.0, 20.0, 15.0, "rectangulo", true, true));
        }

        List<ConfigTarjeta.ZonaProtegida> zonas = ConfigTarjeta.normalizar(
                new ConfigTarjeta(null, null, null, null, muchas)).zonasProtegidas();

        assertThat(zonas).hasSize(12);
        assertThat(zonas.stream().map(ConfigTarjeta.ZonaProtegida::id)).doesNotHaveDuplicates();
        assertThat(zonas.get(0).automatica()).isTrue();
    }

    @Test
    void conservaLasZonasAlCambiarElMarco() {
        ConfigTarjeta conZona = ConfigTarjeta.normalizar(new ConfigTarjeta(null, null, null, null,
                List.of(new ConfigTarjeta.ZonaProtegida("gorro", "Gorro", 70.0, 20.0, 20.0, 15.0, "rectangulo", true, true))));

        ConfigTarjeta conMarco = conZona.conMarco(ConfigTarjeta.marcoDesdeFoto(new BigDecimal("50"), new BigDecimal("40"),
                new BigDecimal("30"), new BigDecimal("30"), Boolean.TRUE));

        assertThat(conMarco.zonasProtegidas()).hasSize(1);
        assertThat(conMarco.zonasProtegidas().get(0).id()).isEqualTo("gorro");
    }

    @Test
    void noIncluyeMarcoCuandoNoSeMarca() {
        // Sin marco, la plantilla no puede guardarse: el servicio lo exige aparte.
        assertThat(ConfigTarjeta.normalizar(null).fotoMarco()).isNull();
    }

    @Test
    void normalizaElMarcoDeLaFoto() {
        ConfigTarjeta conMarco = ConfigTarjeta.porDefecto().conMarco(new ConfigTarjeta.FotoMarco(
                null, "CIRCULO", 150.0, -20.0, 0.0, 40.0, null, "azul", 99.0));

        ConfigTarjeta config = ConfigTarjeta.normalizar(conMarco);
        ConfigTarjeta.FotoMarco marco = config.fotoMarco();

        assertThat(marco).isNotNull();
        assertThat(marco.visible()).isTrue();
        assertThat(marco.forma()).isEqualTo("circulo");
        assertThat(marco.x()).isEqualTo(100.0);
        assertThat(marco.y()).isEqualTo(0.0);
        assertThat(marco.ancho()).isEqualTo(1.0);
        assertThat(marco.alto()).isEqualTo(40.0);
        assertThat(marco.borde()).isFalse();
        assertThat(marco.colorBorde()).isEqualTo("#FFFFFF");
        assertThat(marco.grosorBorde()).isEqualTo(15.0);
    }

    @Test
    void reconstruyeElMarcoDesdeLaPosicionAntigua() {
        ConfigTarjeta.FotoMarco marco = ConfigTarjeta.marcoDesdeFoto(
                new java.math.BigDecimal("70"), new java.math.BigDecimal("40"),
                new java.math.BigDecimal("30"), new java.math.BigDecimal("30"), Boolean.TRUE);

        assertThat(marco.forma()).isEqualTo("circulo");
        assertThat(marco.x()).isEqualTo(70.0);
        assertThat(marco.y()).isEqualTo(40.0);
        assertThat(marco.ancho()).isEqualTo(30.0);
        assertThat(marco.alto()).isEqualTo(30.0);
    }
}

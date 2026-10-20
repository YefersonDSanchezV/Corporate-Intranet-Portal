package co.com.icvc.intranet_backend.portal;

import co.com.icvc.intranet_backend.portal.config.MinioClientProvider;
import co.com.icvc.intranet_backend.portal.service.ParametroService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * El cliente MinIO debe construirse desde los parámetros de la tabla (endpoint y
 * credenciales), no solo desde las variables de entorno. Estas pruebas fijan ese
 * contrato sin necesidad de un MinIO real (solo se verifica la resolución de valores).
 */
@ExtendWith(MockitoExtension.class)
class MinioClientProviderTest {

    @Mock
    private ParametroService parametroService;

    private MinioClientProvider provider(String envEndpoint) {
        MinioClientProvider p = new MinioClientProvider(parametroService);
        ReflectionTestUtils.setField(p, "envEndpoint", envEndpoint);
        ReflectionTestUtils.setField(p, "envAccessKey", "envAccess");
        ReflectionTestUtils.setField(p, "envSecretKey", "envSecret");
        ReflectionTestUtils.setField(p, "bucketsProp", "fotos-cumpleanos");
        return p;
    }

    @Test
    void probarRechazaCuandoNoHayEndpoint() {
        when(parametroService.get("S3_ENDPOINT")).thenReturn("");
        MinioClientProvider p = provider("");
        assertThatThrownBy(() -> p.probarConFallback(null, "a", "b", "bucket"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("endpoint");
    }

    @Test
    void probarRechazaCuandoNoHayCredenciales() {
        when(parametroService.get("S3_ACCESS_KEY")).thenReturn(null);
        when(parametroService.get("S3_SECRET_KEY")).thenReturn("");
        MinioClientProvider p = provider("http://env:9000");
        ReflectionTestUtils.setField(p, "envAccessKey", "");
        ReflectionTestUtils.setField(p, "envSecretKey", "");
        assertThatThrownBy(() -> p.probarConFallback("http://minio:9000", null, null, "bucket"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("credenciales");
    }

    @Test
    void probarUsaElFallbackDeParametrosYEntorno() {
        // Sin valores en el request: debe resolver endpoint y credenciales del entorno.
        when(parametroService.get("S3_ENDPOINT")).thenReturn(null);
        when(parametroService.get("S3_ACCESS_KEY")).thenReturn(null);
        when(parametroService.get("S3_SECRET_KEY")).thenReturn(null);
        MinioClientProvider p = provider("http://desde-env:9000");

        // No debe lanzar IllegalArgumentException por credenciales faltantes:
        // las toma del entorno (la conexión real puede fallar, se tolera).
        try {
            p.probarConFallback(null, null, null, "fotos-cumpleanos");
        } catch (IllegalArgumentException ex) {
            throw new AssertionError("No debía faltar configuración: " + ex.getMessage());
        } catch (Exception tolerated) {
            // MinIO inexistente en pruebas: el objetivo es validar la resolución previa.
        }
    }

    @Test
    void usaElEndpointDelParametroCuandoExiste() {
        when(parametroService.get("S3_ENDPOINT")).thenReturn("http://desde-bd:9000");
        when(parametroService.get("S3_ACCESS_KEY")).thenReturn("bdAccess");
        when(parametroService.get("S3_SECRET_KEY")).thenReturn("bdSecret");
        MinioClientProvider p = provider("http://desde-env:9000");

        // Debe construir sin lanzar: el corner de red se tolera con fallback interno.
        assertThat(p.client()).isNotNull();
        // La firma interna debe reflejar los valores de la BD, no los del entorno.
        assertThat(ReflectionTestUtils.getField(p, "firmaActual"))
                .isEqualTo("http://desde-bd:9000|bdAccess|bdSecret");
    }

    @Test
    void caeAlEntornoCuandoElParametroEstaVacio() {
        when(parametroService.get("S3_ENDPOINT")).thenReturn("");
        when(parametroService.get("S3_ACCESS_KEY")).thenReturn(null);
        when(parametroService.get("S3_SECRET_KEY")).thenReturn("   ");
        MinioClientProvider p = provider("http://desde-env:9000");

        assertThat(p.client()).isNotNull();
        assertThat(ReflectionTestUtils.getField(p, "firmaActual"))
                .isEqualTo("http://desde-env:9000|envAccess|envSecret");
    }
}

package co.com.icvc.intranet_backend.portal;

import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.service.PdfRasterizador;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Las plantillas PDF se convierten en imagen para poder superponer los datos variables. */
class PdfRasterizadorTest {

    private final PdfRasterizador rasterizador = new PdfRasterizador();

    private byte[] pdfDePrueba() throws Exception {
        try (PDDocument documento = new PDDocument()) {
            documento.addPage(new PDPage(PDRectangle.A4));
            ByteArrayOutputStream salida = new ByteArrayOutputStream();
            documento.save(salida);
            return salida.toByteArray();
        }
    }

    @Test
    void rasterizaLaPrimeraPaginaComoPng() throws Exception {
        PdfRasterizador.Resultado resultado = rasterizador.rasterizar(pdfDePrueba());

        assertThat(resultado.png()).isNotEmpty();
        // Firma PNG: 89 50 4E 47
        assertThat(resultado.png()[0] & 0xFF).isEqualTo(0x89);
        assertThat(resultado.png()[1] & 0xFF).isEqualTo(0x50);
        assertThat(resultado.png()[2] & 0xFF).isEqualTo(0x4E);
        assertThat(resultado.png()[3] & 0xFF).isEqualTo(0x47);
        assertThat(resultado.ancho()).isGreaterThan(0);
        assertThat(resultado.alto()).isGreaterThan(0);
        // La imagen se mantiene dentro del límite de tamaño configurado.
        assertThat(Math.max(resultado.ancho(), resultado.alto())).isLessThanOrEqualTo(2600);
    }

    @Test
    void rechazaUnArchivoVacio() {
        assertThatThrownBy(() -> rasterizador.rasterizar(new byte[0]))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("vacío");
    }

    @Test
    void rechazaUnArchivoQueNoEsPdf() {
        byte[] noEsPdf = "esto no es un pdf".getBytes();
        assertThatThrownBy(() -> rasterizador.rasterizar(noEsPdf))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("PDF");
    }
}

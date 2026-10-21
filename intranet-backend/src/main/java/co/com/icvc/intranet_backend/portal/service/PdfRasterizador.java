package co.com.icvc.intranet_backend.portal.service;

import co.com.icvc.intranet_backend.common.exception.ValidationException;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * Convierte la primera página de una plantilla PDF en una imagen PNG de alta
 * resolución. Las plantillas se manejan siempre como imagen porque sobre ellas se
 * superponen los datos variables (foto, nombre, cargo y fecha); así una plantilla
 * en PDF o en JPG/PNG se comporta exactamente igual.
 */
@Component
@Slf4j
public class PdfRasterizador {

    /** Resolución de trabajo: suficiente para pantalla y para impresión moderada. */
    private static final float DPI = 200f;

    /** Lado máximo de la imagen generada, para no producir archivos desmedidos. */
    private static final int LADO_MAXIMO = 2600;

    public record Resultado(byte[] png, int ancho, int alto) {
    }

    /**
     * Rasteriza la primera página del PDF. Lanza {@link ValidationException} con un
     * mensaje claro si el PDF está protegido, corrupto o no tiene páginas.
     */
    public Resultado rasterizar(byte[] pdf) {
        if (pdf == null || pdf.length == 0) {
            throw new ValidationException("El archivo de la plantilla está vacío");
        }
        try (PDDocument documento = Loader.loadPDF(pdf)) {
            if (documento.getNumberOfPages() == 0) {
                throw new ValidationException("El PDF de la plantilla no tiene páginas");
            }
            PDPage primera = documento.getPage(0);
            PDFRenderer renderer = new PDFRenderer(documento);
            BufferedImage imagen = renderer.renderImageWithDPI(0, DPI, ImageType.RGB);
            imagen = reducirSiEsNecesario(imagen, primera);
            return new Resultado(aPng(imagen), imagen.getWidth(), imagen.getHeight());
        } catch (ValidationException ex) {
            throw ex;
        } catch (IOException ex) {
            String mensaje = String.valueOf(ex.getMessage()).toLowerCase();
            if (mensaje.contains("password") || mensaje.contains("encrypt")) {
                log.warn("Plantilla PDF protegida con contraseña: {}", ex.getMessage());
                throw new ValidationException(
                        "La plantilla PDF está protegida con contraseña. Cárguela sin contraseña o como imagen JPG/PNG.");
            }
            log.warn("No se pudo leer la plantilla PDF: {}", ex.getMessage());
            throw new ValidationException("No se pudo leer el PDF de la plantilla: " + ex.getMessage());
        }
    }

    /** Escala la imagen si supera el lado máximo permitido, conservando la proporción. */
    private BufferedImage reducirSiEsNecesario(BufferedImage origen, PDPage pagina) {
        int ancho = origen.getWidth();
        int alto = origen.getHeight();
        int mayor = Math.max(ancho, alto);
        if (mayor <= LADO_MAXIMO) {
            return origen;
        }
        double factor = (double) LADO_MAXIMO / mayor;
        int nuevoAncho = Math.max(1, (int) Math.round(ancho * factor));
        int nuevoAlto = Math.max(1, (int) Math.round(alto * factor));
        BufferedImage destino = new BufferedImage(nuevoAncho, nuevoAlto, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = destino.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.drawImage(origen, 0, 0, nuevoAncho, nuevoAlto, null);
        } finally {
            g.dispose();
        }
        log.debug("Plantilla PDF reducida de {}x{} a {}x{}", ancho, alto, nuevoAncho, nuevoAlto);
        return destino;
    }

    private byte[] aPng(BufferedImage imagen) {
        try (ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            ImageIO.write(imagen, "png", salida);
            return salida.toByteArray();
        } catch (IOException ex) {
            throw new ValidationException("No se pudo generar la imagen de la plantilla: " + ex.getMessage());
        }
    }
}

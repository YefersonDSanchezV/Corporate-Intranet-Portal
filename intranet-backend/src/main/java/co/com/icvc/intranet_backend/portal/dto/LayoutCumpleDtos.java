package co.com.icvc.intranet_backend.portal.dto;

import java.util.List;

/**
 * Datos que intercambia el agente de composición con el proveedor de IA.
 *
 * <p>El navegador mide la tarjeta con el motor determinista y envía esta estructura
 * (tamaños reales, número de líneas y obstáculos). El proveedor solo devuelve ajustes
 * numéricos; el frontend los vuelve a validar con el motor antes de aplicarlos, así que
 * una respuesta incorrecta nunca llega a la tarjeta.</p>
 */
public final class LayoutCumpleDtos {

    private LayoutCumpleDtos() {
    }

    /** Campo de texto tal como lo midió el motor del navegador. */
    public record CampoMedido(
            String campo,
            /** Longitud del contenido: el texto de la persona no sale del servidor. */
            Integer caracteres,
            Integer palabras,
            Double x,
            Double y,
            Double ancho,
            Double fuente,
            Integer lineas,
            /** Ancho de la línea más larga, % del lienzo. */
            Double anchoMaxLinea,
            Boolean noCabe) {
    }

    /** Foto o zona protegida que la composición no puede tapar. */
    public record Obstaculo(
            String nombre,
            String forma,
            Double x,
            Double y,
            Double ancho,
            Double alto) {
    }

    public record Entrada(
            Double ancho,
            Double alto,
            List<CampoMedido> campos,
            List<Obstaculo> obstaculos) {
    }

    /** Ajuste propuesto para un campo. Todos los valores son % del lienzo. */
    public record Ajuste(
            String campo,
            Double x,
            Double y,
            Double ancho,
            Double fuente,
            String motivo) {
    }

    public record Respuesta(
            String origen,
            String explicacion,
            List<Ajuste> ajustes,
            List<String> observaciones) {
    }

    public record Disponibilidad(boolean disponible, String proveedor) {
    }
}

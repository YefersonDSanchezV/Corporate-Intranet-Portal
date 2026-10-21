package co.com.icvc.intranet_backend.portal.dto;

import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.entity.PlantillaCumpleanios;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Posición y tamaño de la foto del funcionario sobre una plantilla de cumpleaños.
 * Todos los valores son porcentajes (0-100) relativos al tamaño de la plantilla,
 * de modo que la previsualización funcione igual a cualquier resolución.
 *
 * <p>{@code px/py/ancho/alto} definen el marco donde va la foto (normalmente el
 * círculo del arte). {@code zoom} y {@code offsetX/offsetY} permiten reencuadrar la
 * foto <strong>dentro</strong> de ese marco sin moverlo: el zoom acerca la imagen y
 * los desplazamientos, en porcentaje del marco, la mueven con límites para que nunca
 * quede un hueco.</p>
 */
public record PosicionFoto(
        BigDecimal px,
        BigDecimal py,
        BigDecimal ancho,
        BigDecimal alto,
        boolean redondo,
        BigDecimal zoom,
        BigDecimal offsetX,
        BigDecimal offsetY) {

    private static final BigDecimal CIEN = new BigDecimal("100");
    private static final BigDecimal ZOOM_MIN = BigDecimal.ONE;
    private static final BigDecimal ZOOM_MAX = new BigDecimal("5");

    public static final PosicionFoto DEFECTO = new PosicionFoto(
            new BigDecimal("50"), new BigDecimal("34"),
            new BigDecimal("26"), new BigDecimal("26"), true,
            BigDecimal.ONE, BigDecimal.ZERO, BigDecimal.ZERO);

    public static PosicionFoto of(BigDecimal px, BigDecimal py, BigDecimal ancho, BigDecimal alto, Boolean redondo) {
        return of(px, py, ancho, alto, redondo, null, null, null);
    }

    public static PosicionFoto of(BigDecimal px, BigDecimal py, BigDecimal ancho, BigDecimal alto, Boolean redondo,
            BigDecimal zoom, BigDecimal offsetX, BigDecimal offsetY) {
        return new PosicionFoto(
                limite(px, DEFECTO.px()),
                limite(py, DEFECTO.py()),
                limite(ancho, DEFECTO.ancho()),
                limite(alto, DEFECTO.alto()),
                redondo == null || redondo,
                acotar(zoom, ZOOM_MIN, ZOOM_MAX, BigDecimal.ONE),
                acotar(offsetX, new BigDecimal("-100"), CIEN, BigDecimal.ZERO),
                acotar(offsetY, new BigDecimal("-100"), CIEN, BigDecimal.ZERO));
    }

    /** Posición con la que fue cargada la plantilla; sirve como valor por defecto al asignarla. */
    public static PosicionFoto de(PlantillaCumpleanios plantilla) {
        if (plantilla == null) {
            return DEFECTO;
        }
        return of(
                plantilla.getFotoPx(),
                plantilla.getFotoPy(),
                plantilla.getFotoAncho(),
                plantilla.getFotoAlto(),
                plantilla.isFotoRedondo());
    }

    /** Valida los porcentajes recibidos y devuelve una posición lista para persistir. */
    public static PosicionFoto validar(BigDecimal px, BigDecimal py, BigDecimal ancho, BigDecimal alto, Boolean redondo) {
        return validar(px, py, ancho, alto, redondo, null, null, null);
    }

    public static PosicionFoto validar(BigDecimal px, BigDecimal py, BigDecimal ancho, BigDecimal alto, Boolean redondo,
            BigDecimal zoom, BigDecimal offsetX, BigDecimal offsetY) {
        return new PosicionFoto(
                requerido(px, "La posición horizontal de la foto"),
                requerido(py, "La posición vertical de la foto"),
                requerido(ancho, "El ancho de la foto"),
                requerido(alto, "El alto de la foto"),
                redondo == null || redondo,
                acotar(zoom, ZOOM_MIN, ZOOM_MAX, BigDecimal.ONE),
                acotar(offsetX, new BigDecimal("-100"), CIEN, BigDecimal.ZERO),
                acotar(offsetY, new BigDecimal("-100"), CIEN, BigDecimal.ZERO));
    }

    private static BigDecimal limite(BigDecimal valor, BigDecimal porDefecto) {
        if (valor == null) {
            return porDefecto;
        }
        if (valor.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO;
        }
        if (valor.compareTo(CIEN) > 0) {
            return CIEN;
        }
        return valor;
    }

    private static BigDecimal acotar(BigDecimal valor, BigDecimal min, BigDecimal max, BigDecimal porDefecto) {
        if (valor == null) {
            return porDefecto;
        }
        if (valor.compareTo(min) < 0) {
            return min;
        }
        if (valor.compareTo(max) > 0) {
            return max;
        }
        return valor;
    }

    private static BigDecimal requerido(BigDecimal valor, String etiqueta) {
        if (valor == null) {
            throw new ValidationException(etiqueta + " es obligatoria");
        }
        if (valor.compareTo(BigDecimal.ZERO) < 0 || valor.compareTo(CIEN) > 0) {
            throw new ValidationException(etiqueta + " debe estar entre 0 y 100");
        }
        return valor;
    }

    /** Ayuda para construir valores con la escala usada en base de datos. */
    public static BigDecimal pct(double valor) {
        return BigDecimal.valueOf(valor).setScale(3, RoundingMode.HALF_UP);
    }
}

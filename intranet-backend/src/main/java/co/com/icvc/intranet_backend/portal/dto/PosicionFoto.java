package co.com.icvc.intranet_backend.portal.dto;

import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.entity.PlantillaCumpleanios;

import java.math.BigDecimal;

/**
 * Posición y tamaño de la foto del funcionario sobre una plantilla de cumpleaños.
 * Todos los valores son porcentajes (0-100) relativos al tamaño de la plantilla,
 * de modo que la previsualización funcione igual a cualquier resolución.
 */
public record PosicionFoto(
        BigDecimal px,
        BigDecimal py,
        BigDecimal ancho,
        BigDecimal alto,
        boolean redondo) {

    public static final PosicionFoto DEFECTO = new PosicionFoto(
            new BigDecimal("50"), new BigDecimal("34"),
            new BigDecimal("26"), new BigDecimal("26"), true);

    public static PosicionFoto of(BigDecimal px, BigDecimal py, BigDecimal ancho, BigDecimal alto, Boolean redondo) {
        return new PosicionFoto(
                limite(px, DEFECTO.px()),
                limite(py, DEFECTO.py()),
                limite(ancho, DEFECTO.ancho()),
                limite(alto, DEFECTO.alto()),
                redondo == null || redondo);
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
        return new PosicionFoto(
                requerido(px, "La posición horizontal de la foto"),
                requerido(py, "La posición vertical de la foto"),
                requerido(ancho, "El ancho de la foto"),
                requerido(alto, "El alto de la foto"),
                redondo == null || redondo);
    }

    private static BigDecimal limite(BigDecimal valor, BigDecimal porDefecto) {
        if (valor == null) {
            return porDefecto;
        }
        if (valor.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO;
        }
        if (valor.compareTo(new BigDecimal("100")) > 0) {
            return new BigDecimal("100");
        }
        return valor;
    }

    private static BigDecimal requerido(BigDecimal valor, String etiqueta) {
        if (valor == null) {
            throw new ValidationException(etiqueta + " es obligatoria");
        }
        if (valor.compareTo(BigDecimal.ZERO) < 0 || valor.compareTo(new BigDecimal("100")) > 0) {
            throw new ValidationException(etiqueta + " debe estar entre 0 y 100");
        }
        return valor;
    }
}

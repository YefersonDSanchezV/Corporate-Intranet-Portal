package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.common.exception.ValidationException;

import java.time.LocalDate;
import java.time.Period;

/**
 * Validación centralizada de fecha de nacimiento para el módulo de cumpleaños.
 * Reglas:
 * - obligatoria
 * - anterior a hoy (no futura ni de hoy)
 * - edad resultante entre {@code EDAD_MINIMA} y {@code EDAD_MAXIMA}
 */
public final class FechaNacimientoValidator {

    public static final int EDAD_MINIMA = 14;
    public static final int EDAD_MAXIMA = 100;

    private FechaNacimientoValidator() {
    }

    public static void validar(LocalDate fechaNacimiento) {
        if (fechaNacimiento == null) {
            throw new ValidationException("La fecha de nacimiento es obligatoria");
        }
        LocalDate hoy = LocalDate.now();
        if (!fechaNacimiento.isBefore(hoy)) {
            throw new ValidationException("La fecha de nacimiento debe ser anterior a hoy");
        }
        int edad = Period.between(fechaNacimiento, hoy).getYears();
        if (edad < EDAD_MINIMA || edad > EDAD_MAXIMA) {
            throw new ValidationException(
                    "La fecha de nacimiento no es válida: la edad debe estar entre "
                            + EDAD_MINIMA + " y " + EDAD_MAXIMA + " años");
        }
    }

    /** Fecha de cumpleaños en el año actual (29-feb -> 28-feb en años no bisiestos). */
    public static LocalDate fechaCumpleanosAnioActual(LocalDate fechaNacimiento) {
        int anio = LocalDate.now().getYear();
        int mes = fechaNacimiento.getMonthValue();
        int dia = fechaNacimiento.getDayOfMonth();
        if (mes == 2 && dia == 29 && !LocalDate.of(anio, 1, 1).isLeapYear()) {
            dia = 28;
        }
        return LocalDate.of(anio, mes, dia);
    }

    /** Edad que cumple (o cumplió) en el año actual. */
    public static int edadQueCumple(LocalDate fechaNacimiento) {
        return LocalDate.now().getYear() - fechaNacimiento.getYear();
    }
}

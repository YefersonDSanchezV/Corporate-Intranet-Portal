package co.com.icvc.intranet_backend.portal.dto;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Configuración de los campos dinámicos de una plantilla de cumpleaños.
 *
 * <p>El arte de la plantilla (fondos, textos institucionales, adornos) es fijo; solo
 * cambian la foto, el nombre, el cargo y la fecha. Esta configuración guarda, para
 * cada campo de texto, dónde se dibuja y con qué estilo, siempre en porcentaje sobre
 * el tamaño real de la plantilla. Al ser porcentajes, la tarjeta se ve igual en
 * cualquier resolución y el texto se puede superponer a imágenes o PDF rasterizados.</p>
 *
 * <p>El {@link FotoMarco} es obligatorio al crear una plantilla: define el círculo o
 * recuadro del arte donde se insertará automáticamente la foto del funcionario.</p>
 *
 * <p>El tamaño de fuente de cada campo se interpreta como el tamaño <i>preferido</i>:
 * el motor de composición (frontend) lo reduce hasta {@code fuenteMin} cuando el texto
 * no cabe en {@code ancho}, y avisa cuando ni con ese mínimo es posible. Así un nombre
 * largo se ajusta solo en lugar de desbordarse sobre el arte.</p>
 *
 * <p>Las {@code zonasProtegidas} son partes del arte que ningún dato dinámico puede
 * tapar (el gorro navideño, un logo, un marco ilustrado). El motor las trata como
 * obstáculos y recoloca los textos en lugar de superponerse a ellas.</p>
 */
public record ConfigTarjeta(Campo nombre, Campo cargo, Campo fecha, FotoMarco fotoMarco,
        List<ZonaProtegida> zonasProtegidas, FrenteMarco frenteMarco) {

    /** Compatibilidad con las configuraciones guardadas antes de existir las zonas. */
    public ConfigTarjeta(Campo nombre, Campo cargo, Campo fecha, FotoMarco fotoMarco) {
        this(nombre, cargo, fecha, fotoMarco, List.of(), null);
    }

    /** Compatibilidad con las configuraciones guardadas antes de existir el marco de la capa frontal. */
    public ConfigTarjeta(Campo nombre, Campo cargo, Campo fecha, FotoMarco fotoMarco,
            List<ZonaProtegida> zonasProtegidas) {
        this(nombre, cargo, fecha, fotoMarco, zonasProtegidas, null);
    }

    /**
     * Un campo de texto situado sobre la plantilla.
     *
     * <p>Los cuatro últimos valores controlan el ajuste automático: {@code fuente} es
     * el tamaño preferido y el motor de composición lo reduce hasta {@code fuenteMin}
     * (nunca por debajo, para no volver el texto ilegible) cuando el contenido no cabe
     * en {@code ancho}. {@code fuenteMax} acota el tamaño por arriba.</p>
     */
    public record Campo(
            Boolean visible,
            Double x,
            Double y,
            Double ancho,
            Double fuente,
            String color,
            String alineacion,
            Boolean negrita,
            Boolean cursiva,
            Boolean mayusculas,
            String familia,
            // Interlineado relativo al tamaño de fuente (1.18 = el histórico).
            Double interlineado,
            // Si es true, el texto reduce su tamaño hasta fuenteMin para caber.
            Boolean autoAjustar,
            // Tamaño mínimo de fuente (% del alto de la plantilla).
            Double fuenteMin,
            // Tamaño máximo de fuente (% del alto de la plantilla).
            Double fuenteMax) {
    }

    /**
     * Zona del arte donde va la foto. Las coordenadas son el centro del marco y el
     * tamaño en porcentaje sobre la plantilla.
     */
    public record FotoMarco(
            Boolean visible,
            /** circulo | rectangulo | redondeado */
            String forma,
            Double x,
            Double y,
            Double ancho,
            Double alto,
            /** Dibuja un borde encima de la foto (útil si el arte no trae marco). */
            Boolean borde,
            String colorBorde,
            /** Grosor del borde en porcentaje del lado menor del marco. */
            Double grosorBorde) {
    }

    /**
     * Parte del arte que ningún dato dinámico puede tapar.
     *
     * <p>Las coordenadas son el centro de la zona y el tamaño, todo en porcentaje sobre
     * la plantilla. Una zona {@code automatica} la dedujo el sistema de la capa frontal
     * (por ejemplo el gorro navideño), no el administrador.</p>
     */
    public record ZonaProtegida(
            String id,
            String nombre,
            Double x,
            Double y,
            Double ancho,
            Double alto,
            /** rectangulo | circulo */
            String forma,
            Boolean activa,
            Boolean automatica) {
    }

    /**
     * Dónde se dibuja la capa frontal (el adorno que va encima de la foto, por ejemplo
     * el gorro navideño).
     *
     * <p>Es un recuadro con centro y tamaño en porcentaje sobre la plantilla, igual que
     * el marco de la foto: el administrador puede moverlo y cambiar su tamaño para
     * colocar el adorno donde quiera, sin tener que preparar el PNG a medida. La imagen
     * se dibuja completa dentro del recuadro, respetando su proporción.</p>
     *
     * <p>Si no se informa, la capa frontal ocupa el lienzo completo, que es el
     * comportamiento de las plantillas que ya la tenían.</p>
     */
    public record FrenteMarco(
            Boolean visible,
            Double x,
            Double y,
            Double ancho,
            Double alto) {
    }

    private static final Set<String> ALINEACIONES = Set.of("left", "center", "right");
    private static final Set<String> FAMILIAS = Set.of("sans", "serif", "script");
    private static final Set<String> FORMAS = Set.of("circulo", "rectangulo", "redondeado");
    private static final Set<String> FORMAS_ZONA = Set.of("rectangulo", "circulo");

    /** Tope de zonas por plantilla: evita configuraciones desmesuradas. */
    private static final int MAX_ZONAS = 12;

    /** Interlineado histórico: el que se usaba antes de poder configurarlo. */
    private static final double INTERLINEADO_DEFECTO = 1.18;
    /** Por defecto el ajuste automático deja bajar al 60% del tamaño preferido. */
    private static final double RATIO_FUENTE_MIN_DEFECTO = 0.6;
    private static final double FUENTE_MIN_ABSOLUTA = 0.8;
    private static final double FUENTE_MAX_ABSOLUTA = 20.0;

    /**
     * Valores por defecto: pensados para plantillas horizontales donde el arte deja
     * libre la franja inferior. El operador los ajusta arrastrando los campos.
     */
    public static ConfigTarjeta porDefecto() {
        return new ConfigTarjeta(
                campo(true, 50.0, 72.0, 80.0, 4.6, "#0B5E8A", "center", true, false, false, "serif"),
                campo(true, 50.0, 79.0, 80.0, 3.0, "#334155", "center", false, false, false, "sans"),
                campo(true, 50.0, 86.0, 80.0, 3.0, "#0B5E8A", "center", false, true, false, "script"),
                null);
    }

    /** Campo con los valores de ajuste automático ya coherentes con su tamaño base. */
    private static Campo campo(Boolean visible, Double x, Double y, Double ancho, Double fuente, String color,
            String alineacion, Boolean negrita, Boolean cursiva, Boolean mayusculas, String familia) {
        return new Campo(visible, x, y, ancho, fuente, color, alineacion, negrita, cursiva, mayusculas, familia,
                INTERLINEADO_DEFECTO, true,
                Math.max(FUENTE_MIN_ABSOLUTA, fuente * RATIO_FUENTE_MIN_DEFECTO), fuente);
    }

    /** Completa con los valores por defecto cualquier campo ausente o inválido. */
    public static ConfigTarjeta normalizar(ConfigTarjeta config) {
        ConfigTarjeta base = porDefecto();
        if (config == null) {
            return base;
        }
        return new ConfigTarjeta(
                normalizarCampo(config.nombre(), base.nombre()),
                normalizarCampo(config.cargo(), base.cargo()),
                normalizarCampo(config.fecha(), base.fecha()),
                config.fotoMarco() == null ? null : normalizarMarco(config.fotoMarco()),
                normalizarZonas(config.zonasProtegidas()),
                config.frenteMarco() == null ? null : normalizarFrente(config.frenteMarco()));
    }

    /**
     * Normaliza el recuadro de la capa frontal. Por defecto ocupa el lienzo completo,
     * que es como se dibujaban las capas frontales antes de poder colocarlas.
     */
    public static FrenteMarco normalizarFrente(FrenteMarco frente) {
        if (frente == null) {
            return null;
        }
        return new FrenteMarco(
                frente.visible() == null || frente.visible(),
                limitar(frente.x(), 50.0, 0, 100),
                limitar(frente.y(), 50.0, 0, 100),
                limitar(frente.ancho(), 100.0, 1, 100),
                limitar(frente.alto(), 100.0, 1, 100));
    }

    /** Recuadro de la capa frontal por defecto: todo el lienzo. */
    public static FrenteMarco frentePorDefecto() {
        return new FrenteMarco(true, 50.0, 50.0, 100.0, 100.0);
    }

    /** Devuelve una copia con el marco de foto indicado. */
    public ConfigTarjeta conMarco(FotoMarco marco) {
        return new ConfigTarjeta(nombre, cargo, fecha, marco, zonasProtegidas, frenteMarco);
    }

    /**
     * Limpia la lista de zonas protegidas: descarta las que no tienen superficie, acota
     * las coordenadas, completa identificadores y nombres y recorta el número máximo.
     */
    public static List<ZonaProtegida> normalizarZonas(List<ZonaProtegida> zonas) {
        if (zonas == null || zonas.isEmpty()) {
            return List.of();
        }
        List<ZonaProtegida> limpias = new ArrayList<>();
        Set<String> idsUsados = new HashSet<>();
        for (ZonaProtegida zona : zonas) {
            if (zona == null || limpias.size() >= MAX_ZONAS) {
                continue;
            }
            double ancho = limitar(zona.ancho(), 0.0, 0, 100);
            double alto = limitar(zona.alto(), 0.0, 0, 100);
            if (ancho <= 0 || alto <= 0) {
                // Una zona sin superficie no protege nada: se descarta en lugar de
                // agrandarla a un valor arbitrario.
                continue;
            }
            int numero = limpias.size() + 1;
            String forma = zona.forma() == null ? "rectangulo" : zona.forma().trim().toLowerCase(Locale.ROOT);
            if (!FORMAS_ZONA.contains(forma)) {
                forma = "rectangulo";
            }
            String id = zona.id() == null || zona.id().isBlank() ? "zona-" + numero : zona.id().trim();
            if (!idsUsados.add(id)) {
                id = id + "-" + numero;
                idsUsados.add(id);
            }
            String nombre = zona.nombre() == null || zona.nombre().isBlank()
                    ? "Zona " + numero
                    : zona.nombre().trim();
            limpias.add(new ZonaProtegida(
                    id,
                    nombre,
                    limitar(zona.x(), 50.0, 0, 100),
                    limitar(zona.y(), 50.0, 0, 100),
                    ancho,
                    alto,
                    forma,
                    zona.activa() == null || zona.activa(),
                    zona.automatica() != null && zona.automatica()));
        }
        return List.copyOf(limpias);
    }

    /**
     * Reconstruye el marco para plantillas creadas antes de que fuera obligatorio,
     * a partir de la posición de foto que ya tenían guardada.
     */
    public static FotoMarco marcoDesdeFoto(java.math.BigDecimal px, java.math.BigDecimal py,
            java.math.BigDecimal ancho, java.math.BigDecimal alto, Boolean redondo) {
        return normalizarMarco(new FotoMarco(
                true,
                Boolean.FALSE.equals(redondo) ? "rectangulo" : "circulo",
                aDouble(px, 50.0),
                aDouble(py, 34.0),
                aDouble(ancho, 26.0),
                aDouble(alto, 26.0),
                false,
                "#FFFFFF",
                2.0));
    }

    public static FotoMarco normalizarMarco(FotoMarco marco) {
        if (marco == null) {
            return null;
        }
        String forma = marco.forma() == null ? "circulo" : marco.forma().trim().toLowerCase(Locale.ROOT);
        if (!FORMAS.contains(forma)) {
            forma = "circulo";
        }
        return new FotoMarco(
                marco.visible() == null || marco.visible(),
                forma,
                limitar(marco.x(), 50.0, 0, 100),
                limitar(marco.y(), 34.0, 0, 100),
                limitar(marco.ancho(), 26.0, 1, 100),
                limitar(marco.alto(), 26.0, 1, 100),
                marco.borde() != null && marco.borde(),
                colorValido(marco.colorBorde(), "#FFFFFF"),
                limitar(marco.grosorBorde(), 2.0, 0, 15));
    }

    private static Campo normalizarCampo(Campo campo, Campo base) {
        if (campo == null) {
            return base;
        }
        String alineacion = campo.alineacion() == null ? base.alineacion()
                : campo.alineacion().trim().toLowerCase(Locale.ROOT);
        if (!ALINEACIONES.contains(alineacion)) {
            alineacion = base.alineacion();
        }
        String familia = campo.familia() == null ? base.familia()
                : campo.familia().trim().toLowerCase(Locale.ROOT);
        if (!FAMILIAS.contains(familia)) {
            familia = base.familia();
        }

        // Tamaños: primero se acotan, luego se garantiza fuenteMin <= fuente <= fuenteMax
        // para que el motor de composición siempre tenga un rango válido.
        double fuente = limitar(campo.fuente(), base.fuente(), FUENTE_MIN_ABSOLUTA, FUENTE_MAX_ABSOLUTA);
        double fuenteMin = limitar(campo.fuenteMin(),
                Math.max(FUENTE_MIN_ABSOLUTA, fuente * RATIO_FUENTE_MIN_DEFECTO),
                FUENTE_MIN_ABSOLUTA, FUENTE_MAX_ABSOLUTA);
        double fuenteMax = limitar(campo.fuenteMax(), fuente, FUENTE_MIN_ABSOLUTA, FUENTE_MAX_ABSOLUTA);
        if (fuenteMin > fuenteMax) {
            fuenteMin = fuenteMax;
        }
        fuente = Math.min(fuenteMax, Math.max(fuenteMin, fuente));

        return new Campo(
                campo.visible() == null ? base.visible() : campo.visible(),
                limitar(campo.x(), base.x(), 0, 100),
                limitar(campo.y(), base.y(), 0, 100),
                limitar(campo.ancho(), base.ancho(), 5, 100),
                fuente,
                colorValido(campo.color(), base.color()),
                alineacion,
                campo.negrita() == null ? base.negrita() : campo.negrita(),
                campo.cursiva() == null ? base.cursiva() : campo.cursiva(),
                campo.mayusculas() == null ? base.mayusculas() : campo.mayusculas(),
                familia,
                limitar(campo.interlineado(), INTERLINEADO_DEFECTO, 0.8, 2.5),
                campo.autoAjustar() == null ? base.autoAjustar() : campo.autoAjustar(),
                fuenteMin,
                fuenteMax);
    }

    private static Double limitar(Double valor, Double defecto, double min, double max) {
        if (valor == null || valor.isNaN()) {
            return defecto;
        }
        return Math.min(max, Math.max(min, valor));
    }

    private static double aDouble(java.math.BigDecimal valor, double defecto) {
        return valor == null ? defecto : valor.doubleValue();
    }

    private static String colorValido(String color, String defecto) {
        if (color == null) {
            return defecto;
        }
        String limpio = color.trim();
        if (limpio.matches("#[0-9a-fA-F]{6}")) {
            return limpio.toUpperCase(Locale.ROOT);
        }
        if (limpio.matches("#[0-9a-fA-F]{3}")) {
            return limpio.toUpperCase(Locale.ROOT);
        }
        return defecto;
    }
}

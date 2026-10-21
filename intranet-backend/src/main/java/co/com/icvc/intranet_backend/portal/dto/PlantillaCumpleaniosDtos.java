package co.com.icvc.intranet_backend.portal.dto;

import co.com.icvc.intranet_backend.portal.entity.PlantillaCumpleanios;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Plantilla de cumpleaños: nombre visible para el operador, datos del archivo
 * asociado (que se descarga con {@code GET /api/files/{archivoOid}}), la posición
 * de la foto y la configuración de los campos dinámicos (nombre, cargo y fecha).
 */
public final class PlantillaCumpleaniosDtos {

    private PlantillaCumpleaniosDtos() {
    }

    /** Posición de la foto dentro de la plantilla, en porcentaje. */
    public record Foto(
            java.math.BigDecimal px,
            java.math.BigDecimal py,
            java.math.BigDecimal ancho,
            java.math.BigDecimal alto,
            boolean redondo) {
    }

    /**
     * Composición de una plantilla existente. El JSON llega como texto porque es
     * exactamente el mismo documento que se guarda en {@code genplanconfig}.
     */
    public record ConfigRequest(String config) {
    }

    public record Response(
            Integer oid,
            String nombre,
            Integer archivoOid,
            String nombreOriginal,
            String tipo,
            Long tamano,
            LocalDateTime fechaCreacion,
            Foto foto,
            /** Campos dinámicos ya normalizados; nunca {@code null}. */
            ConfigTarjeta config,
            /** Meses en que aplica (vacío = todo el año). */
            List<Integer> meses,
            /** PDF o IMAGEN. */
            String origen,
            /**
             * Archivo PNG de la capa frontal que se dibuja por encima de la foto
             * (adornos del arte, p. ej. el gorro navideño); {@code null} si no tiene.
             */
            Integer frenteArchivoOid,
            String frenteNombreOriginal) {

        public static Response from(PlantillaCumpleanios plantilla) {
            return from(plantilla, null);
        }

        public static Response from(PlantillaCumpleanios plantilla, ConfigTarjeta config) {
            var archivo = plantilla.getArchivo();
            var frente = plantilla.getFrente();
            return new Response(
                    plantilla.getOid(),
                    plantilla.getNombre(),
                    archivo != null ? archivo.getOid() : null,
                    archivo != null ? archivo.getNombreOriginal() : null,
                    archivo != null ? archivo.getTipo() : null,
                    archivo != null ? archivo.getTamano() : null,
                    plantilla.getFechaCreacion(),
                    plantilla.getFotoPx() == null ? null : new Foto(
                            plantilla.getFotoPx(),
                            plantilla.getFotoPy(),
                            plantilla.getFotoAncho(),
                            plantilla.getFotoAlto(),
                            plantilla.isFotoRedondo()),
                    config,
                    mesesDe(plantilla.getMeses()),
                    plantilla.getOrigen(),
                    frente != null ? frente.getOid() : null,
                    frente != null ? frente.getNombreOriginal() : null);
        }

        private static List<Integer> mesesDe(String meses) {
            List<Integer> lista = new ArrayList<>();
            if (meses == null || meses.isBlank()) {
                return lista;
            }
            for (String parte : meses.split(",")) {
                try {
                    int mes = Integer.parseInt(parte.trim());
                    if (mes >= 1 && mes <= 12 && !lista.contains(mes)) {
                        lista.add(mes);
                    }
                } catch (NumberFormatException ignored) {
                    // valor inválido: se omite
                }
            }
            return lista;
        }
    }
}

package co.com.icvc.intranet_backend.portal.dto;

import co.com.icvc.intranet_backend.portal.entity.PlantillaCumpleanios;

import java.time.LocalDateTime;

/**
 * Plantilla de cumpleaños: nombre visible para el operador, datos del archivo
 * asociado (que se descarga con {@code GET /api/files/{archivoOid}}) y la
 * posición con la que se superpone la foto del funcionario.
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

    public record Response(
            Integer oid,
            String nombre,
            Integer archivoOid,
            String nombreOriginal,
            String tipo,
            Long tamano,
            LocalDateTime fechaCreacion,
            Foto foto) {

        public static Response from(PlantillaCumpleanios plantilla) {
            var archivo = plantilla.getArchivo();
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
                            plantilla.isFotoRedondo()));
        }
    }
}

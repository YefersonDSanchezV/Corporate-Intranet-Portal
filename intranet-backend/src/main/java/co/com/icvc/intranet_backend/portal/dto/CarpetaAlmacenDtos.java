package co.com.icvc.intranet_backend.portal.dto;

import co.com.icvc.intranet_backend.portal.entity.CarpetaAlmacen;

import java.time.LocalDateTime;

/**
 * Carpetas lógicas de almacenamiento. Nunca expone rutas físicas ni credenciales
 * de MinIO: solo la organización lógica (bucket físico + prefijo) que necesita la
 * pantalla de administración.
 */
public final class CarpetaAlmacenDtos {

    private CarpetaAlmacenDtos() {
    }

    public record Response(
            Integer oid,
            String nombre,
            String descripcion,
            String tipo,
            String bucket,
            String prefijo,
            boolean activo,
            long archivos,
            LocalDateTime fechaCreacion) {

        public static Response from(CarpetaAlmacen carpeta) {
            return from(carpeta, 0L);
        }

        public static Response from(CarpetaAlmacen carpeta, long archivos) {
            return new Response(
                    carpeta.getOid(),
                    carpeta.getNombre(),
                    carpeta.getDescripcion(),
                    carpeta.getTipo(),
                    carpeta.getBucket(),
                    carpeta.getPrefijo(),
                    carpeta.isActivo(),
                    archivos,
                    carpeta.getFechaCreacion());
        }
    }

    /** Alta/edición: un único formulario reutilizable para crear y editar. */
    public record Request(
            String nombre,
            String descripcion,
            String tipo,
            String bucket,
            String prefijo,
            Boolean activo) {
    }

    public record EstadoRequest(Boolean activo) {
    }

    /**
     * Archivo mostrado en "Ver archivos". Combina la realidad del bucket con los
     * metadatos de la BD: un objeto puede existir en MinIO sin fila en genarchivo
     * (por ejemplo, cargado antes de habilitar el catálogo), y en ese caso se
     * ofrece solo la vista previa por bucket+clave.
     */
    public record ArchivoItem(
            Integer oid,
            String nombre,
            String tipo,
            Long tamano,
            java.time.LocalDateTime fecha,
            /** Clave del objeto dentro del bucket (sin credenciales). */
            String key,
            /** true si el objeto existe físicamente en MinIO. */
            boolean enMinio,
            /** Categoría de vista previa: IMAGEN, VIDEO, PDF, TEXTO, OTRO. */
            String vista) {
    }
}

package co.com.icvc.intranet_backend.portal.service;

import co.com.icvc.intranet_backend.common.exception.ConflictException;
import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.dto.CarpetaAlmacenDtos;
import co.com.icvc.intranet_backend.portal.entity.CarpetaAlmacen;
import co.com.icvc.intranet_backend.portal.repository.ArchivoRepository;
import co.com.icvc.intranet_backend.portal.repository.CarpetaAlmacenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Catálogo dinámico de carpetas de almacenamiento.
 *
 * <p>Distingue el bucket FÍSICO de MinIO (se crea de forma idempotente y solo
 * cuando hace falta) de la carpeta LÓGICA de negocio, que es únicamente un
 * prefijo de objeto dentro de ese bucket. Crear una carpeta nueva no crea un
 * bucket nuevo, y el prefijo es lo que determina dónde cae cada archivo.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarpetaAlmacenService {

    private static final Set<String> TIPOS = Set.of("DOCUMENTOS", "IMAGENES", "VIDEOS", "OTROS");
    private static final int MAX_NOMBRE = 120;
    private static final int MAX_PREFIJO = 255;

    /** Carpeta por defecto de la carga genérica (compatibilidad con lo ya almacenado). */
    public static final String NOMBRE_POR_DEFECTO = "fotos-cumpleanos";

    private final CarpetaAlmacenRepository carpetaRepository;
    private final ArchivoRepository archivoRepository;
    private final MinioStorageService minioStorageService;

    @Transactional(readOnly = true)
    public List<CarpetaAlmacenDtos.Response> listar(String busqueda, String tipo, Boolean activo) {
        String texto = busqueda == null ? "" : busqueda.trim().toLowerCase(Locale.ROOT);
        String tipoFiltro = tipo == null || tipo.isBlank() ? null : normalizarTipo(tipo);
        return carpetaRepository.findAllByOrderByNombreAsc().stream()
                .filter(c -> tipoFiltro == null || tipoFiltro.equals(c.getTipo()))
                .filter(c -> activo == null || activo == c.isActivo())
                .filter(c -> texto.isEmpty()
                        || c.getNombre().toLowerCase(Locale.ROOT).contains(texto)
                        || (c.getDescripcion() != null && c.getDescripcion().toLowerCase(Locale.ROOT).contains(texto))
                        || c.getPrefijo().toLowerCase(Locale.ROOT).contains(texto))
                .map(this::conConteo)
                .toList();
    }

    @Transactional(readOnly = true)
    public CarpetaAlmacenDtos.Response require(Integer oid) {
        CarpetaAlmacen carpeta = buscar(oid);
        return conConteo(carpeta);
    }

    /** Archivos asociados a una carpeta: realidad de MinIO + metadatos de la BD. */
    @Transactional(readOnly = true)
    public List<CarpetaAlmacenDtos.ArchivoItem> archivos(Integer oid) {
        CarpetaAlmacen carpeta = buscar(oid);
        String bucket = carpeta.getBucket();
        String prefijo = carpeta.getPrefijo();

        // 1) Objetos que existen de verdad en el bucket bajo el prefijo.
        List<MinioStorageService.ObjetoMinio> objetos = List.of();
        String aviso = null;
        try {
            objetos = minioStorageService.listar(bucket, prefijo);
        } catch (Exception ex) {
            aviso = ex.getMessage();
            log.warn("No se pudo listar MinIO para {}/{}: {}", bucket, prefijo, ex.getMessage());
        }

        // 2) Metadatos de BD, indexados por clave de objeto.
        java.util.Map<String, co.com.icvc.intranet_backend.portal.entity.Archivo> porKey = new java.util.HashMap<>();
        for (var a : archivoRepository.findEnCarpeta(bucket, prefijo)) {
            porKey.put(claveDeRuta(a.getRuta(), bucket), a);
        }

        java.util.LinkedHashMap<String, CarpetaAlmacenDtos.ArchivoItem> items = new java.util.LinkedHashMap<>();
        for (var objeto : objetos) {
            var meta = porKey.get(objeto.key());
            String nombre = meta != null && meta.getNombreOriginal() != null
                    ? meta.getNombreOriginal()
                    : nombreDesdeKey(objeto.key());
            String tipo = meta != null ? meta.getTipo() : null;
            items.put(objeto.key(), new CarpetaAlmacenDtos.ArchivoItem(
                    meta != null ? meta.getOid() : null,
                    nombre, tipo, objeto.tamano(), objeto.fecha(), objeto.key(), true, vistaDe(tipo, nombre)));
        }

        // 3) Archivos registrados en BD cuyo objeto ya no está en MinIO (histórico/fallback).
        if (aviso == null) {
            for (var entrada : porKey.entrySet()) {
                if (items.containsKey(entrada.getKey())) {
                    continue;
                }
                var a = entrada.getValue();
                items.put(entrada.getKey(), new CarpetaAlmacenDtos.ArchivoItem(
                        a.getOid(), a.getNombreOriginal(), a.getTipo(), a.getTamano(), a.getFechaCreacion(),
                        entrada.getKey(), false, vistaDe(a.getTipo(), a.getNombreOriginal())));
            }
        }
        return new java.util.ArrayList<>(items.values());
    }

    /** Cuenta los objetos reales del bucket bajo el prefijo; si MinIO falla, usa la BD. */
    private long contarArchivos(CarpetaAlmacen carpeta) {
        try {
            return minioStorageService.listar(carpeta.getBucket(), carpeta.getPrefijo()).size();
        } catch (Exception ex) {
            log.debug("No se pudo contar en MinIO {}/{}: {}; se usa la BD", carpeta.getBucket(), carpeta.getPrefijo(), ex.getMessage());
            return archivoRepository.countEnCarpeta(carpeta.getBucket(), carpeta.getPrefijo());
        }
    }

    private static String claveDeRuta(String ruta, String bucket) {
        if (ruta == null) {
            return "";
        }
        String base = "s3://" + bucket + "/";
        return ruta.startsWith(base) ? ruta.substring(base.length()) : ruta;
    }

    private static String nombreDesdeKey(String key) {
        if (key == null) {
            return "";
        }
        int slash = key.lastIndexOf('/');
        return slash >= 0 ? key.substring(slash + 1) : key;
    }

    /** Categoría de vista previa a partir del MIME y la extensión. */
    private static String vistaDe(String tipo, String nombre) {
        String t = tipo == null ? "" : tipo.toLowerCase(Locale.ROOT);
        String ext = "";
        if (nombre != null) {
            int punto = nombre.lastIndexOf('.');
            if (punto >= 0) {
                ext = nombre.substring(punto + 1).toLowerCase(Locale.ROOT);
            }
        }
        if (t.startsWith("image/") || Set.of("png", "jpg", "jpeg", "gif", "webp", "bmp", "svg").contains(ext)) {
            return "IMAGEN";
        }
        if (t.startsWith("video/") || Set.of("mp4", "webm", "mov", "avi", "mkv").contains(ext)) {
            return "VIDEO";
        }
        if (t.equals("application/pdf") || ext.equals("pdf")) {
            return "PDF";
        }
        if (t.startsWith("text/") || Set.of("txt", "csv", "log", "md", "json", "xml").contains(ext)) {
            return "TEXTO";
        }
        return "OTRO";
    }

    @Transactional
    public CarpetaAlmacenDtos.Response crear(CarpetaAlmacenDtos.Request request) {
        DatosValidados datos = validar(request, null);
        CarpetaAlmacen carpeta = CarpetaAlmacen.builder()
                .nombre(datos.nombre())
                .descripcion(datos.descripcion())
                .tipo(datos.tipo())
                .bucket(datos.bucket())
                .prefijo(datos.prefijo())
                .activo(request == null || request.activo() == null || request.activo())
                .fechaCreacion(LocalDateTime.now())
                .build();
        // Creación idempotente del bucket físico: solo si no existe.
        minioStorageService.ensureBucket(datos.bucket());
        return conConteo(carpetaRepository.save(carpeta));
    }

    @Transactional
    public CarpetaAlmacenDtos.Response editar(Integer oid, CarpetaAlmacenDtos.Request request) {
        CarpetaAlmacen carpeta = buscar(oid);
        DatosValidados datos = validar(request, oid);
        carpeta.setNombre(datos.nombre());
        carpeta.setDescripcion(datos.descripcion());
        carpeta.setTipo(datos.tipo());
        carpeta.setBucket(datos.bucket());
        carpeta.setPrefijo(datos.prefijo());
        if (request != null && request.activo() != null) {
            carpeta.setActivo(request.activo());
        }
        minioStorageService.ensureBucket(datos.bucket());
        return conConteo(carpetaRepository.save(carpeta));
    }

    /**
     * Activa o desactiva una carpeta. Desactivar nunca borra archivos ni impide
     * consultarlos o descargarlos: solo deja de aceptar cargas nuevas.
     */
    @Transactional
    public CarpetaAlmacenDtos.Response cambiarEstado(Integer oid, boolean activo) {
        CarpetaAlmacen carpeta = buscar(oid);
        carpeta.setActivo(activo);
        return conConteo(carpetaRepository.save(carpeta));
    }

    /**
     * Eliminación protegida: solo se permite si la carpeta no tiene archivos.
     * Bloquea la fila (FOR UPDATE) para no chocar con cargas concurrentes.
     */
    @Transactional
    public void eliminar(Integer oid) {
        CarpetaAlmacen carpeta = carpetaRepository.findByIdForUpdate(oid)
                .orElseThrow(() -> NotFoundException.of("Carpeta de almacenamiento", oid));
        long archivos = archivoRepository.countEnCarpeta(carpeta.getBucket(), carpeta.getPrefijo());
        if (archivos > 0) {
            throw new ConflictException("No se puede eliminar la carpeta '" + carpeta.getNombre()
                    + "' porque contiene " + archivos + " archivo" + (archivos == 1 ? "" : "s")
                    + ". Desactívela o mueva/elimine sus archivos primero.");
        }
        if (esCarpetaPorDefecto(carpeta)) {
            throw new ConflictException("La carpeta '" + carpeta.getNombre()
                    + "' es la carpeta por defecto de las cargas y no se puede eliminar.");
        }
        carpetaRepository.delete(carpeta);
    }

    /**
     * Resuelve la carpeta destino de una carga a partir del tipo de contenido.
     * Los nombres de carpeta viven en la base de datos, no en el código: aquí solo
     * se busca por tipo (o la carpeta por defecto) y, si no hay ninguna, se
     * devuelve {@code null} para que el llamador conserve su comportamiento previo.
     */
    @Transactional(readOnly = true)
    public CarpetaAlmacen resolverPorTipo(String tipo) {
        if (tipo != null && !tipo.isBlank()) {
            String tipoNormalizado = normalizarTipo(tipo);
            CarpetaAlmacen porTipo = primeraActivaDeTipo(tipoNormalizado);
            if (porTipo != null) {
                return porTipo;
            }
        }
        return carpetaRepository.findAllByOrderByNombreAsc().stream()
                .filter(CarpetaAlmacen::isActivo)
                .filter(c -> NOMBRE_POR_DEFECTO.equalsIgnoreCase(c.getNombre()))
                .findFirst()
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public CarpetaAlmacen requireActiva(Integer oid) {
        CarpetaAlmacen carpeta = buscar(oid);
        if (!carpeta.isActivo()) {
            throw new ValidationException("La carpeta '" + carpeta.getNombre() + "' está desactivada y no admite cargas.");
        }
        return carpeta;
    }

    /**
     * Resuelve una carpeta activa por su nombre lógico. Devuelve {@code null} si no
     * existe, para que el llamador conserve su comportamiento previo.
     */
    @Transactional(readOnly = true)
    public CarpetaAlmacen resolverPorNombre(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            return null;
        }
        String buscado = nombre.trim();
        return carpetaRepository.findAllByOrderByNombreAsc().stream()
                .filter(CarpetaAlmacen::isActivo)
                .filter(c -> buscado.equalsIgnoreCase(c.getNombre()))
                .findFirst()
                .orElse(null);
    }

    private CarpetaAlmacen primeraActivaDeTipo(String tipo) {
        return carpetaRepository.findAllByOrderByNombreAsc().stream()
                .filter(CarpetaAlmacen::isActivo)
                .filter(c -> tipo.equals(c.getTipo()))
                .findFirst()
                .orElse(null);
    }

    private boolean esCarpetaPorDefecto(CarpetaAlmacen carpeta) {
        return NOMBRE_POR_DEFECTO.equalsIgnoreCase(carpeta.getNombre());
    }

    private CarpetaAlmacenDtos.Response conConteo(CarpetaAlmacen carpeta) {
        return CarpetaAlmacenDtos.Response.from(carpeta, contarArchivos(carpeta));
    }

    /**
     * Sirve el contenido de un objeto de la carpeta para la vista previa. Valida que
     * la clave pertenezca al bucket+prefijo de la carpeta (no se puede pedir cualquier
     * objeto del servidor) y devuelve el tipo MIME detectado.
     */
    @Transactional(readOnly = true)
    public ContenidoObjeto contenido(Integer oid, String key) {
        CarpetaAlmacen carpeta = buscar(oid);
        if (key == null || !key.startsWith(carpeta.getPrefijo()) || key.contains("..")) {
            throw new ValidationException("El archivo no pertenece a esta carpeta.");
        }
        String tipo = null;
        long tamano = 0;
        try {
            var stat = minioStorageService.stat(carpeta.getBucket(), key);
            tipo = stat.contentType();
            tamano = stat.size();
        } catch (Exception ex) {
            log.debug("Sin metadatos de MinIO para {}: {}", key, ex.getMessage());
        }
        byte[] bytes;
        try {
            bytes = minioStorageService.getBytes(carpeta.getBucket(), key);
        } catch (Exception ex) {
            // Respaldo: el objeto pudo quedar en disco local (fallback de FileService).
            var meta = archivoRepository.findEnCarpeta(carpeta.getBucket(), carpeta.getPrefijo()).stream()
                    .filter(a -> key.equals(claveDeRuta(a.getRuta(), carpeta.getBucket())))
                    .findFirst()
                    .orElseThrow(() -> new NotFoundException("El archivo no está disponible: " + key));
            try {
                byte[] locales = java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(meta.getRuta()));
                return new ContenidoObjeto(locales, meta.getTipo() != null ? meta.getTipo() : "application/octet-stream",
                        meta.getTamano() == null ? locales.length : meta.getTamano());
            } catch (java.io.IOException ioEx) {
                throw new NotFoundException("El archivo no está disponible: " + key);
            }
        }
        String nombre = nombreDesdeKey(key);
        return new ContenidoObjeto(bytes, tipo != null ? tipo : mimePorNombre(nombre), tamano);
    }

    private static String mimePorNombre(String nombre) {
        String ext = "";
        if (nombre != null) {
            int punto = nombre.lastIndexOf('.');
            if (punto >= 0) {
                ext = nombre.substring(punto + 1).toLowerCase(Locale.ROOT);
            }
        }
        return switch (ext) {
            case "png" -> "image/png";
            case "jpg", "jpeg" -> "image/jpeg";
            case "gif" -> "image/gif";
            case "webp" -> "image/webp";
            case "svg" -> "image/svg+xml";
            case "pdf" -> "application/pdf";
            case "mp4" -> "video/mp4";
            case "webm" -> "video/webm";
            case "txt", "log" -> "text/plain; charset=UTF-8";
            case "csv" -> "text/csv; charset=UTF-8";
            case "json" -> "application/json";
            case "xml" -> "application/xml";
            default -> "application/octet-stream";
        };
    }

    /** Contenido de un objeto listo para servir en la vista previa. */
    public record ContenidoObjeto(byte[] bytes, String tipo, long tamano) {
    }

    private CarpetaAlmacen buscar(Integer oid) {
        return carpetaRepository.findById(oid)
                .orElseThrow(() -> NotFoundException.of("Carpeta de almacenamiento", oid));
    }

    private record DatosValidados(String nombre, String descripcion, String tipo, String bucket, String prefijo) {
    }

    private DatosValidados validar(CarpetaAlmacenDtos.Request request, Integer oidActual) {
        if (request == null) {
            throw new ValidationException("Los datos de la carpeta son obligatorios");
        }
        String nombre = request.nombre() == null ? "" : request.nombre().trim();
        if (nombre.isEmpty()) {
            throw new ValidationException("El nombre de la carpeta es obligatorio");
        }
        if (nombre.length() > MAX_NOMBRE) {
            throw new ValidationException("El nombre no puede exceder " + MAX_NOMBRE + " caracteres");
        }
        String bucket = request.bucket() == null ? "" : request.bucket().trim();
        if (bucket.isEmpty()) {
            throw new ValidationException("El bucket de almacenamiento es obligatorio");
        }
        String prefijo = normalizarPrefijo(request.prefijo() != null ? request.prefijo() : nombre);
        if (prefijo.length() > MAX_PREFIJO) {
            throw new ValidationException("La ubicación no puede exceder " + MAX_PREFIJO + " caracteres");
        }
        boolean duplicado = oidActual == null
                ? carpetaRepository.existsByBucketAndPrefijo(bucket, prefijo)
                : carpetaRepository.existsByBucketAndPrefijoAndOidNot(bucket, prefijo, oidActual);
        if (duplicado) {
            throw new ConflictException("Ya existe una carpeta registrada en " + bucket + "/" + prefijo);
        }
        String descripcion = request.descripcion() == null ? null : request.descripcion().trim();
        if (descripcion != null && descripcion.isEmpty()) {
            descripcion = null;
        }
        return new DatosValidados(nombre, descripcion, normalizarTipo(request.tipo()), bucket, prefijo);
    }

    private String normalizarTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            return "OTROS";
        }
        String valor = tipo.trim().toUpperCase(Locale.ROOT);
        if (!TIPOS.contains(valor)) {
            throw new ValidationException("Tipo de contenido inválido: " + tipo);
        }
        return valor;
    }

    /**
     * Normaliza el prefijo a una ruta segura terminada en '/': sin barras iniciales,
     * sin segmentos '..' ni caracteres problemáticos para una clave de objeto.
     */
    private String normalizarPrefijo(String crudo) {
        String valor = crudo == null ? "" : crudo.trim().replace('\\', '/');
        while (valor.startsWith("/")) {
            valor = valor.substring(1);
        }
        if (valor.isEmpty()) {
            throw new ValidationException("La ubicación dentro del bucket es obligatoria");
        }
        if (valor.contains("..")) {
            throw new ValidationException("La ubicación dentro del bucket no es válida");
        }
        if (valor.matches(".*[\\s<>\"'|?*].*")) {
            throw new ValidationException("La ubicación dentro del bucket contiene caracteres no permitidos");
        }
        if (!valor.endsWith("/")) {
            valor = valor + "/";
        }
        return valor;
    }
}

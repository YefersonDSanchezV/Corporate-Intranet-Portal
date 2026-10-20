package co.com.icvc.intranet_backend.portal.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.entity.Archivo;
import co.com.icvc.intranet_backend.portal.entity.CarpetaAlmacen;
import co.com.icvc.intranet_backend.portal.repository.ArchivoRepository;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    private final ArchivoRepository archivoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MinioStorageService minioStorageService;
    private final ParametroService parametroService;
    private final CarpetaAlmacenService carpetaAlmacenService;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.s3.buckets:fotos-cumpleanos,documentos,videos}")
    private String bucketsProp;

    private String defaultBucket() {
        try {
            String param = parametroService.get("FOTOS_CUMPLE_BUCKET");
            if (param != null && !param.isBlank()) {
                return param.trim();
            }
        } catch (Exception ex) {
            log.debug("No se pudo leer parámetro FOTOS_CUMPLE_BUCKET: {}", ex.getMessage());
        }
        if (bucketsProp != null && !bucketsProp.isBlank()) {
            return bucketsProp.split(",")[0].trim();
        }
        return "fotos-cumpleanos";
    }

    /**
     * Almacenamiento por defecto (sin carpeta explícita). Conserva EXACTAMENTE el
     * comportamiento histórico: bucket {@code FOTOS_CUMPLE_BUCKET} y prefijo
     * {@code cumpleanos/}. Si el catálogo de carpetas tiene la carpeta por defecto
     * activa, se usa su bucket/prefijo (que la migración dejó idénticos), de modo
     * que los archivos nuevos y antiguos comparten la misma ruta.
     */
    @Transactional
    public Archivo store(MultipartFile file, Integer usuarioOid) {
        CarpetaAlmacen carpeta = carpetaAlmacenService.resolverPorTipo(null);
        if (carpeta != null) {
            return store(file, usuarioOid, carpeta);
        }
        return almacenar(file, usuarioOid, defaultBucket(), "cumpleanos/");
    }

    /** Almacena el archivo en la carpeta lógica indicada (bucket físico + prefijo). */
    @Transactional
    public Archivo store(MultipartFile file, Integer usuarioOid, Integer carpetaOid) {
        if (carpetaOid == null) {
            return store(file, usuarioOid);
        }
        return store(file, usuarioOid, carpetaAlmacenService.requireActiva(carpetaOid));
    }

    /** Almacena el archivo en la carpeta indicada por tipo de contenido (p. ej. DOCUMENTOS). */
    @Transactional
    public Archivo storePorTipo(MultipartFile file, Integer usuarioOid, String tipo) {
        CarpetaAlmacen carpeta = carpetaAlmacenService.resolverPorTipo(tipo);
        if (carpeta == null) {
            return store(file, usuarioOid);
        }
        return store(file, usuarioOid, carpeta);
    }

    /**
     * Almacena el archivo en la carpeta lógica indicada por nombre. Si la carpeta no
     * existe en el catálogo, cae al comportamiento por defecto (compatibilidad).
     */
    @Transactional
    public Archivo storeEnCarpeta(MultipartFile file, Integer usuarioOid, String nombreCarpeta) {
        CarpetaAlmacen carpeta = carpetaAlmacenService.resolverPorNombre(nombreCarpeta);
        if (carpeta == null) {
            return store(file, usuarioOid);
        }
        return store(file, usuarioOid, carpeta);
    }

    private Archivo store(MultipartFile file, Integer usuarioOid, CarpetaAlmacen carpeta) {
        return almacenar(file, usuarioOid, carpeta.getBucket(), carpeta.getPrefijo());
    }

    private Archivo almacenar(MultipartFile file, Integer usuarioOid, String bucket, String prefijo) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("El archivo está vacío");
        }
        Usuario usuario = usuarioRepository.findById(usuarioOid)
                .orElseThrow(() -> NotFoundException.of("Usuario", usuarioOid));
        String nombreInterno = UUID.randomUUID() + "-" + file.getOriginalFilename();
        String key = prefijo + nombreInterno;
        try {
            minioStorageService.put(bucket, key, file.getInputStream(),
                    file.getContentType(), file.getSize());
            Archivo archivo = Archivo.builder()
                    .nombreInterno(nombreInterno)
                    .nombreOriginal(file.getOriginalFilename())
                    .ruta("s3://" + bucket + "/" + key)
                    .tipo(file.getContentType())
                    .tamano(file.getSize())
                    .fechaCreacion(LocalDateTime.now())
                    .usuario(usuario)
                    .build();
            return archivoRepository.save(archivo);
        } catch (Exception ex) {
            log.warn("MinIO no disponible, fallback a disco local: {}", ex.getMessage());
        }
        try {
            Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Path destino = dir.resolve(nombreInterno).normalize();
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, destino);
            }

            Archivo archivo = Archivo.builder()
                    .nombreInterno(nombreInterno)
                    .nombreOriginal(file.getOriginalFilename())
                    .ruta(destino.toString())
                    .tipo(file.getContentType())
                    .tamano(file.getSize())
                    .fechaCreacion(LocalDateTime.now())
                    .usuario(usuario)
                    .build();
            return archivoRepository.save(archivo);
        } catch (IOException ioEx) {
            throw new ValidationException("No se pudo almacenar el archivo: " + ioEx.getMessage());
        }
    }

    /**
     * Guarda bytes generados por el sistema (ej. CSV del cierre del muro)
     * con el mismo registro de {@code genarchivo} que los archivos subidos.
     */
    @Transactional
    public Archivo storeBytes(byte[] contenido, String nombreOriginal, String contentType, Integer usuarioOid) {
        if (contenido == null || contenido.length == 0) {
            throw new ValidationException("El archivo está vacío");
        }
        if (nombreOriginal == null || nombreOriginal.isBlank()) {
            throw new ValidationException("El nombre del archivo es obligatorio");
        }
        Usuario usuario = usuarioRepository.findById(usuarioOid)
                .orElseThrow(() -> NotFoundException.of("Usuario", usuarioOid));
        try {
            Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String nombreInterno = UUID.randomUUID() + "-" + nombreOriginal;
            Path destino = dir.resolve(nombreInterno).normalize();
            Files.write(destino, contenido);

            Archivo archivo = Archivo.builder()
                    .nombreInterno(nombreInterno)
                    .nombreOriginal(nombreOriginal)
                    .ruta(destino.toString())
                    .tipo(contentType)
                    .tamano((long) contenido.length)
                    .fechaCreacion(LocalDateTime.now())
                    .usuario(usuario)
                    .build();
            return archivoRepository.save(archivo);
        } catch (IOException ex) {
            throw new ValidationException("No se pudo almacenar el archivo: " + ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Archivo require(Integer id) {
        return archivoRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Archivo", id));
    }

    @Transactional(readOnly = true)
    public Resource loadAsResource(Integer id) {
        Archivo archivo = require(id);
        String ruta = archivo.getRuta();
        if (ruta != null && ruta.startsWith("s3://")) {
            String[] parts = parseS3Uri(ruta);
            byte[] bytes = minioStorageService.getBytes(parts[0], parts[1]);
            return new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return archivo.getNombreOriginal();
                }
            };
        }
        try {
            Path path = Paths.get(ruta);
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new NotFoundException("Archivo físico no disponible: " + id);
            }
            return resource;
        } catch (IOException ex) {
            throw new NotFoundException("Archivo físico no disponible: " + id);
        }
    }

    @Transactional
    public void delete(Integer id) {
        Archivo archivo = archivoRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Archivo", id));
        String ruta = archivo.getRuta();
        if (ruta != null && ruta.startsWith("s3://")) {
            try {
                String[] parts = parseS3Uri(ruta);
                minioStorageService.remove(parts[0], parts[1]);
            } catch (Exception ignored) {
            }
        } else {
            try {
                Files.deleteIfExists(Paths.get(ruta));
            } catch (IOException ignored) {
            }
        }
        archivoRepository.delete(archivo);
    }

    private String[] parseS3Uri(String uri) {
        // s3://bucket/key...
        String sinEsquema = uri.substring("s3://".length());
        int slash = sinEsquema.indexOf('/');
        if (slash < 0) {
            throw new ValidationException("Ruta S3 inválida: " + uri);
        }
        return new String[]{sinEsquema.substring(0, slash), sinEsquema.substring(slash + 1)};
    }
}

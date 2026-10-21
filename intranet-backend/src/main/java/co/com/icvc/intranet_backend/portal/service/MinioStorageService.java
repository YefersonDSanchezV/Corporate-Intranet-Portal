package co.com.icvc.intranet_backend.portal.service;

import co.com.icvc.intranet_backend.portal.config.MinioClientProvider;
import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.ListObjectsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.Result;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.http.Method;
import io.minio.messages.Item;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Operaciones contra MinIO. El cliente se obtiene en caliente de
 * {@link MinioClientProvider}, de modo que un cambio en los parámetros
 * (endpoint/credenciales) se refleje sin reiniciar la aplicación.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MinioStorageService {

    private final MinioClientProvider minioClientProvider;

    @Value("${app.s3.presigned-expiry-minutes:15}")
    private int presignedExpiryMinutes;

    private MinioClient client() {
        return minioClientProvider.client();
    }

    public void ensureBucket(String bucket) {
        try {
            MinioClient minioClient = client();
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("Bucket MinIO creado: {}", bucket);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo verificar/crear el bucket " + bucket + ": " + ex.getMessage(), ex);
        }
    }

    public void put(String bucket, String key, MultipartFile file) {
        try {
            put(bucket, key, file.getInputStream(), file.getContentType(), file.getSize());
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo subir el archivo a MinIO: " + ex.getMessage(), ex);
        }
    }

    public void put(String bucket, String key, InputStream stream, String contentType, long size) {
        try {
            ensureBucket(bucket);
            PutObjectArgs.Builder builder = PutObjectArgs.builder().bucket(bucket).object(key).stream(stream, size, -1);
            if (contentType != null && !contentType.isBlank()) {
                builder.contentType(contentType);
            }
            client().putObject(builder.build());
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo subir el archivo a MinIO: " + ex.getMessage(), ex);
        }
    }

    public byte[] getBytes(String bucket, String key) {
        try (InputStream stream = client().getObject(GetObjectArgs.builder().bucket(bucket).object(key).build())) {
            return stream.readAllBytes();
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo descargar el archivo de MinIO: " + ex.getMessage(), ex);
        }
    }

    public String presignedGet(String bucket, String key, Integer expiryMinutes) {
        try {
            int expiry = expiryMinutes != null ? expiryMinutes : presignedExpiryMinutes;
            return client().getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucket)
                    .object(key)
                    .expiry(expiry, TimeUnit.MINUTES)
                    .build());
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo generar URL prefirmada: " + ex.getMessage(), ex);
        }
    }

    public String presignedGet(String bucket, String key) {
        return presignedGet(bucket, key, null);
    }

    /** Metadatos de un objeto (tamaño, tipo, fecha) sin descargarlo. */
    public StatObjectResponse stat(String bucket, String key) {
        try {
            return client().statObject(StatObjectArgs.builder().bucket(bucket).object(key).build());
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo consultar el objeto en MinIO: " + ex.getMessage(), ex);
        }
    }

    /**
     * Lista los objetos reales de un bucket bajo un prefijo. Es lo que permite ver
     * los archivos que existen físicamente aunque no estén registrados en la BD
     * (por ejemplo, cargados antes de habilitar el catálogo de carpetas).
     */
    public List<ObjetoMinio> listar(String bucket, String prefijo) {
        List<ObjetoMinio> objetos = new ArrayList<>();
        try {
            Iterable<Result<Item>> resultados = client().listObjects(ListObjectsArgs.builder()
                    .bucket(bucket)
                    .prefix(prefijo == null ? "" : prefijo)
                    .recursive(true)
                    .build());
            for (Result<Item> resultado : resultados) {
                Item item = resultado.get();
                if (item.isDir()) {
                    continue;
                }
                objetos.add(new ObjetoMinio(
                        item.objectName(),
                        item.size(),
                        item.lastModified() != null ? item.lastModified().toLocalDateTime() : null));
            }
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo listar el bucket " + bucket + ": " + ex.getMessage(), ex);
        }
        return objetos;
    }

    /** Objeto de MinIO (solo metadatos; no incluye credenciales). */
    public record ObjetoMinio(String key, long tamano, java.time.LocalDateTime fecha) {
    }

    public void remove(String bucket, String key) {
        try {
            client().removeObject(RemoveObjectArgs.builder().bucket(bucket).object(key).build());
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo eliminar el archivo de MinIO: " + ex.getMessage(), ex);
        }
    }
}

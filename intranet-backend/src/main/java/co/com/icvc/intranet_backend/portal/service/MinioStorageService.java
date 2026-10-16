package co.com.icvc.intranet_backend.portal.service;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioStorageService {

    private final MinioClient minioClient;

    @Value("${app.s3.presigned-expiry-minutes:15}")
    private int presignedExpiryMinutes;

    public void ensureBucket(String bucket) {
        try {
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
            minioClient.putObject(builder.build());
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo subir el archivo a MinIO: " + ex.getMessage(), ex);
        }
    }

    public byte[] getBytes(String bucket, String key) {
        try (InputStream stream = minioClient.getObject(GetObjectArgs.builder().bucket(bucket).object(key).build())) {
            return stream.readAllBytes();
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo descargar el archivo de MinIO: " + ex.getMessage(), ex);
        }
    }

    public String presignedGet(String bucket, String key, Integer expiryMinutes) {
        try {
            int expiry = expiryMinutes != null ? expiryMinutes : presignedExpiryMinutes;
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
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

    public void remove(String bucket, String key) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(key).build());
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo eliminar el archivo de MinIO: " + ex.getMessage(), ex);
        }
    }
}

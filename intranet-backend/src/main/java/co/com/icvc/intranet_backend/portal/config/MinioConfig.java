package co.com.icvc.intranet_backend.portal.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class MinioConfig {

    @Value("${app.s3.endpoint:http://localhost:9000}")
    private String endpoint;

    @Value("${app.s3.access-key:minioadmin}")
    private String accessKey;

    @Value("${app.s3.secret-key:minioadmin}")
    private String secretKey;

    @Value("${app.s3.buckets:fotos-cumpleanos,documentos,videos}")
    private String bucketsProp;

    @Bean
    public MinioClient minioClient() {
        MinioClient client = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
        try {
            for (String raw : bucketsProp.split(",")) {
                String b = raw == null ? "" : raw.trim().replaceAll("[\\[\\]]", "");
                if (b.isEmpty()) {
                    continue;
                }
                boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(b).build());
                if (!exists) {
                    client.makeBucket(MakeBucketArgs.builder().bucket(b).build());
                    log.info("Bucket MinIO creado: {}", b);
                }
            }
        } catch (Exception ex) {
            log.warn("MinIO no disponible en {}: no se crearon buckets. Se usará fallback local. Detalle: {}",
                    endpoint, ex.getMessage());
        }
        return client;
    }
}

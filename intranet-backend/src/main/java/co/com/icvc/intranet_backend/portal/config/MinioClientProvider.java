package co.com.icvc.intranet_backend.portal.config;

import co.com.icvc.intranet_backend.portal.service.ParametroService;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Construye y entrega el {@link MinioClient} en caliente, leyendo el endpoint y las
 * credenciales primero de la tabla de parámetros ({@code genparametro}) y, si no están
 * definidos, de las variables de entorno / application.yml.
 *
 * <p>Antes el cliente se creaba una sola vez al arrancar y solo desde el entorno, por lo
 * que editar {@code S3_ENDPOINT} en el módulo de Parámetros no tenía ningún efecto. Ahora
 * {@link #client()} detecta cambios en los parámetros y reconstruye el cliente, de modo
 * que lo que se guarda en la pantalla de Parámetros es lo que realmente se usa.</p>
 */
@Component
@Slf4j
public class MinioClientProvider {

    private final ParametroService parametroService;

    @Value("${app.s3.endpoint:http://localhost:9000}")
    private String envEndpoint;

    @Value("${app.s3.access-key:minioadmin}")
    private String envAccessKey;

    @Value("${app.s3.secret-key:minioadmin}")
    private String envSecretKey;

    @Value("${app.s3.buckets:fotos-cumpleanos,documentos,videos}")
    private String bucketsProp;

    private volatile MinioClient clientActual;
    private volatile String firmaActual;

    public MinioClientProvider(ParametroService parametroService) {
        this.parametroService = parametroService;
    }

    /** Cliente vigente. Se reconstruye solo si cambió la configuración. */
    public MinioClient client() {
        String endpoint = parametro("S3_ENDPOINT", envEndpoint);
        String accessKey = parametro("S3_ACCESS_KEY", envAccessKey);
        String secretKey = parametro("S3_SECRET_KEY", envSecretKey);
        String firma = endpoint + "|" + accessKey + "|" + secretKey;
        MinioClient actual = clientActual;
        if (actual == null || !firma.equals(firmaActual)) {
            synchronized (this) {
                if (clientActual == null || !firma.equals(firmaActual)) {
                    clientActual = construir(endpoint, accessKey, secretKey);
                    firmaActual = firma;
                    log.info("Cliente MinIO reconstruido para endpoint {}", endpoint);
                }
                actual = clientActual;
            }
        }
        return actual;
    }

    /** Crea un cliente con los valores indicados y comprueba que el bucket sea accesible. */
    public void probar(String endpoint, String accessKey, String secretKey, String bucket) {
        probarConFallback(endpoint, accessKey, secretKey, bucket);
    }

    /**
     * Prueba de conexión tolerante: los valores nulos/vacíos se resuelven con el mismo
     * criterio que {@link #client()} (parámetro de BD → variable de entorno). Así la
     * pantalla puede probar sin repetir las credenciales cuando ya están configuradas.
     */
    public void probarConFallback(String endpoint, String accessKey, String secretKey, String bucket) {
        String ep = endpoint != null && !endpoint.isBlank() ? endpoint.trim() : parametro("S3_ENDPOINT", envEndpoint);
        String ak = accessKey != null && !accessKey.isBlank() ? accessKey.trim() : parametro("S3_ACCESS_KEY", envAccessKey);
        String sk = secretKey != null && !secretKey.isBlank() ? secretKey : parametro("S3_SECRET_KEY", envSecretKey);
        if (ep == null || ep.isBlank()) {
            throw new IllegalArgumentException("El endpoint es obligatorio");
        }
        if (ak == null || ak.isBlank() || sk == null || sk.isBlank()) {
            throw new IllegalArgumentException("Las credenciales (access key y secret key) son obligatorias");
        }
        MinioClient cliente = construir(ep, ak, sk);
        try {
            if (bucket != null && !bucket.isBlank()) {
                boolean existe = cliente.bucketExists(BucketExistsArgs.builder().bucket(bucket.trim()).build());
                if (!existe) {
                    cliente.makeBucket(MakeBucketArgs.builder().bucket(bucket.trim()).build());
                }
            } else {
                // Sin bucket concreto: basta con poder listar/crear alguno.
                cliente.listBuckets();
            }
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo conectar con MinIO en " + ep + ": " + ex.getMessage(), ex);
        }
    }

    private MinioClient construir(String endpoint, String accessKey, String secretKey) {
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

    private String parametro(String clave, String defecto) {
        try {
            String valor = parametroService.get(clave);
            if (valor != null && !valor.isBlank()) {
                return valor.trim();
            }
        } catch (Exception ex) {
            log.debug("No se pudo leer parámetro {}: {}", clave, ex.getMessage());
        }
        return defecto;
    }
}

package co.com.icvc.intranet_backend.portal.controller;

import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.config.MinioClientProvider;
import co.com.icvc.intranet_backend.portal.entity.Parametro;
import co.com.icvc.intranet_backend.portal.service.ParametroService;
import co.com.icvc.intranet_backend.permisos.RequiresPermission;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/parametros")
@RequiredArgsConstructor
public class ParametroController {

    private final ParametroService parametroService;
    private final MinioClientProvider minioClientProvider;

    @GetMapping
    public List<Parametro> list() {
        return parametroService.getAll();
    }

    /**
     * Prueba de conexión a MinIO con los valores que el operador tiene en pantalla.
     * No guarda nada: solo valida que el endpoint, las credenciales y el bucket sean
     * alcanzables antes de persistir los parámetros.
     */
    public record ProbarMinioRequest(String endpoint, String accessKey, String secretKey, String bucket) {
    }

    public record ProbarMinioResponse(boolean ok, String mensaje) {
    }

    @PostMapping("/probar-minio")
    @RequiresPermission(module = "parametros-comunicaciones", action = "actualizar")
    public ProbarMinioResponse probarMinio(@RequestBody(required = false) ProbarMinioRequest body) {
        ProbarMinioRequest datos = body != null ? body : new ProbarMinioRequest(null, null, null, null);
        try {
            minioClientProvider.probarConFallback(
                    datos.endpoint(), datos.accessKey(), datos.secretKey(), datos.bucket());
            return new ProbarMinioResponse(true, "Conexión exitosa con MinIO.");
        } catch (Exception ex) {
            return new ProbarMinioResponse(false, ex.getMessage());
        }
    }

    @GetMapping("/{clave}")
    public Parametro get(@PathVariable String clave) {
        return parametroService.require(clave);
    }

    public record UpdateRequest(@Size(max = 2000, message = "El valor no puede exceder 2000 caracteres") String valor) {
    }

    @PutMapping("/{clave}")
    @RequiresPermission(module = "parametros-comunicaciones", action = "actualizar")
    public Parametro update(@PathVariable String clave, @Valid @RequestBody UpdateRequest body) {
        if (clave == null || clave.isBlank()) {
            throw new ValidationException("La clave es obligatoria");
        }
        if (body == null || body.valor() == null) {
            throw new ValidationException("El valor es obligatorio");
        }
        if (body.valor().length() > 2000) {
            throw new ValidationException("El valor no puede exceder 2000 caracteres");
        }
        return parametroService.set(clave, body.valor());
    }
}
